import { Server } from 'socket.io';
import { AuthenticatedSocket, ChatMessageData, ConversationData, TypingData } from '../types';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants';
import { chatService } from '../../chatService';
import { notificationService } from '../../notificationService';

export class ChatHandler {
    constructor(private io: Server) { }

    async handleChatMessage(socket: AuthenticatedSocket, data: ChatMessageData) {
        try {
            console.log('💬 Chat mesajı alındı:', data);

            const { receiverId, content, messageType, replyToId, attachmentUrl } = data;

            if (!receiverId || !content) {
                socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Alıcı ID ve mesaj içeriği gerekli' });
                return;
            }

            // Kullanıcının kendine mesaj atmasını engelle
            if (socket.userId === receiverId) {
                socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Kendinize mesaj gönderemezsiniz' });
                return;
            }

            // Mesajı veritabanına kaydet
            const result = await chatService.sendMessage({
                senderId: socket.userId!,
                receiverId,
                content,
                messageType,
                replyToId,
                attachmentUrl
            });

            if (!result.success || !result.data) {
                // Engelleme durumunu detaylı kontrol et
                if (result.error?.includes('engellendi') || result.error?.includes('engelle') || result.error?.includes('gönderemezsiniz')) {
                    // Detaylı engelleme durumunu kontrol et
                    const blockStatus = await chatService.checkBlockStatus(socket.userId!, receiverId);

                    let errorType = 'BLOCKED';
                    let errorMessage = result.error;

                    if (blockStatus.isBlocked) {
                        errorType = 'BLOCKED_BY_OTHER';
                        errorMessage = 'Bu kullanıcı sizi engellemiş. Mesaj gönderemezsiniz.';
                    } else if (blockStatus.hasBlocked) {
                        errorType = 'BLOCKED_BY_YOU';
                        errorMessage = 'Bu kullanıcıyı siz engellemişsiniz. Mesaj gönderemezsiniz.';
                    } else if (result.error?.includes('banlandı')) {
                        errorType = 'BANNED';
                        errorMessage = 'Bu kullanıcı kalıcı olarak banlandı. Mesaj gönderemezsiniz.';
                    }

                    socket.emit('message_send_error', {
                        error: errorMessage,
                        type: errorType,
                        receiverId: receiverId,
                        blockStatus: blockStatus
                    });
                } else {
                    socket.emit('message_send_error', {
                        error: result.error || 'Mesaj gönderilemedi',
                        type: 'GENERAL',
                        receiverId: receiverId
                    });
                }
                return;
            }

            const message = result.data;

            // Gönderene başarı mesajı
            socket.emit('message_sent_success', {
                success: true,
                message: message
            });

            // Alıcıya mesajı direkt gönder
            this.sendToUser(receiverId, SOCKET_EVENTS.NEW_CHAT_MESSAGE, {
                message: message
            });

            // Push notification gönder
            notificationService.sendCustomNotification(
                receiverId,
                'Yeni Mesaj',
                'Sana yeni bir mesaj geldi',
                { message }
            );

            // Konuşma odasındaki tüm kullanıcılara mesajı gönder (gönderen hariç)
            const conversationRoom = SOCKET_ROOMS.CONVERSATION(message.conversation.id);
            socket.to(conversationRoom).emit(SOCKET_EVENTS.NEW_CHAT_MESSAGE, {
                message: message
            });

            // 5 saniye sonra mesajın okunup okunmadığını kontrol et ve bildirim gönder
            setTimeout(async () => {
                try {
                    console.log(`⏰ 5 saniye geçti, mesaj okundu mu kontrol ediliyor: ${message.id}`);

                    // Mesajın güncel durumunu veritabanından kontrol et
                    const updatedMessage = await chatService.getMessageById(message.id);

                    if (updatedMessage.success && updatedMessage.data) {
                        const messageData = updatedMessage.data;

                        // Eğer mesaj hala okunmamışsa bildirim gönder
                        if (!messageData.isRead) {
                            console.log(`📱 Mesaj okunmamış, bildirim gönderiliyor: ${message.id}`);

                            // Alıcıya "mesaj geldi" bildirimi gönder
                            this.sendToUser(receiverId, 'message_notification', {
                                messageId: message.id,
                                senderId: socket.userId,
                                content: message.content,
                                conversationId: message.conversation.id,
                                timestamp: new Date().toISOString(),
                                type: 'unread_message'
                            });

                            console.log(`✅ Bildirim gönderildi -> User ${receiverId}`);
                        } else {
                            console.log(`✓ Mesaj zaten okunmuş, bildirim gönderilmiyor: ${message.id}`);
                        }
                    }
                } catch (error) {
                    console.error('5 saniye sonra okundu kontrolü hatası:', error);
                }
            }, 5000); // 5 saniye bekle

        } catch (error) {
            console.error('Chat mesaj işleme hatası:', error);
            socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Mesaj gönderilemedi' });
        }
    }

