import { getSocketService } from '../socketService';

/**
 * Socket event'lerini kolayca göndermek için yardımcı sınıf
 */
export class SocketEventEmitter {
    
    /**
     * Belirli bir kullanıcıya mesaj gönder
     */
    static sendToUser(userId: string, event: string, data: any) {
        try {
            const socketService = getSocketService();
            socketService.sendToUser(userId, event, data);
        } catch (error) {
            console.error('Socket event gönderme hatası:', error);
        }
    }

    /**
     * Tüm kullanıcılara broadcast gönder
     */
    static broadcast(event: string, data: any) {
        try {
            const socketService = getSocketService();
            socketService.broadcast(event, data);
        } catch (error) {
            console.error('Socket broadcast hatası:', error);
        }
    }

    /**
     * Belirli bir odaya mesaj gönder
     */
    static sendToRoom(room: string, event: string, data: any) {
        try {
            const socketService = getSocketService();
            socketService.sendToRoom(room, event, data);
        } catch (error) {
            console.error('Socket room mesaj hatası:', error);
        }
    }

    /**
     * Chat mesajı bildirimi gönder
     */
    static notifyNewChatMessage(receiverId: string, message: any) {
        this.sendToUser(receiverId, 'new_chat_message', { message });
    }

    /**
     * İlan güncellemesi bildirimi gönder
     */
    static notifyListingUpdate(updateData: any) {
        this.broadcast('listing_updated', updateData);
    }

    /**
     * Kullanıcı durumu güncellemesi gönder
     */
    static notifyUserStatusUpdate(userId: string, status: string) {
        this.broadcast('user_status_update', {
            userId,
            status,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Push notification gönder
     */
    static sendPushNotification(userId: string, notification: any) {
        this.sendToUser(userId, 'push_notification', notification);
    }
}