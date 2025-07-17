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

    // Kaleci teklif geldi bildirimi gönder
    async sendGoalkeeperOfferNotification(
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
                    title: '🥅 Yeni Kaleci Teklifi Geldi!',
                    body: `${offerData.senderName} kaleci ilanınız için teklif gönderdi. Maç: ${offerData.matchDate}, ${offerData.location}`,
                    data: {
                        type: 'GOALKEEPER_OFFER_RECEIVED',
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
            console.log('Kaleci teklif bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Kaleci teklif bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Hakem teklif geldi bildirimi gönder
    async sendRefereeOfferNotification(
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
                    title: '⚽ Yeni Hakem Teklifi Geldi!',
                    body: `${offerData.senderName} hakem ilanınız için teklif gönderdi. Maç: ${offerData.matchDate}, ${offerData.location}`,
                    data: {
                        type: 'REFEREE_OFFER_RECEIVED',
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
            console.log('Hakem teklif bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Hakem teklif bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Halı saha teklif geldi bildirimi gönder
    async sendFieldOfferNotification(
        recipientUserId: string,
        offerData: {
            senderName: string;
            matchDate: string;
            fieldName: string;
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
                    title: '🏟️ Yeni Halı Saha Teklifi Geldi!',
                    body: `${offerData.senderName} halı sahanız için teklif gönderdi. Maç: ${offerData.matchDate}, ${offerData.fieldName}`,
                    data: {
                        type: 'FIELD_OFFER_RECEIVED',
                        offerId: offerData.offerId,
                        senderName: offerData.senderName,
                        matchDate: offerData.matchDate,
                        fieldName: offerData.fieldName,
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
            console.log('Halı saha teklif bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Halı saha teklif bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Kaleci teklif kabul edildi bildirimi
    async sendGoalkeeperOfferAcceptedNotification(
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
                    title: '✅ Kaleci Teklifiniz Kabul Edildi!',
                    body: `${offerData.goalkeeperName} teklifinizi kabul etti! Maç: ${offerData.matchDate}, ${offerData.location} messagelar kısımıdan devam edeniniz `,
                    data: {
                        type: 'GOALKEEPER_OFFER_ACCEPTED',
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
            console.log('Kaleci kabul bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Kaleci kabul bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Hakem teklif kabul edildi bildirimi
    async sendRefereeOfferAcceptedNotification(
        recipientUserId: string,
        offerData: {
            refereeName: string;
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
                    title: '✅ Hakem Teklifiniz Kabul Edildi!',
                    body: `${offerData.refereeName} teklifinizi kabul etti! Maç: ${offerData.matchDate}, ${offerData.location} messagelar kısımıdan devam edeniniz `,
                    data: {
                        type: 'REFEREE_OFFER_ACCEPTED',
                        offerId: offerData.offerId,
                        refereeName: offerData.refereeName,
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
            console.log('Hakem kabul bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Hakem kabul bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Halı saha teklif kabul edildi bildirimi
    async sendFieldOfferAcceptedNotification(
        recipientUserId: string,
        offerData: {
            ownerName: string;
            fieldName: string;
            matchDate: string;
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
                    title: '✅ Halı Saha Teklifiniz Kabul Edildi!',
                    body: `${offerData.ownerName} halı saha teklifinizi kabul etti! Maç: ${offerData.matchDate}, ${offerData.fieldName} messagelar kısımıdan devam ediniz`,
                    data: {
                        type: 'FIELD_OFFER_ACCEPTED',
                        offerId: offerData.offerId,
                        ownerName: offerData.ownerName,
                        fieldName: offerData.fieldName,
                        matchDate: offerData.matchDate
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
            console.log('Halı saha kabul bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Halı saha kabul bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Halı saha teklif tamamlandı bildirimi
    async sendFieldOfferCompletedNotification(
        recipientUserId: string,
        offerData: {
            ownerName: string;
            fieldName: string;
            matchDate: string;
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
                    title: '🎉 Halı Saha Teklifiniz Tamamlandı!',
                    body: `${offerData.ownerName} ile ${offerData.fieldName} için teklifiniz başarıyla tamamlandı! Maç: ${offerData.matchDate}`,
                    data: {
                        type: 'FIELD_OFFER_COMPLETED',
                        offerId: offerData.offerId,
                        ownerName: offerData.ownerName,
                        fieldName: offerData.fieldName,
                        matchDate: offerData.matchDate
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
            console.log('Halı saha tamamlandı bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Halı saha tamamlandı bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }




    // Kaleci teklif reddedildi bildirimi
    async sendGoalkeeperOfferRejectedNotification(
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
                    title: '❌ Kaleci Teklifiniz Reddedildi',
                    body: `${offerData.goalkeeperName} teklifinizi reddetti. Maç: ${offerData.matchDate}`,
                    data: {
                        type: 'GOALKEEPER_OFFER_REJECTED',
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
            console.log('Kaleci red bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Kaleci red bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Hakem teklif reddedildi bildirimi
    async sendRefereeOfferRejectedNotification(
        recipientUserId: string,
        offerData: {
            refereeName: string;
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
                    title: '❌ Hakem Teklifiniz Reddedildi',
                    body: `${offerData.refereeName} teklifinizi reddetti. Maç: ${offerData.matchDate}`,
                    data: {
                        type: 'REFEREE_OFFER_REJECTED',
                        offerId: offerData.offerId,
                        refereeName: offerData.refereeName,
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
            console.log('Hakem red bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Hakem red bildirimi gönderme hatası:', error);
            return {
                success: false,
                error: 'Bildirim gönderilirken bir hata oluştu'
            };
        }
    }

    // Halı saha teklif reddedildi bildirimi
    async sendFieldOfferRejectedNotification(
        recipientUserId: string,
        offerData: {
            ownerName: string;
            fieldName: string;
            matchDate: string;
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
                    title: '❌ Halı Saha Teklifiniz Reddedildi',
                    body: `${offerData.ownerName} halı saha teklifinizi reddetti. Maç: ${offerData.matchDate}`,
                    data: {
                        type: 'FIELD_OFFER_REJECTED',
                        offerId: offerData.offerId,
                        ownerName: offerData.ownerName,
                        fieldName: offerData.fieldName,
                        matchDate: offerData.matchDate
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
            console.log('Halı saha red bildirimi gönderildi:', tickets);

            return { success: true };
        } catch (error) {
            console.error('Halı saha red bildirimi gönderme hatası:', error);
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