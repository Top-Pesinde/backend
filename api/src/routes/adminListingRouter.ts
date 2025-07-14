import express from 'express';
import { listingFeatureService, ListingType } from '../services/listingFeatureService';
import { authenticateToken } from '../middleware/authMiddleware';
import { ServiceResponse } from '../types';

const router = express.Router();

// Admin yetkisi kontrolü middleware
const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Bu işlem için ADMIN yetkisi gereklidir',
            statusCode: 403
        });
    }
    next();
};

// İlan öne çıkarma/kaldırma endpoint'i
router.post('/listings/:type/:id/feature',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { type, id } = req.params;
            const { featured } = req.body;

            // Parametre validasyonu
            if (!['field', 'goalkeeper', 'referee'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz ilan tipi. Desteklenen tipler: field, goalkeeper, referee',
                    statusCode: 400
                });
            }

            if (typeof featured !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'featured parametresi boolean olmalıdır',
                    statusCode: 400
                });
            }

            const result = await listingFeatureService.setListingFeatured(
                type as ListingType,
                id,
                featured
            );

            if (result.success) {
                return res.json({
                    success: true,
                    message: featured ? 'İlan öne çıkarıldı' : 'İlan öne çıkarma kaldırıldı',
                    data: { featured },
                    statusCode: 200
                });
            } else {
                return res.status(result.statusCode || 400).json({
                    success: false,
                    message: result.error,
                    statusCode: result.statusCode || 400
                });
            }

        } catch (error) {
            console.error('Admin listing feature error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                statusCode: 500
            });
        }
    }
);

// İlanın öne çıkan durumunu getirme endpoint'i
router.get('/listings/:type/:id/feature',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { type, id } = req.params;

            // Parametre validasyonu
            if (!['field', 'goalkeeper', 'referee'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz ilan tipi. Desteklenen tipler: field, goalkeeper, referee',
                    statusCode: 400
                });
            }

            const result = await listingFeatureService.getListingFeaturedStatus(
                type as ListingType,
                id
            );

            if (result.success) {
                return res.json({
                    success: true,
                    data: { featured: result.data },
                    statusCode: 200
                });
            } else {
                return res.status(result.statusCode || 400).json({
                    success: false,
                    message: result.error,
                    statusCode: result.statusCode || 400
                });
            }

        } catch (error) {
            console.error('Admin get listing feature status error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                statusCode: 500
            });
        }
    }
);

// Kullanıcının tüm ilanlarını öne çıkarma/kaldırma endpoint'i
router.post('/users/:userId/listings/feature',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { featured } = req.body;

            if (typeof featured !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'featured parametresi boolean olmalıdır',
                    statusCode: 400
                });
            }

            const result = await listingFeatureService.setUserAllListingsFeatured(
                userId,
                featured
            );

            if (result.success) {
                return res.json({
                    success: true,
                    message: featured ? 'Kullanıcının tüm ilanları öne çıkarıldı' : 'Kullanıcının tüm ilanları öne çıkarma kaldırıldı',
                    data: { featured },
                    statusCode: 200
                });
            } else {
                return res.status(result.statusCode || 400).json({
                    success: false,
                    message: result.error,
                    statusCode: result.statusCode || 400
                });
            }

        } catch (error) {
            console.error('Admin user listings feature error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                statusCode: 500
            });
        }
    }
);

// Kullanıcının belirli tip ilanlarını öne çıkarma/kaldırma endpoint'i
router.post('/users/:userId/listings/:type/feature',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
        try {
            const { userId, type } = req.params;
            const { featured } = req.body;

            // Parametre validasyonu
            if (!['field', 'goalkeeper', 'referee'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Geçersiz ilan tipi. Desteklenen tipler: field, goalkeeper, referee',
                    statusCode: 400
                });
            }

            if (typeof featured !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'featured parametresi boolean olmalıdır',
                    statusCode: 400
                });
            }

            const result = await listingFeatureService.setUserListingsByTypeFeatured(
                userId,
                type as ListingType,
                featured
            );

            if (result.success) {
                return res.json({
                    success: true,
                    message: featured ? `Kullanıcının ${type} ilanları öne çıkarıldı` : `Kullanıcının ${type} ilanları öne çıkarma kaldırıldı`,
                    data: { featured, type },
                    statusCode: 200
                });
            } else {
                return res.status(result.statusCode || 400).json({
                    success: false,
                    message: result.error,
                    statusCode: result.statusCode || 400
                });
            }

        } catch (error) {
            console.error('Admin user listings by type feature error:', error);
            return res.status(500).json({
                success: false,
                message: 'Sunucu hatası',
                statusCode: 500
            });
        }
    }
);

export default router; 