import { prisma } from '../lib/prisma';
import {
    CreateFieldListingDto,
    UpdateFieldListingDto,
    FieldListingFilterDto,
    ServiceResponse,
    FieldListing,
    PaginationParams,
    PaginatedResponse
} from '../types';
import { Decimal } from '@prisma/client/runtime/library';

export class FieldListingService {

    // Kullanıcının halısaha ilanı var mı kontrol et
    async hasExistingListing(userId: string): Promise<ServiceResponse<boolean>> {
        try {
            const existingListing = await prisma.fieldListing.findUnique({
                where: { userId }
            });

            return {
                success: true,
                data: !!existingListing
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanı kontrolü başarısız'
            };
        }
    }

    // Halısaha ilanı oluştur
    async createFieldListing(userId: string, data: CreateFieldListingDto): Promise<ServiceResponse<FieldListing>> {
        try {
            // Kullanıcının zaten bir ilanı var mı kontrol et
            const hasListing = await this.hasExistingListing(userId);
            if (!hasListing.success) {
                return {
                    success: false,
                    error: hasListing.error
                };
            }

            if (hasListing.data) {
                return {
                    success: false,
                    error: 'Kullanıcı zaten bir halısaha ilanına sahip. Sadece bir ilan oluşturabilirsiniz.',
                    statusCode: 400
                };
            }

            // Fotoğraf sayısı kontrolü
            if (data.photos && (data.photos.length < 2 || data.photos.length > 3)) {
                return {
                    success: false,
                    error: 'Minimum 2, maksimum 3 fotoğraf yükleyebilirsiniz.',
                    statusCode: 400
                };
            }

            const result = await prisma.$transaction(async (tx) => {
                // Ana ilan oluştur
                const fieldListing = await tx.fieldListing.create({
                    data: {
                        userId,
                        fieldName: data.fieldName,
                        fieldAddress: data.fieldAddress,
                        hourlyPrice: new Decimal(data.hourlyPrice),
                        isIndoor: data.isIndoor,
                        surfaceType: data.surfaceType,
                        phone: data.phone,
                        contactType: data.contactType,
                        description: data.description
                    }
                });

                // Çalışma saatleri ekle
                if (data.schedules && data.schedules.length > 0) {
                    await tx.fieldSchedule.createMany({
                        data: data.schedules.map(schedule => ({
                            fieldListingId: fieldListing.id,
                            dayOfWeek: schedule.dayOfWeek,
                            startTime: schedule.startTime,
                            endTime: schedule.endTime
                        }))
                    });
                }

                // Özellikler ekle
                if (data.features && data.features.length > 0) {
                    await tx.fieldFeature.createMany({
                        data: data.features.map(feature => ({
                            fieldListingId: fieldListing.id,
                            featureType: feature
                        }))
                    });
                }

                // Alt sahalar ekle (eğer varsa)
                if (data.subFields && data.subFields.length > 0) {
                    await tx.subField.createMany({
                        data: data.subFields.map(subField => ({
                            fieldListingId: fieldListing.id,
                            name: subField.name,
                            surfaceType: subField.surfaceType,
                            hourlyPrice: new Decimal(subField.hourlyPrice),
                            isIndoor: subField.isIndoor
                        }))
                    });
                }

                // Fotoğraflar ekle (eğer varsa)
                if (data.photos && data.photos.length > 0) {
                    await tx.fieldPhoto.createMany({
                        data: data.photos.map((photoUrl, index) => ({
                            fieldListingId: fieldListing.id,
                            photoUrl: photoUrl,
                            photoOrder: index + 1
                        }))
                    });
                }

                return fieldListing;
            });

            // Tam veri ile geri döndür
            const fullListing = await this.getFieldListingById(result.id);

            return {
                success: true,
                data: fullListing.data
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanı oluşturma başarısız'
            };
        }
    }

