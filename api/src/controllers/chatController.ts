import { Response } from 'express';
import { chatService } from '../services/chatService';
import { getSocketService } from '../services/socketService';
import { CustomRequest } from '../types';

export class ChatController {
    // Konuşma başlat veya mevcut konuşmayı getir
    async startConversation(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { otherUserId } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!otherUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Diğer kullanıcı ID\'si gerekli'
                });
            }

            if (userId === otherUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Kendinizle konuşma başlatamazsınız'
                });
            }

            const result = await chatService.findOrCreateConversation(userId, otherUserId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Konuşma başlatma hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Konuşma başlatılamadı'
            });
        }
    }

    // Kullanıcının konuşmalarını getir
    async getConversations(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            const result = await chatService.getUserConversations(userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Konuşmaları getirme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Konuşmalar getirilemedi'
            });
        }
    }

    // Konuşmanın mesajlarını getir
    async getMessages(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { conversationId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!conversationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Konuşma ID gerekli'
                });
            }

            const result = await chatService.getConversationMessages(
                conversationId,
                userId,
                page,
                limit
            );

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Mesajları getirme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Mesajlar getirilemedi'
            });
        }
    }

    // REST API ile mesaj gönder (socket dışında)
    async sendMessage(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { receiverId, content, messageType, replyToId, attachmentUrl } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!receiverId || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Alıcı ID ve mesaj içeriği gerekli'
                });
            }

            const result = await chatService.sendMessage({
                senderId: userId,
                receiverId,
                content,
                messageType,
                replyToId,
                attachmentUrl
            });

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            // Socket ile bildirim gönder
            try {
                const socketService = getSocketService();
                socketService.sendToUser(receiverId, 'new_chat_message', {
                    message: result.data
                });
            } catch (socketError) {
                console.error('Socket bildirimi gönderilemedi:', socketError);
                // Socket hatası mesaj göndermeyi engellemez
            }

            return res.status(201).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Mesaj gönderilemedi'
            });
        }
    }

    // Mesajları okundu olarak işaretle
    async markMessagesAsRead(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { conversationId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!conversationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Konuşma ID gerekli'
                });
            }

            const result = await chatService.markConversationAsRead(conversationId, userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            // Socket ile bildirim gönder
            try {
                const socketService = getSocketService();
                socketService.sendToRoom(`conversation_${conversationId}`, 'messages_read_by_user', {
                    userId,
                    conversationId
                });
            } catch (socketError) {
                console.error('Socket bildirimi gönderilemedi:', socketError);
            }

            return res.status(200).json({
                success: true,
                message: 'Mesajlar okundu olarak işaretlendi'
            });
        } catch (error) {
            console.error('Mesaj okundu işaretleme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Mesajlar okundu olarak işaretlenemedi'
            });
        }
    }

    // Mesaj sil
    async deleteMessage(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { messageId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!messageId) {
                return res.status(400).json({
                    success: false,
                    message: 'Mesaj ID gerekli'
                });
            }

            const result = await chatService.deleteMessage(messageId, userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Mesaj silindi'
            });
        } catch (error) {
            console.error('Mesaj silme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Mesaj silinemedi'
            });
        }
    }

    // Mesaj düzenle
    async editMessage(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { messageId } = req.params;
            const { content } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!messageId || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Mesaj ID ve yeni içerik gerekli'
                });
            }

            const result = await chatService.editMessage(messageId, userId, content);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Mesaj düzenleme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Mesaj düzenlenemedi'
            });
        }
    }

    // Kullanıcı engelle
    async blockUser(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { blockedUserId, reason } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!blockedUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Engellenecek kullanıcı ID gerekli'
                });
            }

            const result = await chatService.blockUser(userId, blockedUserId, reason);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kullanıcı engellendi'
            });
        } catch (error) {
            console.error('Kullanıcı engelleme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Kullanıcı engellenemedi'
            });
        }
    }

    // Kullanıcı engelini kaldır
    async unblockUser(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { blockedUserId } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!blockedUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Engeli kaldırılacak kullanıcı ID gerekli'
                });
            }

            const result = await chatService.unblockUser(userId, blockedUserId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Kullanıcı engeli kaldırıldı'
            });
        } catch (error) {
            console.error('Kullanıcı engel kaldırma hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Engel kaldırılamadı'
            });
        }
    }

    // Engellenmiş kullanıcıları getir
    async getBlockedUsers(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            const result = await chatService.getBlockedUsers(userId);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            return res.status(200).json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Engellenmiş kullanıcıları getirme hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Engellenmiş kullanıcılar getirilemedi'
            });
        }
    }

    // İki kullanıcının birbirini engellediğini kontrol et
    async checkBlockStatus(req: CustomRequest, res: Response): Promise<any> {
        try {
            const userId = req.user?.id;
            const { otherUserId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Kimlik doğrulama gerekli'
                });
            }

            if (!otherUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Diğer kullanıcı ID gerekli'
                });
            }

            const isBlocked = await chatService.checkIfBlocked(userId, otherUserId);

            return res.status(200).json({
                success: true,
                data: {
                    isBlocked,
                    canChat: !isBlocked
                }
            });
        } catch (error) {
            console.error('Engelleme durumu kontrolü hatası:', error);
            return res.status(500).json({
                success: false,
                message: 'Engelleme durumu kontrol edilemedi'
            });
        }
    }
}

export const chatController = new ChatController(); 