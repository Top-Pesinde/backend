import { prisma } from '../lib/prisma';
import { ServiceResponse } from '../types';

export type ListingType = 'field' | 'goalkeeper' | 'referee';

export class ListingFeatureService {
    /**
     * İlanın öne çıkan durumunu ayarlar
     * @param type İlan tipi (field, goalkeeper, referee)
     * @param id İlan ID'si
     * @param featured Öne çıkan durumu (true/false)
     * @returns ServiceResponse
     */
    async setListingFeatured(
        type: ListingType,
        id: string,
        featured: boolean
    ): Promise<ServiceResponse<void>> {
        try {
            // İlanın var olup olmadığını kontrol et
            let listingExists = false;

            switch (type) {
                case 'field':
                    const fieldListing = await prisma.fieldListing.findUnique({
                        where: { id }
                    });
                    listingExists = !!fieldListing;
                    if (listingExists) {
                        await prisma.fieldListing.update({
                            where: { id },
                            data: { featured }
                        });
                    }
                    break;

                case 'goalkeeper':
                    const goalkeeperListing = await prisma.goalkeeperListing.findUnique({
                        where: { id }
                    });
                    listingExists = !!goalkeeperListing;
                    if (listingExists) {
                        await prisma.goalkeeperListing.update({
                            where: { id },
                            data: { featured }
                        });
                    }
                    break;

                case 'referee':
                    const refereeListing = await prisma.refereeListing.findUnique({
                        where: { id }
                    });
                    listingExists = !!refereeListing;
                    if (listingExists) {
                        await prisma.refereeListing.update({
                            where: { id },
                            data: { featured }
                        });
                    }
                    break;

                default:
                    return {
                        success: false,
                        error: 'Geçersiz ilan tipi. Desteklenen tipler: field, goalkeeper, referee',
                        statusCode: 400
                    };
            }

            if (!listingExists) {
                return {
                    success: false,
                    error: 'İlan bulunamadı',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: undefined
            };

        } catch (error) {
            console.error('ListingFeatureService.setListingFeatured error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'İlan öne çıkarma işlemi başarısız',
                statusCode: 500
            };
        }
    }

    /**
     * Kullanıcının tüm ilanlarını öne çıkarır
     * @param userId Kullanıcı ID'si
     * @param featured Öne çıkan durumu (true/false)
     * @returns ServiceResponse
     */
    async setUserAllListingsFeatured(
        userId: string,
        featured: boolean
    ): Promise<ServiceResponse<void>> {
        try {
            await prisma.$transaction(async (tx) => {
                // Halısaha ilanları
                await tx.fieldListing.updateMany({
                    where: { userId },
                    data: { featured }
                });

                // Kaleci ilanları
                await tx.goalkeeperListing.updateMany({
                    where: { userId },
                    data: { featured }
                });

                // Hakem ilanları
                await tx.refereeListing.updateMany({
                    where: { userId },
                    data: { featured }
                });
            });

            return {
                success: true,
                data: undefined
            };

        } catch (error) {
            console.error('ListingFeatureService.setUserAllListingsFeatured error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Kullanıcı ilanları öne çıkarma işlemi başarısız',
                statusCode: 500
            };
        }
    }

    /**
     * Belirli bir kullanıcının belirli tip ilanlarını öne çıkarır
     * @param userId Kullanıcı ID'si
     * @param type İlan tipi
     * @param featured Öne çıkan durumu (true/false)
     * @returns ServiceResponse
     */
    async setUserListingsByTypeFeatured(
        userId: string,
        type: ListingType,
        featured: boolean
    ): Promise<ServiceResponse<void>> {
        try {
            switch (type) {
                case 'field':
                    await prisma.fieldListing.updateMany({
                        where: { userId },
                        data: { featured }
                    });
                    break;

                case 'goalkeeper':
                    await prisma.goalkeeperListing.updateMany({
                        where: { userId },
                        data: { featured }
                    });
                    break;

                case 'referee':
                    await prisma.refereeListing.updateMany({
                        where: { userId },
                        data: { featured }
                    });
                    break;

                default:
                    return {
                        success: false,
                        error: 'Geçersiz ilan tipi. Desteklenen tipler: field, goalkeeper, referee',
                        statusCode: 400
                    };
            }

            return {
                success: true,
                data: undefined
            };

        } catch (error) {
            console.error('ListingFeatureService.setUserListingsByTypeFeatured error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Kullanıcı ilanları öne çıkarma işlemi başarısız',
                statusCode: 500
            };
        }
    }

    /**
     * İlanın mevcut öne çıkan durumunu getirir
     * @param type İlan tipi
     * @param id İlan ID'si
     * @returns ServiceResponse<boolean>
     */
    async getListingFeaturedStatus(
        type: ListingType,
        id: string
    ): Promise<ServiceResponse<boolean>> {
        try {
            let featured = false;

            switch (type) {
                case 'field':
                    const fieldListing = await prisma.fieldListing.findUnique({
                        where: { id },
                        select: { featured: true }
                    });
                    featured = fieldListing?.featured || false;
                    break;

                case 'goalkeeper':
                    const goalkeeperListing = await prisma.goalkeeperListing.findUnique({
                        where: { id },
                        select: { featured: true }
                    });
                    featured = goalkeeperListing?.featured || false;
                    break;

                case 'referee':
                    const refereeListing = await prisma.refereeListing.findUnique({
                        where: { id },
                        select: { featured: true }
                    });
                    featured = refereeListing?.featured || false;
                    break;

                default:
                    return {
                        success: false,
                        error: 'Geçersiz ilan tipi. Desteklenen tipler: field, goalkeeper, referee',
                        statusCode: 400
                    };
            }

            return {
                success: true,
                data: featured
            };

        } catch (error) {
            console.error('ListingFeatureService.getListingFeaturedStatus error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'İlan öne çıkan durumu getirme başarısız',
                statusCode: 500
            };
        }
    }
}

export const listingFeatureService = new ListingFeatureService(); 