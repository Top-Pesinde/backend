# Socket.IO İstemci Entegrasyon Rehberi

Bu rehber, Monepero uygulamasının Socket.IO tabanlı gerçek zamanlı özelliklerini istemci tarafında nasıl kullanacağınızı açıklar.

## Bağlantı Kurma

```javascript
import { io } from 'socket.io-client';

// JWT token'ınızı alın (login işleminden sonra)
const token = 'your-jwt-token';

// Socket.IO bağlantısını başlat
const socket = io('https://api.monepero.com', {
  auth: {
    token: token
  },
  transports: ['websocket']
});

// Bağlantı olaylarını dinle
socket.on('connect', () => {
  console.log('Socket.IO bağlantısı kuruldu!');
});

socket.on('connect_error', (error) => {
  console.error('Socket.IO bağlantı hatası:', error.message);
});
```

## Sohbet Odalarına Katılma ve Ayrılma

```javascript
// Bir konuşmaya katılma
function joinConversation(conversationId) {
  socket.emit('join_conversation', { conversationId });
}

// Konuşmaya katılma başarılı olduğunda
socket.on('conversation_joined', (data) => {
  console.log(`Konuşmaya katıldınız: ${data.conversationId}`);
  // UI'ı güncelle, mesajları yükle, vb.
});

// Bir kullanıcı konuşmaya katıldığında (yeni eklenen özellik)
socket.on('user_joined_conversation', (data) => {
  console.log(`Kullanıcı konuşmaya katıldı: ${data.userId}`);
  // UI'ı güncelle, kullanıcının çevrimiçi olduğunu göster
  // Bu kullanıcı artık mesajları gerçek zamanlı olarak görebilir
});

// Bir konuşmadan ayrılma
function leaveConversation(conversationId) {
  socket.emit('leave_conversation', { conversationId });
}

// Konuşmadan ayrılma başarılı olduğunda
socket.on('conversation_left', (data) => {
  console.log(`Konuşmadan ayrıldınız: ${data.conversationId}`);
});

// Bir kullanıcı konuşmadan ayrıldığında (yeni eklenen özellik)
socket.on('user_left_conversation', (data) => {
  console.log(`Kullanıcı konuşmadan ayrıldı: ${data.userId}`);
  // UI'ı güncelle, kullanıcının çevrimdışı olduğunu göster
});
```

## Mesaj Gönderme ve Alma

```javascript
// Mesaj gönderme
function sendMessage(receiverId, content, messageType = 'TEXT', replyToId = null, attachmentUrl = null) {
  socket.emit('send_chat_message', {
    receiverId,
    content,
    messageType,
    replyToId,
    attachmentUrl
  });
}

// Mesaj gönderildiğinde (gönderene bildirilir)
socket.on('message_sent', (data) => {
  console.log('Mesaj gönderildi:', data.message);
  // UI'da mesajın gönderildiğini göster (tek tik ✓)
});

// Mesaj alıcıya ulaştığında (gönderene bildirilir)
socket.on('message_delivered', (data) => {
  console.log('Mesaj iletildi:', data.messageId);
  // UI'da mesajın iletildiğini göster (çift tik ✓✓)
});

// Yeni mesaj alındığında
socket.on('new_chat_message', (data) => {
  console.log('Yeni mesaj alındı:', data.message);
  // UI'a yeni mesajı ekle
});
```

## Mesaj Okundu Bildirimleri (Gerçek Zamanlı)

```javascript
// Mesajları okundu olarak işaretleme
function markMessagesAsRead(conversationId) {
  socket.emit('mark_messages_read', { conversationId });
}

// Mesajlar okundu olarak işaretlendiğinde (işlemi yapan kullanıcıya bildirilir)
socket.on('messages_marked_read', (data) => {
  console.log('Mesajlar okundu olarak işaretlendi:', data);
  // UI'ı güncelle, mesajları okundu olarak göster
});

// Bir kullanıcı mesajları okuduğunda (diğer kullanıcılara bildirilir)
socket.on('messages_read_by_user', (data) => {
  console.log(`Kullanıcı mesajları okudu: ${data.userId}`, data);
  // UI'da mesajların okunduğunu göster (mavi tik ✓✓)
  // data.messageIds içindeki tüm mesajları okundu olarak işaretle
});

// Tek bir mesaj okunduğunda (yeni eklenen özellik)
socket.on('message_read', (data) => {
  console.log(`Mesaj okundu: ${data.messageId}`);
  // UI'da belirli bir mesajın okunduğunu göster
});
```

