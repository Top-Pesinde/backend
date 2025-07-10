import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { fcmTokenService } from './fcmTokenService';
import { prisma } from '../lib/prisma';

export class NotificationService {
    private expo: Expo;

    constructor() {
        this.expo = new Expo({
            accessToken: "CmOITu7ZRA_1Crxt6A6hUjEPF2kIAjTlgd6gvemA",
            useFcmV1: true
        });
    }

    // Teklif geldi bildirimi gönder
    async sendOfferNotification(
        recipientUserId: string,
        offerData: {
            senderName: string;
            matchDate: string;
            location: string;
            offeredPrice: number;
            offerId: string;
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const tokensResponse = await fcmTokenService.getUserFcmTokens(recipientUserId);

            if (!tokensResponse.success || !tokensResponse.data || tokensResponse.data.length === 0) {
                return {
                    success: false,
                    error: 'Kullanıcının aktif FCM token\'ı bulunamadı'
                };
            }

            const messages: ExpoPushMessage[] = tokensResponse.data
                .filter(tokenData => Expo.isExpoPushToken(tokenData.token))
                .map(tokenData => ({
                    to: tokenData.token,
                    sound: 'default',
                    title: '🥅 Yeni Teklif Geldi!',
                    body: `${offerData.senderName} kaleci ilanınız için teklif gönderdi. Maç: ${offerData.matchDate}, ${offerData.location}`,
                    data: {
                        type: 'OFFER_RECEIVED',
                        offerId: offerData.offerId,
                        senderName: offerData.senderName,
                        matchDate: offerData.matchDate,
                        location: offerData.location,
                        offeredPrice: offerData.offeredPrice
                    },
                    badge: 1
                }));

            if (messages.length === 0) {
                return {
                    success: false,
                    error: 'Geçerli Expo push token bulunamadı'
                };
            }

            const tickets = await this.expo.sendPushNotificationsAsync(messages);
            console.log('Teklif bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Teklif bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Teklif kabul edildi bildirimi
    async sendOfferAcceptedNotification(
        recipientUserId: string,
        offerData: {
            goalkeeperName: string;
            matchDate: string;
            location: string;
            offerId: string;
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const tokensResponse = await fcmTokenService.getUserFcmTokens(recipientUserId);

            if (!tokensResponse.success || !tokensResponse.data || tokensResponse.data.length === 0) {
                return {
                    success: false,
                    error: 'Kullanıcının aktif FCM token\'ı bulunamadı'
                };
            }

            const messages: ExpoPushMessage[] = tokensResponse.data
                .filter(tokenData => Expo.isExpoPushToken(tokenData.token))
                .map(tokenData => ({
                    to: tokenData.token,
                    sound: 'default',
                    title: '✅ Teklifiniz Kabul Edildi!',
                    body: `${offerData.goalkeeperName} teklifinizi kabul etti! Maç: ${offerData.matchDate}, ${offerData.location} messagelar kısımıdan devam edeniniz `,
                    data: {
                        type: 'OFFER_ACCEPTED',
                        offerId: offerData.offerId,
                        goalkeeperName: offerData.goalkeeperName,
                        matchDate: offerData.matchDate,
                        location: offerData.location
                    },
                    badge: 1
                }));

            if (messages.length === 0) {
                return {
                    success: false,
                    error: 'Geçerli Expo push token bulunamadı'
                };
            }

            const tickets = await this.expo.sendPushNotificationsAsync(messages);
            console.log('Kabul bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Kabul bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Teklif reddedildi bildirimi
    async sendOfferRejectedNotification(
        recipientUserId: string,
        offerData: {
            goalkeeperName: string;
            matchDate: string;
            location: string;
            offerId: string;
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const tokensResponse = await fcmTokenService.getUserFcmTokens(recipientUserId);

            if (!tokensResponse.success || !tokensResponse.data || tokensResponse.data.length === 0) {
                return {
                    success: false,
                    error: 'Kullanıcının aktif FCM token\'ı bulunamadı'
                };
            }

            const messages: ExpoPushMessage[] = tokensResponse.data
                .filter(tokenData => Expo.isExpoPushToken(tokenData.token))
                .map(tokenData => ({
                    to: tokenData.token,
                    sound: 'default',
                    title: '❌ Teklifiniz Reddedildi',
                    body: `${offerData.goalkeeperName} teklifinizi reddetti. Maç: ${offerData.matchDate}`,
                    data: {
                        type: 'OFFER_REJECTED',
                        offerId: offerData.offerId,
                        goalkeeperName: offerData.goalkeeperName,
                        matchDate: offerData.matchDate,
                        location: offerData.location
                    },
                    badge: 1
                }));

            if (messages.length === 0) {
                return {
                    success: false,
                    error: 'Geçerli Expo push token bulunamadı'
                };
            }

            const tickets = await this.expo.sendPushNotificationsAsync(messages);
            console.log('Red bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Red bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Genel bildirim gönderme (diğer amaçlar için)
    async sendCustomNotification(
        recipientUserId: string,
        title: string,
        body: string,
        data?: any
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const tokensResponse = await fcmTokenService.getUserFcmTokens(recipientUserId);

            if (!tokensResponse.success || !tokensResponse.data || tokensResponse.data.length === 0) {
                return {
                    success: false,
                    error: 'Kullanıcının aktif FCM token\'ı bulunamadı'
                };
            }

            const messages: ExpoPushMessage[] = tokensResponse.data
                .filter(tokenData => Expo.isExpoPushToken(tokenData.token))
                .map(tokenData => ({
                    to: tokenData.token,
                    sound: 'default',
                    title,
                    body,
                    data: data || {},
                    badge: 1
                }));

            if (messages.length === 0) {
                return {
                    success: false,
                    error: 'Geçerli Expo push token bulunamadı'
                };
            }

            const tickets = await this.expo.sendPushNotificationsAsync(messages);
            console.log('Özel bildirim gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Özel bildirim gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // TEST: Direkt Expo push token ile bildirim gönderme
    async sendTestNotification(
        expoPushToken: string,
        title?: string,
        body?: string,
        data?: any
    ): Promise<{ success: boolean; error?: string; details?: any }> {
        try {
            // Token'ın geçerli olup olmadığını kontrol et
            if (!Expo.isExpoPushToken(expoPushToken)) {
                return {
                    success: false,
                    error: 'Geçersiz Expo push token formatı'
                };
            }

            const message: ExpoPushMessage = {
                to: expoPushToken,
                sound: 'default',
                title: title || '🧪 Test Bildirimi',
                body: body || 'Bu bir test bildirimidir. Expo push notification sistemi çalışıyor! 🚀',
                data: {
                    type: 'TEST_NOTIFICATION',
                    timestamp: new Date().toISOString(),
                    source: 'Kaleci Teklif Sistemi',
                    ...data
                },
                badge: 1
            };

            console.log('Test bildirimi gönderiliyor:', {
                to: expoPushToken,
                title: message.title,
                body: message.body
            });

            const tickets = await this.expo.sendPushNotificationsAsync([message]);

            console.log('Test bildirimi gönderildi:', tickets);

            // Ticket detaylarını kontrol et
            const ticket = tickets[0];
            if (ticket.status === 'error') {
                return {
                    success: false,
                    error: `Bildirim gönderme hatası: ${ticket.message}`,
                    details: ticket
                };
            }

            return {
                success: true,
                details: {
                    ticket: ticket,
                    message: 'Test bildirimi başarıyla gönderildi!'
                }
            };
        } catch (error: any) {
            console.error('Test bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Test bildirimi gönderilirken bir hata oluştu: ' + error.message
            };
        }
    }
}

export const notificationService = new NotificationService(); 