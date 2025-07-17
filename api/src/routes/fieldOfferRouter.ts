import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { FieldOfferController } from '../controllers/fielOfferController';

const router = Router();
const fieldOfferController = new FieldOfferController();

router.use(authenticateToken);
router.post('/', fieldOfferController.createOffer.bind(fieldOfferController));
router.patch('/:offerId/status', fieldOfferController.updateOfferStatus.bind(fieldOfferController));

router.get('/sent', fieldOfferController.getUserSentOffers.bind(fieldOfferController));
router.get('/received', fieldOfferController.getUserReceivedOffers.bind(fieldOfferController));
router.get('/my', fieldOfferController.getMyFieldOffers.bind(fieldOfferController));

// Halı saha için kabul edilen teklifleri getirme (boş günleri görmek için)
router.get('/field/:fieldListingId/accepted', fieldOfferController.getAcceptedOffersByField.bind(fieldOfferController));

// Yeni: Halı saha için kabul edilen tekliflerin gün ve saatlerini getirme
router.get('/field/:fieldListingId/accepted-times', fieldOfferController.getAcceptedOfferTimesByField.bind(fieldOfferController));

router.get('/:offerId', fieldOfferController.getOfferById.bind(fieldOfferController));


export default router;