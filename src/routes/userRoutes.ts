import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const userController = new UserController();

// All user routes require authentication
// Additional ADMIN role check is done in controller

// GET /api/users - Get all users with pagination and filters (ADMIN only)
router.get('/', authenticateToken, userController.getAllUsers.bind(userController));

// GET /api/users/stats - Get user statistics (ADMIN only)
router.get('/stats', authenticateToken, userController.getUserStats.bind(userController));

// GET /api/users/football-field-owners - Get all football field owners with documents (ADMIN only)
router.get('/football-field-owners', authenticateToken, userController.getFootballFieldOwners.bind(userController));

// GET /api/users/documents - Get all documents with user info (ADMIN only)
router.get('/documents', authenticateToken, userController.getAllDocuments.bind(userController));

// GET /api/users/documents/:documentId/download - Download document by ID (ADMIN only)
router.get('/documents/:documentId/download', authenticateToken, userController.downloadDocument.bind(userController));

// GET /api/users/documents/:documentId/url - Get document download URL (ADMIN only)
router.get('/documents/:documentId/url', authenticateToken, userController.getDocumentDownloadUrl.bind(userController));

// GET /api/users/:userId - Get specific user by ID (ADMIN only)
router.get('/:userId', authenticateToken, userController.getUserById.bind(userController));

// GET /api/users/:userId/documents - Get user documents by user ID (ADMIN only)
router.get('/:userId/documents', authenticateToken, userController.getUserDocuments.bind(userController));

// GET /api/users/:userId/documents/:documentId/download - Download specific user document (ADMIN only)
router.get('/:userId/documents/:documentId/download', authenticateToken, userController.downloadUserDocument.bind(userController));

export { router as userRoutes }; 