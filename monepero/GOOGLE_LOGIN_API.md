# Google ile Giriş API Dokümantasyonu

Bu doküman, backend servisinde bulunan Google ile giriş ve kayıt akışını detaylandırmaktadır. Akış, kullanıcının sisteme ilk defa mı giriş yaptığını yoksa mevcut bir kullanıcı mı olduğunu anlayan iki aşamalı bir yapıya dayanır.

## Akışın Mantığı

1.  **Giriş Denemesi (`/api/auth/google-login`):** Mobil veya web istemcisi, her zaman ilk olarak bu endpoint'i çağırır.
2.  **Cevabı Değerlendirme:**
    - **`200 OK` Cevabı:** Kullanıcı sistemde kayıtlıdır. Giriş başarılıdır ve token'lar alınır. Akış burada biter.
    - **`404 Not Found` Cevabı:** Kullanıcı sistemde kayıtlı değildir. Cevabın `data` alanındaki ön bilgiler alınır ve kullanıcıya eksik bilgileri tamamlaması için bir kayıt formu gösterilir.
3.  **Kaydı Tamamlama (`/api/auth/google-register`):** Sadece `404` cevabı alındığında, kullanıcıdan alınan ek bilgilerle bu endpoint çağrılarak kayıt işlemi tamamlanır ve giriş yapılır.

---

## 1. Adım: Giriş Yap veya Kullanıcıyı Kontrol Et

Bu endpoint, kullanıcının Google `idToken`'ı ile sistemde kayıtlı olup olmadığını kontrol eder.

- **Endpoint:** `POST /api/auth/google-login`
- **Amaç:** Mevcut bir kullanıcıyı doğrulamak veya yeni bir kullanıcı için ön kayıt bilgilerini almak.

### Request Body

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...Your.Google.ID.Token...Sw",
  "platform": "IOS"
}
```

### Senaryo A: Kullanıcı Zaten Mevcut (Başarılı Giriş)

Kullanıcının e-postası veya Google ID'si sistemde mevcutsa, standart bir giriş cevabı döner.

- **Durum Kodu:** `200 OK`
- **Response Body:**
  ```json
  {
    "success": true,
    "message": "Google login successful",
    "data": {
      "user": {
        "id": "cl...",
        "firstName": "Hasan Ali",
        "lastName": "Arıkan"
        // ... diğer kullanıcı bilgileri
      },
      "accessToken": "ey...",
      "refreshToken": "ey..."
    },
    "statusCode": 200
  }
  ```

### Senaryo B: Kullanıcı Yeni (Kayıt Gerekli)

Kullanıcı sistemde mevcut değilse, istemcinin kayıt işlemini başlatması gerektiğini belirten bir cevap döner.

- **Durum Kodu:** `404 Not Found`
- **Response Body:**
  ```json
  {
    "success": false,
    "message": "User not found, registration required",
    "data": {
      "googleId": "118158484452429530801",
      "email": "hasanaliarikan077@gmail.com",
      "firstName": "hasan ali",
      "lastName": "arikan",
      "profilePhotoUrl": "https://lh3.googleusercontent.com/a/ACg8.../photo.jpg"
    },
    "statusCode": 404
  }
  ```
  > **İstemci Notu:** Bu `data` objesindeki bilgileri alarak kayıt formunu kullanıcı için önceden doldurabilirsiniz.

---

## 2. Adım: Yeni Kullanıcının Kaydını Tamamlama

Bu endpoint, **sadece ve sadece** 1. Adım'dan `404` cevabı alındığında çağrılmalıdır.

- **Endpoint:** `POST /api/auth/google-register`
- **Amaç:** Eksik bilgileri alarak yeni kullanıcının kaydını tamamlamak ve giriş yapmak.

### Request Body

1. adımdan alınan `data` objesi ile kullanıcıdan alınan yeni bilgileri birleştirerek gönderin.

```json
{
  "googleId": "118158484452429530801", // 1. adımdan
  "email": "hasanaliarikan077@gmail.com", // 1. adımdan
  "firstName": "hasan ali", // 1. adımdan (kullanıcıya düzenleme izni verilebilir)
  "lastName": "arikan", // 1. adımdan (kullanıcıya düzenleme izni verilebilir)
  "profilePhoto": "https://.../photo.jpg", // 1. adımdaki `profilePhotoUrl`
  "username": "hasanali.dev", // ✅ ZORUNLU (Kullanıcıdan alınacak)
  "phone": "5559876543", // ✅ ZORUNLU (Kullanıcıdan alınacak)
  "location": "Antalya", // ✅ ZORUNLU (Kullanıcıdan alınacak)
  "bio": "Futbol sevdalısı", // ❓ Opsiyonel (Kullanıcıdan alınacak)
  "role": "USER", // ✅ ZORUNLU (Kullanıcıdan alınacak veya varsayılan)
  "password": "123456", // ✅ ZORUNLU (Kullanıcıdan alınacak - güvenlik için)
  "documents": [] // ⚠️ FOOTBALL_FIELD_OWNER için ZORUNLU (Multer file objects)
}
```

### Response (Kayıt ve Giriş Başarılı)

Kayıt başarılı olduğunda, sistem kullanıcıyı otomatik olarak giriş yapmış sayar ve standart giriş cevabını döner.

- **Durum Kodu:** `200 OK`
- **Response Body:**
  ```json
  {
    "success": true,
    "message": "Google registration successful",
    "data": {
      "user": {
        "id": "yeni_kullanici_id",
        "username": "hasanali.dev"
        // ... yeni oluşturulan kullanıcının tüm bilgileri
      },
      "accessToken": "ey...",
      "refreshToken": "ey..."
    },
    "statusCode": 200
  }
  ```

---

## Normal Login Entegrasyonu

Eğer bir kullanıcı Google Sign In ile kayıt olmuşsa ve sonra normal login yapmaya çalışırsa:

- **Endpoint:** `POST /api/auth/login`
- **Hata Durumu:** `400 Bad Request`
- **Response:**
  ```json
  {
    "success": false,
    "message": "This account was created with Google. Please use Google login.",
    "statusCode": 400
  }
  ```

---

## Örnek Akış

```
1. Kullanıcı Google Sign In butonuna tıklar
2. Google OAuth dialog'unu gösterir
3. Kullanıcı Google ile giriş yapar
4. Google ID token'ı döner
5. App POST /api/auth/google-login çağırır
6a. 200 OK → Giriş başarılı, token'ları sakla
6b. 404 → Kayıt formu göster, eksik bilgileri al
7. (Sadece 404 durumunda) POST /api/auth/google-register çağırır
8. 200 OK → Kayıt ve giriş başarılı, token'ları sakla
```

---

## Özel Kurallar

### FOOTBALL_FIELD_OWNER Kullanıcıları

1. **Document Zorunluluğu:** FOOTBALL_FIELD_OWNER rolü seçildiğinde document yükleme zorunludur
2. **Status:** Kayıt sırasında status otomatik olarak `false` yapılır
3. **Admin Onayı:** Bu kullanıcılar admin onayı bekler, giriş yapamazlar
4. **Hata Mesajı:** Status false olan kullanıcılar giriş yapmaya çalıştığında:
   - FOOTBALL_FIELD_OWNER: "Account is pending admin approval. Please wait for activation."
   - Diğerleri: "Account is deactivated. Please contact support."

### Diğer Roller (USER, GOALKEEPER, REFEREE)

1. **Document:** Opsiyonel
2. **Status:** Kayıt sırasında otomatik olarak `true`
3. **Hemen Giriş:** Kayıt sonrası hemen giriş yapabilirler
