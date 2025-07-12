import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Tüm chat route'ları authentication gerektirir
router.use(authenticateToken);

// Konuşma route'ları
router.post('/conversations/start', chatController.startConversation);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.put('/conversations/:conversationId/read', chatController.markMessagesAsRead);

// Mesaj route'ları
router.post('/messages/send', chatController.sendMessage);
router.delete('/messages/:messageId', chatController.deleteMessage);
router.put('/messages/:messageId/edit', chatController.editMessage);

// Engelleme route'ları
router.post('/block', chatController.blockUser);
router.post('/unblock', chatController.unblockUser);
router.get('/blocked-users', chatController.getBlockedUsers);
router.get('/block-status/:otherUserId', chatController.checkBlockStatus);

export default router; 