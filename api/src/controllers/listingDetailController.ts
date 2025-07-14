import { Request, Response } from 'express';
import { ListingDetailService, ListingType } from '../services/listingDetailService';
import { ApiResponse } from '../types';

const listingDetailService = new ListingDetailService();

export class ListingDetailController {

    /**
     * İlan tipi belirtilerek detay getirme
     * @route GET /api/v1/listings/:type/:id
     * @access Public
     */
    async getListingDetail(req: Request, res: Response): Promise<void> {
        try {
            const { type, id } = req.params;

            // Parametre validasyonu
            if (!id) {
                const response: ApiResponse = {
                    success: false,
                    message: 'İlan ID gereklidir',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            if (!['field', 'goalkeeper', 'referee'].includes(type)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Geçersiz ilan tipi. Desteklenen tipler: field, goalkeeper, referee',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            const result = await listingDetailService.getListingDetail(type as ListingType, id);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'İlan detayı getirilemedi',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'İlan detayı başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'İlan detayı getirme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    /**
     * İlan ID'sinden otomatik tip tespiti ile detay getirme
     * @route GET /api/v1/listings/:id
     * @access Public
     */
    async getListingDetailAuto(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Parametre validasyonu
            if (!id) {
                const response: ApiResponse = {
                    success: false,
                    message: 'İlan ID gereklidir',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Önce ilan tipini tespit et
            const typeResult = await listingDetailService.detectListingType(id);

            if (!typeResult.success) {
                const response: ApiResponse = {
                    success: false,
                    message: typeResult.error || 'İlan bulunamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: typeResult.statusCode || 404
                };
                res.status(typeResult.statusCode || 404).json(response);
                return;
            }

            // İlan detayını getir
            const result = await listingDetailService.getListingDetail(typeResult.data!.type, id);

            if (!result.success) {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'İlan detayı getirilemedi',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'İlan detayı başarıyla getirildi',
                data: result.data,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);

        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'İlan detayı getirme sırasında hata oluştu',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }
} 