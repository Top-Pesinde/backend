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
import { MinioService } from '../services/minioService';

class FieldListingController {
    private minioService = new MinioService();

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

            // Kullanıcının aktif ilanı var mı kontrol et
            const activeListingCheck = await fieldListingService.hasActiveListing(userId);
            if (!activeListingCheck.success) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Aktif ilan kontrolü sırasında hata oluştu',
                    timestamp: new Date().toISOString(),
                    statusCode: 500
                };
                res.status(500).json(response);
                return;
            }

            if (activeListingCheck.data) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Zaten aktif bir halısaha ilanınız bulunmaktadır. Yeni ilan oluşturmak için önce mevcut ilanınızı deaktif etmelisiniz.',
                    timestamp: new Date().toISOString(),
                    statusCode: 409
                };
                res.status(409).json(response);
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
            if (!fieldName || !fieldAddress || !hourlyPrice || isIndoor === undefined || !surfaceType) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Gerekli alanlar eksik',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            let parsedSchedules;
            try {
                parsedSchedules = Array.isArray(schedules) ? schedules : JSON.parse(schedules);
            } catch (error) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Çalışma saatleri formatı geçersiz',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            if (!parsedSchedules || !Array.isArray(parsedSchedules) || parsedSchedules.length === 0) {
                const response: ApiResponse = {
                    success: false,
                    message: 'En az bir çalışma saati tanımlanmalıdır',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // features'ı parse et
            let parsedFeatures;
            try {
                parsedFeatures = Array.isArray(features) ? features : JSON.parse(features);
            } catch (error) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Özellikler formatı geçersiz',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            if (!parsedFeatures || !Array.isArray(parsedFeatures)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Özellikler listesi gereklidir',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Fotoğrafları kontrol et - artık zorunlu
            const photoFiles = (Array.isArray(req.files) ? req.files : []) as Express.Multer.File[];
            if (photoFiles.length < 2 || photoFiles.length > 3) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Halısaha için 2-3 fotoğraf yüklemeniz gereklidir',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Fotoğraf tiplerini kontrol et
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            for (const file of photoFiles) {
                if (!allowedTypes.includes(file.mimetype)) {
                    const response: ApiResponse = {
                        success: false,
                        message: `Geçersiz dosya tipi: ${file.originalname}. Sadece resim dosyaları yükleyebilirsiniz.`,
                        timestamp: new Date().toISOString(),
                        statusCode: 400
                    };
                    res.status(400).json(response);
                    return;
                }
            }

            // Önce halısaha ilanını oluştur
            const createData: CreateFieldListingDto = {
                fieldName,
                fieldAddress,
                hourlyPrice: parseFloat(hourlyPrice),
                isIndoor: isIndoor === 'true' || isIndoor === true,
                surfaceType: surfaceType as SurfaceType,
                phone,
                contactType: contactType as ContactType,
                description,
                schedules: parsedSchedules,
                features: parsedFeatures,
                subFields: subFields ? (Array.isArray(subFields) ? subFields : JSON.parse(subFields)) : undefined,
                photos: [] // Başlangıçta boş, sonra güncellenecek
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

            // Halısaha oluşturulduktan sonra fotoğrafları yükle
            const fieldId = result.data!.id;
            const uploadedPhotos: string[] = [];

            try {
                // Fotoğrafları MinIO'ya yükle
                for (let i = 0; i < photoFiles.length; i++) {
                    const file = photoFiles[i];
                    const uploadResult = await this.minioService.uploadFile(file, 'field', userId, fieldId);
                    if (uploadResult.success) {
                        uploadedPhotos.push(uploadResult.data!.url);
                    } else {
                        throw new Error(`Fotoğraf ${i + 1} yüklenemedi: ${uploadResult.error}`);
                    }
                }

                // Fotoğraf URL'lerini veritabanına kaydet
                if (uploadedPhotos.length > 0) {
                    await fieldListingService.updateFieldPhotos(fieldId, uploadedPhotos);
                }

                // Güncellenmiş halısaha bilgilerini getir
                const updatedListing = await fieldListingService.getFieldListingById(fieldId);

                const response: ApiResponse = {
                    success: true,
                    message: 'Halısaha ilanı ve fotoğrafları başarıyla oluşturuldu',
                    data: updatedListing.data,
                    timestamp: new Date().toISOString(),
                    statusCode: 201
                };
                res.status(201).json(response);

            } catch (photoError) {
                // Fotoğraf yükleme hatasını logla
                console.error('Fotoğraf yükleme hatası:', {
                    userId,
                    fieldId,
                    error: photoError instanceof Error ? photoError.message : photoError,
                    stack: photoError instanceof Error ? photoError.stack : undefined,
                    timestamp: new Date().toISOString()
                });

                // Fotoğraf yükleme hatası durumunda halısaha ilanını sil
                await fieldListingService.deleteFieldListingById(fieldId);

                const response: ApiResponse = {
                    success: false,
                    message: `Fotoğraf yükleme hatası: ${photoError instanceof Error ? photoError.message : 'Bilinmeyen hata'}`,
                    timestamp: new Date().toISOString(),
                    statusCode: 500
                };
                res.status(500).json(response);
                return;
            }

        } catch (error) {
            // Ana hatayı logla
            console.error('Halısaha ilanı oluşturma hatası:', {
                userId: req.user?.id,
                requestBody: req.body,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });

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
            const photos = req.files ? (Array.isArray(req.files) ? req.files : []).map(file => file.filename) : undefined;
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

    // Kullanıcının tüm halısaha ilanlarını getir
    async getUserFieldListings(req: CustomRequest, res: Response): Promise<void> {
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

            const result = await fieldListingService.getUserFieldListings(userId);

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
                message: result.data && result.data.length > 0 ? 'Halısaha ilanları başarıyla getirildi' : 'Henüz halısaha ilanınız bulunmamaktadır',
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

    // Kullanıcının kendi ilanını getir (deprecated)
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
            const sortBy = req.query.sortBy as string || 'fieldName';
            const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'asc';

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