    handleJoinConversation(socket: AuthenticatedSocket, data: ConversationData) {
        try {
            const { conversationId } = data;

            if (!conversationId) {
                socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Konuşma ID gerekli' });
                return;
            }

            const conversationRoom = SOCKET_ROOMS.CONVERSATION(conversationId);
            socket.join(conversationRoom);

            console.log(`👥 User ${socket.userId} konuşmaya katıldı: ${conversationRoom}`);

            socket.emit(SOCKET_EVENTS.CONVERSATION_JOINED, {
                success: true,
                conversationId,
                room: conversationRoom
            });

            // --- YENİ: Unread mesajları gönder ---
            this.sendUnreadMessages(socket, conversationId);

            // --- YENİ: Odaya girince otomatik okundu olarak işaretle ---
            (async () => {
                const unreadMessages = await chatService.getUnreadMessages(conversationId, socket.userId!);
                if (unreadMessages && unreadMessages.length > 0) {
                    // Mesajları okundu olarak işaretle
                    await chatService.markConversationAsRead(conversationId, socket.userId!);

                    // Karşı tarafı bul
                    const conversation = await chatService.getConversationDetail(conversationId, socket.userId!);
                    if (conversation.success) {
                        const otherUserId = conversation.data.user1Id === socket.userId!
                            ? conversation.data.user2Id
                            : conversation.data.user1Id;
                        // Karşı tarafa okundu bilgisi gönder
                        this.sendToUser(otherUserId, SOCKET_EVENTS.MESSAGES_READ_BY_USER, {
                            userId: socket.userId,
                            conversationId,
                            unreadCount: 0,
                            timestamp: new Date().toISOString(),
                            message: 'Mesajlarınız okundu (sohbet odasına girildiğinde)'
                        });
                        // UnreadCount güncellemesi
                        this.sendToUser(otherUserId, 'unread_count_updated', {
                            conversationId,
                            unreadCount: 0
                        });
                    }
                }
            })();

        } catch (error) {
            console.error('Konuşmaya katılma hatası:', error);
            socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Konuşmaya katılamadı' });
        }
    }

    handleLeaveConversation(socket: AuthenticatedSocket, data: ConversationData) {
        try {
            const { conversationId } = data;

            if (!conversationId) {
                socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Konuşma ID gerekli' });
                return;
            }

            const conversationRoom = SOCKET_ROOMS.CONVERSATION(conversationId);
            socket.leave(conversationRoom);

            console.log(`👋 User ${socket.userId} konuşmadan ayrıldı: ${conversationRoom}`);

            socket.emit(SOCKET_EVENTS.CONVERSATION_LEFT, {
                success: true,
                conversationId,
                room: conversationRoom
            });

        } catch (error) {
            console.error('Konuşmadan ayrılma hatası:', error);
            socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Konuşmadan ayrılamadı' });
        }
    }

