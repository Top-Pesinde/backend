import { prisma } from '../lib/prisma';
import {
    CreateFieldListingDto,
    UpdateFieldListingDto,
    FieldListingFilterDto,
    ServiceResponse,
    FieldListing,
    PaginationParams,
    PaginatedResponse,
    DayOfWeek
} from '../types';
import { Decimal } from '@prisma/client/runtime/library';

export class FieldListingService {

    // Kullanıcının aktif halısaha ilanı var mı kontrol et
    async hasActiveListing(userId: string): Promise<ServiceResponse<boolean>> {
        try {
            const activeListing = await prisma.fieldListing.findFirst({
                where: {
                    userId,
                    isActive: true
                }
            });

            return {
                success: true,
                data: !!activeListing
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
            // Kullanıcının zaten aktif bir ilanı var mı kontrol et
            const hasActiveListing = await this.hasActiveListing(userId);
            if (!hasActiveListing.success) {
                return {
                    success: false,
                    error: hasActiveListing.error
                };
            }

            if (hasActiveListing.data) {
                return {
                    success: false,
                    error: 'Zaten aktif bir halısaha ilanınız bulunmaktadır. Yeni ilan oluşturmak için mevcut ilanınızı deaktif edin.',
                    statusCode: 400
                };
            }

            // Fotoğraf sayısı kontrolü - şimdilik esnek yapalım çünkü fotoğraflar sonra yüklenecek
            // if (data.photos && (data.photos.length < 2 || data.photos.length > 3)) {
            //     return {
            //         success: false,
            //         error: 'Minimum 2, maksimum 3 fotoğraf yükleyebilirsiniz.',
            //         statusCode: 400
            //     };
            // }

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
                        phone: data.phone || null,
                        contactType: data.contactType || null,
                        description: data.description
                    }
                });


