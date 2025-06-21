import { Request, Response } from 'express';
import {
    CustomRequest,
    CreateFieldListingDto,
    UpdateFieldListingDto,
    FieldListingFilterDto,
    PaginationParams,
    ApiResponse,
    SurfaceType,
    ContactType,
    DayOfWeek,
    FeatureType
} from '../types';
import { fieldListingService } from '../services/fieldListingService';

class FieldListingController {

    // Halısaha ilanı oluştur
    async createFieldListing(req: CustomRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Kullanıcı kimliği bulunamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const {
                fieldName,
                fieldAddress,
                hourlyPrice,
                isIndoor,
                surfaceType,
                phone,
                contactType,
                description,
                schedules,
                features,
                subFields
            } = req.body;

            // Validation
            if (!fieldName || !fieldAddress || !hourlyPrice || isIndoor === undefined || !surfaceType || !phone || !contactType) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Gerekli alanlar eksik',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
                const response: ApiResponse = {
                    success: false,
                    message: 'En az bir çalışma saati tanımlanmalıdır',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            if (!features || !Array.isArray(features)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Özellikler listesi gereklidir',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Fotoğrafları kontrol et (geçici olarak zorunlu değil)
            const photos = req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : [];
            if (photos.length > 3) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Maksimum 3 fotoğraf yükleyebilirsiniz',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            const createData: CreateFieldListingDto = {
                fieldName,
                fieldAddress,
                hourlyPrice: parseFloat(hourlyPrice),
                isIndoor: isIndoor === 'true' || isIndoor === true,
                surfaceType: surfaceType as SurfaceType,
                phone,
                contactType: contactType as ContactType,
                description,
                schedules: Array.isArray(schedules) ? schedules : JSON.parse(schedules),
                features: Array.isArray(features) ? features : JSON.parse(features),
                subFields: subFields ? (Array.isArray(subFields) ? subFields : JSON.parse(subFields)) : undefined,
                photos
            };

            const result = await fieldListingService.createFieldListing(userId, createData);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Halısaha ilanı oluşturulamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Halısaha ilanı başarıyla oluşturuldu',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: 201
            };
            res.status(201).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Halısaha ilanı oluşturma sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    // Halısaha ilanını güncelle
    async updateFieldListing(req: CustomRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Kullanıcı kimliği bulunamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const {
                fieldName,
                fieldAddress,
                hourlyPrice,
                isIndoor,
                surfaceType,
                phone,
                contactType,
                description,
                schedules,
                features,
                subFields
            } = req.body;

            // Fotoğrafları kontrol et
            const photos = req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : undefined;
            if (photos && photos.length > 3) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Maksimum 3 fotoğraf yükleyebilirsiniz',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            const updateData: UpdateFieldListingDto = {
                fieldName,
                fieldAddress,
                hourlyPrice: hourlyPrice ? parseFloat(hourlyPrice) : undefined,
                isIndoor: isIndoor !== undefined ? (isIndoor === 'true' || isIndoor === true) : undefined,
                surfaceType: surfaceType as SurfaceType,
                phone,
                contactType: contactType as ContactType,
                description,
                schedules: schedules ? (Array.isArray(schedules) ? schedules : JSON.parse(schedules)) : undefined,
                features: features ? (Array.isArray(features) ? features : JSON.parse(features)) : undefined,
                subFields: subFields ? (Array.isArray(subFields) ? subFields : JSON.parse(subFields)) : undefined,
                photos
            };

            const result = await fieldListingService.updateFieldListing(userId, updateData);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Halısaha ilanı güncellenemedi',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Halısaha ilanı başarıyla güncellendi',
                data: result.data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Halısaha ilanı güncelleme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    // Kullanıcının kendi ilanını getir
    async getUserFieldListing(req: CustomRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Kullanıcı kimliği bulunamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const result = await fieldListingService.getUserFieldListing(userId);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Halısaha ilanı getirilemedi',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: result.data ? 'Halısaha ilanı başarıyla getirildi' : 'Halısaha ilanı bulunamadı',
                data: result.data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Halısaha ilanı getirme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    // ID'ye göre halısaha ilanı getir
    async getFieldListingById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                const response: ApiResponse = {
                    success: false,
                    message: 'İlan ID\'si gereklidir',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            const result = await fieldListingService.getFieldListingById(id);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Halısaha ilanı bulunamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Halısaha ilanı başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Halısaha ilanı getirme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    // Tüm halısaha ilanlarını listele
    async getAllFieldListings(req: Request, res: Response): Promise<void> {
        try {
            // Pagination parametreleri
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
            const sortBy = req.query.sortBy as string || 'createdAt';
            const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

            const pagination: PaginationParams = {
                page,
                limit,
                sortBy,
                sortOrder
            };

            // Filtre parametreleri
            const filters: FieldListingFilterDto = {
                surfaceType: req.query.surfaceType as SurfaceType,
                isIndoor: req.query.isIndoor === 'true' ? true : req.query.isIndoor === 'false' ? false : undefined,
                minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
                maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
                features: req.query.features ? (req.query.features as string).split(',') as FeatureType[] : undefined,
                dayOfWeek: req.query.dayOfWeek as DayOfWeek,
                startTime: req.query.startTime as string,
                endTime: req.query.endTime as string,
                search: req.query.search as string
            };

            const result = await fieldListingService.getAllFieldListings(filters, pagination);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Halısaha ilanları getirilemedi',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Halısaha ilanları başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Halısaha ilanları getirme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    // Halısaha ilanını deaktif et
    async deactivateFieldListing(req: CustomRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Kullanıcı kimliği bulunamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const result = await fieldListingService.deactivateFieldListing(userId);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Halısaha ilanı deaktif edilemedi',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Halısaha ilanı başarıyla deaktif edildi',
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Halısaha ilanı deaktif etme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    // Halısaha ilanını aktif et
    async activateFieldListing(req: CustomRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Kullanıcı kimliği bulunamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const result = await fieldListingService.activateFieldListing(userId);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Halısaha ilanı aktif edilemedi',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Halısaha ilanı başarıyla aktif edildi',
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Halısaha ilanı aktif etme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    // Halısaha ilanını sil
    async deleteFieldListing(req: CustomRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Kullanıcı kimliği bulunamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const result = await fieldListingService.deleteFieldListing(userId);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Halısaha ilanı silinemedi',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Halısaha ilanı başarıyla silindi',
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Halısaha ilanı silme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }
}

export const fieldListingController = new FieldListingController(); 