import { prisma } from '../lib/prisma';
import { ServiceResponse } from '../types';

export type ListingType = 'field' | 'goalkeeper' | 'referee';

export interface ListingDetailResponse {
    id: string;
    type: ListingType;
    title: string;
    description?: string;
    location?: string;
    hourlyPrice: number;
    phone: string;
    contactType: string;
    isActive: boolean;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        username: string;
        email: string;
        phone: string;
        profilePhoto?: string;
        role: string;
    };
    // Field specific fields
    fieldName?: string;
    fieldAddress?: string;
    isIndoor?: boolean;
    surfaceType?: string;
    features?: string[];
    schedules?: any[];
    photos?: string[];
    subFields?: any[];
    // Goalkeeper specific fields
    bio?: string;
    hasLicense?: boolean;
    // Referee specific fields
    experience?: string;
    licenseNumber?: string;
    certifications?: string[];
}

export class ListingDetailService {

    /**
     * İlan tipine göre detay bilgilerini getirir
     * @param type İlan tipi (field, goalkeeper, referee)
     * @param id İlan ID'si
     * @returns ServiceResponse<ListingDetailResponse>
     */
    async getListingDetail(
        type: ListingType,
        id: string
    ): Promise<ServiceResponse<ListingDetailResponse>> {
        try {
            let listing: any = null;
            let listingDetail: ListingDetailResponse;

            switch (type) {
                case 'field':
                    listing = await prisma.fieldListing.findUnique({
                        where: { id },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true,
                                    email: true,
                                    phone: true,
                                    profilePhoto: true,
                                    role: true
                                }
                            },
                            schedules: true,
                            features: true,
                            photos: true,
                            subFields: true
                        }
                    });

                    if (!listing) {
                        return {
                            success: false,
                            error: 'Halısaha ilanı bulunamadı',
                            statusCode: 404
                        };
                    }

                    listingDetail = {
                        id: listing.id,
                        type: 'field',
                        title: listing.fieldName,
                        description: listing.description,
                        location: listing.fieldAddress,
                        hourlyPrice: listing.hourlyPrice,
                        phone: listing.phone,
                        contactType: listing.contactType,
                        isActive: listing.isActive,
                        featured: listing.featured,
                        createdAt: listing.createdAt.toISOString(),
                        updatedAt: listing.updatedAt.toISOString(),
                        user: listing.user,
                        fieldName: listing.fieldName,
                        fieldAddress: listing.fieldAddress,
                        isIndoor: listing.isIndoor,
                        surfaceType: listing.surfaceType,
                        features: listing.features?.map((f: any) => f.featureType) || [],
                        schedules: listing.schedules || [],
                        photos: listing.photos?.map((p: any) => p.photoUrl) || [],
                        subFields: listing.subFields || []
                    };
                    break;

                case 'goalkeeper':
                    listing = await prisma.goalkeeperListing.findUnique({
                        where: { id },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true,
                                    email: true,
                                    phone: true,
                                    profilePhoto: true,
                                    role: true
                                }
                            }
                        }
                    });

                    if (!listing) {
                        return {
                            success: false,
                            error: 'Kaleci ilanı bulunamadı',
                            statusCode: 404
                        };
                    }

                    listingDetail = {
                        id: listing.id,
                        type: 'goalkeeper',
                        title: listing.title,
                        description: listing.description,
                        location: listing.location,
                        hourlyPrice: listing.hourlyPrice,
                        phone: listing.phone,
                        contactType: listing.contactType,
                        isActive: listing.isActive,
                        featured: listing.featured,
                        createdAt: listing.createdAt.toISOString(),
                        updatedAt: listing.updatedAt.toISOString(),
                        user: listing.user,
                        bio: listing.bio,
                        hasLicense: listing.hasLicense
                    };
                    break;

                case 'referee':
                    listing = await prisma.refereeListing.findUnique({
                        where: { id },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true,
                                    email: true,
                                    phone: true,
                                    profilePhoto: true,
                                    role: true
                                }
                            }
                        }
                    });

                    if (!listing) {
                        return {
                            success: false,
                            error: 'Hakem ilanı bulunamadı',
                            statusCode: 404
                        };
                    }

                    listingDetail = {
                        id: listing.id,
                        type: 'referee',
                        title: listing.title,
                        description: listing.description,
                        location: listing.location,
                        hourlyPrice: listing.hourlyPrice,
                        phone: listing.phone,
                        contactType: listing.contactType,
                        isActive: listing.isActive,
                        featured: listing.featured,
                        createdAt: listing.createdAt.toISOString(),
                        updatedAt: listing.updatedAt.toISOString(),
                        user: listing.user,
                        experience: listing.bio,
                        licenseNumber: listing.hasLicense ? 'Lisanslı' : 'Lisanssız',
                        certifications: []
                    };
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
                data: listingDetail
            };

        } catch (error) {
            console.error('ListingDetailService.getListingDetail error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'İlan detayı getirme başarısız',
                statusCode: 500
            };
        }
    }

    /**
     * İlan ID'sinden tipini otomatik tespit eder
     * @param id İlan ID'si
     * @returns ServiceResponse<{type: ListingType, id: string}>
     */
    async detectListingType(id: string): Promise<ServiceResponse<{ type: ListingType, id: string }>> {
        try {
            // Önce field listings'de ara
            const fieldListing = await prisma.fieldListing.findUnique({
                where: { id },
                select: { id: true }
            });

            if (fieldListing) {
                return {
                    success: true,
                    data: { type: 'field' as ListingType, id }
                };
            }

            // Kaleci listings'de ara
            const goalkeeperListing = await prisma.goalkeeperListing.findUnique({
                where: { id },
                select: { id: true }
            });

            if (goalkeeperListing) {
                return {
                    success: true,
                    data: { type: 'goalkeeper' as ListingType, id }
                };
            }

            // Hakem listings'de ara
            const refereeListing = await prisma.refereeListing.findUnique({
                where: { id },
                select: { id: true }
            });

            if (refereeListing) {
                return {
                    success: true,
                    data: { type: 'referee' as ListingType, id }
                };
            }

            return {
                success: false,
                error: 'İlan bulunamadı',
                statusCode: 404
            };

        } catch (error) {
            console.error('ListingDetailService.detectListingType error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'İlan tipi tespit edilemedi',
                statusCode: 500
            };
        }
    }
} 