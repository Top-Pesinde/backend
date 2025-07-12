import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { chatService } from './chatService';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}

export class SocketService {
    private io: Server;

    constructor(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupAuthentication();
        this.setupEventHandlers();
    }

    private setupAuthentication() {
        this.io.use((socket: any, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.query.token;

                if (!token) {
                    console.log('Socket bağlantısı - token bulunamadı');
                    return next(new Error('Authentication token gerekli'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
                socket.userId = decoded.userId;
                socket.user = decoded;

                console.log(`Socket kimlik doğrulaması başarılı: User ${decoded.userId}`);
                next();
            } catch (error) {
                console.error('Socket kimlik doğrulama hatası:', error);
                next(new Error('Geçersiz authentication token'));
            }
        });
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: AuthenticatedSocket) => {
            console.log(`✅ Kullanıcı socket'e bağlandı: ${socket.userId}`);

            // Kullanıcıyı kendi özel odasına ekle
            const userRoom = `user_${socket.userId}`;
            socket.join(userRoom);
            console.log(`📍 Kullanıcı ${socket.userId} odası: ${userRoom}`);

            // Bağlantı başarılı mesajı gönder
            socket.emit('connected', {
                success: true,
                message: 'Socket bağlantısı başarılı',
                userId: socket.userId,
                timestamp: new Date().toISOString()
            });

            // Chat mesajları
            socket.on('send_chat_message', (data: any) => {
                this.handleChatMessage(socket, data);
            });

            socket.on('join_conversation', (data: any) => {
                this.handleJoinConversation(socket, data);
            });

            socket.on('leave_conversation', (data: any) => {
                this.handleLeaveConversation(socket, data);
            });

            socket.on('mark_messages_read', (data: any) => {
                this.handleMarkMessagesRead(socket, data);
            });

            socket.on('typing_start', (data: any) => {
                this.handleTypingStart(socket, data);
            });

            socket.on('typing_stop', (data: any) => {
                this.handleTypingStop(socket, data);
            });

            // Temel mesaj gönderme (eski sistem)
            socket.on('send_message', (data: any) => {
                this.handleMessage(socket, data);
            });

            // İlan güncellemeleri
            socket.on('listing_update', (data: any) => {
                this.handleListingUpdate(socket, data);
            });

            // Ping-pong bağlantı testi
            socket.on('ping', () => {
                console.log('🏓 pong');
                socket.emit('pong', {
                    timestamp: new Date().toISOString(),
                    userId: socket.userId
                });
            });

            // Kullanıcı durumu
            socket.on('user_status', (data: any) => {
                this.handleUserStatus(socket, data);
            });

            // Bağlantı kesilme
            socket.on('disconnect', (reason) => {
                console.log(`❌ Kullanıcı ${socket.userId} bağlantısı kesildi: ${reason}`);
            });

            // Hata yönetimi
            socket.on('error', (error) => {
                console.error(`Socket hatası (User ${socket.userId}):`, error);
            });
        });
    }

    private handleMessage(socket: AuthenticatedSocket, data: any) {
        try {
            console.log('📩 Mesaj alındı:', data);

            const messageData = {
                id: Date.now().toString(),
                userId: socket.userId,
                message: data.message,
                timestamp: new Date().toISOString(),
                type: data.type || 'general'
            };

            // Gönderici hariç tüm kullanıcılara gönder
            socket.broadcast.emit('new_message', messageData);

            // Gönderene onay mesajı
            socket.emit('message_sent', {
                success: true,
                messageId: messageData.id,
                timestamp: messageData.timestamp
            });

        } catch (error) {
            console.error('Mesaj işleme hatası:', error);
            socket.emit('error', { message: 'Mesaj gönderilemedi' });
        }
    }

