# FCM Token API Dokümantasyonu

## Genel Bakış

FCM (Firebase Cloud Messaging) Token API, kullanıcıların push notification almak için cihaz token'larını yönetir. 

### Önemli Kural
**Her kullanıcının sadece 1 tane aktif FCM token'ı olabilir.** Yeni token kaydedildiğinde, kullanıcının tüm eski token'ları otomatik olarak silinir.

## Endpoints

### 1. FCM Token Kaydet/Güncelle
**POST** `/api/v1/fcm-tokens`

Yeni FCM token kaydeder veya mevcut token'ı günceller.

#### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "token": "string (required)",      // FCM token
  "platform": "string (required)",  // IOS, ANDROID, WEB
  "deviceId": "string (optional)"    // Cihaz ID
}
```

#### Response (201 - Yeni token)
```json
{
  "success": true,
  "message": "FCM token başarıyla kaydedildi",
  "data": {
    "id": "cm4qaq84d0000lgiq1ls1ox5c",
    "userId": "cm4qaq84d0000lgiq1ls1ox5c",
    "token": "test_token_device_1",
    "platform": "ANDROID",
    "deviceId": "device_001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 201
}
```

#### Response (200 - Aynı token güncellendi)
```json
{
  "success": true,
  "message": "FCM token başarıyla güncellendi",
  "data": {
    "id": "cm4qaq84d0000lgiq1ls1ox5c",
    "userId": "cm4qaq84d0000lgiq1ls1ox5c",
    "token": "test_token_device_1",
    "platform": "IOS",
    "deviceId": "device_002",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:01.000Z"
  },
  "timestamp": "2024-01-01T00:00:01.000Z",
  "statusCode": 200
}
```

#### Hata Durumları
- **400**: Eksik veya geçersiz alanlar
- **401**: Authentication gerekli
- **409**: Token başka kullanıcı tarafından kullanılıyor
- **500**: Sunucu hatası

---

### 2. FCM Token'ları Listele
**GET** `/api/v1/fcm-tokens`

Kullanıcının aktif FCM token'larını getirir.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response (200)
```json
{
  "success": true,
  "message": "FCM token'ları başarıyla getirildi",
  "data": [
    {
      "id": "cm4qaq84d0000lgiq1ls1ox5c",
      "userId": "cm4qaq84d0000lgiq1ls1ox5c",
      "token": "test_token_device_1",
      "platform": "ANDROID",
      "deviceId": "device_001",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

---

### 3. FCM Token Sil
**DELETE** `/api/v1/fcm-tokens/:tokenId`

Belirtilen FCM token'ı tamamen siler.

#### Headers
```
Authorization: Bearer <access_token>
```

#### URL Parameters
- `tokenId`: Silinecek token'ın ID'si

#### Response (200)
```json
{
  "success": true,
  "message": "FCM token başarıyla silindi",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "statusCode": 200
}
```

#### Hata Durumları
- **401**: Authentication gerekli
- **404**: Token bulunamadı veya erişim yok
- **500**: Sunucu hatası

## Token Mantığı

### Yeni Token Kaydı
1. **Aynı token zaten varsa**: Sadece platform ve deviceId güncellenir
2. **Farklı token gelirse**: 
   - Kullanıcının tüm eski token'ları silinir
   - Yeni token kaydedilir

### Örnek Senaryo
```
1. Kullanıcı Android cihazdan token_A kaydeder → Token_A aktif
2. Kullanıcı iPhone'dan token_B kaydeder → Token_A silinir, Token_B aktif
3. Kullanıcı yine Android'den token_A kaydeder → Token_B silinir, Token_A aktif
```

## Platform Değerleri
- `IOS`: iOS cihazlar
- `ANDROID`: Android cihazlar  
- `WEB`: Web tarayıcılar

## Test Örnekleri

### Token Kaydet
```bash
curl -X POST http://localhost:3000/api/v1/fcm-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "token": "your_fcm_token_here",
    "platform": "ANDROID",
    "deviceId": "device_123"
  }'
```

### Token'ları Listele
```bash
curl -X GET http://localhost:3000/api/v1/fcm-tokens \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Token Sil
```bash
curl -X DELETE http://localhost:3000/api/v1/fcm-tokens/TOKEN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Güvenlik Notları

- Tüm endpoint'ler authentication gerektirir
- Kullanıcılar sadece kendi token'larını yönetebilir
- Token'lar unique olmalı (aynı token farklı kullanıcılar tarafından kullanılamaz)
- Silme işlemi geri alınamaz (hard delete)

## Veritabanı Değişiklikleri

- FCM token silme işlemi artık `isActive: false` yapmak yerine tamamen silme (`DELETE`) yapıyor
- Her yeni token kaydında kullanıcının tüm eski token'ları otomatik silinir 