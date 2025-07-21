import { Socket } from 'socket.io';
import { MessageType } from '@prisma/client';

// Socket ile ilgili tip tanımları
export interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}

export interface SocketEventData {
    [key: string]: any;
}

export interface ChatMessageData {
    receiverId: string;
    content: string;
    messageType?: MessageType;
    replyToId?: string;
    attachmentUrl?: string;
}

export interface ConversationData {
    conversationId: string;
}

export interface TypingData {
    conversationId: string;
    receiverId: string;
}

export interface ListingUpdateData {
    type: 'field' | 'goalkeeper' | 'referee';
    listingId: string;
    action: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
    data?: any;
}

export interface UserStatusData {
    status: 'online' | 'away' | 'busy';
}

export interface SocketResponse {
    success: boolean;
    message?: string;
    data?: any;
    timestamp: string;
}

export interface SocketError {
    message: string;
    code?: string;
    timestamp: string;
}