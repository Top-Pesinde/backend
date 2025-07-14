import express from 'express';
import { ListingDetailController } from '../controllers/listingDetailController';

const router = express.Router();
const listingDetailController = new ListingDetailController();

/**
 * @route GET /api/v1/listings/:id
 * @desc Get listing detail by ID with automatic type detection
 * @access Public
 * @param {string} id - Listing ID
 */
router.get('/:id', listingDetailController.getListingDetailAuto.bind(listingDetailController));

/**
 * @route GET /api/v1/listings/:type/:id
 * @desc Get listing detail by type and ID
 * @access Public
 * @param {string} type - Listing type (field, goalkeeper, referee)
 * @param {string} id - Listing ID
 */
router.get('/:type/:id', listingDetailController.getListingDetail.bind(listingDetailController));

export default router; 