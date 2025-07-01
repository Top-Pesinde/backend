# 📱 Cihaz ve Tarayıcı Bilgisi ile Oturum Yönetimi

Bu doküman, kullanıcıdan alınan cihaz adı (`deviceName`) ve tarayıcı adı (`browserName`) bilgilerinin oturum (session) kaydında nasıl kullanılacağını ve API ile entegrasyonunu açıklar.

## 1. Amaç
- Kullanıcıların oturumlarını cihaz ve tarayıcı bazında daha doğru ayırt edebilmek
- Sadece User-Agent string'ine bağlı kalmadan, frontend'den gelen gerçek cihaz/tarayıcı adını kaydedebilmek

## 2. API Kullanımı

### Login / Register İsteği

```http
POST /api/v1/auth/login
Content-Type: application/json
User-Agent: iPhone 11/iOS 16.0 Safari

{
  "username": "hasanaliarikan077",
  "password": "test123456",
  "deviceName": "iPhone 11",
  "browserName": "Safari"
}
```

> **Not:** `deviceName` ve `browserName` opsiyoneldir. Gönderilirse öncelikli olarak kullanılır, gönderilmezse User-Agent parse edilir.

### Session Kaydı
- Backend, oturum oluştururken önce `deviceName` ve `browserName` parametrelerine bakar.
- Eğer bu alanlar varsa, session kaydında `deviceInfo` şu şekilde olur:
  - `deviceInfo = "iPhone 11 - Safari"`
- Eğer bu alanlar yoksa, User-Agent string'i parse edilerek platform ve browser tahmini yapılır:
  - `deviceInfo = "IOS - Safari"` veya `deviceInfo = "ANDROID - Chrome"`

## 3. Response Örneği

```json
{
  "success": true,
  "data": {
    "sessionInfo": {
      "sessionId": "cmcgkp9rj000bwrw891clnua2",
      "deviceInfo": "iPhone 11 - Safari",
      "location": "Local",
      "platform": "IOS"
    }
  }
}
```

## 4. Tavsiye Edilen Frontend Kullanımı
- Mobil uygulama veya web istemcisi, login/register sırasında cihaz ve tarayıcı adını mümkünse backend'e göndermelidir.
- Örnek:
  - Mobil: `deviceName = "iPhone 11"`, `browserName = "Safari"`
  - Web: `deviceName = "Windows 10"`, `browserName = "Chrome"`

## 5. Geriye Dönük Uyum
- Eski istemciler sadece User-Agent ile çalışmaya devam edebilir.
- Yeni istemciler daha doğru cihaz/tarayıcı adı gönderebilir.

---

**Sorumlu:** Backend Development Team
**Son Güncelleme:** 28 Haziran 2025 