    private handleListingUpdate(socket: AuthenticatedSocket, data: any) {
        try {
            console.log('📋 İlan güncellemesi:', data);

            const updateData = {
                type: data.type, // 'field', 'goalkeeper', 'referee'
                listingId: data.listingId,
                action: data.action, // 'created', 'updated', 'deleted', 'activated', 'deactivated'
                userId: socket.userId,
                timestamp: new Date().toISOString(),
                data: data.data || null
            };

            // Tüm kullanıcılara güncelleyi broadcast et
            this.io.emit('listing_updated', updateData);

        } catch (error) {
            console.error('İlan güncelleme hatası:', error);
            socket.emit('error', { message: 'İlan güncellemesi başarısız' });
        }
    }

    private handleUserStatus(socket: AuthenticatedSocket, data: any) {
        try {
            const statusData = {
                userId: socket.userId,
                status: data.status, // 'online', 'away', 'busy'
                timestamp: new Date().toISOString()
            };

            // Diğer kullanıcılara durum güncellemesini gönder
            socket.broadcast.emit('user_status_update', statusData);

        } catch (error) {
            console.error('Kullanıcı durumu hatası:', error);
        }
    }

    // Belirli kullanıcıya mesaj gönder
    public sendToUser(userId: string, event: string, data: any) {
        try {
            this.io.to(`user_${userId}`).emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });
            console.log(`📤 ${event} gönderildi -> User ${userId}`);
        } catch (error) {
            console.error(`Kullanıcıya mesaj gönderme hatası (${userId}):`, error);
        }
    }

    // Tüm kullanıcılara mesaj gönder
    public broadcast(event: string, data: any) {
        try {
            this.io.emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });
            console.log(`📡 ${event} broadcast edildi`);
        } catch (error) {
            console.error('Broadcast hatası:', error);
        }
    }

    // Belirli odaya mesaj gönder
    public sendToRoom(room: string, event: string, data: any) {
        try {
            this.io.to(room).emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });
            console.log(`📤 ${event} gönderildi -> Room ${room}`);
        } catch (error) {
            console.error(`Odaya mesaj gönderme hatası (${room}):`, error);
        }
    }

    // Bağlı kullanıcı sayısını getir
    public getConnectedUsersCount(): number {
        return this.io.sockets.sockets.size;
    }

    // Chat mesaj handler'ları
    private async handleChatMessage(socket: AuthenticatedSocket, data: any) {
        try {
            console.log('💬 Chat mesajı alındı:', data);

            const { receiverId, content, messageType, replyToId, attachmentUrl } = data;

            if (!receiverId || !content) {
                socket.emit('chat_error', { message: 'Alıcı ID ve mesaj içeriği gerekli' });
                return;
            }

            // Kullanıcının kendine mesaj atmasını engelle
            if (socket.userId === receiverId) {
                socket.emit('chat_error', { message: 'Kendinize mesaj gönderemezsiniz' });
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
                socket.emit('chat_error', { message: result.error || 'Mesaj gönderilemedi' });
                return;
            }

            const message = result.data;

            // Gönderene onay mesajı
            socket.emit('message_sent', {
                success: true,
                message: message
            });

            // Konuşma odasındaki tüm kullanıcılara mesajı gönder (gönderen hariç)
            const conversationRoom = `conversation_${message.conversation.id}`;
            socket.to(conversationRoom).emit('new_chat_message', {
                message: message
            });

            // Ayrıca alıcıya da direkt gönder (eğer conversation room'a katılmamışsa da alabilsin)
            this.sendToUser(receiverId, 'new_chat_message', {
                message: message
                
            });

        } catch (error) {
            console.error('Chat mesaj işleme hatası:', error);
            socket.emit('chat_error', { message: 'Mesaj gönderilemedi' });
        }
    }

    private handleJoinConversation(socket: AuthenticatedSocket, data: any) {
        try {
            const { conversationId } = data;

            if (!conversationId) {
                socket.emit('chat_error', { message: 'Konuşma ID gerekli' });
                return;
            }

            const conversationRoom = `conversation_${conversationId}`;
            socket.join(conversationRoom);

            console.log(`👥 User ${socket.userId} konuşmaya katıldı: ${conversationRoom}`);

            socket.emit('conversation_joined', {
                success: true,
                conversationId,
                room: conversationRoom
            });

        } catch (error) {
            console.error('Konuşmaya katılma hatası:', error);
            socket.emit('chat_error', { message: 'Konuşmaya katılamadı' });
        }
    }

    private handleLeaveConversation(socket: AuthenticatedSocket, data: any) {
        try {
            const { conversationId } = data;

            if (!conversationId) {
                socket.emit('chat_error', { message: 'Konuşma ID gerekli' });
                return;
            }

            const conversationRoom = `conversation_${conversationId}`;
            socket.leave(conversationRoom);

            console.log(`👋 User ${socket.userId} konuşmadan ayrıldı: ${conversationRoom}`);

            socket.emit('conversation_left', {
                success: true,
                conversationId,
                room: conversationRoom
            });

        } catch (error) {
            console.error('Konuşmadan ayrılma hatası:', error);
            socket.emit('chat_error', { message: 'Konuşmadan ayrılamadı' });
        }
    }

    private async handleMarkMessagesRead(socket: AuthenticatedSocket, data: any) {
        try {
            const { conversationId } = data;

            if (!conversationId) {
                socket.emit('chat_error', { message: 'Konuşma ID gerekli' });
                return;
            }

            // Mesajları okundu olarak işaretle
            const result = await chatService.markConversationAsRead(conversationId, socket.userId!);

            if (!result.success) {
                socket.emit('chat_error', { message: result.error || 'Mesajlar okundu olarak işaretlenemedi' });
                return;
            }

            // Başarılı yanıt gönder
            socket.emit('messages_marked_read', {
                success: true,
                conversationId
            });

            // Konuşma odasındaki diğer kullanıcılara bildir
            const conversationRoom = `conversation_${conversationId}`;
            socket.to(conversationRoom).emit('messages_read_by_user', {
                userId: socket.userId,
                conversationId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Mesajları okundu işaretleme hatası:', error);
            socket.emit('chat_error', { message: 'Mesajlar okundu olarak işaretlenemedi' });
        }
    }

    private handleTypingStart(socket: AuthenticatedSocket, data: any) {
        try {
            const { conversationId, receiverId } = data;

            if (!conversationId) {
                socket.emit('chat_error', { message: 'Konuşma ID gerekli' });
                return;
            }

            console.log(`⌨️ User ${socket.userId} yazmaya başladı: ${conversationId}`);

            // Konuşma odasındaki diğer kullanıcılara bildir
            const conversationRoom = `conversation_${conversationId}`;
            socket.to(conversationRoom).emit('user_typing_start', {
                userId: socket.userId,
                conversationId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Yazma başlangıcı bildirme hatası:', error);
        }
    }

    private handleTypingStop(socket: AuthenticatedSocket, data: any) {
        try {
            const { conversationId, receiverId } = data;

            if (!conversationId) {
                socket.emit('chat_error', { message: 'Konuşma ID gerekli' });
                return;
            }

            console.log(`⏹️ User ${socket.userId} yazmayı bıraktı: ${conversationId}`);

            // Konuşma odasındaki diğer kullanıcılara bildir
            const conversationRoom = `conversation_${conversationId}`;
            socket.to(conversationRoom).emit('user_typing_stop', {
                userId: socket.userId,
                conversationId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Yazma bitiş bildirme hatası:', error);
        }
    }

    // Socket server'ı kapat
    public close() {
        this.io.close();
        console.log('🔴 Socket server kapatıldı');
    }
}

// Global socket service instance
export let socketService: SocketService;

// Socket service'i başlat
export const initializeSocket = (httpServer: HttpServer): SocketService => {
    socketService = new SocketService(httpServer);
    console.log('🚀 Socket.IO servisi başlatıldı');
    return socketService;
};

// Socket service'i al
export const getSocketService = (): SocketService => {
    if (!socketService) {
        throw new Error('Socket service henüz başlatılmadı. Önce initializeSocket() çağırın.');
    }
    return socketService;
}; 