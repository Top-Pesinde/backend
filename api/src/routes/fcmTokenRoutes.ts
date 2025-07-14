import { Router } from 'express';
import { fcmTokenController } from '../controllers/fcmTokenController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Tüm routes authentication gerektirir
router.use(authenticateToken);

/**
 * @route POST /api/v1/fcm-tokens
 * @desc FCM token kaydetme veya güncelleme
 * @access Private
 * @body {string} token - FCM token (required)
 * @body {string} platform - Platform (IOS/ANDROID/WEB) (required)
 * @body {string} deviceId - Device ID (optional)
 */
router.post('/', fcmTokenController.upsertFcmToken.bind(fcmTokenController));

/**
 * @route GET /api/v1/fcm-tokens
 * @desc Kullanıcının FCM token'larını getirme
 * @access Private
 */
router.get('/', fcmTokenController.getUserFcmTokens.bind(fcmTokenController));

/**
 * @route DELETE /api/v1/fcm-tokens/:tokenId
 * @desc FCM token silme (deaktif etme)
 * @access Private
 * @params {string} tokenId - FCM token ID
 */
router.delete('/:tokenId', fcmTokenController.deleteFcmToken.bind(fcmTokenController));

export default router; 