    async handleMarkMessagesRead(socket: AuthenticatedSocket, data: ConversationData) {
        try {
            const { conversationId } = data;

            if (!conversationId) {
                socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Konuşma ID gerekli' });
                return;
            }

            // Mesajları okundu olarak işaretle
            const result = await chatService.markConversationAsRead(conversationId, socket.userId!);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: result.error || 'Mesajlar okundu olarak işaretlenemedi' });
                return;
            }

            // Güncel unreadCount'u hesapla
            const unreadCount = await chatService.getUnreadCount(conversationId, socket.userId!);

            // Başarılı yanıt gönder
            socket.emit(SOCKET_EVENTS.MESSAGES_MARKED_READ, {
                success: true,
                conversationId,
                unreadCount: 0 // Artık okunmamış mesaj yok
            });

            // Karşı tarafı bul ve direkt bildir
            const conversation = await chatService.getConversationDetail(conversationId, socket.userId!);
            if (conversation.success) {
                const otherUserId = conversation.data.user1Id === socket.userId!
                    ? conversation.data.user2Id
                    : conversation.data.user1Id;

                // Karşı tarafa okundu bilgisi gönder
                this.sendToUser(otherUserId, SOCKET_EVENTS.MESSAGES_READ_BY_USER, {
                    userId: socket.userId,
                    conversationId,
                    unreadCount: 0,
                    timestamp: new Date().toISOString(),
                    readerInfo: {
                        id: socket.userId,
                        username: conversation.data.user1Id === socket.userId!
                            ? conversation.data.user1.username
                            : conversation.data.user2.username
                    },
                    message: 'Mesajlarınız okundu'
                });
            }

            // Konuşma odasındaki diğer kullanıcılara da bildir
            const conversationRoom = SOCKET_ROOMS.CONVERSATION(conversationId);
            socket.to(conversationRoom).emit(SOCKET_EVENTS.MESSAGES_READ_BY_USER, {
                userId: socket.userId,
                conversationId,
                unreadCount: 0,
                timestamp: new Date().toISOString()
            });

            // UnreadCount güncelleme bildirimi gönder
            socket.emit('unread_count_updated', {
                conversationId,
                unreadCount: 0
            });

        } catch (error) {
            console.error('Mesajları okundu işaretleme hatası:', error);
            socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Mesajlar okundu olarak işaretlenemedi' });
        }
    }

    handleTypingStart(socket: AuthenticatedSocket, data: TypingData) {
        try {
            const { conversationId, receiverId } = data;

            if (!conversationId || !receiverId) {
                socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Konuşma ID ve Alıcı ID gerekli' });
                return;
            }

            console.log(`⌨️  User ${socket.userId}, ${receiverId} için yazmaya başladı: ${conversationId}`);

            // Sadece ilgili kullanıcıya gönder
            this.sendToUser(receiverId, SOCKET_EVENTS.USER_TYPING_START, {
                userId: socket.userId,
                conversationId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Yazma başlangıcı bildirme hatası:', error);
        }
    }

    handleTypingStop(socket: AuthenticatedSocket, data: TypingData) {
        try {
            const { conversationId, receiverId } = data;

            if (!conversationId || !receiverId) {
                socket.emit(SOCKET_EVENTS.CHAT_ERROR, { message: 'Konuşma ID ve Alıcı ID gerekli' });
                return;
            }

            console.log(`⏹️  User ${socket.userId}, ${receiverId} için yazmayı bıraktı: ${conversationId}`);

            // Sadece ilgili kullanıcıya gönder
            this.sendToUser(receiverId, SOCKET_EVENTS.USER_TYPING_STOP, {
                userId: socket.userId,
                conversationId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Yazma bitiş bildirme hatası:', error);
        }
    }

    private sendToUser(userId: string, event: string, data: any) {
        try {
            this.io.to(SOCKET_ROOMS.USER(userId)).emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });
            console.log(`📤 ${event} gönderildi -> User ${userId}`);
        } catch (error) {
            console.error(`Kullanıcıya mesaj gönderme hatası (${userId}):`, error);
        }
    }

    // Unread mesajları gönder
    async sendUnreadMessages(socket: AuthenticatedSocket, conversationId: string) {
        try {
            const unreadMessages = await chatService.getUnreadMessages(conversationId, socket.userId!);
            socket.emit('unread_messages', {
                conversationId,
                messages: unreadMessages
            });
        } catch (error) {
            console.error('Unread mesajları gönderme hatası:', error);
        }
    }
}