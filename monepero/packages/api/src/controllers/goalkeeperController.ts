import { Request, Response } from 'express';
import { goalkeeperService } from '../services/goalkeeperService';
import {
    CustomRequest,
    CreateGoalkeeperListingDto,
    UpdateGoalkeeperListingDto,
    ServiceListingFilterDto,
    PaginationParams
} from '../types';

export class GoalkeeperController {
    // Kaleci ilanı oluşturma
    async createGoalkeeperListing(req: CustomRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Token gerekli',
                    error: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                });
            }

            // Gerekli alanları kontrol et
            const { title, location, description, hourlyPrice, bio, phone, contactType, hasLicense } = req.body;

            if (!title || !location || !description || !hourlyPrice || !bio || !phone) {
                return res.status(400).json({
                    success: false,
                    message: 'Eksik alanlar: title, location, description, hourlyPrice, bio, phone gereklidir',
                    error: 'Validation failed',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            // Saatlik ücret validasyonu
            if (isNaN(hourlyPrice) || hourlyPrice < 0 || hourlyPrice > 10000) {
                return res.status(400).json({
                    success: false,
                    message: 'Saatlik ücret 0-10000 TL arasında olmalıdır',
                    error: 'Invalid hourly price',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const listingData: CreateGoalkeeperListingDto = {
                title,
                location,
                description,
                hourlyPrice: parseFloat(hourlyPrice),
                bio,
                phone,
                contactType: contactType || 'PHONE',
                hasLicense: hasLicense === 'true' || hasLicense === true
            };

            const result = await goalkeeperService.createGoalkeeperListing(userId, listingData);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kaleci ilanı oluşturulamadı',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Kaleci ilanı başarıyla oluşturuldu',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 201
            });

        } catch (error) {
            console.error('GoalkeeperController.createGoalkeeperListing error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Tüm kaleci ilanlarını listeleme
    async getGoalkeeperListings(req: Request, res: Response) {
        try {
            // Pagination parametreleri
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
            const sortBy = req.query.sortBy as string || 'title';
            const sortOrder = (req.query.sortOrder as string || 'asc') as 'asc' | 'desc';

            const paginationParams: PaginationParams = {
                page,
                limit,
                sortBy,
                sortOrder
            };

            // Filter parametreleri
            const filters: ServiceListingFilterDto = {};

            if (req.query.minPrice) {
                filters.minPrice = parseFloat(req.query.minPrice as string);
            }
            if (req.query.maxPrice) {
                filters.maxPrice = parseFloat(req.query.maxPrice as string);
            }
            if (req.query.hasLicense) {
                filters.hasLicense = req.query.hasLicense === 'true';
            }
            if (req.query.location) {
                filters.location = req.query.location as string;
            }
            if (req.query.search) {
                filters.search = req.query.search as string;
            }

            const result = await goalkeeperService.getGoalkeeperListings(paginationParams, filters);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kaleci ilanları getirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kaleci ilanları başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('GoalkeeperController.getGoalkeeperListings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // ID ile kaleci ilanı detayını getirme
    async getGoalkeeperListingById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'İlan ID gereklidir',
                    error: 'Missing listing ID',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const result = await goalkeeperService.getGoalkeeperListingById(id);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kaleci ilanı getirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kaleci ilanı başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('GoalkeeperController.getGoalkeeperListingById error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Kullanıcının kaleci ilanlarını getirme
    async getUserGoalkeeperListings(req: CustomRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Token gerekli',
                    error: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                });
            }

            const result = await goalkeeperService.getUserGoalkeeperListings(userId);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kullanıcı kaleci ilanları getirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kullanıcı kaleci ilanları başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('GoalkeeperController.getUserGoalkeeperListings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Kaleci ilanını güncelleme
    async updateGoalkeeperListing(req: CustomRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Token gerekli',
                    error: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                });
            }

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'İlan ID gereklidir',
                    error: 'Missing listing ID',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const { title, location, description, hourlyPrice, bio, phone, contactType, hasLicense, isActive } = req.body;

            // Saatlik ücret validasyonu (eğer gönderilmişse)
            if (hourlyPrice && (isNaN(hourlyPrice) || hourlyPrice < 0 || hourlyPrice > 10000)) {
                return res.status(400).json({
                    success: false,
                    message: 'Saatlik ücret 0-10000 TL arasında olmalıdır',
                    error: 'Invalid hourly price',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const updateData: UpdateGoalkeeperListingDto = {};
            if (title) updateData.title = title;
            if (location) updateData.location = location;
            if (description) updateData.description = description;
            if (hourlyPrice) updateData.hourlyPrice = parseFloat(hourlyPrice);
            if (bio) updateData.bio = bio;
            if (phone) updateData.phone = phone;
            if (contactType) updateData.contactType = contactType;
            if (hasLicense !== undefined) updateData.hasLicense = hasLicense === 'true' || hasLicense === true;
            if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

            const result = await goalkeeperService.updateGoalkeeperListing(id, userId, updateData);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kaleci ilanı güncellenemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kaleci ilanı başarıyla güncellendi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('GoalkeeperController.updateGoalkeeperListing error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Kaleci ilanını silme
    async deleteGoalkeeperListing(req: CustomRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Token gerekli',
                    error: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                });
            }

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'İlan ID gereklidir',
                    error: 'Missing listing ID',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const result = await goalkeeperService.deleteGoalkeeperListing(id, userId);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kaleci ilanı silinemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kaleci ilanı başarıyla silindi',
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('GoalkeeperController.deleteGoalkeeperListing error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Kaleci ilanını aktifleştirme
    async activateGoalkeeperListing(req: CustomRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Token gerekli',
                    error: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'İlan ID gereklidir',
                    error: 'Missing listing ID',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const result = await goalkeeperService.activateGoalkeeperListing(id, userId);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kaleci ilanı aktifleştirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kaleci ilanı başarıyla aktifleştirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('GoalkeeperController.activateGoalkeeperListing error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Kaleci ilanını deaktifleştirme
    async deactivateGoalkeeperListing(req: CustomRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Token gerekli',
                    error: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                });
            }

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'İlan ID gereklidir',
                    error: 'Missing listing ID',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const result = await goalkeeperService.deactivateGoalkeeperListing(id, userId);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kaleci ilanı deaktifleştirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kaleci ilanı başarıyla deaktifleştirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('GoalkeeperController.deactivateGoalkeeperListing error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }
}

export const goalkeeperController = new GoalkeeperController(); 