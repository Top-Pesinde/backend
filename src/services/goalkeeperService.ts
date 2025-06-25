import { prisma } from '../lib/prisma';
import {
    CreateGoalkeeperListingDto,
    UpdateGoalkeeperListingDto,
    ServiceListingFilterDto,
    ServiceResponse,
    GoalkeeperListing,
    PaginationParams
} from '../types';

export class GoalkeeperService {
    // Kaleci ilanı oluşturma
    async createGoalkeeperListing(userId: string, data: CreateGoalkeeperListingDto): Promise<ServiceResponse<GoalkeeperListing>> {
        try {
            // Kullanıcının GOALKEEPER rolüne sahip olduğunu kontrol et
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

            if (user.role !== 'GOALKEEPER') {
                return {
                    success: false,
                    error: 'Bu işlem için GOALKEEPER rolüne sahip olmanız gerekiyor',
                    statusCode: 403
                };
            }

            // Kaleci ilanı oluştur
            const goalkeeperListing = await prisma.goalkeeperListing.create({
                data: {
                    userId,
                    title: data.title,
                    location: data.location,
                    description: data.description,
                    hasLicense: data.hasLicense || false,
                    hourlyPrice: data.hourlyPrice,
                    bio: data.bio,
                    phone: data.phone,
                    contactType: data.contactType || 'PHONE'
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
                            profilePhoto: true,
                            role: true,
                            createdAt: true
                        }
                    }
                }
            });

            return {
                success: true,
                data: goalkeeperListing as any,
                statusCode: 201
            };
        } catch (error) {
            console.error('GoalkeeperService.createGoalkeeperListing error:', error);
            return {
                success: false,
                error: 'Kaleci ilanı oluşturulurken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Tüm kaleci ilanlarını listeleme (pagination + filtering)
    async getGoalkeeperListings(
        params: PaginationParams,
        filters: ServiceListingFilterDto = {}
    ): Promise<ServiceResponse<{ data: GoalkeeperListing[]; pagination: any }>> {
        try {
            const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = params;
            const skip = (page - 1) * limit;

            // Filter koşulları oluştur
            const where: any = {
                isActive: true
            };

            if (filters.minPrice || filters.maxPrice) {
                where.hourlyPrice = {};
                if (filters.minPrice) where.hourlyPrice.gte = filters.minPrice;
                if (filters.maxPrice) where.hourlyPrice.lte = filters.maxPrice;
            }

            if (filters.hasLicense !== undefined) {
                where.hasLicense = filters.hasLicense;
            }

            if (filters.location) {
                where.location = {
                    contains: filters.location,
                    mode: 'insensitive'
                };
            }

            if (filters.search) {
                where.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { bio: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } }
                ];
            }

            // Toplam kayıt sayısını al
            const total = await prisma.goalkeeperListing.count({ where });

            // İlanları getir
            const listings = await prisma.goalkeeperListing.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
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
                            role: true,
                            createdAt: true
                        }
                    }
                }
            });

            const pagination = {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            };

            return {
                success: true,
                data: {
                    data: listings as any,
                    pagination
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('GoalkeeperService.getGoalkeeperListings error:', error);
            return {
                success: false,
                error: 'Kaleci ilanları getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // ID ile kaleci ilanı detayını getirme
    async getGoalkeeperListingById(id: string): Promise<ServiceResponse<GoalkeeperListing>> {
        try {
            const listing = await prisma.goalkeeperListing.findUnique({
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
                            role: true,
                            createdAt: true
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

            return {
                success: true,
                data: listing as any,
                statusCode: 200
            };
        } catch (error) {
            console.error('GoalkeeperService.getGoalkeeperListingById error:', error);
            return {
                success: false,
                error: 'Kaleci ilanı getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Kullanıcının kaleci ilanlarını getirme
    async getUserGoalkeeperListings(userId: string): Promise<ServiceResponse<GoalkeeperListing[]>> {
        try {
            const listings = await prisma.goalkeeperListing.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
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
                            role: true,
                            createdAt: true
                        }
                    }
                }
            });

            return {
                success: true,
                data: listings as any[],
                statusCode: 200
            };
        } catch (error) {
            console.error('GoalkeeperService.getUserGoalkeeperListings error:', error);
            return {
                success: false,
                error: 'Kullanıcı kaleci ilanları getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Kaleci ilanını güncelleme
    async updateGoalkeeperListing(
        id: string,
        userId: string,
        data: UpdateGoalkeeperListingDto
    ): Promise<ServiceResponse<GoalkeeperListing>> {
        try {
            // İlan var mı ve kullanıcının kendi ilanı mı kontrol et
            const existingListing = await prisma.goalkeeperListing.findUnique({
                where: { id }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Kaleci ilanı bulunamadı',
                    statusCode: 404
                };
            }

            if (existingListing.userId !== userId) {
                return {
                    success: false,
                    error: 'Bu ilanı güncelleme yetkiniz yok',
                    statusCode: 403
                };
            }

            // İlanı güncelle
            const updatedListing = await prisma.goalkeeperListing.update({
                where: { id },
                data: {
                    ...(data.title && { title: data.title }),
                    ...(data.location && { location: data.location }),
                    ...(data.description && { description: data.description }),
                    ...(data.hasLicense !== undefined && { hasLicense: data.hasLicense }),
                    ...(data.hourlyPrice && { hourlyPrice: data.hourlyPrice }),
                    ...(data.bio && { bio: data.bio }),
                    ...(data.phone && { phone: data.phone }),
                    ...(data.contactType && { contactType: data.contactType }),
                    ...(data.isActive !== undefined && { isActive: data.isActive }),
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
                            profilePhoto: true,
                            role: true,
                            createdAt: true
                        }
                    }
                }
            });

            return {
                success: true,
                data: updatedListing as any,
                statusCode: 200
            };
        } catch (error) {
            console.error('GoalkeeperService.updateGoalkeeperListing error:', error);
            return {
                success: false,
                error: 'Kaleci ilanı güncellenirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Kaleci ilanını silme
    async deleteGoalkeeperListing(id: string, userId: string): Promise<ServiceResponse<void>> {
        try {
            // İlan var mı ve kullanıcının kendi ilanı mı kontrol et
            const existingListing = await prisma.goalkeeperListing.findUnique({
                where: { id }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Kaleci ilanı bulunamadı',
                    statusCode: 404
                };
            }

            if (existingListing.userId !== userId) {
                return {
                    success: false,
                    error: 'Bu ilanı silme yetkiniz yok',
                    statusCode: 403
                };
            }

            // İlanı sil
            await prisma.goalkeeperListing.delete({
                where: { id }
            });

            return {
                success: true,
                statusCode: 200
            };
        } catch (error) {
            console.error('GoalkeeperService.deleteGoalkeeperListing error:', error);
            return {
                success: false,
                error: 'Kaleci ilanı silinirken bir hata oluştu',
                statusCode: 500
            };
        }
    }
}

export const goalkeeperService = new GoalkeeperService(); 