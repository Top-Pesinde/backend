import { prisma } from '../lib/prisma';
import { listingFeatureService } from './listingFeatureService';
import { ServiceResponse } from '../types';

export class SubscriptionService {
    /**
     * Kullanıcı abone olduğunda ilanlarını otomatik olarak öne çıkarır
     * @param userId Kullanıcı ID'si
     * @param subscriptionType Abonelik tipi (premium, gold, etc.)
     * @returns ServiceResponse
     */
    async activateUserSubscription(
        userId: string,
        subscriptionType: 'premium' | 'gold' | 'platinum'
    ): Promise<ServiceResponse<void>> {
        try {
            // Kullanıcının abonelik durumunu güncelle
            await prisma.user.update({
                where: { id: userId },
                data: {
                    subscription: true,
                    // Abonelik tipini de kaydedebilirsin (eğer schema'da alan varsa)
                }
            });

            // Abonelik tipine göre öne çıkarma stratejisi
            let shouldFeature = false;

            switch (subscriptionType) {
                case 'premium':
                    // Premium abonelik: Sadece halısaha ilanlarını öne çıkar
                    await listingFeatureService.setUserListingsByTypeFeatured(
                        userId,
                        'field',
                        true
                    );
                    shouldFeature = true;
                    break;

                case 'gold':
                    // Gold abonelik: Tüm ilanları öne çıkar
                    await listingFeatureService.setUserAllListingsFeatured(
                        userId,
                        true
                    );
                    shouldFeature = true;
                    break;

                case 'platinum':
                    // Platinum abonelik: Tüm ilanları öne çıkar + ek özellikler
                    await listingFeatureService.setUserAllListingsFeatured(
                        userId,
                        true
                    );
                    shouldFeature = true;
                    // Burada ek özellikler eklenebilir (örn: özel rozet, renkli gösterim, etc.)
                    break;

                default:
                    return {
                        success: false,
                        error: 'Geçersiz abonelik tipi',
                        statusCode: 400
                    };
            }

            if (shouldFeature) {
                console.log(`✅ Kullanıcı ${userId} için ${subscriptionType} abonelik aktifleştirildi ve ilanlar öne çıkarıldı`);
            }

            return {
                success: true,
                data: undefined
            };

        } catch (error) {
            console.error('SubscriptionService.activateUserSubscription error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Abonelik aktifleştirme başarısız',
                statusCode: 500
            };
        }
    }

    /**
     * Kullanıcının aboneliğini iptal ettiğinde ilanlarını öne çıkarmayı kaldırır
     * @param userId Kullanıcı ID'si
     * @returns ServiceResponse
     */
    async deactivateUserSubscription(userId: string): Promise<ServiceResponse<void>> {
        try {
            // Kullanıcının abonelik durumunu güncelle
            await prisma.user.update({
                where: { id: userId },
                data: { subscription: false }
            });

            // Tüm ilanların öne çıkarma durumunu kaldır
            await listingFeatureService.setUserAllListingsFeatured(
                userId,
                false
            );

            console.log(`❌ Kullanıcı ${userId} için abonelik iptal edildi ve ilanlar öne çıkarma kaldırıldı`);

            return {
                success: true,
                data: undefined
            };

        } catch (error) {
            console.error('SubscriptionService.deactivateUserSubscription error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Abonelik iptal etme başarısız',
                statusCode: 500
            };
        }
    }

    /**
     * Kullanıcının abonelik durumunu kontrol eder
     * @param userId Kullanıcı ID'si
     * @returns ServiceResponse<boolean>
     */
    async checkUserSubscription(userId: string): Promise<ServiceResponse<boolean>> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { subscription: true }
            });

            if (!user) {
                return {
                    success: false,
                    error: 'Kullanıcı bulunamadı',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: user.subscription
            };

        } catch (error) {
            console.error('SubscriptionService.checkUserSubscription error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Abonelik durumu kontrol edilemedi',
                statusCode: 500
            };
        }
    }

    /**
     * Belirli bir ilanı öne çıkarma (ödeme sonrası)
     * @param listingType İlan tipi
     * @param listingId İlan ID'si
     * @param duration Öne çıkarma süresi (gün)
     * @returns ServiceResponse
     */
    async featureSpecificListing(
        listingType: 'field' | 'goalkeeper' | 'referee',
        listingId: string,
        duration: number = 30 // Varsayılan 30 gün
    ): Promise<ServiceResponse<void>> {
        try {
            // İlanı öne çıkar
            const result = await listingFeatureService.setListingFeatured(
                listingType,
                listingId,
                true
            );

            if (!result.success) {
                return result;
            }

            // Burada otomatik olarak süre sonunda öne çıkarmayı kaldıracak bir job eklenebilir
            // Örnek: setTimeout veya cron job ile
            setTimeout(async () => {
                try {
                    await listingFeatureService.setListingFeatured(
                        listingType,
                        listingId,
                        false
                    );
                    console.log(`⏰ İlan ${listingId} için öne çıkarma süresi doldu ve kaldırıldı`);
                } catch (error) {
                    console.error('Otomatik öne çıkarma kaldırma hatası:', error);
                }
            }, duration * 24 * 60 * 60 * 1000); // Günü milisaniyeye çevir

            console.log(`✅ İlan ${listingId} ${duration} gün boyunca öne çıkarıldı`);

            return {
                success: true,
                data: undefined
            };

        } catch (error) {
            console.error('SubscriptionService.featureSpecificListing error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'İlan öne çıkarma başarısız',
                statusCode: 500
            };
        }
    }
}

export const subscriptionService = new SubscriptionService(); 