# 🔌 Socket.IO Chat Sistemi - Detaylı Rehber

## 📋 İçindekiler
- [Genel Bakış](#genel-bakış)
- [Sistem Mimarisi](#sistem-mimarisi)
- [Socket Bağlantı Akışı](#socket-bağlantı-akışı)
- [Event Sistemi](#event-sistemi)
- [Okundu Bilgisi Sistemi](#okundu-bilgisi-sistemi)
- [Güvenlik](#güvenlik)
- [Test Senaryoları](#test-senaryoları)
- [Hata Yönetimi](#hata-yönetimi)

---

## 🎯 Genel Bakış

Bu sistem, **Node.js + Express + Socket.IO + Prisma** teknolojileri kullanılarak geliştirilmiş gerçek zamanlı chat uygulamasıdır. Kullanıcılar arasında anlık mesajlaşma, okundu bilgisi, yazma durumu gibi modern chat özelliklerini destekler.

### 🏗️ Teknoloji Stack'i
- **Backend**: Node.js + Express.js
- **Real-time**: Socket.IO
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: MinIO (S3-compatible)

---

## 🏛️ Sistem Mimarisi

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Socket.IO     │    │   Database      │
│                 │◄──►│   Server        │◄──►│   (PostgreSQL)  │
│  (Web/Mobile)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   JWT Auth      │    │   Event         │    │   Prisma        │
│   Middleware    │    │   Handlers      │    │   ORM           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 Dosya Yapısı
```
src/
├── services/
│   └── socket/
│       ├── socketService.ts          # Ana socket servisi
│       ├── handlers/
│       │   ├── connectionHandler.ts  # Bağlantı yönetimi
│       │   ├── chatHandler.ts        # Chat event'leri
│       │   ├── userHandler.ts        # Kullanıcı event'leri
│       │   └── listingHandler.ts     # İlan event'leri
│       ├── constants/
│       │   └── events.ts             # Event sabitleri
│       └── types.ts                  # TypeScript tipleri
├── controllers/
│   └── chatController.ts             # REST API controller
├── services/
│   └── chatService.ts                # Chat business logic
└── routes/
    └── chatRoutes.ts                 # REST API routes
```

---

## 🔄 Socket Bağlantı Akışı

### 1. **Kullanıcı Girişi**
```javascript
// 1. REST API ile login
const loginResponse = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'sockettest1',
        password: '123456'
    })
});

const { accessToken } = await loginResponse.json();
```

### 2. **Socket Bağlantısı**
```javascript
// 2. Socket.IO bağlantısı (JWT ile)
const socket = io('http://localhost:3000', {
    auth: { token: accessToken }
});
```

### 3. **Kimlik Doğrulama**
```typescript
// Backend: Socket middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        socket.userId = decoded.userId;
        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
});
```

### 4. **Room'a Katılma**
```typescript
// Kullanıcı kendi özel odasına katılır
const userRoom = `user_${socket.userId}`;
socket.join(userRoom);
```

---

## 📡 Event Sistemi

### 🔗 Bağlantı Event'leri
| Event | Açıklama | Veri |
|-------|----------|------|
| `connection` | Socket bağlandığında | - |
| `disconnect` | Socket bağlantısı kesildiğinde | `reason` |
| `connected` | Bağlantı başarılı bildirimi | `{ success, userId, timestamp }` |

### 💬 Chat Event'leri
| Event | Yön | Açıklama | Veri |
|-------|-----|----------|------|
| `send_chat_message` | Client → Server | Mesaj gönderme | `{ receiverId, content, messageType?, replyToId?, attachmentUrl? }` |
| `new_chat_message` | Server → Client | Yeni mesaj alındı | `{ message: Message }` |
| `message_sent` | Server → Client | Mesaj gönderildi onayı | `{ success, message }` |
| `chat_error` | Server → Client | Chat hatası | `{ message }` |

### 👁️ Okundu Bilgisi Event'leri
| Event | Yön | Açıklama | Veri |
|-------|-----|----------|------|
| `mark_messages_read` | Client → Server | Mesajları okundu işaretle | `{ conversationId }` |
| `messages_marked_read` | Server → Client | Okundu işaretlendi onayı | `{ success, conversationId }` |
| `messages_read_by_user` | Server → Client | Diğer kullanıcı okudu bildirimi | `{ userId, conversationId, timestamp }` |

### ⌨️ Yazma Durumu Event'leri
| Event | Yön | Açıklama | Veri |
|-------|-----|----------|------|
| `typing_start` | Client → Server | Yazmaya başladı | `{ conversationId, receiverId }` |
| `typing_stop` | Client → Server | Yazmayı bıraktı | `{ conversationId, receiverId }` |
| `user_typing_start` | Server → Client | Kullanıcı yazıyor | `{ userId, conversationId, timestamp }` |
| `user_typing_stop` | Server → Client | Kullanıcı yazmayı bıraktı | `{ userId, conversationId, timestamp }` |

---

## 👁️ Okundu Bilgisi Sistemi

### 🔄 Otomatik İşaretleme
```typescript
// Mesaj alındığında otomatik olarak okundu işaretlenir
socket.on('new_chat_message', (data) => {
    // Mesajı göster
    console.log('Yeni mesaj:', data.message.content);
    
    // 1 saniye sonra otomatik okundu işaretle
    setTimeout(() => {
        socket.emit('mark_messages_read', { 
            conversationId: data.message.conversationId 
        });
    }, 1000);
});
```

### 🖱️ Manuel İşaretleme
```typescript
// Kullanıcı manuel olarak okundu işaretleyebilir
function markAsRead(conversationId: string) {
    socket.emit('mark_messages_read', { conversationId });
}
```

### 📊 Veritabanı Güncellemesi
```sql
-- Mesajlar okundu olarak işaretlenir
UPDATE messages 
SET is_read = true, read_at = NOW() 
WHERE conversation_id = ? AND receiver_id = ? AND is_read = false;
```

---

## 🔒 Güvenlik

### 🛡️ Kimlik Doğrulama
- **JWT Token**: Her socket bağlantısı için JWT doğrulaması
- **Session Management**: Aktif session'lar takip edilir
- **Token Expiration**: Token'lar belirli süre sonra geçersiz olur

### 🚫 Engelleme Sistemi
```typescript
// Kullanıcılar birbirini engelleyebilir
const isBlocked = await chatService.checkIfBlocked(senderId, receiverId);
if (isBlocked) {
    socket.emit('chat_error', { message: 'Bu kullanıcıya mesaj gönderemezsiniz.' });
    return;
}
```

### 🔐 Room Güvenliği
- Her kullanıcı sadece kendi odasına mesaj alabilir
- Conversation odaları sadece ilgili kullanıcılar için açıktır
- Unauthorized erişim engellenir

---

## 🧪 Test Senaryoları

### 📱 İki Kullanıcılı Test
```bash
# Terminal 1: User1
node user1-socket.js

# Terminal 2: User2  
node user2-socket.js
```

### 🔄 Test Akışı
1. **Bağlantı Testi**: Her iki kullanıcı da başarıyla bağlanır
2. **Mesaj Gönderme**: User1 → User2 mesaj gönderir
3. **Mesaj Alma**: User2 mesajı alır ve otomatik okundu işaretlenir
4. **Okundu Bildirimi**: User1, User2'nin mesajını okuduğunu görür
5. **Yazma Durumu**: User2 yazmaya başladığında User1'e bildirim gider

### 📊 Beklenen Sonuçlar
```
User1: 🔌 Socket bağlandı
User1: 💬 Mesaj gönderildi
User2: 💬 Yeni mesaj alındı
User2: 📖 Otomatik okundu işaretlendi
User1: 👁️ User2 mesajınızı okudu
```

---

## ⚠️ Hata Yönetimi

### 🔍 Yaygın Hatalar
| Hata | Sebep | Çözüm |
|------|-------|-------|
| `ECONNREFUSED` | Backend çalışmıyor | `npm run dev` ile backend'i başlat |
| `Authentication failed` | JWT token geçersiz | Yeniden login ol |
| `Foreign key constraint` | Kullanıcı ID'si yanlış | Doğru kullanıcı ID'lerini kullan |
| `Room not found` | Conversation ID yanlış | Gerçek conversation ID'sini kullan |

### 🛠️ Debug Modu
```typescript
// Tüm event'leri logla
const originalEmit = socket.emit;
socket.emit = function(event, ...args) {
    console.log('🔍 Debug - Emitting:', event, args);
    return originalEmit.apply(this, [event, ...args]);
};
```

---

## 🚀 Performans Optimizasyonları

### ⚡ Socket.IO Ayarları
```typescript
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});
```

### 📦 Mesaj Batching
- Çoklu mesaj gönderimi için batch işlemi
- Database transaction'ları optimize edildi
- Index'ler performans için eklendi

### 🔄 Connection Pooling
- Prisma connection pool ayarları
- Socket bağlantı limitleri
- Memory leak önleme

---

## 📈 Monitoring ve Logging

### 📊 Metrikler
- Aktif socket bağlantı sayısı
- Mesaj gönderim/alım oranları
- Hata oranları
- Response time'lar

### 📝 Logging
```typescript
// Structured logging
console.log(`📤 ${event} gönderildi -> User ${userId}`);
console.log(`💬 Chat mesajı alındı:`, data);
console.log(`❌ Kullanıcı ${userId} bağlantısı kesildi: ${reason}`);
```

---

## 🔮 Gelecek Özellikler

### 🎯 Planlanan Geliştirmeler
- [ ] **Voice Messages**: Ses mesajı desteği
- [ ] **File Sharing**: Dosya paylaşımı
- [ ] **Group Chats**: Grup sohbetleri
- [ ] **Message Reactions**: Mesaj tepkileri
- [ ] **Message Search**: Mesaj arama
- [ ] **Message Encryption**: End-to-end şifreleme
- [ ] **Push Notifications**: Push bildirimleri
- [ ] **Message Scheduling**: Mesaj zamanlama

### 🔧 Teknik İyileştirmeler
- [ ] **Redis Integration**: Socket session'ları için Redis
- [ ] **Load Balancing**: Çoklu server desteği
- [ ] **Message Queuing**: RabbitMQ/Kafka entegrasyonu
- [ ] **WebRTC**: Peer-to-peer bağlantılar
- [ ] **Service Workers**: Offline mesaj desteği

---

## 📚 Kaynaklar

### 🔗 Dokümantasyon
- [Socket.IO Documentation](https://socket.io/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [JWT.io](https://jwt.io/)

### 📖 Kod Örnekleri
- [user1-socket.js](./user1-socket.js) - User1 test client'ı
- [user2-socket.js](./user2-socket.js) - User2 test client'ı
- [simple-socket-test.sh](./simple-socket-test.sh) - Basit test script'i

---

## 🤝 Katkıda Bulunma

Bu projeye katkıda bulunmak için:

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](./LICENSE) dosyasına bakın.

---

**🎉 Socket.IO Chat Sistemi başarıyla çalışıyor!**

*Son güncelleme: 20 Temmuz 2025* 