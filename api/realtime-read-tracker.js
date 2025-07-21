const io = require('socket.io-client');

class RealtimeReadTracker {
    constructor(token, userId) {
        this.socket = io('http://localhost:3000', {
            auth: { token }
        });
        this.userId = userId;
        this.setupEventListeners();
        this.messageReadCallbacks = new Map(); // messageId -> callback
    }

    setupEventListeners() {
        // Bağlantı kurulduğunda
        this.socket.on('connect', () => {
            console.log('🔌 Gerçek zamanlı okundu takibi aktif');
        });

        // Mesaj gönderildiğinde takip et
        this.socket.on('message_sent_success', (data) => {
            const messageId = data.message.id;
            console.log(`📤 Mesaj gönderildi (ID: ${messageId})`);
            
            // Bu mesaj için okundu callback'i ayarla
            this.trackMessageRead(messageId, (readData) => {
                console.log(`✅ Mesajınız okundu! (ID: ${messageId})`);
                console.log(`👁️ Okunma zamanı: ${readData.timestamp}`);
                
                // UI güncelleme
                this.updateMessageUI(messageId, 'read');
            });
        });

        // Karşı taraf mesaj okuduğunda
        this.socket.on('messages_read_by_user', (data) => {
            console.log('🎯 ANLIK OKUNDU BİLDİRİMİ!');
            console.log('📊 Detaylar:', {
                userId: data.userId,
                conversationId: data.conversationId,
                timestamp: data.timestamp,
                unreadCount: data.unreadCount
            });

            // Tüm mesajlar için callback'leri tetikle
            this.triggerReadCallbacks(data.conversationId, data);
            
            // Bildirim göster
            this.showReadNotification(data);
        });

        // Unread count güncellemesi
        this.socket.on('unread_count_updated', (data) => {
            console.log('📊 Okunmamış mesaj sayısı güncellendi:', data.unreadCount);
            this.updateUnreadBadge(data.conversationId, data.unreadCount);
        });
    }

    // Mesaj gönder ve okundu takibini başlat
    sendMessageWithReadTracking(receiverId, content, onRead) {
        return new Promise((resolve, reject) => {
            // Mesajı gönder
            this.socket.emit('send_chat_message', {
                receiverId,
                content,
                messageType: 'TEXT'
            });

            // Gönderim başarılı olduğunda
            this.socket.once('message_sent_success', (data) => {
                const messageId = data.message.id;
                
                // Okundu callback'ini kaydet
                if (onRead) {
                    this.messageReadCallbacks.set(messageId, onRead);
                }
                
                resolve(data.message);
            });

            // Hata durumunda
            this.socket.once('message_send_error', (error) => {
                reject(error);
            });
        });
    }

    // Mesaj okundu takibi
    trackMessageRead(messageId, callback) {
        this.messageReadCallbacks.set(messageId, callback);
    }

    // Okundu callback'lerini tetikle
    triggerReadCallbacks(conversationId, readData) {
        this.messageReadCallbacks.forEach((callback, messageId) => {
            // Bu konuşmadaki tüm mesajlar okundu
            callback(readData);
        });
        
        // Callback'leri temizle
        this.messageReadCallbacks.clear();
    }

    // UI güncelleme fonksiyonları
    updateMessageUI(messageId, status) {
        console.log(`🎨 UI Güncelleme: Mesaj ${messageId} -> ${status}`);
        // Burada gerçek UI güncellemesi yapılır
        // Örnek: mesajın yanına mavi tik ekle
    }

    updateUnreadBadge(conversationId, count) {
        console.log(`🔢 Badge Güncelleme: ${conversationId} -> ${count} okunmamış`);
        // Burada unread badge güncellenir
    }

    showReadNotification(data) {
        console.log('🔔 PUSH BİLDİRİM: Mesajlarınız okundu!');
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Mesajınız Okundu! 👁️', {
                body: `Gönderdiğiniz mesaj okundu`,
                icon: '/icon-read.png',
                tag: `read-${data.conversationId}`
            });
        }
    }

    // Konuşmaya katıl (otomatik okundu için)
    joinConversation(conversationId) {
        this.socket.emit('join_conversation', { conversationId });
        
        // Konuşmaya katıldığında
        this.socket.once('conversation_joined', (data) => {
            console.log('👥 Konuşmaya katıldınız:', data.conversationId);
        });
    }

    // Bağlantıyı kapat
    disconnect() {
        this.socket.disconnect();
    }
}

// Kullanım örneği
async function demonstrateRealtimeReadTracking() {
    console.log('🚀 Gerçek Zamanlı Okundu Takibi Demo');
    
    // Login yap
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'sockettest1',
            password: '123456'
        })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data.accessToken;
    const userId = loginData.data.user.id;
    
    // Tracker'ı başlat
    const tracker = new RealtimeReadTracker(token, userId);
    
    // Konuşmaya katıl
    const conversationId = 'cmdc5v9w9000bo165nvptez6z';
    tracker.joinConversation(conversationId);
    
    // Mesaj gönder ve okundu takibi yap
    try {
        const message = await tracker.sendMessageWithReadTracking(
            'cmdc5or7q0002o1jwmldqzulb', // User2 ID
            'Bu mesajın okunup okunmadığını takip ediyorum! 👀',
            (readData) => {
                console.log('🎉 CALLBACK TETİKLENDİ!');
                console.log('✅ Mesajım okundu:', readData.timestamp);
            }
        );
        
        console.log('📤 Mesaj gönderildi:', message.content);
        console.log('⏳ Okunmasını bekliyorum...');
        
    } catch (error) {
        console.error('❌ Mesaj gönderme hatası:', error);
    }
}

// Export et
module.exports = { RealtimeReadTracker, demonstrateRealtimeReadTracking };

// Eğer direkt çalıştırılıyorsa demo'yu başlat
if (require.main === module) {
    demonstrateRealtimeReadTracking().catch(console.error);
}