    // Halısaha ilanını güncelle
    async updateFieldListing(userId: string, data: UpdateFieldListingDto): Promise<ServiceResponse<FieldListing>> {
        try {
            // Kullanıcının ilanını bul
            const existingListing = await prisma.fieldListing.findUnique({
                where: { userId }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Halısaha ilanı bulunamadı',
                    statusCode: 404
                };
            }

            // Fotoğraf sayısı kontrolü
            if (data.photos && (data.photos.length < 2 || data.photos.length > 3)) {
                return {
                    success: false,
                    error: 'Minimum 2, maksimum 3 fotoğraf yükleyebilirsiniz.',
                    statusCode: 400
                };
            }

            await prisma.$transaction(async (tx) => {
                // Ana ilan güncelle
                const updateData: any = {};
                if (data.fieldName !== undefined) updateData.fieldName = data.fieldName;
                if (data.fieldAddress !== undefined) updateData.fieldAddress = data.fieldAddress;
                if (data.hourlyPrice !== undefined) updateData.hourlyPrice = new Decimal(data.hourlyPrice);
                if (data.isIndoor !== undefined) updateData.isIndoor = data.isIndoor;
                if (data.surfaceType !== undefined) updateData.surfaceType = data.surfaceType;
                if (data.phone !== undefined) updateData.phone = data.phone;
                if (data.contactType !== undefined) updateData.contactType = data.contactType;
                if (data.description !== undefined) updateData.description = data.description;

                await tx.fieldListing.update({
                    where: { id: existingListing.id },
                    data: updateData
                });

                // Çalışma saatleri güncelle
                if (data.schedules) {
                    await tx.fieldSchedule.deleteMany({
                        where: { fieldListingId: existingListing.id }
                    });

                    if (data.schedules.length > 0) {
                        await tx.fieldSchedule.createMany({
                            data: data.schedules.map(schedule => ({
                                fieldListingId: existingListing.id,
                                dayOfWeek: schedule.dayOfWeek,
                                startTime: schedule.startTime,
                                endTime: schedule.endTime
                            }))
                        });
                    }
                }

                // Özellikler güncelle
                if (data.features) {
                    await tx.fieldFeature.deleteMany({
                        where: { fieldListingId: existingListing.id }
                    });

                    if (data.features.length > 0) {
                        await tx.fieldFeature.createMany({
                            data: data.features.map(feature => ({
                                fieldListingId: existingListing.id,
                                featureType: feature
                            }))
                        });
                    }
                }

                // Alt sahalar güncelle
                if (data.subFields) {
                    await tx.subField.deleteMany({
                        where: { fieldListingId: existingListing.id }
                    });

                    if (data.subFields.length > 0) {
                        await tx.subField.createMany({
                            data: data.subFields.map(subField => ({
                                fieldListingId: existingListing.id,
                                name: subField.name,
                                surfaceType: subField.surfaceType,
                                hourlyPrice: new Decimal(subField.hourlyPrice),
                                isIndoor: subField.isIndoor
                            }))
                        });
                    }
                }

                // Fotoğraflar güncelle
                if (data.photos) {
                    await tx.fieldPhoto.deleteMany({
                        where: { fieldListingId: existingListing.id }
                    });

                    if (data.photos.length > 0) {
                        await tx.fieldPhoto.createMany({
                            data: data.photos.map((photoUrl, index) => ({
                                fieldListingId: existingListing.id,
                                photoUrl: photoUrl,
                                photoOrder: index + 1
                            }))
                        });
                    }
                }
            });

            // Güncellenmiş veri ile geri döndür
            const fullListing = await this.getFieldListingById(existingListing.id);

            return {
                success: true,
                data: fullListing.data
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanı güncelleme başarısız'
            };
        }
    }

