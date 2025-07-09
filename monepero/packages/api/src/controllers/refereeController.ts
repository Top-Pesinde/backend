import { Request, Response } from 'express';
import { refereeService } from '../services/refereeService';
import {
    CustomRequest,
    CreateRefereeListingDto,
    UpdateRefereeListingDto,
    ServiceListingFilterDto,
    PaginationParams
} from '../types';

export class RefereeController {
    // Hakem ilanı oluşturma
    async createRefereeListing(req: CustomRequest, res: Response) {
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

            // Kullanıcının aktif hakem ilanı var mı kontrol et
            const activeListingCheck = await refereeService.getUserRefereeListings(userId);
            if (activeListingCheck.success && activeListingCheck.data) {
                const hasActiveListing = activeListingCheck.data.some((listing: any) => listing.isActive === true);
                if (hasActiveListing) {
                    return res.status(409).json({
                        success: false,
                        message: 'Zaten aktif bir hakem ilanınız bulunmaktadır. Yeni ilan oluşturmak için önce mevcut ilanınızı deaktif etmelisiniz.',
                        error: 'Active listing already exists',
                        timestamp: new Date().toISOString(),
                        statusCode: 409
                    });
                }
            }

            const { title, location, description, hourlyPrice, bio, phone, contactType, hasLicense } = req.body;

            if (!title || !location || !description || hourlyPrice === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Eksik alanlar: title, location, description, hourlyPrice gereklidir',
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

            const listingData: CreateRefereeListingDto = {
                title,
                location,
                description,
                hourlyPrice: parseFloat(hourlyPrice),
                bio: bio || null,
                phone: phone || null,
                contactType: contactType || null,
                hasLicense: hasLicense === 'true' || hasLicense === true
            };

            const result = await refereeService.createRefereeListing(userId, listingData);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Hakem ilanı oluşturulamadı',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(201).json({
                success: true,
                message: 'Hakem ilanı başarıyla oluşturuldu',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 201
            });

        } catch (error) {
            console.error('RefereeController.createRefereeListing error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Tüm hakem ilanlarını listeleme
    async getRefereeListings(req: Request, res: Response) {
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

            const result = await refereeService.getRefereeListings(paginationParams, filters);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Hakem ilanları getirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Hakem ilanları başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('RefereeController.getRefereeListings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // ID ile hakem ilanı detayını getirme
    async getRefereeListingById(req: Request, res: Response) {
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

            const result = await refereeService.getRefereeListingById(id);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Hakem ilanı getirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Hakem ilanı başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('RefereeController.getRefereeListingById error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Kullanıcının hakem ilanlarını getirme
    async getUserRefereeListings(req: CustomRequest, res: Response) {
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

            const result = await refereeService.getUserRefereeListings(userId);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Kullanıcı hakem ilanları getirilemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kullanıcı hakem ilanları başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('RefereeController.getUserRefereeListings error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Hakem ilanını güncelleme
    async updateRefereeListing(req: CustomRequest, res: Response) {
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

            const { title, description, hourlyPrice } = req.body;

            // En az bir alan belirtilmelidir
            if (title === undefined && description === undefined && hourlyPrice === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Güncellemek için en az bir alan belirtmelisiniz (title, description, hourlyPrice)',
                    error: 'No fields to update',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            // Saatlik ücret validasyonu (eğer gönderilmişse)
            if (hourlyPrice !== undefined && (isNaN(hourlyPrice) || hourlyPrice < 0 || hourlyPrice > 10000)) {
                return res.status(400).json({
                    success: false,
                    message: 'Saatlik ücret 0-10000 TL arasında olmalıdır',
                    error: 'Invalid hourly price',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                });
            }

            const updateData: UpdateRefereeListingDto = {};
            if (title !== undefined) updateData.title = title;
            if (description !== undefined) updateData.description = description;
            if (hourlyPrice !== undefined) updateData.hourlyPrice = parseFloat(hourlyPrice);

            const result = await refereeService.updateRefereeListing(id, userId, updateData);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Hakem ilanı güncellenemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Hakem ilanı başarıyla güncellendi',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('RefereeController.updateRefereeListing error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                error: 'Internal server error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            });
        }
    }

    // Hakem ilanını silme
    async deleteRefereeListing(req: CustomRequest, res: Response) {
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

            const result = await refereeService.deleteRefereeListing(id, userId);

            if (!result.success) {
                return res.status(result.statusCode || 500).json({
                    success: false,
                    message: result.error || 'Hakem ilanı silinemedi',
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Hakem ilanı başarıyla silindi',
                timestamp: new Date().toISOString(),
                statusCode: 200
            });

        } catch (error) {
            console.error('RefereeController.deleteRefereeListing error:', error);
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

export const refereeController = new RefereeController(); 