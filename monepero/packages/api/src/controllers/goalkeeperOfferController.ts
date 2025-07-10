import { Request, Response } from 'express';
import { goalkeeperOfferService, CreateGoalkeeperOfferDto, UpdateOfferStatusDto } from '../services/goalkeeperOfferService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class GoalkeeperOfferController {
    // Teklif gönderme
    async createOffer(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
                return;
            }

            const {
                listingId,
                matchDate,
                startTime,
                endTime,
                location,
                description,
                offeredPrice
            } = req.body;

            // Gerekli alanları kontrol et
            if (!listingId || !matchDate || !startTime || !endTime || !location || !offeredPrice) {
                res.status(400).json({
                    success: false,
                    message: 'Gerekli alanlar eksik: listingId, matchDate, startTime, endTime, location, offeredPrice'
                });
                return;
            }

            // Tarih formatını kontrol et
            const parsedDate = new Date(matchDate);
            if (isNaN(parsedDate.getTime())) {
                res.status(400).json({
                    success: false,
                    message: 'Geçersiz tarih formatı'
                });
                return;
            }

            // Geçmiş tarih kontrolü
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const offerDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());

            if (offerDate < today) {
                res.status(400).json({
                    success: false,
                    message: 'Geçmiş tarih için teklif verilemez'
                });
                return;
            }

            // Saat formatını kontrol et (HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
                res.status(400).json({
                    success: false,
                    message: 'Geçersiz saat formatı. HH:MM formatında olmalıdır'
                });
                return;
            }

            // Başlangıç saati bitiş saatinden önce olmalı
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            if (startMinutes >= endMinutes) {
                res.status(400).json({
                    success: false,
                    message: 'Başlangıç saati bitiş saatinden önce olmalıdır'
                });
                return;
            }

            // Ücret kontrolü
            const price = parseFloat(offeredPrice);
            if (isNaN(price) || price <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'Geçersiz ücret miktarı'
                });
                return;
            }

            const offerData: CreateGoalkeeperOfferDto = {
                listingId,
                matchDate: parsedDate,
                startTime,
                endTime,
                location: location.trim(),
                description: description?.trim(),
                offeredPrice: price
            };

            const result = await goalkeeperOfferService.createOffer(userId, offerData);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Teklif başarıyla gönderildi' : result.error,
                data: result.data
            });
        } catch (error) {
            console.error('GoalkeeperOfferController.createOffer error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    // Teklif durumunu güncelleme (kabul/red)
    async updateOfferStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
                return;
            }

            const { offerId } = req.params;
            const { status } = req.body;

            if (!offerId) {
                res.status(400).json({
                    success: false,
                    message: 'Teklif ID gereklidir'
                });
                return;
            }

            if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Geçersiz durum. ACCEPTED veya REJECTED olmalıdır'
                });
                return;
            }

            const updateData: UpdateOfferStatusDto = {
                status
            };

            const result = await goalkeeperOfferService.updateOfferStatus(offerId, userId, updateData);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success
                    ? (status === 'ACCEPTED' ? 'Teklif kabul edildi' : 'Teklif reddedildi')
                    : result.error,
                data: result.data
            });
        } catch (error) {
            console.error('GoalkeeperOfferController.updateOfferStatus error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    // Kullanıcının gönderdiği teklifleri getirme
    async getUserSentOffers(req: AuthenticatedRequest, res: Response): Promise<void> {
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

            const result = await goalkeeperOfferService.getUserSentOffers(userId, page, limit);

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

    // Kullanıcının aldığı teklifleri getirme
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

            const result = await goalkeeperOfferService.getUserReceivedOffers(userId, page, limit);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Alınan teklifler başarıyla getirildi' : result.error,
                data: result.data,
                pagination: result.data && limit ? {
                    currentPage: page,
                    totalPages: result.data.totalPages,
                    totalItems: result.data.total,
                    itemsPerPage: limit
                } : undefined
            });
        } catch (error) {
            console.error('GoalkeeperOfferController.getUserReceivedOffers error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    // Teklif detayını getirme
    async getOfferById(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
                return;
            }

            const { offerId } = req.params;

            if (!offerId) {
                res.status(400).json({
                    success: false,
                    message: 'Teklif ID gereklidir'
                });
                return;
            }

            const result = await goalkeeperOfferService.getOfferById(offerId, userId);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Teklif detayı başarıyla getirildi' : result.error,
                data: result.data
            });
        } catch (error) {
            console.error('GoalkeeperOfferController.getOfferById error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }

    // Teklifi iptal etme
    async cancelOffer(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Oturum açmanız gerekiyor'
                });
                return;
            }

            const { offerId } = req.params;

            if (!offerId) {
                res.status(400).json({
                    success: false,
                    message: 'Teklif ID gereklidir'
                });
                return;
            }

            const result = await goalkeeperOfferService.cancelOffer(offerId, userId);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Teklif başarıyla iptal edildi' : result.error
            });
        } catch (error) {
            console.error('GoalkeeperOfferController.cancelOffer error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }
}

export const goalkeeperOfferController = new GoalkeeperOfferController(); 