                if (data.schedules && data.schedules.length > 0) {
                    // Tüm günleri liste olarak tanımla
                    const allDays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

                    // Gönderilen günleri map'e çevir (hızlı arama için)
                    const providedDaysMap = new Map();
                    data.schedules.forEach(schedule => {
                        providedDaysMap.set(schedule.dayOfWeek, schedule);
                    });

                    // Tüm günler için schedule oluştur
                    const scheduleData = allDays.map(day => {
                        const providedSchedule = providedDaysMap.get(day);
                        if (providedSchedule) {
                            // Kullanıcının gönderdiği gün - açık
                            return {
                                fieldListingId: fieldListing.id,
                                dayOfWeek: day,
                                startTime: providedSchedule.startTime || null,
                                endTime: providedSchedule.endTime || null,
                                isOpen: providedSchedule.isOpen !== false // default true
                            };
                        } else {
                            // Kullanıcının göndermediği gün - otomatik kapalı
                            return {
                                fieldListingId: fieldListing.id,
                                dayOfWeek: day,
                                startTime: null,
                                endTime: null,
                                isOpen: false
                            };
                        }
                    });

                    await tx.fieldSchedule.createMany({
                        data: scheduleData
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

    // Halısaha fotoğraflarını güncelle
    async updateFieldPhotos(fieldListingId: string, photoUrls: string[]): Promise<ServiceResponse<void>> {
        try {
            // Mevcut fotoğrafları sil
            await prisma.fieldPhoto.deleteMany({
                where: { fieldListingId }
            });

            // Yeni fotoğrafları ekle
            if (photoUrls.length > 0) {
                await prisma.fieldPhoto.createMany({
                    data: photoUrls.map((photoUrl, index) => ({
                        fieldListingId,
                        photoUrl,
                        photoOrder: index + 1
                    }))
                });
            }

            return {
                success: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha fotoğrafları güncellenirken hata oluştu'
            };
        }
    }

    // Halısaha ilanını güncelle
    async updateFieldListing(userId: string, data: UpdateFieldListingDto): Promise<ServiceResponse<FieldListing>> {
        try {
            // Kullanıcının ilanını bul
            const existingListing = await prisma.fieldListing.findFirst({
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

                // Çalışma saatleri güncelle - sadece gönderilen günler açık, diğerleri kapalı
                if (data.schedules) {
                    await tx.fieldSchedule.deleteMany({
                        where: { fieldListingId: existingListing.id }
                    });

                    // Tüm günleri liste olarak tanımla
                    const allDays: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

                    // Gönderilen günleri map'e çevir (hızlı arama için)
                    const providedDaysMap = new Map();
                    if (data.schedules.length > 0) {
                        data.schedules.forEach(schedule => {
                            providedDaysMap.set(schedule.dayOfWeek, schedule);
                        });
                    }

                    // Tüm günler için schedule oluştur
                    const scheduleData = allDays.map(day => {
                        const providedSchedule = providedDaysMap.get(day);
                        if (providedSchedule) {
                            // Kullanıcının gönderdiği gün - açık
                            return {
                                fieldListingId: existingListing.id,
                                dayOfWeek: day,
                                startTime: providedSchedule.startTime || null,
                                endTime: providedSchedule.endTime || null,
                                isOpen: providedSchedule.isOpen !== false // default true
                            };
                        } else {
                            // Kullanıcının göndermediği gün - otomatik kapalı
                            return {
                                fieldListingId: existingListing.id,
                                dayOfWeek: day,
                                startTime: null,
                                endTime: null,
                                isOpen: false
                            };
                        }
                    });

                    await tx.fieldSchedule.createMany({
                        data: scheduleData
                    });
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

    // Kullanıcının tüm halısaha ilanlarını getir (aktif + deaktif)
    async getUserFieldListings(userId: string): Promise<ServiceResponse<FieldListing[]>> {
        try {
            const fieldListings = await prisma.fieldListing.findMany({
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
                },
                orderBy: { createdAt: 'desc' }
            });

            const formattedListings = fieldListings.map((fieldListing: any) => ({
                ...fieldListing,
                description: fieldListing.description || undefined,
                hourlyPrice: Number(fieldListing.hourlyPrice),
                subFields: fieldListing.subFields.map((subField: any) => ({
                    ...subField,
                    hourlyPrice: Number(subField.hourlyPrice)
                }))
            }));

            return {
                success: true,
                data: formattedListings
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Halısaha ilanları getirme başarısız'
            };
        }
    }

    // Kullanıcının kendi ilanını getir (deprecated - getUserFieldListings kullanın)
    async getUserFieldListing(userId: string): Promise<ServiceResponse<FieldListing | null>> {
        try {
            const fieldListing = await prisma.fieldListing.findFirst({
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
            const { page, limit, sortBy = 'fieldName', sortOrder = 'asc' } = pagination;
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

            // Sıralama seçeneklerini belirle
            let orderByClause: any[] = [{ featured: 'desc' }];

            // Alfabetik sıralama seçenekleri
            switch (sortBy) {
                case 'name':
                case 'firstName':
                    orderByClause.push({ user: { firstName: sortOrder } });
                    break;
                case 'lastName':
                    orderByClause.push({ user: { lastName: sortOrder } });
                    break;
                case 'fullName':
                    // İsim + soyisim birlikte sıralama
                    orderByClause.push({ user: { firstName: sortOrder } });
                    orderByClause.push({ user: { lastName: sortOrder } });
                    break;
                case 'fieldName':
                case 'title':
                    orderByClause.push({ fieldName: sortOrder });
                    break;
                case 'location':
                case 'fieldAddress':
                    orderByClause.push({ fieldAddress: sortOrder });
                    break;
                case 'hourlyPrice':
                case 'price':
                    orderByClause.push({ hourlyPrice: sortOrder });
                    break;
                case 'surfaceType':
                    orderByClause.push({ surfaceType: sortOrder });
                    break;
                case 'createdAt':
                default:
                    orderByClause.push({ createdAt: sortOrder });
                    break;
            }

            // Veriyi getir - Featured ilanlar önce, sonra normal sıralama
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
                orderBy: orderByClause,
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
            const existingListing = await prisma.fieldListing.findFirst({
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
            const existingListing = await prisma.fieldListing.findFirst({
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
            const existingListing = await prisma.fieldListing.findFirst({
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

    // ID'ye göre halısaha ilanını sil
    async deleteFieldListingById(fieldId: string): Promise<ServiceResponse<void>> {
        try {
            const existingListing = await prisma.fieldListing.findUnique({
                where: { id: fieldId }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Halısaha ilanı bulunamadı',
                    statusCode: 404
                };
            }

            await prisma.fieldListing.delete({
                where: { id: fieldId }
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

    // İlanı öne çıkan yap
    async setFeaturedStatus(fieldId: string, featured: boolean): Promise<ServiceResponse<void>> {
        try {
            const existingListing = await prisma.fieldListing.findUnique({
                where: { id: fieldId }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Halısaha ilanı bulunamadı',
                    statusCode: 404
                };
            }

            await prisma.fieldListing.update({
                where: { id: fieldId },
                data: { featured }
            });

            return {
                success: true
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'İlan öne çıkan durumu güncellenirken hata oluştu'
            };
        }
    }

    // Öne çıkan ilanları getir
    async getFeaturedFieldListings(): Promise<ServiceResponse<FieldListing[]>> {
        try {
            const featuredListings = await prisma.fieldListing.findMany({
                where: {
                    isActive: true,
                    featured: true
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
                },
                orderBy: [
                    { featured: 'desc' },
                    { createdAt: 'desc' }
                ]
            });

            const formattedListings: any[] = featuredListings.map(listing => ({
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
                data: formattedListings
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Öne çıkan ilanlar getirme başarısız'
            };
        }
    }
}

export const fieldListingService = new FieldListingService(); 