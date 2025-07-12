import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { uploadRoutes } from './uploadRoutes';
import { userRoutes } from './userRoutes';
import { metricsRoutes } from './metricsRoutes';
import fieldListingRoutes from './fieldListingRoutes';
import goalkeeperRoutes from './goalkeeperRoutes';
import refereeRoutes from './refereeRoutes';
import fcmTokenRoutes from './fcmTokenRoutes';
import adminListingRoutes from './adminListingRouter';
import listingDetailRoutes from './listingDetailRoutes';
import goalkeeperOfferRoutes from './goalkeeperOfferRoutes';
import refereeOfferRoutes from './refereeOfferRoutes';
import testNotificationRoutes from './testNotificationRoutes';
import chatRoutes from './chatRoutes';

const router = Router();

// API versiyonu ve base route'ları
router.use('/v1/auth', authRoutes);
router.use('/v1/upload', uploadRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/field-listings', fieldListingRoutes);
router.use('/v1/goalkeeper-listings', goalkeeperRoutes);
router.use('/v1/referee-listings', refereeRoutes);
router.use('/v1/goalkeeper-offers', goalkeeperOfferRoutes);
router.use('/v1/referee-offers', refereeOfferRoutes);
router.use('/v1/fcm-tokens', fcmTokenRoutes);
router.use('/v1/admin/listings', adminListingRoutes);
router.use('/v1/listings', listingDetailRoutes);
router.use('/v1/chat', chatRoutes);
router.use('/v1/metrics', metricsRoutes);
router.use('/v1/test-notification', testNotificationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Express API Services'
    });
});

// Ana endpoint - API dökümantasyonu
router.get('/', (req, res) => {
    res.json({
        message: 'Express API Services',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: 'GET /api/health (Health check)',
            auth: {
                register: 'POST /api/v1/auth/register (User registration)',
                login: 'POST /api/v1/auth/login (User login)',
                logout: 'POST /api/v1/auth/logout (User logout)',
                refreshToken: 'POST /api/v1/auth/refresh-token (Refresh access token)',
                forgotPassword: 'POST /api/v1/auth/forgot-password (Send password reset email)',
                resetPassword: 'POST /api/v1/auth/reset-password (Reset password)',
                googleLogin: 'POST /api/v1/auth/google-login (Google login)',
                googleRegister: 'POST /api/v1/auth/google-register (Complete Google registration)',
                appleLogin: 'POST /api/v1/auth/apple-login (Apple login)',
                appleRegister: 'POST /api/v1/auth/apple-register (Complete Apple registration)',
                changePassword: 'POST /api/v1/auth/change-password (Change password)',
                updateProfile: 'PUT /api/v1/auth/profile (Update profile)',
                updateContactInfo: 'PUT /api/v1/auth/contact-info (Update contact info)',
                changeSubscription: 'PATCH /api/v1/auth/subscription (Change subscription status)',
                changeStatus: 'PATCH /api/v1/auth/status (Change user status - ADMIN only)',
                terminateSession: 'POST /api/v1/auth/terminate-session (Terminate specific session)',
                terminateOtherSessions: 'POST /api/v1/auth/terminate-other-sessions (Terminate all other sessions)',
                getSessions: 'GET /api/v1/auth/sessions (Get user sessions)',
            },
            users: {
                me: 'GET /api/v1/users/me (Get complete information about the authenticated user)',
                getUserByUsername: 'GET /api/v1/users/username/:username (Get user by username - PUBLIC)',
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
            goalkeeperOffers: {
                create: 'POST /api/v1/goalkeeper-offers (Send offer to goalkeeper listing)',
                updateStatus: 'PATCH /api/v1/goalkeeper-offers/:offerId/status (Accept/Reject offer - Goalkeeper only)',
                getSent: 'GET /api/v1/goalkeeper-offers/sent (Get sent offers)',
                getReceived: 'GET /api/v1/goalkeeper-offers/received (Get received offers)',
                getById: 'GET /api/v1/goalkeeper-offers/:offerId (Get offer details)',
                cancel: 'PATCH /api/v1/goalkeeper-offers/:offerId/cancel (Cancel offer - Sender only)',
            },
            refereeOffers: {
                create: 'POST /api/v1/referee-offers (Send offer to referee listing)',
                updateStatus: 'PATCH /api/v1/referee-offers/:offerId/status (Accept/Reject offer - Referee only)',
                getSent: 'GET /api/v1/referee-offers/sent (Get sent offers)',
                getReceived: 'GET /api/v1/referee-offers/received (Get received offers)',
                getById: 'GET /api/v1/referee-offers/:offerId (Get offer details)',
                cancel: 'PATCH /api/v1/referee-offers/:offerId/cancel (Cancel offer - Sender only)',
            },
            upload: {
                single: 'POST /api/v1/upload/single (Upload single file)',
                multiple: 'POST /api/v1/upload/multiple (Upload multiple files)',
            },
            listings: {
                getDetail: 'GET /api/v1/listings/:id (Get listing detail with auto type detection)',
                getDetailByType: 'GET /api/v1/listings/:type/:id (Get listing detail by type)',
            },
            fcmTokens: {
                register: 'POST /api/v1/fcm-tokens/register (Register FCM token)',
                unregister: 'DELETE /api/v1/fcm-tokens/unregister (Unregister FCM token)',
                getUserTokens: 'GET /api/v1/fcm-tokens/my (Get user\'s FCM tokens)',
            },
            testNotification: {
                send: 'POST /api/v1/test-notification/send (Send test notification)',
            },
            chat: {
                startConversation: 'POST /api/v1/chat/conversations/start (Start conversation with another user)',
                getConversations: 'GET /api/v1/chat/conversations (Get user conversations)',
                getMessages: 'GET /api/v1/chat/conversations/:conversationId/messages (Get conversation messages)',
                markAsRead: 'PUT /api/v1/chat/conversations/:conversationId/read (Mark messages as read)',
                sendMessage: 'POST /api/v1/chat/messages/send (Send message via REST API)',
                deleteMessage: 'DELETE /api/v1/chat/messages/:messageId (Delete message)',
                editMessage: 'PUT /api/v1/chat/messages/:messageId/edit (Edit message)',
                blockUser: 'POST /api/v1/chat/block (Block user)',
                unblockUser: 'POST /api/v1/chat/unblock (Unblock user)',
                getBlockedUsers: 'GET /api/v1/chat/blocked-users (Get blocked users)',
                checkBlockStatus: 'GET /api/v1/chat/block-status/:otherUserId (Check block status)',
            },
            metrics: 'GET /api/v1/metrics (Get system metrics - ADMIN only)',
        }
    });
});

export { router }; 