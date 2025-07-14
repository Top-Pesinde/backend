import { Router } from 'express';
import { testNotificationController } from '../controllers/testNotificationController';

const router = Router();

/**
 * @swagger
 * /api/v1/test/notifications/send:
 *   post:
 *     summary: Test bildirimi gönder
 *     tags: [Test Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expoPushToken
 *             properties:
 *               expoPushToken:
 *                 type: string
 *                 description: Expo push token (ExponentPushToken[...])
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *               title:
 *                 type: string
 *                 description: Bildirim başlığı
 *                 example: "🚀 Test Bildirimi"
 *               body:
 *                 type: string
 *                 description: Bildirim içeriği
 *                 example: "Kaleci teklif sistemi test bildirimi!"
 *               data:
 *                 type: object
 *                 description: Ek data
 *     responses:
 *       200:
 *         description: Bildirim başarıyla gönderildi
 *       400:
 *         description: Geçersiz token veya parametreler
 */
router.post('/send', testNotificationController.sendTestNotification.bind(testNotificationController));

/**
 * @swagger
 * /api/v1/test/notifications/validate:
 *   post:
 *     summary: Expo push token'ı validate et
 *     tags: [Test Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expoPushToken
 *             properties:
 *               expoPushToken:
 *                 type: string
 *                 description: Expo push token
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *     responses:
 *       200:
 *         description: Token validation sonucu
 */
router.post('/validate', testNotificationController.validateExpoPushToken.bind(testNotificationController));

export default router; 