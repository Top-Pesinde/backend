import { prisma } from '../lib/prisma';
import { notificationService } from './notificationService';
import { Decimal } from '@prisma/client/runtime/library';

// Teklif oluşturma için DTO
export interface CreateGoalkeeperOfferDto {
    listingId: string;
    matchDate: Date;
    startTime: string; // HH:MM formatında
    endTime: string;   // HH:MM formatında
    location: string;
    description?: string;
    offeredPrice: number;
}

// Teklif güncelleme için DTO
export interface UpdateOfferStatusDto {
    status: 'ACCEPTED' | 'REJECTED';
}

export interface GoalkeeperOffer {
    id: string;
    listingId: string;
    offerFromUserId: string;
    offerToUserId: string;
    matchDate: Date;
    startTime: string;
    endTime: string;
    location: string;
    description?: string;
    offeredPrice: Decimal; // Decimal tipine değiştirdim
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

export class GoalkeeperOfferService {
    // Teklif gönderme
    async createOffer(
        userId: string,
        data: CreateGoalkeeperOfferDto
    ): Promise<ServiceResponse<GoalkeeperOffer>> {
        try {
            // Kaleci ilanını kontrol et
            const listing = await prisma.goalkeeperListing.findUnique({
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
                    error: 'Kaleci ilanı bulunamadı veya aktif değil',
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
            const existingOffer = await (prisma as any).goalkeeperOffer.findFirst({
                where: {
                    listingId: data.listingId,
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
            const offer = await (prisma as any).goalkeeperOffer.create({
                data: {
                    listingId: data.listingId,
                    offerFromUserId: userId,
                    offerToUserId: listing.userId,
                    matchDate: data.matchDate,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    location: data.location,
                    description: data.description,
                    offeredPrice: new Decimal(data.offeredPrice)
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

            // Kaleciye bildirim gönder
            const senderName = `${offerFromUser.firstName} ${offerFromUser.lastName}`;
            const matchDateStr = new Intl.DateTimeFormat('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(data.matchDate);

            await notificationService.sendOfferNotification(listing.userId, {
                senderName,
                matchDate: `${matchDateStr} ${data.startTime}-${data.endTime}`,
                location: data.location,
                offeredPrice: data.offeredPrice,
                offerId: offer.id
            });

            return {
                success: true,
                data: offer,
                statusCode: 201
            };
        } catch (error: any) {
            console.error('GoalkeeperOfferService.createOffer error:', error);
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
    ): Promise<ServiceResponse<GoalkeeperOffer>> {
        try {
            // Teklifi kontrol et
            const existingOffer = await (prisma as any).goalkeeperOffer.findUnique({
                where: { id: offerId },
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

            if (!existingOffer) {
                return {
                    success: false,
                    error: 'Teklif bulunamadı',
                    statusCode: 404
                };
            }

            // Sadece kaleci (ilan sahibi) teklifleri yanıtlayabilir
            if (existingOffer.offerToUserId !== userId) {
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
            const updatedOffer = await (prisma as any).goalkeeperOffer.update({
                where: { id: offerId },
                data: {
                    status: data.status
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

            // Teklifi gönderen kişiye bildirim gönder
            const goalkeeperName = `${existingOffer.offerToUser.firstName} ${existingOffer.offerToUser.lastName}`;
            const matchDateStr = new Intl.DateTimeFormat('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(existingOffer.matchDate);

            if (data.status === 'ACCEPTED') {
                await notificationService.sendOfferAcceptedNotification(existingOffer.offerFromUserId, {
                    goalkeeperName,
                    matchDate: `${matchDateStr} ${existingOffer.startTime}-${existingOffer.endTime}`,
                    location: existingOffer.location,
                    offerId: offerId
                });
            } else if (data.status === 'REJECTED') {
                await notificationService.sendOfferRejectedNotification(existingOffer.offerFromUserId, {
                    goalkeeperName,
                    matchDate: `${matchDateStr} ${existingOffer.startTime}-${existingOffer.endTime}`,
                    location: existingOffer.location,
                    offerId: offerId
                });
            }

            return {
                success: true,
                data: updatedOffer,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('GoalkeeperOfferService.updateOfferStatus error:', error);
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
    ): Promise<ServiceResponse<{ offers: GoalkeeperOffer[]; total: number; totalPages: number }>> {
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
                (prisma as any).goalkeeperOffer.findMany(findManyOptions),
                (prisma as any).goalkeeperOffer.count({
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
            console.error('GoalkeeperOfferService.getUserSentOffers error:', error);
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
    ): Promise<ServiceResponse<{ offers: GoalkeeperOffer[]; total: number; totalPages: number }>> {
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
                (prisma as any).goalkeeperOffer.findMany(findManyOptions),
                (prisma as any).goalkeeperOffer.count({
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
            console.error('GoalkeeperOfferService.getUserReceivedOffers error:', error);
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
    ): Promise<ServiceResponse<GoalkeeperOffer>> {
        try {
            const offer = await (prisma as any).goalkeeperOffer.findUnique({
                where: { id: offerId },
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
            console.error('GoalkeeperOfferService.getOfferById error:', error);
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
            const existingOffer = await (prisma as any).goalkeeperOffer.findUnique({
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

            await (prisma as any).goalkeeperOffer.update({
                where: { id: offerId },
                data: { status: 'CANCELLED' }
            });

            return {
                success: true,
                statusCode: 200
            };
        } catch (error: any) {
            console.error('GoalkeeperOfferService.cancelOffer error:', error);
            return {
                success: false,
                error: 'Teklif iptal edilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }
}

export const goalkeeperOfferService = new GoalkeeperOfferService(); 