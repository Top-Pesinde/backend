import { Router } from 'express';
import { goalkeeperOfferController } from '../controllers/goalkeeperOfferController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     GoalkeeperOffer:
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
 *           description: Teklifi alan kullanıcı ID'si (kaleci)
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
 *         message:
 *           type: string
 *           description: Teklif mesajı
 *         responseMessage:
 *           type: string
 *           description: Kalecinin cevap mesajı
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/goalkeeper-offers:
 *   post:
 *     summary: Kaleci ilanına teklif gönder
 *     tags: [Goalkeeper Offers]
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
 *                 description: Kaleci ilanı ID'si
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
 *               message:
 *                 type: string
 *                 description: Teklif mesajı
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
router.post('/', goalkeeperOfferController.createOffer.bind(goalkeeperOfferController));

/**
 * @swagger
 * /api/v1/goalkeeper-offers/{offerId}/status:
 *   patch:
 *     summary: Teklif durumunu güncelle (kabul/red)
 *     tags: [Goalkeeper Offers]
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
 *                 description: Teklif durumu
 *               responseMessage:
 *                 type: string
 *                 description: Kalecinin cevap mesajı
 *     responses:
 *       200:
 *         description: Teklif durumu güncellendi
 *       400:
 *         description: Geçersiz durum
 *       403:
 *         description: Bu teklifi yanıtlama yetkiniz yok
 *       404:
 *         description: Teklif bulunamadı
 */
router.patch('/:offerId/status', goalkeeperOfferController.updateOfferStatus.bind(goalkeeperOfferController));

/**
 * @swagger
 * /api/v1/goalkeeper-offers/sent:
 *   get:
 *     summary: Gönderilen teklifleri getir
 *     tags: [Goalkeeper Offers]
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
router.get('/sent', goalkeeperOfferController.getUserSentOffers.bind(goalkeeperOfferController));

/**
 * @swagger
 * /api/v1/goalkeeper-offers/received:
 *   get:
 *     summary: Alınan teklifleri getir
 *     tags: [Goalkeeper Offers]
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
router.get('/received', goalkeeperOfferController.getUserReceivedOffers.bind(goalkeeperOfferController));




/**
 * 
 * @swagger
 * /api/v1/goalkeeper-offers/{offerId}:
 *   get:
 *     summary: Teklif detayını getir
 *     tags: [Goalkeeper Offers]
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

/**
 * @swagger
 * /api/v1/goalkeeper-offers/{offerId}/cancel:
 *   patch:
 *     summary: Teklifi iptal et
 *     tags: [Goalkeeper Offers]
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
 *       403:
 *         description: Bu teklifi iptal etme yetkiniz yok
 *       404:
 *         description: Teklif bulunamadı
 */
router.patch('/:offerId/cancel', goalkeeperOfferController.cancelOffer.bind(goalkeeperOfferController));

export default router; 