    // Kullanıcının kendi ilanını getir
    async getUserFieldListing(userId: string): Promise<ServiceResponse<FieldListing | null>> {
        try {
            const fieldListing = await prisma.fieldListing.findUnique({
                where: { userId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            email: true,
                            phone: true,
                            location: true,
                            bio: true,
                            profilePhoto: true,
                            role: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    },
                    schedules: true,
                    features: true,
                    photos: {
                        orderBy: { photoOrder: 'asc' }
                    },
                    subFields: true
                }
            });

            if (!fieldListing) {
                return {
                    success: true,
                    data: null
                };
            }

            const formattedListing: any = {
                ...fieldListing,
                description: fieldListing.description || undefined,
                hourlyPrice: Number(fieldListing.hourlyPrice),
                subFields: fieldListing.subFields.map(subField => ({
                    ...subField,
                    hourlyPrice: Number(subField.hourlyPrice)
                }))
            };

            return {
                success: true,
                data: formattedListing
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanı getirme başarısız'
            };
        }
    }

    // ID'ye göre halısaha ilanı getir
    async getFieldListingById(id: string): Promise<ServiceResponse<FieldListing>> {
        try {
            const fieldListing = await prisma.fieldListing.findUnique({
                where: {
                    id,
                    isActive: true
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            email: true,
                            phone: true,
                            location: true,
                            bio: true,
                            profilePhoto: true,
                            role: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    },
                    schedules: true,
                    features: true,
                    photos: {
                        orderBy: { photoOrder: 'asc' }
                    },
                    subFields: true
                }
            });

            if (!fieldListing) {
                return {
                    success: false,
                    error: 'Halısaha ilanı bulunamadı',
                    statusCode: 404
                };
            }

            const formattedListing: any = {
                ...fieldListing,
                description: fieldListing.description || undefined,
                hourlyPrice: Number(fieldListing.hourlyPrice),
                subFields: fieldListing.subFields.map(subField => ({
                    ...subField,
                    hourlyPrice: Number(subField.hourlyPrice)
                }))
            };

            return {
                success: true,
                data: formattedListing
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanı getirme başarısız'
            };
        }
    }

    // Tüm halısaha ilanlarını listele (filtreleme ve pagination ile)
    async getAllFieldListings(
        filters: FieldListingFilterDto,
        pagination: PaginationParams
    ): Promise<ServiceResponse<PaginatedResponse<FieldListing>>> {
        try {
            const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
            const skip = (page - 1) * limit;

            // Filtre koşulları oluştur
            const where: any = {
                isActive: true
            };

            if (filters.surfaceType) {
                where.surfaceType = filters.surfaceType;
            }

            if (filters.isIndoor !== undefined) {
                where.isIndoor = filters.isIndoor;
            }

            if (filters.minPrice || filters.maxPrice) {
                where.hourlyPrice = {};
                if (filters.minPrice) where.hourlyPrice.gte = new Decimal(filters.minPrice);
                if (filters.maxPrice) where.hourlyPrice.lte = new Decimal(filters.maxPrice);
            }

            if (filters.search) {
                where.OR = [
                    { fieldName: { contains: filters.search, mode: 'insensitive' } },
                    { fieldAddress: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            if (filters.features && filters.features.length > 0) {
                where.features = {
                    some: {
                        featureType: { in: filters.features }
                    }
                };
            }

            if (filters.dayOfWeek) {
                where.schedules = {
                    some: {
                        dayOfWeek: filters.dayOfWeek
                    }
                };
            }

            // Toplam sayı
            const total = await prisma.fieldListing.count({ where });

            // Veriyi getir
            const fieldListings = await prisma.fieldListing.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            email: true,
                            phone: true,
                            location: true,
                            bio: true,
                            profilePhoto: true,
                            role: true,
                            createdAt: true,
                            updatedAt: true
                        }
                    },
                    schedules: true,
                    features: true,
                    photos: {
                        orderBy: { photoOrder: 'asc' }
                    },
                    subFields: true
                },
                orderBy: {
                    [sortBy]: sortOrder
                },
                skip,
                take: limit
            });

            const formattedListings: any[] = fieldListings.map(listing => ({
                ...listing,
                description: listing.description || undefined,
                hourlyPrice: Number(listing.hourlyPrice),
                subFields: listing.subFields.map(subField => ({
                    ...subField,
                    hourlyPrice: Number(subField.hourlyPrice)
                }))
            }));

            return {
                success: true,
                data: {
                    data: formattedListings,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanları getirme başarısız'
            };
        }
    }

    // Halısaha ilanını deaktif et
    async deactivateFieldListing(userId: string): Promise<ServiceResponse<void>> {
        try {
            const existingListing = await prisma.fieldListing.findUnique({
                where: { userId }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Halısaha ilanı bulunamadı',
                    statusCode: 404
                };
            }

            await prisma.fieldListing.update({
                where: { id: existingListing.id },
                data: { isActive: false }
            });

            return {
                success: true
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanı deaktif etme başarısız'
            };
        }
    }

    // Halısaha ilanını aktif et
    async activateFieldListing(userId: string): Promise<ServiceResponse<void>> {
        try {
            const existingListing = await prisma.fieldListing.findUnique({
                where: { userId }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Halısaha ilanı bulunamadı',
                    statusCode: 404
                };
            }

            await prisma.fieldListing.update({
                where: { id: existingListing.id },
                data: { isActive: true }
            });

            return {
                success: true
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanı aktif etme başarısız'
            };
        }
    }

    // Halısaha ilanını sil
    async deleteFieldListing(userId: string): Promise<ServiceResponse<void>> {
        try {
            const existingListing = await prisma.fieldListing.findUnique({
                where: { userId }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Halısaha ilanı bulunamadı',
                    statusCode: 404
                };
            }

            await prisma.fieldListing.delete({
                where: { id: existingListing.id }
            });

            return {
                success: true
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanı silme başarısız'
            };
        }
    }
}

export const fieldListingService = new FieldListingService(); 