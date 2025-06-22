import { Router } from 'express';
import { fieldListingController } from '../controllers/fieldListingController';
import { authenticateToken } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Multer configuration for field photos (memory storage for MinIO)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları kabul edilir!'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 3 // Maximum 3 files
    },
    fileFilter: fileFilter
});

// Public routes (no authentication required)
/**
 * @route GET /api/field-listings
 * @desc Get all field listings with filters and pagination
 * @access Public
 * @query {string} page - Page number
 * @query {string} limit - Items per page (max 50)
 * @query {string} sortBy - Sort field (default: createdAt)
 * @query {string} sortOrder - Sort order (asc/desc)
 * @query {string} surfaceType - Surface type filter (GRASS, ARTIFICIAL, CONCRETE, CARPET)
 * @query {string} isIndoor - Indoor filter (true/false)
 * @query {string} minPrice - Minimum price filter
 * @query {string} maxPrice - Maximum price filter
 * @query {string} features - Comma separated features
 * @query {string} dayOfWeek - Day of week filter
 * @query {string} search - Search in field name or address
 */
router.get('/', fieldListingController.getAllFieldListings);

/**
 * @route GET /api/field-listings/:id
 * @desc Get field listing by ID
 * @access Public
 * @param {string} id - Field listing ID
 */
router.get('/:id', fieldListingController.getFieldListingById);

// Protected routes (authentication required)
/**
 * @route POST /api/field-listings
 * @desc Create a new field listing
 * @access Private
 * @body {string} fieldName - Field name (required)
 * @body {string} fieldAddress - Field address (required)
 * @body {number} hourlyPrice - Hourly price (required)
 * @body {boolean} isIndoor - Is indoor field (required)
 * @body {string} surfaceType - Surface type (required)
 * @body {string} phone - Contact phone (required)
 * @body {string} contactType - Contact type (PHONE/WHATSAPP) (required)
 * @body {string} description - Field description
 * @body {Array} schedules - Working schedules (required)
 * @body {Array} features - Field features (required)
 * @body {Array} subFields - Sub fields (optional)
 * @files photos - Field photos (2-3 files required)
 */
router.post(
    '/',
    authenticateToken,
    upload.array('photos', 3),
    fieldListingController.createFieldListing
);

/**
 * @route GET /api/field-listings/my/listings
 * @desc Get current user's all field listings (active + inactive)
 * @access Private
 */
router.get('/my/listings', authenticateToken, fieldListingController.getUserFieldListings);

/**
 * @route GET /api/field-listings/my/listing
 * @desc Get current user's field listing (deprecated - use /my/listings)
 * @access Private
 */
router.get('/my/listing', authenticateToken, fieldListingController.getUserFieldListing);

/**
 * @route PUT /api/field-listings/my/listing
 * @desc Update current user's field listing
 * @access Private
 * @body {string} fieldName - Field name
 * @body {string} fieldAddress - Field address
 * @body {number} hourlyPrice - Hourly price
 * @body {boolean} isIndoor - Is indoor field
 * @body {string} surfaceType - Surface type
 * @body {string} phone - Contact phone
 * @body {string} contactType - Contact type (PHONE/WHATSAPP)
 * @body {string} description - Field description
 * @body {Array} schedules - Working schedules
 * @body {Array} features - Field features
 * @body {Array} subFields - Sub fields
 * @files photos - Field photos (2-3 files if updating photos)
 */
router.put(
    '/my/listing',
    authenticateToken,
    upload.array('photos', 3),
    fieldListingController.updateFieldListing
);

/**
 * @route PATCH /api/field-listings/my/listing/deactivate
 * @desc Deactivate current user's field listing
 * @access Private
 */
router.patch('/my/listing/deactivate', authenticateToken, fieldListingController.deactivateFieldListing);

/**
 * @route PATCH /api/field-listings/my/listing/activate
 * @desc Activate current user's field listing
 * @access Private
 */
router.patch('/my/listing/activate', authenticateToken, fieldListingController.activateFieldListing);

/**
 * @route DELETE /api/field-listings/my/listing
 * @desc Delete current user's field listing
 * @access Private
 */
router.delete('/my/listing', authenticateToken, fieldListingController.deleteFieldListing);

export default router; 