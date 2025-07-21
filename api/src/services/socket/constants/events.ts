// Socket event isimleri için sabitler
export const SOCKET_EVENTS = {
    // Bağlantı event'leri
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    CONNECTED: 'connected',
    ERROR: 'error',

    // Chat event'leri
    SEND_CHAT_MESSAGE: 'send_chat_message',
    NEW_CHAT_MESSAGE: 'new_chat_message',
    MESSAGE_SENT: 'message_sent',
    CHAT_ERROR: 'chat_error',
    
    // Konuşma event'leri
    JOIN_CONVERSATION: 'join_conversation',
    LEAVE_CONVERSATION: 'leave_conversation',
    CONVERSATION_JOINED: 'conversation_joined',
    CONVERSATION_LEFT: 'conversation_left',
    
    // Mesaj okuma event'leri
    MARK_MESSAGES_READ: 'mark_messages_read',
    MESSAGES_MARKED_READ: 'messages_marked_read',
    MESSAGES_READ_BY_USER: 'messages_read_by_user',
    
    // Yazma durumu event'leri
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    USER_TYPING_START: 'user_typing_start',
    USER_TYPING_STOP: 'user_typing_stop',
    
    // İlan event'leri
    LISTING_UPDATE: 'listing_update',
    LISTING_UPDATED: 'listing_updated',
    
    // Kullanıcı event'leri
    USER_STATUS: 'user_status',
    USER_STATUS_UPDATE: 'user_status_update',
    PING: 'ping',
    PONG: 'pong',
    
    // Legacy event'ler
    SEND_MESSAGE: 'send_message',
    NEW_MESSAGE: 'new_message',
    
    // Bildirim event'leri
    PUSH_NOTIFICATION: 'push_notification',
    MESSAGE_NOTIFICATION: 'message_notification',
    UNREAD_MESSAGE_NOTIFICATION: 'unread_message_notification'
} as const;

// Room isimleri için sabitler
export const SOCKET_ROOMS = {
    USER: (userId: string) => `user_${userId}`,
    CONVERSATION: (conversationId: string) => `conversation_${conversationId}`,
    LISTING: (listingType: string) => `listing_${listingType}`,
    GENERAL: 'general'
} as const;