## Yazıyor Bildirimleri

```javascript
// Kullanıcı yazmaya başladığında
function startTyping(conversationId) {
  socket.emit('typing_start', { conversationId });
}

// Kullanıcı yazmayı bıraktığında
function stopTyping(conversationId) {
  socket.emit('typing_stop', { conversationId });
}

// Bir kullanıcı yazmaya başladığında
socket.on('user_typing_start', (data) => {
  console.log(`Kullanıcı yazmaya başladı: ${data.userId}`);
  // UI'da "... yazıyor" göster
});

// Bir kullanıcı yazmayı bıraktığında
socket.on('user_typing_stop', (data) => {
  console.log(`Kullanıcı yazmayı bıraktı: ${data.userId}`);
  // UI'dan "... yazıyor" bildirimini kaldır
});
```

## Hata Yönetimi

```javascript
// Sohbet hatalarını dinle
socket.on('chat_error', (error) => {
  console.error('Sohbet hatası:', error.message);
  // Kullanıcıya hata mesajını göster
});

// Genel socket hatalarını dinle
socket.on('error', (error) => {
  console.error('Socket hatası:', error);
});
```

## Bağlantıyı Kapatma

```javascript
// Bağlantıyı kapat (örneğin, logout olduğunda)
function disconnect() {
  socket.disconnect();
}
```

## Gerçek Zamanlı Mesaj Okundu Özelliği Kullanımı

Yeni eklenen gerçek zamanlı mesaj okundu özelliği, kullanıcılar aynı sohbet odasında olduğunda mesajların otomatik olarak okundu olarak işaretlenmesini sağlar.

### Nasıl Çalışır?

1. Bir kullanıcı `join_conversation` ile bir sohbet odasına katıldığında, diğer kullanıcılara `user_joined_conversation` olayı ile bildirilir.
2. Kullanıcı odaya katıldığında, otomatik olarak tüm okunmamış mesajlar okundu olarak işaretlenir.
3. Kullanıcı odadayken yeni bir mesaj aldığında, mesaj otomatik olarak okundu olarak işaretlenir ve gönderene `message_read` olayı ile bildirilir.
4. Kullanıcı `leave_conversation` ile odadan ayrıldığında, diğer kullanıcılara `user_left_conversation` olayı ile bildirilir.

### Örnek Kullanım

```javascript
// Kullanıcı arayüzünde mesaj okundu durumunu gösterme
function updateMessageReadStatus(messageId, isRead, readAt) {
  const messageElement = document.getElementById(`message-${messageId}`);
  if (messageElement) {
    // Mesaj okundu işaretini güncelle
    const readStatusElement = messageElement.querySelector('.read-status');
    if (readStatusElement) {
      readStatusElement.innerHTML = isRead ? '✓✓' : '✓';
      readStatusElement.style.color = isRead ? 'blue' : 'gray';
      
      if (isRead && readAt) {
        readStatusElement.title = `Okundu: ${new Date(readAt).toLocaleString()}`;
      }
    }
  }
}

// Mesaj okundu olayını dinle
socket.on('message_read', (data) => {
  updateMessageReadStatus(data.messageId, true, data.readAt);
});

// Toplu mesaj okundu olayını dinle
socket.on('messages_read_by_user', (data) => {
  data.messageIds.forEach(messageId => {
    updateMessageReadStatus(messageId, true, data.readAt);
  });
});
```

Bu rehber, Monepero uygulamasının Socket.IO tabanlı gerçek zamanlı özelliklerini istemci tarafında nasıl kullanacağınızı gösterir. Herhangi bir sorunuz veya öneriniz varsa, lütfen geliştirici ekibiyle iletişime geçin.