import { Server } from 'socket.io';
import { AuthenticatedSocket, UserStatusData } from '../types';
import { SOCKET_EVENTS } from '../constants';

export class UserHandler {
    constructor(private io: Server) {}

    handleUserStatus(socket: AuthenticatedSocket, data: UserStatusData) {
        try {
            const statusData = {
                userId: socket.userId,
                status: data.status,
                timestamp: new Date().toISOString()
            };

            // Diğer kullanıcılara durum güncellemesini gönder
            socket.broadcast.emit(SOCKET_EVENTS.USER_STATUS_UPDATE, statusData);

        } catch (error) {
            console.error('Kullanıcı durumu hatası:', error);
        }
    }

    handlePing(socket: AuthenticatedSocket) {
        console.log('🏓 pong');
        socket.emit(SOCKET_EVENTS.PONG, {
            timestamp: new Date().toISOString(),
            userId: socket.userId
        });
    }
}