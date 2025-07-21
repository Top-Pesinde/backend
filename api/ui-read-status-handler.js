// UI'da Okundu Durumu Gösterme - Tam Rehber

class ChatUIReadStatusHandler {
    constructor(socket, userId) {
        this.socket = socket;
        this.userId = userId;
        this.setupReadStatusListeners();
    }

    setupReadStatusListeners() {
        // 🎯 EN ÖNEMLİ: Karşı taraf mesajları okuduğunda
        this.socket.on('messages_read_by_user', (data) => {
            console.log('👁️ Karşı taraf mesajları okudu:', data);
            
            // UI'da tüm mesajları "okundu" olarak işaretle
            this.updateAllMessagesAsRead(data.conversationId, data.timestamp);
            
            // Bildirim göster
            this.showReadNotification(data);
        });

        // Kullanıcı odaya katıldığında (otomatik okundu)
        this.socket.on('user_joined_conversation', (data) => {
            console.log('👥 Kullanıcı odaya katıldı:', data.userId);
            // Bu durumda da mesajlar otomatik okundu olur
        });

        // Mesaj gönderildiğinde başlangıç durumu
        this.socket.on('message_sent_success', (data) => {
            const messageId = data.message.id;
            // Başlangıçta tek tik göster
            this.updateMessageStatus(messageId, 'sent');
        });
    }

    // Tüm mesajları okundu olarak işaretle
    updateAllMessagesAsRead(conversationId, readTimestamp) {
        console.log('🔄 UI Güncelleniyor: Tüm mesajlar okundu olarak işaretleniyor');
        
        // Konuşmadaki tüm gönderdiğin mesajları bul
        const messageElements = document.querySelectorAll(
            `[data-conversation-id="${conversationId}"][data-sender-id="${this.userId}"]`
        );

        messageElements.forEach(messageElement => {
            const messageId = messageElement.dataset.messageId;
            this.updateMessageStatus(messageId, 'read', readTimestamp);
        });

        // Konuşma listesindeki okundu durumunu güncelle
        this.updateConversationReadStatus(conversationId);
    }

    // Tek mesajın durumunu güncelle
    updateMessageStatus(messageId, status, timestamp = null) {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (!messageElement) return;

        const statusElement = messageElement.querySelector('.message-status');
        if (!statusElement) return;

        switch (status) {
            case 'sent':
                statusElement.innerHTML = '✓';
                statusElement.className = 'message-status sent';
                statusElement.style.color = '#gray';
                statusElement.title = 'Gönderildi';
                break;
                
            case 'delivered':
                statusElement.innerHTML = '✓✓';
                statusElement.className = 'message-status delivered';
                statusElement.style.color = '#gray';
                statusElement.title = 'İletildi';
                break;
                
            case 'read':
                statusElement.innerHTML = '✓✓';
                statusElement.className = 'message-status read';
                statusElement.style.color = '#4fc3f7'; // Mavi renk
                statusElement.title = timestamp 
                    ? `Okundu: ${new Date(timestamp).toLocaleString()}`
                    : 'Okundu';
                
                // Animasyon ekle
                statusElement.classList.add('read-animation');
                setTimeout(() => {
                    statusElement.classList.remove('read-animation');
                }, 1000);
                break;
        }

        console.log(`✅ Mesaj ${messageId} durumu güncellendi: ${status}`);
    }

    // Konuşma listesindeki okundu durumunu güncelle
    updateConversationReadStatus(conversationId) {
        const conversationElement = document.querySelector(
            `[data-conversation-id="${conversationId}"]`
        );
        
        if (conversationElement) {
            const unreadBadge = conversationElement.querySelector('.unread-badge');
            if (unreadBadge) {
                unreadBadge.style.display = 'none';
            }
            
            // Son mesaj durumunu güncelle
            const lastMessageStatus = conversationElement.querySelector('.last-message-status');
            if (lastMessageStatus) {
                lastMessageStatus.innerHTML = '✓✓';
                lastMessageStatus.style.color = '#4fc3f7';
            }
        }
    }

