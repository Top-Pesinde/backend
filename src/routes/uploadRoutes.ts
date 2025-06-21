import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
const uploadController = new UploadController();

// Memory storage for MinIO uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png|gif/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and image files are allowed'));
        }
    },
});

// POST /api/uploads/profile-photo - Upload profile photo (korumalı)
router.post('/profile-photo',
    authenticateToken,
    upload.single('profilePhoto'),
    uploadController.uploadProfilePhoto.bind(uploadController)
);

// PUT /api/uploads/profile-photo - Update profile photo (korumalı)
router.put('/profile-photo',
    authenticateToken,
    upload.single('profilePhoto'),
    uploadController.updateProfilePhoto.bind(uploadController)
);

// POST /api/uploads/documents - Upload documents (korumalı)
router.post('/documents',
    authenticateToken,
    upload.array('documents', 5),
    uploadController.uploadDocuments.bind(uploadController)
);

// DELETE /api/uploads/:bucketType/:fileName - Delete file (korumalı)
router.delete('/:bucketType/:fileName',
    authenticateToken,
    uploadController.deleteFile.bind(uploadController)
);

// GET /api/uploads/:bucketType/:fileName/url - Get file URL (korumalı)
router.get('/:bucketType/:fileName/url',
    authenticateToken,
    uploadController.getFileUrl.bind(uploadController)
);

// GET /api/uploads/:bucketType/list - List user files (korumalı)
router.get('/:bucketType/list',
    authenticateToken,
    uploadController.listUserFiles.bind(uploadController)
);

export { router as uploadRoutes }; 