import { Router } from 'express';
import { createSubscription, getUserSubscriptions, updateSubscription } from '../controllers/subscriptionsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createSubscription);
router.get('/:userId', getUserSubscriptions);
router.put('/:id', updateSubscription);

export default router;