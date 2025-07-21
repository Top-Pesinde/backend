import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { AuthenticatedSocket } from '../types';

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            console.log('Socket bağlantısı - token bulunamadı');
            return next(new Error('Authentication token gerekli'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        (socket as AuthenticatedSocket).userId = decoded.userId;
        (socket as AuthenticatedSocket).user = decoded;

        console.log(`Socket kimlik doğrulaması başarılı: User ${decoded.userId}`);
        next();
    } catch (error) {
        console.error('Socket kimlik doğrulama hatası:', error);
        next(new Error('Geçersiz authentication token'));
    }
};