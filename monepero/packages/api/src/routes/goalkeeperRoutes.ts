import { Router } from 'express';
import { goalkeeperController } from '../controllers/goalkeeperController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Tüm kaleci ilanları (genel kullanım, authentication gerekmez)
router.get('/', goalkeeperController.getGoalkeeperListings);

// ID ile kaleci ilanı detayı (genel kullanım, authentication gerekmez)  
router.get('/:id', goalkeeperController.getGoalkeeperListingById);

// Authentication gerektiren route'lar
router.use(authenticateToken);

// Kaleci ilanı oluşturma (sadece GOALKEEPER rolü)
router.post('/', goalkeeperController.createGoalkeeperListing.bind(goalkeeperController));

// Kullanıcının kendi kaleci ilanları
router.get('/my/listings', goalkeeperController.getUserGoalkeeperListings.bind(goalkeeperController));

// Kaleci ilanını güncelleme (sadece ilanın sahibi)
router.put('/:id', goalkeeperController.updateGoalkeeperListing.bind(goalkeeperController));

// Kaleci ilanını silme (sadece ilanın sahibi)
router.delete('/:id', goalkeeperController.deleteGoalkeeperListing.bind(goalkeeperController));

// Kaleci ilanını aktifleştirme (sadece ilanın sahibi)
router.patch('/:id/activate', goalkeeperController.activateGoalkeeperListing.bind(goalkeeperController));

// Kaleci ilanını deaktifleştirme (sadece ilanın sahibi)
router.patch('/:id/deactivate', goalkeeperController.deactivateGoalkeeperListing.bind(goalkeeperController));

export default router; 