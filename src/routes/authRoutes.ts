import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

// Multer configuration for file uploads (memory storage for MinIO)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow common document types
    const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only documents and images are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter,
});

// POST /api/auth/register - Kullanıcı kaydı
router.post('/register', upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'documents', maxCount: 5 }
]), authController.register.bind(authController));

// POST /api/auth/login - Kullanıcı girişi
router.post('/login', authController.login.bind(authController));

// POST /api/auth/forgot-password - Şifre sıfırlama kodu gönderme
router.post('/forgot-password', authController.forgotPassword.bind(authController));

// POST /api/auth/reset-password - Token ile şifre sıfırlama
router.post('/reset-password', authController.resetPassword.bind(authController));

// POST /apwi/auth/refresh - Token yenileme
router.post('/refresh', authController.refreshToken.bind(authController));

// POST /api/auth/logout - Kullanıcı çıkışı (korumalı)
router.post('/logout', authenticateToken, authController.logout.bind(authController));

// GET /api/auth/profile - Kullanıcı profili (korumalı)
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));
router.post('/change-password', authenticateToken, authController.changeUserPassword.bind(authController));

// PUT /api/auth/status - Kullanıcı durumu değiştirme (korumalı)
router.put('/status', authenticateToken, authController.statusChangeAuth.bind(authController));

// PUT /api/auth/subscription - Kullanıcı abonelik durumu değiştirme (korumalı)
router.put('/subscription', authenticateToken, authController.subscriptionChangeAuth.bind(authController));

// PUT /api/auth/profile - Kullanıcı profil güncelleme (korumalı)
router.put('/profile', authenticateToken, authController.changeUserProfile.bind(authController));

// PUT /api/auth/contact-info - Kullanıcı iletişim bilgilerini güncelleme (korumalı)
router.put('/contact-info', authenticateToken, authController.updateContactInfo.bind(authController));

// DELETE /api/auth/profile-photo - Kullanıcı profil fotoğrafı silme (korumalı)
router.delete('/profile-photo', authenticateToken, authController.deleteProfilePhoto.bind(authController));

// Session Management Routes (korumalı)

// GET /api/auth/sessions - Kullanıcının aktif oturumlarını listele
router.get('/sessions', authenticateToken, authController.getUserSessions.bind(authController));

// POST /api/auth/sessions/terminate - Belirli bir oturumu sonlandır
router.post('/sessions/terminate', authenticateToken, authController.terminateSession.bind(authController));

// POST /api/auth/sessions/terminate-others - Diğer oturumları sonlandır (mevcut hariç)
router.post('/sessions/terminate-others', authenticateToken, authController.terminateOtherSessions.bind(authController));

// POST /api/auth/sessions/terminate-all - Tüm oturumları sonlandır
router.post('/sessions/terminate-all', authenticateToken, authController.terminateAllSessions.bind(authController));

// Admin Session Management Routes (ADMIN only)

// GET /api/auth/admin/sessions/stats - Session istatistiklerini getir
router.get('/admin/sessions/stats', authenticateToken, authController.getSessionStats.bind(authController));

// POST /api/auth/admin/sessions/cleanup - Kapsamlı session temizleme
router.post('/admin/sessions/cleanup', authenticateToken, authController.runComprehensiveCleanup.bind(authController));

// POST /api/auth/admin/sessions/cleanup-user - Belirli kullanıcının session'larını temizle
router.post('/admin/sessions/cleanup-user', authenticateToken, authController.cleanupUserSessions.bind(authController));

export { router as authRoutes };