import { prisma } from '../lib/prisma';
import {
    CreateRefereeListingDto,
    UpdateRefereeListingDto,
    ServiceListingFilterDto,
    ServiceResponse,
    RefereeListing,
    PaginationParams
} from '../types';

export class RefereeService {
    // Helper method to format contact type for display
    private formatContactType(contactType: string) {
        return contactType === 'WHATSAPP' ? 'WhatsApp' : 'Telefon';
    }

    // Helper method to enhance listing data with display fields
    private enhanceListingData(listing: any) {
        return {
            ...listing,
            contactTypeDisplay: this.formatContactType(listing.contactType),
            contactTypeIcon: listing.contactType === 'WHATSAPP' ? '📱' : '📞',
            priceDisplay: `${listing.hourlyPrice} TL/saat`,
            licenseDisplay: listing.hasLicense ? '✅ Lisanslı' : '❌ Lisansız'
        };
    }

    // Hakem ilanı oluşturma
    async createRefereeListing(userId: string, data: CreateRefereeListingDto): Promise<ServiceResponse<RefereeListing>> {
        try {
            // Kullanıcının REFEREE rolüne sahip olduğunu kontrol et
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

            if (user.role !== 'REFEREE') {
                return {
                    success: false,
                    error: 'Bu işlem için REFEREE rolüne sahip olmanız gerekiyor',
                    statusCode: 403
                };
            }

            // Kullanıcının aktif hakem ilanı olup olmadığını kontrol et
            const existingActiveListing = await prisma.refereeListing.findFirst({
                where: {
                    userId,
                    isActive: true
                }
            });

            if (existingActiveListing) {
                return {
                    success: false,
                    error: 'Zaten aktif bir hakem ilanınız bulunmaktadır. Yeni ilan açmak için önce mevcut ilanınızı silin.',
                    statusCode: 400
                };
            }

            // Hakem ilanı oluştur
            const refereeListing = await prisma.refereeListing.create({
                data: {
                    userId,
                    title: data.title,
                    location: data.location,
                    description: data.description,
                    hasLicense: data.hasLicense || false,
                    hourlyPrice: data.hourlyPrice,
                    bio: data.bio || null,
                    phone: null,
                    contactType: null
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
                data: this.enhanceListingData(refereeListing) as any,
                statusCode: 201
            };
        } catch (error) {
            console.error('RefereeService.createRefereeListing error:', error);
            return {
                success: false,
                error: 'Hakem ilanı oluşturulurken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Tüm hakem ilanlarını listeleme (pagination + filtering)
    async getRefereeListings(
        params: PaginationParams,
        filters: ServiceListingFilterDto = {}
    ): Promise<ServiceResponse<{ data: RefereeListing[]; pagination: any }>> {
        try {
            const { page = 1, limit = 10, sortBy = 'title', sortOrder = 'asc' } = params;
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
            const total = await prisma.refereeListing.count({ where });

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
                case 'title':
                    orderByClause.push({ title: sortOrder });
                    break;
                case 'location':
                    orderByClause.push({ location: sortOrder });
                    break;
                case 'hourlyPrice':
                case 'price':
                    orderByClause.push({ hourlyPrice: sortOrder });
                    break;
                case 'createdAt':
                default:
                    orderByClause.push({ createdAt: sortOrder });
                    break;
            }

            // İlanları getir
            const listings = await prisma.refereeListing.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderByClause,
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
                    data: listings.map(listing => this.enhanceListingData(listing)) as any[],
                    pagination
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('RefereeService.getRefereeListings error:', error);
            return {
                success: false,
                error: 'Hakem ilanları getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // ID ile hakem ilanı detayını getirme
    async getRefereeListingById(id: string): Promise<ServiceResponse<RefereeListing>> {
        try {
            const listing = await prisma.refereeListing.findUnique({
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
                    error: 'Hakem ilanı bulunamadı',
                    statusCode: 404
                };
            }

            return {
                success: true,
                data: this.enhanceListingData(listing) as any,
                statusCode: 200
            };
        } catch (error) {
            console.error('RefereeService.getRefereeListingById error:', error);
            return {
                success: false,
                error: 'Hakem ilanı getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Kullanıcının hakem ilanlarını getirme
    async getUserRefereeListings(userId: string): Promise<ServiceResponse<RefereeListing[]>> {
        try {
            const listings = await prisma.refereeListing.findMany({
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
                data: listings.map(listing => this.enhanceListingData(listing)) as any[],
                statusCode: 200
            };
        } catch (error) {
            console.error('RefereeService.getUserRefereeListings error:', error);
            return {
                success: false,
                error: 'Kullanıcı hakem ilanları getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Hakem ilanını güncelleme
    async updateRefereeListing(
        id: string,
        userId: string,
        data: UpdateRefereeListingDto
    ): Promise<ServiceResponse<RefereeListing>> {
        try {
            // İlan var mı ve kullanıcının kendi ilanı mı kontrol et
            const existingListing = await prisma.refereeListing.findUnique({
                where: { id }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Hakem ilanı bulunamadı',
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

            // Sadece title, description ve hourlyPrice güncellenebilir
            const allowedFields = ['title', 'description', 'hourlyPrice'];
            const updateData: any = {};
            let hasValidField = false;

            // Sadece izin verilen alanları kontrol et
            if (data.title !== undefined) {
                updateData.title = data.title;
                hasValidField = true;
            }
            if (data.description !== undefined) {
                updateData.description = data.description;
                hasValidField = true;
            }
            if (data.hourlyPrice !== undefined) {
                updateData.hourlyPrice = data.hourlyPrice;
                hasValidField = true;
            }

            // En az bir alan güncellenmelidir
            if (!hasValidField) {
                return {
                    success: false,
                    error: 'Güncellemek için en az bir alan belirtmelisiniz (title, description, hourlyPrice)',
                    statusCode: 400
                };
            }

            // İlanı güncelle
            const updatedListing = await prisma.refereeListing.update({
                where: { id },
                data: updateData,
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

            // Response'a lastUpdated ekle
            const responseData = {
                ...this.enhanceListingData(updatedListing),
                lastUpdated: new Date().toISOString()
            };

            return {
                success: true,
                data: responseData as any,
                statusCode: 200
            };
        } catch (error) {
            console.error('RefereeService.updateRefereeListing error:', error);
            return {
                success: false,
                error: 'Hakem ilanı güncellenirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Hakem ilanını silme
    async deleteRefereeListing(id: string, userId: string): Promise<ServiceResponse<void>> {
        try {
            // İlan var mı ve kullanıcının kendi ilanı mı kontrol et
            const existingListing = await prisma.refereeListing.findUnique({
                where: { id }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Hakem ilanı bulunamadı',
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
            await prisma.refereeListing.delete({
                where: { id }
            });

            return {
                success: true,
                statusCode: 200
            };
        } catch (error) {
            console.error('RefereeService.deleteRefereeListing error:', error);
            return {
                success: false,
                error: 'Hakem ilanı silinirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Hakem ilanını aktifleştirme
    async activateRefereeListing(id: string, userId: string): Promise<ServiceResponse<RefereeListing>> {
        try {
            // İlan var mı ve kullanıcının kendi ilanı mı kontrol et
            const existingListing = await prisma.refereeListing.findUnique({
                where: { id }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Hakem ilanı bulunamadı',
                    statusCode: 404
                };
            }

            if (existingListing.userId !== userId) {
                return {
                    success: false,
                    error: 'Bu ilanı aktifleştirme yetkiniz yok',
                    statusCode: 403
                };
            }

            if (existingListing.isActive) {
                return {
                    success: false,
                    error: 'İlan zaten aktif durumda',
                    statusCode: 400
                };
            }

            // Kullanıcının başka aktif ilanı var mı kontrol et
            const activeListingExists = await prisma.refereeListing.findFirst({
                where: {
                    userId,
                    isActive: true,
                    id: { not: id }
                }
            });

            if (activeListingExists) {
                return {
                    success: false,
                    error: 'Zaten aktif bir hakem ilanınız bulunmaktadır. Önce mevcut aktif ilanınızı devre dışı bırakın.',
                    statusCode: 400
                };
            }

            // İlanı aktifleştir
            const activatedListing = await prisma.refereeListing.update({
                where: { id },
                data: { isActive: true },
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
                data: this.enhanceListingData(activatedListing) as any,
                statusCode: 200
            };
        } catch (error) {
            console.error('RefereeService.activateRefereeListing error:', error);
            return {
                success: false,
                error: 'Hakem ilanı aktifleştirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // Hakem ilanını deaktifleştirme
    async deactivateRefereeListing(id: string, userId: string): Promise<ServiceResponse<RefereeListing>> {
        try {
            // İlan var mı ve kullanıcının kendi ilanı mı kontrol et
            const existingListing = await prisma.refereeListing.findUnique({
                where: { id }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Hakem ilanı bulunamadı',
                    statusCode: 404
                };
            }

            if (existingListing.userId !== userId) {
                return {
                    success: false,
                    error: 'Bu işlem için yetkiniz bulunmuyor',
                    statusCode: 403
                };
            }

            // İlanı deaktif et
            const updatedListing = await prisma.refereeListing.update({
                where: { id },
                data: { isActive: false },
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
                data: this.enhanceListingData(updatedListing) as any,
                statusCode: 200
            };
        } catch (error) {
            console.error('RefereeService.deactivateRefereeListing error:', error);
            return {
                success: false,
                error: 'Hakem ilanı deaktif edilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }

    // İlanı öne çıkan yap
    async setFeaturedStatus(id: string, featured: boolean): Promise<ServiceResponse<void>> {
        try {
            const existingListing = await prisma.refereeListing.findUnique({
                where: { id }
            });

            if (!existingListing) {
                return {
                    success: false,
                    error: 'Hakem ilanı bulunamadı',
                    statusCode: 404
                };
            }

            await prisma.refereeListing.update({
                where: { id },
                data: { featured }
            });

            return {
                success: true
            };

        } catch (error) {
            console.error('RefereeService.setFeaturedStatus error:', error);
            return {
                success: false,
                error: 'İlan öne çıkan durumu güncellenirken hata oluştu'
            };
        }
    }

    // Öne çıkan hakem ilanlarını getir
    async getFeaturedRefereeListings(): Promise<ServiceResponse<RefereeListing[]>> {
        try {
            const featuredListings = await prisma.refereeListing.findMany({
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
                            profilePhoto: true,
                            role: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: [
                    { featured: 'desc' },
                    { createdAt: 'desc' }
                ]
            });

            return {
                success: true,
                data: featuredListings.map(listing => this.enhanceListingData(listing)) as any[],
                statusCode: 200
            };

        } catch (error) {
            console.error('RefereeService.getFeaturedRefereeListings error:', error);
            return {
                success: false,
                error: 'Öne çıkan hakem ilanları getirilirken bir hata oluştu',
                statusCode: 500
            };
        }
    }
}

export const refereeService = new RefereeService(); 