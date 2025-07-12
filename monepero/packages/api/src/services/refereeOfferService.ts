import { prisma } from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { notificationService } from './notificationService';

export interface CreateRefereeOfferDto {
    listingId: string;
    matchDate: Date;
    startTime: string; // HH:MM formatında
    endTime: string;   // HH:MM formatında
    location: string;
    description?: string;
    offeredPrice: number;
}

export interface UpdateRefereeOfferStatusDto {
    status: 'ACCEPTED' | 'REJECTED';
}

export interface RefereeOffer {
    id: string;
    listingId: string;
    offerFromUserId: string;
    offerToUserId: string;
    matchDate: Date;
    startTime: string;
    endTime: string;
    location: string;
    description?: string;
    offeredPrice: Decimal;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    createdAt: Date;
    updatedAt: Date;
    listing?: any;
    offerFromUser?: any;
    offerToUser?: any;
}

export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode: number;
}

export class RefereeOfferService {
    // Teklif gönderme
    async createOffer(
        userId: string,
        data: CreateRefereeOfferDto
    ): Promise<ServiceResponse<RefereeOffer>> {
        try {
            // Hakem ilanını kontrol et
            const listing = await prisma.refereeListing.findUnique({
                where: { id: data.listingId, isActive: true },
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
                    error: 'Hakem ilanı bulunamadı veya aktif değil',
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

            // Aynı tarih ve saatte zaten teklif var mı kontrol et
            const existingOffer = await (prisma as any).refereeOffer.findFirst({
                where: {
                    listingId: data.listingId,
                    offerFromUserId: userId,
                    matchDate: data.matchDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    status: {
                        in: ['PENDING', 'ACCEPTED']
                    }
                }
            });

            if (existingOffer) {
                return {
                    success: false,
                    error: 'Bu tarih ve saat için zaten aktif bir teklifiniz bulunmaktadır',
                    statusCode: 409
                };
            }

            // Teklif oluştur
            const offer = await (prisma as any).refereeOffer.create({
                data: {
                    listingId: data.listingId,
                    offerFromUserId: userId,
                    offerToUserId: listing.userId,
                    matchDate: data.matchDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    location: data.location,
                    description: data.description,
                    offeredPrice: data.offeredPrice
                },
                include: {
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            location: true
                        }
                    },
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    },
                    offerToUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            });

            // Hakem'e bildirim gönder
            try {
                await notificationService.sendRefereeOfferNotification(
                    listing.userId,
                    {
                        senderName: `${offerFromUser.firstName} ${offerFromUser.lastName}`,
                        matchDate: data.matchDate.toISOString().split('T')[0],
                        location: data.location,
                        offeredPrice: data.offeredPrice,
                        offerId: offer.id
                    }
                );
            } catch (notificationError) {
                console.error('Hakem teklif bildirimi gönderilirken hata:', notificationError);
                // Bildirim hatası teklif oluşturulmasını engellemez
            }

            return {
                success: true,
                data: offer,
                statusCode: 201
            };
        } catch (error: any) {
            console.error('RefereeOfferService.createOffer error:', error);
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
        data: UpdateRefereeOfferStatusDto
    ): Promise<ServiceResponse<RefereeOffer>> {
        try {
            const existingOffer = await (prisma as any).refereeOffer.findUnique({
                where: { id: offerId }
            });

            if (!existingOffer) {
                return {
                    success: false,
                    error: 'Teklif bulunamadı',
                    statusCode: 404
                };
            }

            // Sadece teklifi alan kişi (hakem) durumu değiştirebilir
            if (existingOffer.offerToUserId !== userId) {
                return {
                    success: false,
                    error: 'Bu teklifi güncelleme yetkiniz yok',
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

            const updatedOffer = await (prisma as any).refereeOffer.update({
                where: { id: offerId },
                data: { status: data.status },
                include: {
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            location: true,
                            description: true
                        }
                    },
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    },
                    offerToUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            });

            // Teklif gönderen kişiye bildirim gönder
            try {
                const refereeName = `${updatedOffer.offerToUser.firstName} ${updatedOffer.offerToUser.lastName}`;
                const matchDate = updatedOffer.matchDate.toISOString().split('T')[0];

                if (data.status === 'ACCEPTED') {
                    await notificationService.sendRefereeOfferAcceptedNotification(
                        updatedOffer.offerFromUserId,
                        {
                            refereeName,
                            matchDate,
                            location: updatedOffer.location,
                            offerId: updatedOffer.id
                        }
                    );
                } else if (data.status === 'REJECTED') {
                    await notificationService.sendRefereeOfferRejectedNotification(
                        updatedOffer.offerFromUserId,
                        {
                            refereeName,
                            matchDate,
                            location: updatedOffer.location,
                            offerId: updatedOffer.id
                        }
                    );
                }
            } catch (notificationError) {
                console.error('Hakem teklif durum bildirimi gönderilirken hata:', notificationError);
                // Bildirim hatası teklif güncellenmesini engellemez
            }

            return {
                success: true,
                data: updatedOffer,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('RefereeOfferService.updateOfferStatus error:', error);
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
    ): Promise<ServiceResponse<{ offers: RefereeOffer[]; total: number; totalPages: number }>> {
        try {
            const offset = limit ? (page - 1) * limit : 0;

            const findManyOptions: any = {
                where: { offerFromUserId: userId },
                include: {
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            location: true
                        }
                    },
                    offerToUser: {
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
                (prisma as any).refereeOffer.findMany(findManyOptions),
                (prisma as any).refereeOffer.count({
                    where: { offerFromUserId: userId }
                })
            ]);

            return {
                success: true,
                data: {
                    offers: offers,
                    total,
                    totalPages: limit ? Math.ceil(total / limit) : 1
                },
                statusCode: 200
            };
        } catch (error: any) {
            console.error('RefereeOfferService.getUserSentOffers error:', error);
            return {
                success: false,
                error: 'Teklifler getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Kullanıcının aldığı teklifleri getirme
    async getUserReceivedOffers(
        userId: string,
        page: number = 1,
        limit?: number
    ): Promise<ServiceResponse<{ offers: RefereeOffer[]; total: number; totalPages: number }>> {
        try {
            const offset = limit ? (page - 1) * limit : 0;

            const findManyOptions: any = {
                where: { offerToUserId: userId },
                include: {
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            location: true
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
                (prisma as any).refereeOffer.findMany(findManyOptions),
                (prisma as any).refereeOffer.count({
                    where: { offerToUserId: userId }
                })
            ]);

            return {
                success: true,
                data: {
                    offers: offers,
                    total,
                    totalPages: limit ? Math.ceil(total / limit) : 1
                },
                statusCode: 200
            };
        } catch (error: any) {
            console.error('RefereeOfferService.getUserReceivedOffers error:', error);
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
    ): Promise<ServiceResponse<RefereeOffer>> {
        try {
            const offer = await (prisma as any).refereeOffer.findUnique({
                where: { id: offerId },
                include: {
                    listing: {
                        select: {
                            id: true,
                            title: true,
                            location: true,
                            description: true,
                            hasLicense: true,
                            hourlyPrice: true,
                            bio: true,
                            phone: true,
                            contactType: true,
                            isActive: true,
                            featured: true,
                            createdAt: true,
                            updatedAt: true,
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
                    },
                    offerToUser: {
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

            // Sadece teklifi gönderen veya alan kişi görebilir
            if (offer.offerFromUserId !== userId && offer.offerToUserId !== userId) {
                return {
                    success: false,
                    error: 'Bu teklifi görme yetkiniz yok',
                    statusCode: 403
                };
            }

            return {
                success: true,
                data: offer,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('RefereeOfferService.getOfferById error:', error);
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
            const existingOffer = await (prisma as any).refereeOffer.findUnique({
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

            await (prisma as any).refereeOffer.update({
                where: { id: offerId },
                data: { status: 'CANCELLED' }
            });

            return {
                success: true,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('RefereeOfferService.cancelOffer error:', error);
            return {
                success: false,
                error: 'Teklif iptal edilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }
}

export const refereeOfferService = new RefereeOfferService(); 