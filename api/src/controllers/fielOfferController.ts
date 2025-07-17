import { Request, Response } from "express";
import { CustomRequest } from "../types";
import { prisma } from '../lib/prisma';
import { fieldOfferService } from "../services/fieldService";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { notificationService } from "../services/notificationService";

export class FieldOfferController {

    async createOffer(req: CustomRequest, res: Response) {
        try {
            const { fieldListingId, matchDate, startTime, endTime, description, offeredPrice } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Token gerekli',
                    error: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                });
            }

            // Validate required fields
            if (!fieldListingId || !matchDate || !startTime || !endTime || !offeredPrice) {
                return res.status(400).json({
                    success: false,
                    message: 'Eksik alanlar: fieldListingId, matchDate, startTime, endTime, offeredPrice gereklidir',
                    error: 'Validation failed',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            // Check if field listing exists
            const fieldListing = await prisma.fieldListing.findUnique({
                where: { id: fieldListingId }
            });

            if (!fieldListing) {
                return res.status(404).json({
                    success: false,
                    message: 'Saha bulunamadı',
                    error: 'Field listing not found',
                    timestamp: new Date().toISOString(),
                    statusCode: 404
                });
            }

            // ÇAKIŞMA KONTROLÜ: Aynı gün ve saat aralığında kabul edilmiş teklif var mı?
            const overlappingAcceptedOffer = await prisma.fieldOffer.findFirst({
                where: {
                    fieldListingId,
                    status: 'ACCEPTED',
                    matchDate: new Date(matchDate),
                    // Saat aralığı çakışma kontrolü
                    OR: [
                        {
                            startTime: { lte: endTime },
                            endTime: { gte: startTime }
                        }
                    ]
                }
            });

            if (overlappingAcceptedOffer) {
                return res.status(409).json({
                    success: false,
                    message: 'Bu gün ve saat aralığı için zaten kabul edilmiş bir teklif var. Lütfen başka bir zaman dilimi seçin.',
                    error: 'Time slot conflict',
                    timestamp: new Date().toISOString(),
                    statusCode: 409
                });
            }


            const offer = await prisma.fieldOffer.create({
                data: {
                    fieldListingId,
                    offerFromUserId: userId,
                    matchDate: new Date(matchDate),
                    startTime,
                    endTime,
                    description,
                    offeredPrice,
                },
            });

            // Bildirim gönder: ilan sahibi userId'ye
            try {
                const fieldOwner = await prisma.fieldListing.findUnique({
                    where: { id: fieldListingId },
                    select: { userId: true, fieldName: true }
                });
                const senderUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { firstName: true, lastName: true }
                });
                if (fieldOwner && senderUser) {
                    const senderName = `${senderUser.firstName} ${senderUser.lastName}`.trim();
                    await notificationService.sendFieldOfferNotification(
                        fieldOwner.userId,
                        {
                            senderName,
                            matchDate,
                            fieldName: fieldOwner.fieldName,
                            offeredPrice,
                            offerId: offer.id
                        }
                    );
                }
            } catch (notifyError) {
                console.error('Halı saha teklif bildirimi gönderilemedi:', notifyError);
            }

            return res.status(201).json({
                success: true,
                message: 'Saha teklifi başarıyla oluşturuldu',
                data: offer,
                timestamp: new Date().toISOString(),
                statusCode: 201
            });

        } catch (error) {
            console.error('Error creating field order:', error);
            return res.status(500).json({
                success: false,
                message: 'Saha teklifi oluşturulurken bir hata oluştu',
                error: 'Failed to create field order',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    async getOffersByUser(req: CustomRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Token gerekli',
                    error: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                });
            }

            const offers = await prisma.fieldOffer.findMany({
                where: {
                    offerFromUserId: userId
                },
                include: {
                    fieldListing: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return res.status(200).json({
                success: true,
                message: 'Kullanıcı teklifleri başarıyla getirildi',
                data: offers,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });
        } catch (error) {
            console.error('Error fetching user offers:', error);
            return res.status(500).json({
                success: false,
                message: 'Kullanıcı teklifleri getirilirken bir hata oluştu',
                error: 'Failed to fetch user offers',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    async getOfferById(req: Request, res: Response) {
        try {
            const { offerId } = req.params; // DÜZELTME: id yerine offerId

            if (!offerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Teklif ID gereklidir',
                    error: 'Offer ID is required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const offer = await prisma.fieldOffer.findUnique({
                where: { id: offerId },
                include: {
                    fieldListing: {
                        select: {
                            id: true,
                            fieldName: true,
                            fieldAddress: true,
                            hourlyPrice: true,
                            isIndoor: true,
                            surfaceType: true,
                            phone: true,
                            contactType: true,
                            description: true,
                            isActive: true,
                            createdAt: true,
                            updatedAt: true,
                            features: true,
                            photos: true
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
                            location: true
                        }
                    }
                }
            });

            if (!offer) {
                return res.status(404).json({
                    success: false,
                    message: 'Teklif bulunamadı',
                    error: 'Offer not found',
                    timestamp: new Date().toISOString(),
                    statusCode: 404
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Teklif başarıyla getirildi',
                data: offer,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });
        } catch (error) {
            console.error('Error fetching offer:', error);
            return res.status(500).json({
                success: false,
                message: 'Teklif getirilirken bir hata oluştu',
                error: error instanceof Error ? error.message : 'Failed to fetch offer',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    async getUserSentOffers(req: any, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

            // Sayfa kontrolü
            if (page < 1) {
                res.status(400).json({
                    success: false,
                    message: 'Sayfa numarası 1\'den küçük olamaz'
                });
                return;
            }

            // Limit kontrolü (opsiyonel)
            if (limit !== undefined && (limit < 1 || limit > 1000)) {
                res.status(400).json({
                    success: false,
                    message: 'Limit 1-1000 arasında olmalıdır'
                });
                return;
            }

            const result = await fieldOfferService.getUserSentOffers(userId, page, limit);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Gönderilen teklifler başarıyla getirildi' : result.error,
                data: result.data,
                pagination: result.data && limit ? {
                    currentPage: page,
                    totalPages: result.data.totalPages,
                    totalItems: result.data.total,
                    itemsPerPage: limit
                } : undefined
            });
        } catch (error) {
            console.error('GoalkeeperOfferController.getUserSentOffers error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    async updateOfferStatus(req: Request, res: Response) {
        try {
            const { offerId } = req.params;
            const { status } = req.body;

            if (!offerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Teklif ID gereklidir',
                    error: 'Offer ID is required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            if (!['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz durum değeri',
                    error: 'Invalid status value',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const updatedOffer = await prisma.fieldOffer.update({
                where: { id: offerId },
                data: { status }
            });

            // Teklif kabul edildi veya tamamlandıysa bildirim gönder
            if (status === 'ACCEPTED' || status === 'COMPLETED') {
                try {
                    const offer = await prisma.fieldOffer.findUnique({
                        where: { id: offerId },
                        include: {
                            fieldListing: {
                                select: {
                                    fieldName: true,
                                    userId: true
                                }
                            },
                            offerFromUser: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    });

                    if (offer) {
                        const fieldOwner = await prisma.user.findUnique({
                            where: { id: offer.fieldListing.userId },
                            select: { firstName: true, lastName: true }
                        });

                        if (fieldOwner) {
                            const ownerName = `${fieldOwner.firstName} ${fieldOwner.lastName}`.trim();
                            if (status === 'ACCEPTED') {
                                await notificationService.sendFieldOfferAcceptedNotification(
                                    offer.offerFromUserId,
                                    {
                                        ownerName,
                                        fieldName: offer.fieldListing.fieldName,
                                        matchDate: new Date(offer.matchDate).toLocaleDateString('tr-TR'),
                                        offerId: offer.id
                                    }
                                );
                            } else if (status === 'COMPLETED') {
                                await notificationService.sendFieldOfferCompletedNotification(
                                    offer.offerFromUserId,
                                    {
                                        ownerName,
                                        fieldName: offer.fieldListing.fieldName,
                                        matchDate: new Date(offer.matchDate).toLocaleDateString('tr-TR'),
                                        offerId: offer.id
                                    }
                                );
                            }
                        }
                    }
                } catch (notifyError) {
                    console.error('Teklif durumu bildirimi gönderilemedi:', notifyError);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Teklif durumu başarıyla güncellendi',
                data: updatedOffer,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });
        } catch (error) {
            console.error('Error updating offer status:', error);
            return res.status(500).json({
                success: false,
                message: 'Teklif durumu güncellenirken bir hata oluştu',
                error: error instanceof Error ? error.message : 'Failed to update offer status',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }
    async getUserReceivedOffers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
                return;
            }

            // Pagination ve limit kaldırıldı, tüm teklifler getirilecek
            const offers = await prisma.fieldOffer.findMany({
                where: {
                    fieldListing: {
                        userId: userId
                    }
                },
                include: {
                    fieldListing: true,
                    offerFromUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            email: true,
                            phone: true,
                            profilePhoto: true,
                            location: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            res.status(200).json({
                success: true,
                message: 'Alınan teklifler başarıyla getirildi',
                data: { offers, total: offers.length },
                timestamp: new Date().toISOString(),
                statusCode: 200
            });
        } catch (error) {
            console.error('GoalkeeperOfferController.getUserReceivedOffers error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    // Halı saha için kabul edilen teklifleri getirme (boş günleri görmek için)
    async getAcceptedOffersByField(req: Request, res: Response): Promise<void> {
        try {
            const { fieldListingId } = req.params;

            if (!fieldListingId) {
                res.status(400).json({
                    success: false,
                    message: 'Halı saha ID\'si gereklidir',
                    error: 'Field listing ID is required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
                return;
            }

            const result = await fieldOfferService.getAcceptedOffersByField(fieldListingId);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Kabul edilen teklifler başarıyla getirildi' : result.error,
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode
            });
        } catch (error) {
            console.error('FieldOfferController.getAcceptedOffersByField error:', error);
            res.status(500).json({
                success: false,
                message: 'Kabul edilen teklifler getirilirken bir hata oluştu',
                error: 'Failed to fetch accepted offers',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Belirli bir halısaha için kabul edilen tekliflerin gün ve saatlerini döner
    async getAcceptedOfferTimesByField(req: Request, res: Response): Promise<void> {
        try {
            const { fieldListingId } = req.params;

            if (!fieldListingId) {
                res.status(400).json({
                    success: false,
                    message: 'Halı saha ID\'si gereklidir',
                    error: 'Field listing ID is required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
                return;
            }

            const offers = await prisma.fieldOffer.findMany({
                where: {
                    fieldListingId,
                    status: { in: ['ACCEPTED', 'COMPLETED'] }
                },
                select: {
                    matchDate: true,
                    startTime: true,
                    endTime: true
                },
                orderBy: {
                    matchDate: 'asc'
                }
            });

            res.status(200).json({
                success: true,
                message: 'Kabul edilen teklif gün ve saatleri başarıyla getirildi',
                data: offers,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Kabul edilen teklif gün ve saatleri getirilirken bir hata oluştu',
                error: error instanceof Error ? error.message : 'Failed to fetch accepted offer times',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Kullanıcının kendi gönderdiği halısaha tekliflerini getir
    async getMyFieldOffers(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
                return;
            }

            const offers = await prisma.fieldOffer.findMany({
                where: { offerFromUserId: userId },
                include: {
                    fieldListing: true
                },
                orderBy: { createdAt: 'desc' }
            });

            res.status(200).json({
                success: true,
                message: offers.length > 0 ? 'Kendi gönderdiğiniz halısaha teklifleri başarıyla getirildi' : 'Henüz teklifiniz bulunmamaktadır',
                data: offers,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });
        } catch (error) {
            console.error('Kendi halısaha teklifleri getirilirken hata:', error);
            res.status(500).json({
                success: false,
                message: 'Kendi halısaha teklifleri getirilirken bir hata oluştu',
                error: error instanceof Error ? error.message : 'Failed to fetch my field offers',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

}