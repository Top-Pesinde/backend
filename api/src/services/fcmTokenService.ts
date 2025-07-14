import {
    CreateFcmTokenDto,
    UpdateFcmTokenDto,
    ServiceResponse,
    FcmToken,
    Platform
} from '../types';

export class FcmTokenService {
    // FCM token oluşturma veya güncelleme - Her kullanıcının sadece 1 aktif token'ı olur
    async upsertFcmToken(userId: string, data: CreateFcmTokenDto): Promise<ServiceResponse<FcmToken>> {
        try {
            // Kullanıcının varlığını kontrol et
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return {
                    success: false,
                    error: 'Kullanıcı bulunamadı',
                    statusCode: 404
                };
            }

            // Aynı token zaten var mı kontrol et
            const sameToken = await prisma.fcmToken.findFirst({
                where: {
                    userId,
                    token: data.token
                }
            });

            if (sameToken) {
                // Aynı token zaten var, sadece platformu güncelle ve return et
                const fcmToken = await prisma.fcmToken.update({
                    where: { id: sameToken.id },
                    data: {
                        platform: data.platform,
                        deviceId: data.deviceId,
                        isActive: true
                    }
                });

                return {
                    success: true,
                    data: fcmToken as FcmToken,
                    statusCode: 200
                };
            }

            // Kullanıcının tüm eski FCM token'larını sil
            await prisma.fcmToken.deleteMany({
                where: { userId }
            });

            // Yeni token oluştur
            const fcmToken = await prisma.fcmToken.create({
                data: {
                    userId,
                    token: data.token,
                    platform: data.platform,
                    deviceId: data.deviceId
                }
            });

            return {
                success: true,
                data: fcmToken as FcmToken,
                statusCode: 201
            };
        } catch (error: any) {
            console.error('FcmTokenService.upsertFcmToken error:', error);

            // Duplicate token hatası kontrolü
            if (error.code === 'P2002' && error.meta?.target?.includes('token')) {
                return {
                    success: false,
                    error: 'Bu FCM token zaten başka bir kullanıcı tarafından kullanılıyor',
                    statusCode: 409
                };
            }

            return {
                success: false,
                error: 'FCM token işlemi sırasında bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Kullanıcının FCM token'larını getirme
    async getUserFcmTokens(userId: string): Promise<ServiceResponse<FcmToken[]>> {
        try {
            const tokens = await prisma.fcmToken.findMany({
                where: {
                    userId,
                    isActive: true
                },
                orderBy: { createdAt: 'desc' }
            });

            return {
                success: true,
                data: tokens as FcmToken[],
                statusCode: 200
            };
        } catch (error) {
            console.error('FcmTokenService.getUserFcmTokens error:', error);
            return {
                success: false,
                error: 'FCM token\'ları getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // FCM token silme (tamamen sil)
    async deleteFcmToken(userId: string, tokenId: string): Promise<ServiceResponse<void>> {
        try {
            // Token'ın kullanıcıya ait olduğunu kontrol et
            const existingToken = await prisma.fcmToken.findFirst({
                where: {
                    id: tokenId,
                    userId
                }
            });

            if (!existingToken) {
                return {
                    success: false,
                    error: 'FCM token bulunamadı veya bu token\'a erişim yetkiniz yok',
                    statusCode: 404
                };
            }

            // Token'ı tamamen sil
            await prisma.fcmToken.delete({
                where: { id: tokenId }
            });

            return {
                success: true,
                statusCode: 200
            };
        } catch (error) {
            console.error('FcmTokenService.deleteFcmToken error:', error);
            return {
                success: false,
                error: 'FCM token silinirken bir hata oluştu',
                statusCode: 500
            };
        }
    }
}

export const fcmTokenService = new FcmTokenService();
import { prisma } from '../lib/prisma';
