import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';

export class TestNotificationController {
    // Test bildirimi gönderme
    async sendTestNotification(req: Request, res: Response): Promise<void> {
        try {
            const { expoPushToken, title, body, data } = req.body;

            // Gerekli alanları kontrol et
            if (!expoPushToken) {
                res.status(400).json({
                    success: false,
                    message: 'expoPushToken gereklidir'
                });
                return;
            }

            // Test bildirimi gönder
            const result = await notificationService.sendTestNotification(
                expoPushToken,
                title,
                body,
                data
            );

            res.status(result.success ? 200 : 400).json({
                success: result.success,
                message: result.success ? 'Test bildirimi başarıyla gönderildi!' : result.error,
                data: result.details || null
            });
        } catch (error: any) {
            console.error('TestNotificationController.sendTestNotification error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası: ' + error.message
            });
        }
    }

    // Expo push token validation
    async validateExpoPushToken(req: Request, res: Response): Promise<void> {
        try {
            const { expoPushToken } = req.body;

            if (!expoPushToken) {
                res.status(400).json({
                    success: false,
                    message: 'expoPushToken gereklidir'
                });
                return;
            }

            // Expo SDK ile token'ı validate et
            const { Expo } = require('expo-server-sdk');
            const isValid = Expo.isExpoPushToken(expoPushToken);

            res.status(200).json({
                success: true,
                message: isValid ? 'Token geçerli' : 'Token geçersiz',
                data: {
                    expoPushToken,
                    isValid,
                    tokenLength: expoPushToken.length,
                    tokenType: typeof expoPushToken
                }
            });
        } catch (error: any) {
            console.error('TestNotificationController.validateExpoPushToken error:', error);
            res.status(500).json({
                success: false,
                message: 'Sunucu hatası: ' + error.message
            });
        }
    }
}

export const testNotificationController = new TestNotificationController(); 