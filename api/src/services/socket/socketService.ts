import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { AuthenticatedSocket } from './types';
import { socketAuthMiddleware } from './middleware';
import { SOCKET_EVENTS, SOCKET_ROOMS } from './constants';
import {
    ChatHandler,
    ListingHandler,
    UserHandler,
    ConnectionHandler
} from './handlers';

export class SocketService {
    private io: Server;
    private chatHandler: ChatHandler;
    private listingHandler: ListingHandler;
    private userHandler: UserHandler;
    private connectionHandler: ConnectionHandler;

    constructor(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: true, // Tüm origin'lere izin ver (daha agresif)
                methods: "*", // Tüm metodlara izin ver
                credentials: false,
                allowedHeaders: "*",
                optionsSuccessStatus: 200
            },
            transports: ['polling', 'websocket'], // polling'i önce koy
            allowEIO3: true,
            pingInterval: 25000
        });

        // Handler'ları başlat
        this.chatHandler = new ChatHandler(this.io);
        this.listingHandler = new ListingHandler(this.io);
        this.userHandler = new UserHandler(this.io);
        this.connectionHandler = new ConnectionHandler(this.io);

        this.setupAuthentication();
        this.setupEventHandlers();
    }

    private setupAuthentication() {
        this.io.use(socketAuthMiddleware);
    }

    private setupEventHandlers() {
        this.io.on(SOCKET_EVENTS.CONNECTION, (socket: AuthenticatedSocket) => {
            // Bağlantı işlemleri
            this.connectionHandler.handleConnection(socket);

            // Chat event'leri
            socket.on(SOCKET_EVENTS.SEND_CHAT_MESSAGE, (data) => {
                this.chatHandler.handleChatMessage(socket, data);
            });

            socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, (data) => {
                this.chatHandler.handleJoinConversation(socket, data);
            });

            socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (data) => {
                this.chatHandler.handleLeaveConversation(socket, data);
            });

            socket.on(SOCKET_EVENTS.MARK_MESSAGES_READ, (data) => {
                this.chatHandler.handleMarkMessagesRead(socket, data);
            });

            socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
                this.chatHandler.handleTypingStart(socket, data);
            });

            socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
                this.chatHandler.handleTypingStop(socket, data);
            });

            // İlan event'leri
            socket.on(SOCKET_EVENTS.LISTING_UPDATE, (data) => {
                this.listingHandler.handleListingUpdate(socket, data);
            });

            // Kullanıcı event'leri
            socket.on(SOCKET_EVENTS.USER_STATUS, (data) => {
                this.userHandler.handleUserStatus(socket, data);
            });

            socket.on(SOCKET_EVENTS.PING, () => {
                this.userHandler.handlePing(socket);
            });

            // Legacy event'ler (geriye dönük uyumluluk için)
            socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
                this.handleLegacyMessage(socket, data);
            });

            // Bağlantı kesilme ve hata yönetimi
            socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
                this.connectionHandler.handleDisconnect(socket, reason);
            });

            socket.on(SOCKET_EVENTS.ERROR, (error) => {
                this.connectionHandler.handleError(socket, error);
            });
        });
    }

    // Legacy mesaj handler'ı (eski sistem için)
    private handleLegacyMessage(socket: AuthenticatedSocket, data: any) {
        try {
            console.log('📩 Legacy mesaj alındı:', data);

            const messageData = {
                id: Date.now().toString(),
                userId: socket.userId,
                message: data.message,
                timestamp: new Date().toISOString(),
                type: data.type || 'general'
            };

            // Gönderici hariç tüm kullanıcılara gönder
            socket.broadcast.emit(SOCKET_EVENTS.NEW_MESSAGE, messageData);

            // Gönderene onay mesajı
            socket.emit(SOCKET_EVENTS.MESSAGE_SENT, {
                success: true,
                messageId: messageData.id,
                timestamp: messageData.timestamp
            });

        } catch (error) {
            console.error('Legacy mesaj işleme hatası:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Mesaj gönderilemedi' });
        }
    }

    // Public metodlar
    public sendToUser(userId: string, event: string, data: any) {
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

    public getConnectedUsersCount(): number {
        return this.io.sockets.sockets.size;
    }

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