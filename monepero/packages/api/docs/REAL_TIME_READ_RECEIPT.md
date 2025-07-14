# Gerçek Zamanlı Mesaj Okundu Özelliği

Bu belge, Monepero uygulamasına eklenen gerçek zamanlı mesaj okundu özelliğini açıklar.

## Özellik Özeti

Gerçek zamanlı mesaj okundu özelliği, kullanıcıların aynı sohbet odasında olduğunda mesajların otomatik olarak okundu olarak işaretlenmesini ve bu durumun anlık olarak diğer kullanıcılara bildirilmesini sağlar.

### Temel Özellikler

1. **Otomatik Okundu İşaretleme**: Kullanıcı bir konuşmaya katıldığında, tüm okunmamış mesajlar otomatik olarak okundu olarak işaretlenir.
2. **Anlık Bildirimler**: Bir kullanıcı mesajları okuduğunda, diğer kullanıcılara anlık olarak bildirilir.
3. **Kullanıcı Durumu Takibi**: Kullanıcıların konuşmaya katılma ve ayrılma durumları takip edilir ve diğer kullanıcılara bildirilir.
4. **Gerçek Zamanlı Güncelleme**: Mesaj durumu (gönderildi, iletildi, okundu) gerçek zamanlı olarak güncellenir.

## Teknik Detaylar

### Socket.IO Olayları

#### Yeni Eklenen Olaylar

- `user_joined_conversation`: Bir kullanıcı konuşmaya katıldığında tetiklenir.
- `user_left_conversation`: Bir kullanıcı konuşmadan ayrıldığında tetiklenir.
- `message_read`: Belirli bir mesaj okunduğunda tetiklenir.

#### Güncellenen Olaylar

- `messages_read_by_user`: Artık hangi mesajların okunduğu bilgisini de içerir.
- `messages_marked_read`: Artık hangi mesajların okundu olarak işaretlendiği bilgisini de içerir.

### Veri Yapıları

#### messages_read_by_user Olayı

```javascript
{
  userId: "user-id",           // Mesajları okuyan kullanıcının ID'si
  conversationId: "conv-id",   // Konuşma ID'si
  messageIds: ["msg1", "msg2"], // Okunan mesajların ID'leri
  readAt: "2023-06-01T12:00:00Z", // Okunma zamanı
  status: "read"               // Mesaj durumu
}
```

#### message_read Olayı

```javascript
{
  messageId: "msg-id",         // Okunan mesajın ID'si
  conversationId: "conv-id",   // Konuşma ID'si
  readAt: "2023-06-01T12:00:00Z", // Okunma zamanı
  status: "read"               // Mesaj durumu
}
```

#### user_joined_conversation Olayı

```javascript
{
  userId: "user-id",           // Konuşmaya katılan kullanıcının ID'si
  conversationId: "conv-id",   // Konuşma ID'si
  timestamp: "2023-06-01T12:00:00Z" // Katılma zamanı
}
```

#### user_left_conversation Olayı

```javascript
{
  userId: "user-id",           // Konuşmadan ayrılan kullanıcının ID'si
  conversationId: "conv-id",   // Konuşma ID'si
  timestamp: "2023-06-01T12:00:00Z" // Ayrılma zamanı
}
```

## Kullanım Senaryoları

### Senaryo 1: Kullanıcı Konuşmaya Katıldığında

1. Kullanıcı A, Kullanıcı B ile olan konuşmaya katılır.
2. Sistem, Kullanıcı A'nın tüm okunmamış mesajlarını otomatik olarak okundu olarak işaretler.
3. Kullanıcı B, Kullanıcı A'nın konuşmaya katıldığını ve mesajları okuduğunu anlık olarak görür.

### Senaryo 2: Kullanıcı Konuşmadayken Yeni Mesaj Aldığında

1. Kullanıcı A ve Kullanıcı B aynı konuşmada aktif durumdadır.
2. Kullanıcı A, Kullanıcı B'ye bir mesaj gönderir.
3. Mesaj, Kullanıcı B'nin ekranında görüntülenir ve otomatik olarak okundu olarak işaretlenir.
4. Kullanıcı A, mesajının okunduğunu anlık olarak görür.

### Senaryo 3: Kullanıcı Konuşmadan Ayrıldığında

1. Kullanıcı A, konuşmadan ayrılır.
2. Kullanıcı B, Kullanıcı A'nın konuşmadan ayrıldığını anlık olarak görür.
3. Kullanıcı B'nin gönderdiği yeni mesajlar artık otomatik olarak okundu olarak işaretlenmez.

## Test Etme

Bu özelliği test etmek için `/scripts/test-real-time-read-receipt.sh` betiğini kullanabilirsiniz. Bu betik, iki test kullanıcısı arasında bir konuşma başlatır ve gerçek zamanlı mesaj okundu özelliğini test etmek için gerekli adımları gösterir.

```bash
chmod +x ./scripts/test-real-time-read-receipt.sh
./scripts/test-real-time-read-receipt.sh
```

## İstemci Entegrasyonu

İstemci tarafında bu özellikleri nasıl kullanacağınız hakkında daha fazla bilgi için `/docs/SOCKET_CLIENT_GUIDE.md` dosyasına bakın.

## Katkıda Bulunanlar

Bu özellik, Monepero geliştirici ekibi tarafından geliştirilmiştir.

## Lisans

Bu belge ve ilgili kod, Monepero'nun mülkiyetindedir ve izinsiz kullanılamaz veya dağıtılamaz.