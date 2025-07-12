# 🚀 Monepero Chat System

Modern, real-time chat sistemi Socket.IO, Node.js ve Prisma kullanılarak geliştirilmiştir. Kaleci ve hakem bulma platformu için özel olarak tasarlanmıştır.

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [API Endpoints](#api-endpoints)
- [Socket.IO Events](#socketio-events)
- [Veritabanı Schema](#veritabanı-schema)
- [Kullanım Kılavuzu](#kullanım-kılavuzu)
- [Test](#test)
- [Güvenlik](#güvenlik)

## ✨ Özellikler

### 🔥 Core Features

- **Real-time Messaging**: Socket.IO ile anlık mesajlaşma
- **User Authentication**: JWT tabanlı kimlik doğrulama
- **Multiple Message Types**: Text, Image, File, Voice, Location, Offer
- **Message Management**: Düzenleme, silme, yanıtlama
- **Read Receipts**: Mesaj okundu bilgileri
- **Typing Indicators**: Yazma göstergeleri
- **Conversation Management**: Sohbet listesi ve geçmiş

### 🛡️ Security Features

- **User Blocking**: Kullanıcı engelleme sistemi
- **User Banning**: Kalıcı ban özelliği
- **Message Validation**: Mesaj içeriği doğrulama
- **Rate Limiting**: Spam koruması
- **Self-Message Prevention**: Kendine mesaj gönderme engelleme

### 🎨 UI/UX Features

- **Responsive Design**: Mobil uyumlu arayüz
- **Real-time Updates**: Anlık güncelleme
- **Error Handling**: Kullanıcı dostu hata mesajları
- **Status Indicators**: Bağlantı durumu göstergeleri
- **Beautiful Design**: Modern ve şık tasarım

## 🛠️ Teknolojiler

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **TypeScript** - Type safety

### Frontend

- **HTML5** - Markup
- **CSS3** - Styling
- **JavaScript** - Client-side logic
- **Socket.IO Client** - Real-time connection

### DevOps

- **Docker** - Containerization
- **Redis** - Caching
- **Nodemon** - Development server

## 📦 Kurulum

### Gereksinimler

```bash
- Node.js 18+
- PostgreSQL 14+
- Redis (optional)
- Docker (optional)
```

### 1. Proje Klonlama

```bash
git clone https://github.com/yourusername/monepero.git
cd monepero/packages/api
```

### 2. Bağımlılıkları Yükle

```bash
npm install
```

### 3. Çevre Değişkenleri

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/monepero"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
```

### 4. Veritabanı Kurulumu

```bash
# Docker ile PostgreSQL başlat
docker-compose up -d

# Prisma migration çalıştır
npx prisma migrate dev

# Test verilerini ekle
npx prisma db seed
```

### 5. Sunucuyu Başlat

```bash
npm run dev
```

## 🌐 API Endpoints

### Authentication

```bash
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh
```

### Chat Management

```bash
GET    /api/v1/chat/conversations          # Sohbet listesi
POST   /api/v1/chat/conversations/start    # Sohbet başlat
GET    /api/v1/chat/conversations/:id/messages  # Mesajları getir
```

### Message Operations

```bash
POST   /api/v1/chat/messages/send          # Mesaj gönder
PUT    /api/v1/chat/messages/:id/edit      # Mesaj düzenle
DELETE /api/v1/chat/messages/:id/delete    # Mesaj sil
POST   /api/v1/chat/messages/:id/read      # Mesaj okundu işaretle
```

### User Management

```bash
POST   /api/v1/chat/block                  # Kullanıcı engelle
POST   /api/v1/chat/unblock                # Engeli kaldır
GET    /api/v1/chat/blocked                # Engellenen kullanıcılar
```

## 🔌 Socket.IO Events

### Client → Server

```javascript
// Bağlantı kurma
socket.emit("join_conversation", { conversationId });

// Mesaj gönderme
socket.emit("send_chat_message", {
  receiverId: "user-id",
  content: "Hello!",
  messageType: "TEXT",
});

// Yazma göstergeleri
socket.emit("typing_start", { conversationId });
socket.emit("typing_stop", { conversationId });

// Mesaj okundu
socket.emit("mark_messages_read", { conversationId });
```

### Server → Client

```javascript
// Yeni mesaj
socket.on("new_chat_message", (data) => {
  console.log("New message:", data.message);
});

// Mesaj gönderildi onayı
socket.on("message_sent", (data) => {
  console.log("Message sent:", data.message);
});

// Yazma göstergeleri
socket.on("user_typing_start", (data) => {
  console.log("User typing:", data.userId);
});

// Hatalar
socket.on("chat_error", (error) => {
  console.error("Chat error:", error.message);
});
```

## 🗄️ Veritabanı Schema

### Conversation Model

```prisma
model Conversation {
  id           String    @id @default(cuid())
  user1Id      String
  user2Id      String
  lastMessage  String?
  lastMessageAt DateTime?
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user1        User      @relation("ConversationUser1")
  user2        User      @relation("ConversationUser2")
  messages     Message[]
}
```

### Message Model

```prisma
model Message {
  id             String      @id @default(cuid())
  conversationId String
  senderId       String
  receiverId     String
  content        String
  messageType    MessageType @default(TEXT)
  isRead         Boolean     @default(false)
  isEdited       Boolean     @default(false)
  isDeleted      Boolean     @default(false)
  createdAt      DateTime    @default(now())

  conversation   Conversation @relation(fields: [conversationId])
  sender         User         @relation("MessageSender")
  receiver       User         @relation("MessageReceiver")
}
```

### UserBlock Model

```prisma
model UserBlock {
  id           String   @id @default(cuid())
  blockedById  String
  blockedUserId String
  reason       String?
  createdAt    DateTime @default(now())

  blockedBy    User     @relation("BlockedByUser")
  blockedUser  User     @relation("BlockedUser")
}
```

## 📱 Kullanım Kılavuzu

### 1. Test Arayüzü

```bash
# Sunucu çalışıyorken
http://localhost:8080/chat-demo.html
```

### 2. Test Kullanıcıları

```javascript
// Kullanıcı bilgileri
const testUsers = {
  john: { username: "johndoe", password: "123456", role: "USER" },
  jane: { username: "janesmith", password: "123456", role: "GOALKEEPER" },
  ali: { username: "aliveli", password: "123456", role: "REFEREE" },
  admin: { username: "admin", password: "123456", role: "ADMIN" },
};
```

### 3. Temel Kullanım

```javascript
// 1. Bağlantı kur
const socket = io("http://localhost:3000", {
  auth: { token: "your-jwt-token" },
});

// 2. Sohbete katıl
socket.emit("join_conversation", {
  conversationId: "conversation-id",
});

// 3. Mesaj gönder
socket.emit("send_chat_message", {
  receiverId: "receiver-user-id",
  content: "Merhaba!",
  messageType: "TEXT",
});

// 4. Mesajları dinle
socket.on("new_chat_message", (data) => {
  displayMessage(data.message);
});
```

### 4. Gelişmiş Özellikler

```javascript
// Mesaj düzenleme (5 dakika sınırı)
await editMessage(messageId, "Düzenlenen mesaj");

// Mesaj silme
await deleteMessage(messageId);

// Kullanıcı engelleme
await blockUser(userId, "Spam mesajlar");

// Kalıcı ban
await banUser(userId, "BAN - Kalıcı engelleme");
```

## 🧪 Test

### API Testleri

```bash
# Login test
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "password": "123456"}'

# Mesaj gönderme test
curl -X POST http://localhost:3000/api/v1/chat/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"receiverId": "user-id", "content": "Test mesajı", "messageType": "TEXT"}'
```

### Socket.IO Testleri

```javascript
// Bağlantı testi
const socket = io("http://localhost:3000", {
  auth: { token: "your-token" },
});

socket.on("connect", () => {
  console.log("✅ Socket bağlantısı başarılı");
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket bağlantı hatası:", error);
});
```

## 🔒 Güvenlik

### Authentication

- JWT tabanlı kimlik doğrulama
- Token süresi: 60 gün
- Refresh token desteği
- Session management

### Authorization

- Role-based access control
- User permissions
- Message ownership validation

### Data Protection

- Input validation
- SQL injection protection
- XSS protection
- Rate limiting

### Privacy

- User blocking system
- Message deletion
- Conversation privacy
- Data encryption

## 📊 Performans

### Optimizasyonlar

- Database indexing
- Connection pooling
- Message pagination
- Efficient queries

### Monitoring

- Health check endpoint: `/health`
- Metrics endpoint: `/api/metrics`
- Error logging
- Performance tracking

## 🚀 Deployment

### Production Setup

```bash
# Environment variables
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...

# Build
npm run build

# Start
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Katkıda Bulunma

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 İletişim

- **Proje Sahibi**: [Your Name]
- **Email**: your.email@example.com
- **GitHub**: [@yourusername](https://github.com/yourusername)

---

<p align="center">
  <strong>⚽ Monepero Chat System - Futbol Severleri Buluşturan Platform</strong>
</p>
