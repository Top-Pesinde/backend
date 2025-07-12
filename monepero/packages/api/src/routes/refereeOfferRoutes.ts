import { Router } from 'express';
import { refereeOfferController } from '../controllers/refereeOfferController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     RefereeOffer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Teklif ID'si
 *         listingId:
 *           type: string
 *           description: İlan ID'si
 *         offerFromUserId:
 *           type: string
 *           description: Teklifi gönderen kullanıcı ID'si
 *         offerToUserId:
 *           type: string
 *           description: Teklifi alan kullanıcı ID'si (hakem)
 *         matchDate:
 *           type: string
 *           format: date
 *           description: Maç tarihi
 *         startTime:
 *           type: string
 *           description: Başlangıç saati (HH:MM)
 *         endTime:
 *           type: string
 *           description: Bitiş saati (HH:MM)
 *         location:
 *           type: string
 *           description: Maç konumu
 *         description:
 *           type: string
 *           description: Ek açıklama
 *         offeredPrice:
 *           type: number
 *           description: Teklif edilen ücret
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, CANCELLED]
 *           description: Teklif durumu
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/referee-offers:
 *   post:
 *     summary: Hakem ilanına teklif gönder
 *     tags: [Referee Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listingId
 *               - matchDate
 *               - startTime
 *               - endTime
 *               - location
 *               - offeredPrice
 *             properties:
 *               listingId:
 *                 type: string
 *                 description: Hakem ilanı ID'si
 *               matchDate:
 *                 type: string
 *                 format: date
 *                 description: Maç tarihi (YYYY-MM-DD)
 *               startTime:
 *                 type: string
 *                 description: Başlangıç saati (HH:MM)
 *               endTime:
 *                 type: string
 *                 description: Bitiş saati (HH:MM)
 *               location:
 *                 type: string
 *                 description: Maç konumu
 *               description:
 *                 type: string
 *                 description: Ek açıklama
 *               offeredPrice:
 *                 type: number
 *                 description: Teklif edilen ücret
 *     responses:
 *       201:
 *         description: Teklif başarıyla gönderildi
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         description: Yetkilendirme gerekli
 *       409:
 *         description: Bu tarih için zaten teklif mevcut
 */
router.post('/', refereeOfferController.createOffer.bind(refereeOfferController));

/**
 * @swagger
 * /api/v1/referee-offers/{offerId}/status:
 *   patch:
 *     summary: Teklif durumunu güncelle (kabul/red)
 *     tags: [Referee Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teklif ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, REJECTED]
 *                 description: Yeni teklif durumu
 *     responses:
 *       200:
 *         description: Teklif durumu başarıyla güncellendi
 *       400:
 *         description: Geçersiz durum değeri
 *       403:
 *         description: Bu teklifi güncelleme yetkiniz yok
 *       404:
 *         description: Teklif bulunamadı
 */
router.patch('/:offerId/status', refereeOfferController.updateOfferStatus.bind(refereeOfferController));

/**
 * @swagger
 * /api/v1/referee-offers/sent:
 *   get:
 *     summary: Gönderilen teklifleri getir
 *     tags: [Referee Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Sayfa başına öğe sayısı
 *     responses:
 *       200:
 *         description: Gönderilen teklifler başarıyla getirildi
 */
router.get('/sent', refereeOfferController.getUserSentOffers.bind(refereeOfferController));

/**
 * @swagger
 * /api/v1/referee-offers/received:
 *   get:
 *     summary: Alınan teklifleri getir
 *     tags: [Referee Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Sayfa başına öğe sayısı
 *     responses:
 *       200:
 *         description: Alınan teklifler başarıyla getirildi
 */
router.get('/received', refereeOfferController.getUserReceivedOffers.bind(refereeOfferController));

/**
 * @swagger
 * /api/v1/referee-offers/{offerId}:
 *   get:
 *     summary: Teklif detayını getir
 *     tags: [Referee Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teklif ID'si
 *     responses:
 *       200:
 *         description: Teklif detayı başarıyla getirildi
 *       403:
 *         description: Bu teklifi görme yetkiniz yok
 *       404:
 *         description: Teklif bulunamadı
 */
router.get('/:offerId', refereeOfferController.getOfferById.bind(refereeOfferController));

/**
 * @swagger
 * /api/v1/referee-offers/{offerId}/cancel:
 *   patch:
 *     summary: Teklifi iptal et
 *     tags: [Referee Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teklif ID'si
 *     responses:
 *       200:
 *         description: Teklif başarıyla iptal edildi
 *       400:
 *         description: Teklif zaten yanıtlanmış
 *       403:
 *         description: Bu teklifi iptal etme yetkiniz yok
 *       404:
 *         description: Teklif bulunamadı
 */
router.patch('/:offerId/cancel', refereeOfferController.cancelOffer.bind(refereeOfferController));

export default router; 