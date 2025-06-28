import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { uploadRoutes } from './uploadRoutes';
import { userRoutes } from './userRoutes';
import { metricsRoutes } from './metricsRoutes';
import fieldListingRoutes from './fieldListingRoutes';
import goalkeeperRoutes from './goalkeeperRoutes';
import refereeRoutes from './refereeRoutes';
import fcmTokenRoutes from './fcmTokenRoutes';

const router = Router();

// API versiyonu ve base route'ları
router.use('/v1/auth', authRoutes);
router.use('/v1/uploads', uploadRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/field-listings', fieldListingRoutes);
router.use('/v1/goalkeeper-listings', goalkeeperRoutes);
router.use('/v1/referee-listings', refereeRoutes);
router.use('/v1/fcm-tokens', fcmTokenRoutes);

// Monitoring routes (no version prefix)
router.use('/', metricsRoutes);

// Diğer service'ler buraya eklenebilir
// router.use('/v1/products', productRoutes);
// router.use('/v1/orders', orderRoutes);

// API bilgi endpoint'i
router.get('/', (req, res) => {
    res.json({
        message: 'Express API with TypeScript and Services Architecture',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/v1/auth/register',
                login: 'POST /api/v1/auth/login',
                forgotPassword: 'POST /api/v1/auth/forgot-password',
                resetPassword: 'POST /api/v1/auth/reset-password',
                refresh: 'POST /api/v1/auth/refresh',
                profile: 'GET /api/v1/auth/profile',
                logout: 'POST /api/v1/auth/logout',

            },
            uploads: {
                profilePhoto: 'POST /api/v1/uploads/profile-photo',
                updateProfilePhoto: 'PUT /api/v1/uploads/profile-photo',
                documents: 'POST /api/v1/uploads/documents',
                fieldPhotos: 'POST /api/v1/uploads/field-photos (FOOTBALL_FIELD_OWNER only)',
                updateFieldPhotos: 'PUT /api/v1/uploads/field-photos (FOOTBALL_FIELD_OWNER only)',
                deleteFile: 'DELETE /api/v1/uploads/:bucketType/:fileName',
                getFileUrl: 'GET /api/v1/uploads/:bucketType/:fileName/url',
                listFiles: 'GET /api/v1/uploads/:bucketType/list',
            },
            users: {
                me: 'GET /api/v1/users/me (Get complete information about the authenticated user)',
                getAllUsers: 'GET /api/v1/users (ADMIN only)',
                getUserById: 'GET /api/v1/users/:userId (ADMIN only)',
                getUserStats: 'GET /api/v1/users/stats (ADMIN only)',
                getFootballFieldOwners: 'GET /api/v1/users/football-field-owners (ADMIN only)',
                getAllDocuments: 'GET /api/v1/users/documents (ADMIN only)',
                downloadDocument: 'GET /api/v1/users/documents/:documentId/download (ADMIN only)',
                getDocumentDownloadUrl: 'GET /api/v1/users/documents/:documentId/url (ADMIN only)',
                getUserDocuments: 'GET /api/v1/users/:userId/documents (ADMIN only)',
                downloadUserDocument: 'GET /api/v1/users/:userId/documents/:documentId/download (ADMIN only)',
            },
            fieldListings: {
                create: 'POST /api/v1/field-listings (Create new field listing)',
                getAll: 'GET /api/v1/field-listings (Get all field listings with filters)',
                getById: 'GET /api/v1/field-listings/:id (Get field listing by ID)',
                getMy: 'GET /api/v1/field-listings/my/listing (Get current user\'s listing)',
                updateMy: 'PUT /api/v1/field-listings/my/listing (Update current user\'s listing)',
                deactivateMy: 'PATCH /api/v1/field-listings/my/listing/deactivate (Deactivate listing)',
                activateMy: 'PATCH /api/v1/field-listings/my/listing/activate (Activate listing)',
                deleteMy: 'DELETE /api/v1/field-listings/my/listing (Delete listing)',
            },
            goalkeeperListings: {
                create: 'POST /api/v1/goalkeeper-listings (Create new goalkeeper listing - GOALKEEPER role)',
                getAll: 'GET /api/v1/goalkeeper-listings (Get all goalkeeper listings)',
                getById: 'GET /api/v1/goalkeeper-listings/:id (Get goalkeeper listing by ID)',
                getMy: 'GET /api/v1/goalkeeper-listings/my/listings (Get current user\'s goalkeeper listings)',
                update: 'PUT /api/v1/goalkeeper-listings/:id (Update goalkeeper listing)',
                delete: 'DELETE /api/v1/goalkeeper-listings/:id (Delete goalkeeper listing)',
            },
            refereeListings: {
                create: 'POST /api/v1/referee-listings (Create new referee listing - REFEREE role)',
                getAll: 'GET /api/v1/referee-listings (Get all referee listings)',
                getById: 'GET /api/v1/referee-listings/:id (Get referee listing by ID)',
                getMy: 'GET /api/v1/referee-listings/my/listings (Get current user\'s referee listings)',
                update: 'PUT /api/v1/referee-listings/:id (Update referee listing)',
                delete: 'DELETE /api/v1/referee-listings/:id (Delete referee listing)',
            },
            fcmTokens: {
                upsert: 'POST /api/v1/fcm-tokens (Create or update FCM token)',
                getMy: 'GET /api/v1/fcm-tokens (Get current user\'s FCM tokens)',
                delete: 'DELETE /api/v1/fcm-tokens/:tokenId (Delete FCM token)',
            },
            health: '/health',
            metrics: '/metrics (Prometheus metrics)',
        },
        roles: ['USER', 'GOALKEEPER', 'REFEREE', 'FOOTBALL_FIELD_OWNER', 'ADMIN'],
        storage: {
            minioConsole: 'http://localhost:9001',
            buckets: ['profile-photos', 'documents', 'general-uploads', 'fields'],
            bucketUrls: {
                profilePhotos: 'http://localhost:9000/profile-photos/',
                documents: 'http://localhost:9000/documents/',
                fieldPhotos: 'http://localhost:9000/fields/',
                generalUploads: 'http://localhost:9000/general-uploads/'
            }
        },
        fieldListingFeatures: {
            technical: ['OPEN_24_7', 'ONLINE_RESERVATION', 'FREE_WIFI', 'SECURITY_CAMERA'],
            facilities: ['CHANGING_ROOM', 'SHOWER', 'TOILET', 'PARKING', 'CAFE', 'TRIBUNE', 'RENTAL_SHOES', 'RENTAL_GLOVES'],
            surfaceTypes: ['GRASS', 'ARTIFICIAL', 'CONCRETE', 'CARPET'],
            contactTypes: ['PHONE', 'WHATSAPP'],
            daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        },
        timestamp: new Date().toISOString(),
    });
});

export { router as apiRoutes }; 