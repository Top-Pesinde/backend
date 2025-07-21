import { Server } from 'socket.io';
import { AuthenticatedSocket, ListingUpdateData } from '../types';
import { SOCKET_EVENTS } from '../constants';

export class ListingHandler {
    constructor(private io: Server) {}

    handleListingUpdate(socket: AuthenticatedSocket, data: ListingUpdateData) {
        try {
            console.log('📋 İlan güncellemesi:', data);

            const updateData = {
                type: data.type,
                listingId: data.listingId,
                action: data.action,
                userId: socket.userId,
                timestamp: new Date().toISOString(),
                data: data.data || null
            };

            // Tüm kullanıcılara güncelleyi broadcast et
            this.io.emit(SOCKET_EVENTS.LISTING_UPDATED, updateData);

        } catch (error) {
            console.error('İlan güncelleme hatası:', error);
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'İlan güncellemesi başarısız' });
        }
    }
}