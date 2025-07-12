import { Request, Response } from 'express';
import { refereeOfferService, CreateRefereeOfferDto, UpdateRefereeOfferStatusDto } from '../services/refereeOfferService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class RefereeOfferController {
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
                    message: 'Geçmiş tarihler için teklif gönderilemez'
                });
                return;
            }

            // Fiyat kontrolü
            const price = parseFloat(offeredPrice);
            if (isNaN(price) || price <= 0 || price > 10000) {
                res.status(400).json({
                    success: false,
                    message: 'Teklif edilen ücret 0-10000 TL arasında olmalıdır'
                });
                return;
            }

            // Saat formatı kontrolü (HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
                res.status(400).json({
                    success: false,
                    message: 'Saat formatı HH:MM olmalıdır (örn: 14:30)'
                });
                return;
            }

            // Başlangıç saati bitiş saatinden küçük olmalı
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;

            if (startMinutes >= endMinutes) {
                res.status(400).json({
                    success: false,
                    message: 'Başlangıç saati bitiş saatinden küçük olmalıdır'
                });
                return;
            }

            const offerData: CreateRefereeOfferDto = {
                listingId,
                matchDate: parsedDate,
                startTime,
                endTime,
                location,
                description,
                offeredPrice: price
            };

            const result = await refereeOfferService.createOffer(userId, offerData);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Teklif başarıyla gönderildi' : result.error,
                data: result.data
            });
        } catch (error) {
            console.error('RefereeOfferController.createOffer error:', error);
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
                    message: 'Geçerli durum değeri gereklidir (ACCEPTED veya REJECTED)'
                });
                return;
            }

            const updateData: UpdateRefereeOfferStatusDto = { status };
            const result = await refereeOfferService.updateOfferStatus(offerId, userId, updateData);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? `Teklif ${status === 'ACCEPTED' ? 'kabul edildi' : 'reddedildi'}` : result.error,
                data: result.data
            });
        } catch (error) {
            console.error('RefereeOfferController.updateOfferStatus error:', error);
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

            const result = await refereeOfferService.getUserSentOffers(userId, page, limit);

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
            console.error('RefereeOfferController.getUserSentOffers error:', error);
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

            const result = await refereeOfferService.getUserReceivedOffers(userId, page, limit);

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
            console.error('RefereeOfferController.getUserReceivedOffers error:', error);
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

            const result = await refereeOfferService.getOfferById(offerId, userId);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Teklif detayı başarıyla getirildi' : result.error,
                data: result.data
            });
        } catch (error) {
            console.error('RefereeOfferController.getOfferById error:', error);
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

            const result = await refereeOfferService.cancelOffer(offerId, userId);

            res.status(result.statusCode).json({
                success: result.success,
                message: result.success ? 'Teklif başarıyla iptal edildi' : result.error
            });
        } catch (error) {
            console.error('RefereeOfferController.cancelOffer error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası'
            });
        }
    }
}

export const refereeOfferController = new RefereeOfferController(); 