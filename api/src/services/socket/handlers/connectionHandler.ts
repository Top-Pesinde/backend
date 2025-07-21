import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants';

export class ConnectionHandler {
    constructor(private io: Server) {}

    handleConnection(socket: AuthenticatedSocket) {
        console.log(`✅ Kullanıcı socket'e bağlandı: ${socket.userId}`);

        // Kullanıcıyı kendi özel odasına ekle
        const userRoom = SOCKET_ROOMS.USER(socket.userId!);
        socket.join(userRoom);
        console.log(`📍 Kullanıcı ${socket.userId} odası: ${userRoom}`);

        // Bağlantı başarılı mesajı gönder
        socket.emit(SOCKET_EVENTS.CONNECTED, {
            success: true,
            message: 'Socket bağlantısı başarılı',
            userId: socket.userId,
            timestamp: new Date().toISOString()
        });
    }

    handleDisconnect(socket: AuthenticatedSocket, reason: string) {
        console.log(`❌ Kullanıcı ${socket.userId} bağlantısı kesildi: ${reason}`);
    }

    handleError(socket: AuthenticatedSocket, error: Error) {
        console.error(`Socket hatası (User ${socket.userId}):`, error);
    }
}