    // Okundu bildirimi göster
    showReadNotification(data) {
        // Toast notification
        this.showToast('Mesajınız okundu! 👁️', 'success');
        
        // Browser notification (eğer izin varsa)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Mesajınız Okundu! 👁️', {
                body: 'Gönderdiğiniz mesaj karşı taraf tarafından okundu',
                icon: '/assets/read-icon.png',
                tag: `read-${data.conversationId}`,
                requireInteraction: false
            });
        }

        // Ses çal (opsiyonel)
        this.playReadSound();
    }

    // Toast bildirimi göster
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${type === 'success' ? '✅' : 'ℹ️'}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        // Toast container'a ekle
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        toastContainer.appendChild(toast);
        
        // Animasyon
        setTimeout(() => toast.classList.add('show'), 100);
        
        // 3 saniye sonra kaldır
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Okundu sesi çal
    playReadSound() {
        try {
            const audio = new Audio('/assets/sounds/message-read.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Ses çalınamadı:', e));
        } catch (error) {
            console.log('Ses dosyası bulunamadı');
        }
    }

    // Mesaj HTML'i oluştururken status alanını ekle
    createMessageHTML(message, isOwn = false) {
        return `
            <div class="message ${isOwn ? 'own' : 'other'}" 
                 id="message-${message.id}"
                 data-message-id="${message.id}"
                 data-conversation-id="${message.conversationId}"
                 data-sender-id="${message.senderId}">
                
                <div class="message-content">
                    <p>${message.content}</p>
                </div>
                
                <div class="message-info">
                    <span class="message-time">
                        ${new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                    
                    ${isOwn ? `
                        <span class="message-status sent" title="Gönderildi">
                            ✓
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// CSS Stilleri
const readStatusCSS = `
<style>
.message-status {
    font-size: 12px;
    margin-left: 5px;
    transition: all 0.3s ease;
}

.message-status.sent {
    color: #999;
}

.message-status.delivered {
    color: #999;
}

.message-status.read {
    color: #4fc3f7 !important;
    font-weight: bold;
}

.message-status.read-animation {
    animation: readPulse 1s ease-in-out;
}

@keyframes readPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
}

.toast {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    margin-bottom: 10px;
    padding: 12px 16px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    min-width: 250px;
}

.toast.show {
    transform: translateX(0);
}

.toast-success {
    border-left: 4px solid #4caf50;
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.toast-icon {
    font-size: 16px;
}

.toast-message {
    font-size: 14px;
    color: #333;
}
</style>
`;

// HTML head'e CSS'i ekle
document.head.insertAdjacentHTML('beforeend', readStatusCSS);

// Kullanım örneği
function initializeChatUI(socket, userId) {
    // Read status handler'ı başlat
    const readStatusHandler = new ChatUIReadStatusHandler(socket, userId);
    
    // Mesaj gönderme fonksiyonu
    window.sendMessage = function(receiverId, content) {
        socket.emit('send_chat_message', {
            receiverId,
            content,
            messageType: 'TEXT'
        });
    };
    
    // Yeni mesaj geldiğinde UI'a ekle
    socket.on('new_chat_message', (data) => {
        const messageHTML = readStatusHandler.createMessageHTML(data.message, false);
        document.querySelector('.chat-messages').insertAdjacentHTML('beforeend', messageHTML);
        
        // Otomatik scroll
        const chatContainer = document.querySelector('.chat-messages');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
    
    // Mesaj gönderildiğinde UI'a ekle
    socket.on('message_sent_success', (data) => {
        const messageHTML = readStatusHandler.createMessageHTML(data.message, true);
        document.querySelector('.chat-messages').insertAdjacentHTML('beforeend', messageHTML);
        
        // Otomatik scroll
        const chatContainer = document.querySelector('.chat-messages');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    });
    
    return readStatusHandler;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChatUIReadStatusHandler, initializeChatUI };
}