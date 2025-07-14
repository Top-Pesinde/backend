import { Request, Response } from 'express';
import { fcmTokenService } from '../services/fcmTokenService';
import { CustomRequest, CreateFcmTokenDto, UpdateFcmTokenDto, ApiResponse } from '../types';

export class FcmTokenController {
    // FCM token kaydetme veya güncelleme
    async upsertFcmToken(req: CustomRequest, res: Response) {
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

            const { token, platform, deviceId } = req.body;

            // Validation
            if (!token || !platform) {
                return res.status(400).json({
                    success: false,
                    message: 'Token ve platform alanları gereklidir',
                    error: 'Missing required fields',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            // Platform validation
            if (!['IOS', 'ANDROID', 'WEB'].includes(platform)) {
                return res.status(400).json({
                    success: false,
                    message: 'Platform IOS, ANDROID veya WEB olmalıdır',
                    error: 'Invalid platform',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const fcmData: CreateFcmTokenDto = {
                token,
                platform,
                deviceId
            };

            const result = await fcmTokenService.upsertFcmToken(userId, fcmData);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'FCM token işlemi başarısız',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            const message = result.statusCode === 201 ? 'FCM token başarıyla kaydedildi' : 'FCM token başarıyla güncellendi';

            return res.status(200).json({
                success: true,
                message,
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode
            });

        } catch (error) {
            console.error('FcmTokenController.upsertFcmToken error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Kullanıcının FCM token'larını getirme
    async getUserFcmTokens(req: CustomRequest, res: Response) {
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

            const result = await fcmTokenService.getUserFcmTokens(userId);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'FCM token\'ları getirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'FCM token\'ları başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('FcmTokenController.getUserFcmTokens error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // FCM token silme (deaktif etme)
    async deleteFcmToken(req: CustomRequest, res: Response) {
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

            const { tokenId } = req.params;

            if (!tokenId) {
                return res.status(400).json({
                    success: false,
                    message: 'Token ID gereklidir',
                    error: 'Missing token ID',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const result = await fcmTokenService.deleteFcmToken(userId, tokenId);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'FCM token silinemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'FCM token başarıyla silindi',
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('FcmTokenController.deleteFcmToken error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }
}

export const fcmTokenController = new FcmTokenController(); 