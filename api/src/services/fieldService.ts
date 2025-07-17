import { prisma } from '../lib/prisma';
import { notificationService } from './notificationService';
import { Decimal } from '@prisma/client/runtime/library';

// Teklif oluşturma için DTO
export interface CreateFieldOfferDto {
    fieldListingId: string;
    matchDate: Date;
    startTime: string; // HH:MM formatında
    endTime: string;   // HH:MM formatında
    description?: string;
    offeredPrice: number;
}

// Teklif güncelleme için DTO
export interface UpdateOfferStatusDto {
    status: 'ACCEPTED' | 'REJECTED';
}

export interface FieldOffer {
    id: string;
    fieldListingId: string;
    offerFromUserId: string;
    matchDate: Date;
    startTime: string;
    endTime: string;
    description?: string;
    offeredPrice: Decimal;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    createdAt: Date;
    updatedAt: Date;
    fieldListing?: any;
    offerFromUser?: any;
}

export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode: number;
}

export class FieldOfferService {
    // Teklif gönderme
    async createOffer(
        userId: string,
        data: CreateFieldOfferDto
    ): Promise<ServiceResponse<FieldOffer>> {
        try {
            // Halı saha ilanını kontrol et
            const listing = await prisma.fieldListing.findUnique({
                where: { id: data.fieldListingId, isActive: true },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            });

            if (!listing) {
                return {
                    success: false,
                    error: 'Halı saha ilanı bulunamadı veya aktif değil',
                    statusCode: 404
                };
            }

            // Kendi ilanına teklif veremez
            if (listing.userId === userId) {
                return {
                    success: false,
                    error: 'Kendi ilanınıza teklif veremezsiniz',
                    statusCode: 400
                };
            }

            // Teklif gönderen kullanıcının bilgilerini al
            const offerFromUser = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true
                }
            });

            if (!offerFromUser) {
                return {
                    success: false,
                    error: 'Kullanıcı bulunamadı',
                    statusCode: 404
                };
            }

            // Aynı ilana aynı tarih/saat için zaten teklif var mı kontrol et
            const existingOffer = await prisma.fieldOffer.findFirst({
                where: {
                    fieldListingId: data.fieldListingId,
                    offerFromUserId: userId,
                    matchDate: data.matchDate,
                    startTime: data.startTime,
                    status: { in: ['PENDING', 'ACCEPTED'] }
                }
            });

            if (existingOffer) {
                return {
                    success: false,
                    error: 'Bu tarih ve saat için zaten bir teklifiniz bulunuyor',
                    statusCode: 409
                };
            }

            // Teklifi oluştur
            const offer = await prisma.fieldOffer.create({
                data: {
                    fieldListingId: data.fieldListingId,
                    offerFromUserId: userId,
                    matchDate: data.matchDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    description: data.description,
                    offeredPrice: new Decimal(data.offeredPrice)
                },
                include: {
                    fieldListing: {
                        select: {
                            id: true,
                            fieldName: true,
                            fieldAddress: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true
                                }
                            }
                        }
                    },
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            });

            // Halı saha sahibine bildirim gönder
            try {
                const senderName = `${offerFromUser.firstName} ${offerFromUser.lastName}`;
                const matchDateStr = new Intl.DateTimeFormat('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }).format(data.matchDate);

                await notificationService.sendFieldOfferNotification(listing.userId, {
                    senderName,
                    matchDate: `${matchDateStr} ${data.startTime}-${data.endTime}`,
                    fieldName: listing.fieldName,
                    offeredPrice: data.offeredPrice,
                    offerId: offer.id
                });
            } catch (notificationError) {
                console.error('Halı saha teklif bildirimi gönderilirken hata:', notificationError);
                // Bildirim hatası teklif oluşturulmasını engellemez
            }

            return {
                success: true,
                data: offer as any,
                statusCode: 201
            };
        } catch (error: any) {
            console.error('FieldOfferService.createOffer error:', error);
            return {
                success: false,
                error: 'Teklif gönderilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Teklif durumunu güncelleme (kabul/red)
    async updateOfferStatus(
        offerId: string,
        userId: string,
        data: UpdateOfferStatusDto
    ): Promise<ServiceResponse<FieldOffer>> {
        try {
            // Teklifi kontrol et
            const existingOffer = await prisma.fieldOffer.findUnique({
                where: { id: offerId },
                include: {
                    fieldListing: {
                        select: {
                            id: true,
                            fieldName: true,
                            fieldAddress: true,
                            userId: true
                        }
                    },
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            });

            if (!existingOffer) {
                return {
                    success: false,
                    error: 'Teklif bulunamadı',
                    statusCode: 404
                };
            }

            // Sadece halı saha sahibi teklifleri yanıtlayabilir
            if (existingOffer.fieldListing.userId !== userId) {
                return {
                    success: false,
                    error: 'Bu teklifi yanıtlama yetkiniz yok',
                    statusCode: 403
                };
            }

            // Sadece PENDING durumundaki teklifler güncellenebilir
            if (existingOffer.status !== 'PENDING') {
                return {
                    success: false,
                    error: 'Bu teklif zaten yanıtlanmış',
                    statusCode: 400
                };
            }

            // Teklifi güncelle
            const updatedOffer = await prisma.fieldOffer.update({
                where: { id: offerId },
                data: {
                    status: data.status
                },
                include: {
                    fieldListing: {
                        select: {
                            id: true,
                            fieldName: true,
                            fieldAddress: true
                        }
                    },
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            });

            // Teklifi gönderen kişiye bildirim gönder
            try {
                const fieldOwnerName = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        firstName: true,
                        lastName: true
                    }
                });

                const ownerName = fieldOwnerName ? `${fieldOwnerName.firstName} ${fieldOwnerName.lastName}` : 'Halı saha sahibi';
                const matchDateStr = new Intl.DateTimeFormat('tr-TR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }).format(existingOffer.matchDate);

                if (data.status === 'ACCEPTED') {
                    await notificationService.sendFieldOfferAcceptedNotification(existingOffer.offerFromUserId, {
                        ownerName,
                        fieldName: existingOffer.fieldListing.fieldName,
                        matchDate: `${matchDateStr} ${existingOffer.startTime}-${existingOffer.endTime}`,
                        offerId: offerId
                    });
                } else if (data.status === 'REJECTED') {
                    await notificationService.sendFieldOfferRejectedNotification(existingOffer.offerFromUserId, {
                        ownerName,
                        fieldName: existingOffer.fieldListing.fieldName,
                        matchDate: `${matchDateStr} ${existingOffer.startTime}-${existingOffer.endTime}`,
                        offerId: offerId
                    });
                }
            } catch (notificationError) {
                console.error('Halı saha teklif durum bildirimi gönderilirken hata:', notificationError);
                // Bildirim hatası teklif güncellenmesini engellemez
            }

            return {
                success: true,
                data: updatedOffer as any,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('FieldOfferService.updateOfferStatus error:', error);
            return {
                success: false,
                error: 'Teklif durumu güncellenirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Kullanıcının gönderdiği teklifleri getirme
    async getUserSentOffers(
        userId: string,
        page: number = 1,
        limit?: number
    ): Promise<ServiceResponse<{ offers: FieldOffer[]; total: number; totalPages: number }>> {
        try {
            const offset = limit ? (page - 1) * limit : 0;

            const findManyOptions: any = {
                where: { offerFromUserId: userId },
                include: {
                    fieldListing: {
                        select: {
                            id: true,
                            fieldName: true,
                            fieldAddress: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true
                                }
                            }
                        }
                    },
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            };

            // Sadece limit verilmişse pagination uygula
            if (limit) {
                findManyOptions.skip = offset;
                findManyOptions.take = limit;
            }

            const [offers, total] = await Promise.all([
                prisma.fieldOffer.findMany(findManyOptions),
                prisma.fieldOffer.count({
                    where: { offerFromUserId: userId }
                })
            ]);

            return {
                success: true,
                data: {
                    offers: offers as any,
                    total,
                    totalPages: limit ? Math.ceil(total / limit) : 1
                },
                statusCode: 200
            };
        } catch (error: any) {
            console.error('FieldOfferService.getUserSentOffers error:', error);
            return {
                success: false,
                error: 'Teklifler getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Kullanıcının aldığı teklifleri getirme (alias for getFieldReceivedOffers)
    async getUserReceivedOffers(
        userId: string,
        page: number = 1,
        limit?: number
    ): Promise<ServiceResponse<{ offers: FieldOffer[]; total: number; totalPages: number }>> {
        return this.getFieldReceivedOffers(userId, page, limit);
    }

    // Halı saha sahibinin aldığı teklifleri getirme
    async getFieldReceivedOffers(
        userId: string,
        page: number = 1,
        limit?: number
    ): Promise<ServiceResponse<{ offers: FieldOffer[]; total: number; totalPages: number }>> {
        try {
            // Önce kullanıcının halı sahalarını bul
            const userFields = await prisma.fieldListing.findMany({
                where: { userId: userId },
                select: { id: true }
            });

            const fieldIds = userFields.map(field => field.id);

            if (fieldIds.length === 0) {
                return {
                    success: true,
                    data: {
                        offers: [],
                        total: 0,
                        totalPages: 0
                    },
                    statusCode: 200
                };
            }

            const offset = limit ? (page - 1) * limit : 0;

            const findManyOptions: any = {
                where: {
                    fieldListingId: { in: fieldIds }
                },
                include: {
                    fieldListing: {
                        select: {
                            id: true,
                            fieldName: true,
                            fieldAddress: true
                        }
                    },
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            };

            // Sadece limit verilmişse pagination uygula
            if (limit) {
                findManyOptions.skip = offset;
                findManyOptions.take = limit;
            }

            const [offers, total] = await Promise.all([
                prisma.fieldOffer.findMany(findManyOptions),
                prisma.fieldOffer.count({
                    where: { fieldListingId: { in: fieldIds } }
                })
            ]);

            return {
                success: true,
                data: {
                    offers: offers as any,
                    total,
                    totalPages: limit ? Math.ceil(total / limit) : 1
                },
                statusCode: 200
            };
        } catch (error: any) {
            console.error('FieldOfferService.getFieldReceivedOffers error:', error);
            return {
                success: false,
                error: 'Teklifler getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Teklif detayını getirme
    async getOfferById(
        offerId: string,
        userId: string
    ): Promise<ServiceResponse<FieldOffer>> {
        try {
            const offer = await prisma.fieldOffer.findUnique({
                where: { id: offerId },
                include: {
                    fieldListing: {
                        select: {
                            id: true,
                            fieldName: true,
                            fieldAddress: true,
                            description: true,
                            hourlyPrice: true,
                            isActive: true,
                            featured: true,
                            createdAt: true,
                            updatedAt: true,
                            userId: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true,
                                    email: true,
                                    phone: true,
                                    profilePhoto: true,
                                    role: true,
                                    createdAt: true
                                }
                            }
                        }
                    },
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            email: true,
                            phone: true,
                            profilePhoto: true,
                            role: true
                        }
                    }
                }
            });

            if (!offer) {
                return {
                    success: false,
                    error: 'Teklif bulunamadı',
                    statusCode: 404
                };
            }

            // Sadece teklifi gönderen veya halı saha sahibi görebilir
            if (offer.offerFromUserId !== userId && offer.fieldListing.userId !== userId) {
                return {
                    success: false,
                    error: 'Bu teklifi görme yetkiniz yok',
                    statusCode: 403
                };
            }

            return {
                success: true,
                data: offer as any,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('FieldOfferService.getOfferById error:', error);
            return {
                success: false,
                error: 'Teklif getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Teklifi iptal etme (sadece gönderen kişi yapabilir)
    async cancelOffer(
        offerId: string,
        userId: string
    ): Promise<ServiceResponse<void>> {
        try {
            const existingOffer = await prisma.fieldOffer.findUnique({
                where: { id: offerId }
            });

            if (!existingOffer) {
                return {
                    success: false,
                    error: 'Teklif bulunamadı',
                    statusCode: 404
                };
            }

            // Sadece teklifi gönderen kişi iptal edebilir
            if (existingOffer.offerFromUserId !== userId) {
                return {
                    success: false,
                    error: 'Bu teklifi iptal etme yetkiniz yok',
                    statusCode: 403
                };
            }

            // Sadece PENDING durumundaki teklifler iptal edilebilir
            if (existingOffer.status !== 'PENDING') {
                return {
                    success: false,
                    error: 'Bu teklif zaten yanıtlanmış, iptal edilemez',
                    statusCode: 400
                };
            }

            await prisma.fieldOffer.update({
                where: { id: offerId },
                data: { status: 'CANCELLED' }
            });

            return {
                success: true,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('FieldOfferService.cancelOffer error:', error);
            return {
                success: false,
                error: 'Teklif iptal edilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Halı saha için kabul edilen teklifleri getirme (boş günleri hesaplamak için)
    async getAcceptedOffersByField(
        fieldListingId: string
    ): Promise<ServiceResponse<{ acceptedOffers: FieldOffer[] }>> {
        try {
            // Halı saha ilanının var olduğunu kontrol et
            const fieldListing = await prisma.fieldListing.findUnique({
                where: { id: fieldListingId, isActive: true }
            });

            if (!fieldListing) {
                return {
                    success: false,
                    error: 'Halı saha ilanı bulunamadı veya aktif değil',
                    statusCode: 404
                };
            }

            // Kabul edilen teklifleri getir (gelecek tarihler için)
            const acceptedOffers = await prisma.fieldOffer.findMany({
                where: {
                    fieldListingId: fieldListingId,
                    status: 'ACCEPTED',
                    matchDate: {
                        gte: new Date() // Sadece bugün ve gelecek tarihler
                    }
                },
                select: {
                    id: true,
                    matchDate: true,
                    startTime: true,
                    endTime: true,
                    offeredPrice: true,
                    createdAt: true,
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                },
                orderBy: [
                    { matchDate: 'asc' },
                    { startTime: 'asc' }
                ]
            });

            return {
                success: true,
                data: { acceptedOffers: acceptedOffers as any },
                statusCode: 200
            };
        } catch (error: any) {
            console.error('FieldOfferService.getAcceptedOffersByField error:', error);
            return {
                success: false,
                error: 'Kabul edilen teklifler getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }
}

export const fieldOfferService = new FieldOfferService();