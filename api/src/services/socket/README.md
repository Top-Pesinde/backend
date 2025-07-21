# Socket Service Yapısı

Bu klasör, uygulamanın Socket.IO tabanlı gerçek zamanlı iletişim sistemini içerir. Modüler ve organize bir yapıda tasarlanmıştır.

## Klasör Yapısı

```
src/services/socket/
├── index.ts                 # Ana export dosyası
├── socketService.ts         # Ana socket servisi
├── types.ts                 # TypeScript tip tanımları
├── constants/
│   ├── index.ts
│   └── events.ts           # Socket event isimleri ve room sabitleri
├── middleware/
│   ├── index.ts
│   └── authMiddleware.ts   # Socket kimlik doğrulama
├── handlers/
│   ├── index.ts
│   ├── chatHandler.ts      # Chat mesajları
│   ├── listingHandler.ts   # İlan güncellemeleri
│   ├── userHandler.ts      # Kullanıcı durumu ve ping/pong
│   └── connectionHandler.ts # Bağlantı yönetimi
└── utils/
    ├── index.ts
    └── eventEmitter.ts     # Socket event'lerini kolayca göndermek için
```

## Kullanım

### Socket Servisini Başlatma

```typescript
import { initializeSocket } from './services/socket';

const httpServer = http.createServer(app);
const socketService = initializeSocket(httpServer);
```

### Socket Event'leri Gönderme

```typescript
import { SocketEventEmitter } from './services/socket';

// Belirli kullanıcıya mesaj gönder
SocketEventEmitter.sendToUser('userId123', 'new_notification', { message: 'Yeni bildirim' });

// Tüm kullanıcılara broadcast
SocketEventEmitter.broadcast('system_announcement', { message: 'Sistem duyurusu' });

// Chat mesajı bildirimi
SocketEventEmitter.notifyNewChatMessage('receiverId', messageData);
```

### Socket Event Sabitleri

```typescript
import { SOCKET_EVENTS, SOCKET_ROOMS } from './services/socket';

// Event isimleri
socket.emit(SOCKET_EVENTS.SEND_CHAT_MESSAGE, data);
socket.on(SOCKET_EVENTS.NEW_CHAT_MESSAGE, handler);

// Room isimleri
const userRoom = SOCKET_ROOMS.USER(userId);
const conversationRoom = SOCKET_ROOMS.CONVERSATION(conversationId);
```

## Desteklenen Event'ler

### Chat Event'leri
- `send_chat_message` - Chat mesajı gönder
- `new_chat_message` - Yeni chat mesajı alındı
- `join_conversation` - Konuşmaya katıl
- `leave_conversation` - Konuşmadan ayrıl
- `mark_messages_read` - Mesajları okundu işaretle
- `typing_start` - Yazma başladı
- `typing_stop` - Yazma durdu

### İlan Event'leri
- `listing_update` - İlan güncellemesi gönder
- `listing_updated` - İlan güncellendi bildirimi

### Kullanıcı Event'leri
- `user_status` - Kullanıcı durumu güncelle
- `ping` - Bağlantı testi
- `pong` - Bağlantı testi yanıtı

### Bağlantı Event'leri
- `connected` - Bağlantı başarılı
- `disconnect` - Bağlantı kesildi
- `error` - Hata oluştu

## Özellikler

- **Modüler Yapı**: Her özellik ayrı handler'da
- **Tip Güvenliği**: TypeScript tip tanımları
- **Sabit Değerler**: Event isimleri ve room'lar için sabitler
- **Hata Yönetimi**: Kapsamlı hata yakalama ve loglama
- **Kimlik Doğrulama**: JWT tabanlı socket kimlik doğrulama
- **Room Yönetimi**: Kullanıcı ve konuşma odaları
- **Legacy Destek**: Eski sistem ile uyumluluk

## Güvenlik

- JWT token ile kimlik doğrulama
- Kullanıcı yetkilendirmesi
- Rate limiting (ana uygulamada)
- CORS yapılandırması

## Performans

- Efficient room management
- Targeted message sending
- Connection pooling
- Error recovery