import { Router } from 'express';
import { refereeController } from '../controllers/refereeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Tüm hakem ilanları (genel kullanım, authentication gerekmez)
router.get('/', refereeController.getRefereeListings);

// ID ile hakem ilanı detayı (genel kullanım, authentication gerekmez)  
router.get('/:id', refereeController.getRefereeListingById);

// Authentication gerektiren route'lar
router.use(authenticateToken);

// Hakem ilanı oluşturma (sadece REFEREE rolü)
router.post('/', refereeController.createRefereeListing.bind(refereeController));

// Kullanıcının kendi hakem ilanları
router.get('/my/listings', refereeController.getUserRefereeListings.bind(refereeController));

// Hakem ilanını güncelleme (sadece ilanın sahibi)
router.put('/:id', refereeController.updateRefereeListing.bind(refereeController));

// Hakem ilanını silme (sadece ilanın sahibi)
router.delete('/:id', refereeController.deleteRefereeListing.bind(refereeController));

export default router; 