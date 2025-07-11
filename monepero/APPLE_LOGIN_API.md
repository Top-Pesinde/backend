# Apple Sign In API Dokümantasyonu

Bu doküman, backend servisinde bulunan Apple Sign In ile giriş ve kayıt akışını detaylandırmaktadır. Akış, Google Sign In ile benzer şekilde iki aşamalı bir yapıya dayanır.

## Akışın Mantığı

1.  **Giriş Denemesi (`/api/v1/auth/apple-login`):** Mobil istemci, her zaman ilk olarak bu endpoint'i çağırır.
2.  **Cevabı Değerlendirme:**
    - **`200 OK` Cevabı:** Kullanıcı sistemde kayıtlıdır. Giriş başarılıdır ve token'lar alınır. Akış burada biter.
    - **`404 Not Found` Cevabı:** Kullanıcı sistemde kayıtlı değildir. Cevabın `data` alanındaki ön bilgiler alınır ve kullanıcıya eksik bilgileri tamamlaması için bir kayıt formu gösterilir.
3.  **Kaydı Tamamlama (`/api/v1/auth/apple-register`):** Sadece `404` cevabı alındığında, kullanıcıdan alınan ek bilgilerle bu endpoint çağrılarak kayıt işlemi tamamlanır ve giriş yapılır.

---

## Apple Sign In'in Özel Durumları

Apple Sign In, Google Sign In'den farklı olarak:

- **Email bilgisi:** Sadece ilk giriş sırasında gelir, sonraki girişlerde `null` olabilir
- **İsim bilgisi:** Sadece ilk giriş sırasında gelir, sonraki girişlerde `null` olabilir
- **Profil fotoğrafı:** Apple profil fotoğrafı vermez
- **Benzersiz kimlik:** `sub` alanındaki Apple ID her zaman mevcuttur

---

## 1. Adım: Giriş Yap veya Kullanıcıyı Kontrol Et

Bu endpoint, kullanıcının Apple `identityToken`'ı ile sistemde kayıtlı olup olmadığını kontrol eder.

- **Endpoint:** `POST /api/v1/auth/apple-login`
- **Amaç:** Mevcut bir kullanıcıyı doğrulamak veya yeni bir kullanıcı için ön kayıt bilgilerini almak.

### Request Body

```json
{
  "identityToken": "eyJraWQiOiJTZjJsRnF3a3BYIiwiYWxnIjoiUlMyNTYifQ.eyJpc3MiOiJodHRwczovL2FwcGxlaWQuYXBwbGUuY29tIiwiYXVkIjoiY29tLnRvcHBlc2luZGUuYXBwIiwiZXhwIjoxNzUyMzMxNzkzLCJpYXQiOjE3NTIyNDUzOTMsInN1YiI6IjAwMDYyNy5jMDg3YThiYzRkM2U0OTFjODVjNjI1OGY5ZjI1Mjg1OS4wODM0IiwiY19oYXNoIjoidTZuNUV5ZU1PX1pLR1B6TUlrNHVPdyIsImF1dGhfdGltZSI6MTc1MjI0NTM5Mywibm9uY2Vfc3VwcG9ydGVkIjp0cnVlfQ.jva2_p4TIgc538kvS7apbxe7mLgUGKAUDlK8jSQoNKTeorCpqwZyuDHwqRa8gCEVbscvaFb8pkbn6B1hIdTbx7R1u23PXbZX3odtAFOPeIJdrhfOFxQzrxJJS-VScqXnibTifIN9CarVOY3ZqHwySV9BM9CQXzNZfrIbqNBFQWkoduZ0eYkKQL-owNMOzHF1lxd5F1ku4WgTHzU-3GRBqGXn-dEgx7pT0jN9iA_8Z8C8GLka-094ugxdjkakMcpnXp-MYSRqVsDTbFEFwD7OWAmp9t_XCtC56asUr2Xqp8PwjuiJB_rvy4kf-PpWyj6I806HjJnXPrwZF4t5dnhTqg",
  "authorizationCode": "cc5cd31f2e4a54bc4967a5d9b6e0c41e4.0.swsx.G8X5OxF77TIXKae2PCHs3A",
  "fullName": {
    "givenName": "John",
    "familyName": "Doe"
  },
  "email": "john.doe@icloud.com",
  "platform": "IOS"
}
```

**Parametreler:**

- `identityToken` _(zorunlu)_: Apple'ın JWT identity token'ı
- `authorizationCode` _(opsiyonel)_: Apple'ın authorization code'u
- `fullName` _(opsiyonel)_: İlk giriş sırasında Apple'dan gelen isim bilgileri
- `email` _(opsiyonel)_: İlk giriş sırasında Apple'dan gelen email
- `platform` _(opsiyonel)_: Platform bilgisi (IOS, ANDROID, WEB)

### Senaryo A: Kullanıcı Zaten Mevcut (Başarılı Giriş)

Kullanıcının Apple ID'si veya e-postası sistemde mevcutsa, standart bir giriş cevabı döner.

- **Durum Kodu:** `200 OK`
- **Response Body:**
  ```json
  {
    "success": true,
    "message": "Apple login successful",
    "data": {
      "user": {
        "id": "cl...",
        "firstName": "John",
        "lastName": "Doe"
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
      "appleId": "000627.c087a8bc4d3e491c85c6258f9f252859.0834",
      "email": "john.doe@icloud.com",
      "firstName": "John",
      "lastName": "Doe",
      "profilePhotoUrl": null
    },
    "statusCode": 404
  }
  ```
  > **İstemci Notu:** Bu `data` objesindeki bilgileri alarak kayıt formunu kullanıcı için önceden doldurabilirsiniz. Apple profil fotoğrafı vermediği için `profilePhotoUrl` her zaman `null`'dur.

---

## 2. Adım: Yeni Kullanıcının Kaydını Tamamlama

Bu endpoint, **sadece ve sadece** 1. Adım'dan `404` cevabı alındığında çağrılmalıdır.

- **Endpoint:** `POST /api/v1/auth/apple-register`
- **Amaç:** Eksik bilgileri alarak yeni kullanıcının kaydını tamamlamak ve giriş yapmak.

### Request Body

1. adımdan alınan `data` objesi ile kullanıcıdan alınan yeni bilgileri birleştirerek gönderin.

```json
{
  "appleId": "000627.c087a8bc4d3e491c85c6258f9f252859.0834", // 1. adımdan
  "email": "john.doe@icloud.com", // 1. adımdan (zorunlu)
  "firstName": "John", // 1. adımdan (kullanıcıya düzenleme izni verilebilir)
  "lastName": "Doe", // 1. adımdan (kullanıcıya düzenleme izni verilebilir)
  "username": "johndoe.dev", // ✅ ZORUNLU (Kullanıcıdan alınacak)
  "phone": "5559876543", // ✅ ZORUNLU (Kullanıcıdan alınacak)
  "location": "İstanbul", // ✅ ZORUNLU (Kullanıcıdan alınacak)
  "bio": "Apple kullanıcısı", // ❓ Opsiyonel (Kullanıcıdan alınacak)
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
    "message": "Apple registration successful",
    "data": {
      "user": {
        "id": "yeni_kullanici_id",
        "username": "johndoe.dev"
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

Eğer bir kullanıcı Apple Sign In ile kayıt olmuşsa ve sonra normal login yapmaya çalışırsa:

- **Endpoint:** `POST /api/v1/auth/login`
- **Hata Durumu:** `400 Bad Request`
- **Response:**
  ```json
  {
    "success": false,
    "message": "This account was created with Apple. Please use Apple login.",
    "statusCode": 400
  }
  ```

---

## Token Doğrulama

Apple identity token'ları şu şekilde doğrulanır:

1. Apple'ın public key'leri `https://appleid.apple.com/auth/keys` adresinden alınır
2. JWT token'ı Apple'ın public key'i ile doğrulanır
3. `audience` (Bundle ID) ve `issuer` kontrolü yapılır
4. Token'dan `sub` (Apple ID) ve diğer bilgiler çıkarılır

---

## Güvenlik Notları

1. **Token Süresi:** Apple identity token'ları kısa sürelidir (genellikle 10 dakika)
2. **Bir Kerelik Kullanım:** Her identity token sadece bir kez kullanılmalıdır
3. **Bundle ID Kontrolü:** Token'daki `audience` alanı uygulamanızın Bundle ID'si ile eşleşmelidir
4. **Email Kalıcılığı:** İlk giriş sonrası email bilgisi database'de saklanır, sonraki girişlerde Apple'dan gelmeyebilir

---

## Hata Durumları

| HTTP Kodu | Hata Mesajı                             | Açıklama                               |
| --------- | --------------------------------------- | -------------------------------------- |
| 400       | `Apple identity token is required`      | Identity token eksik                   |
| 401       | `Failed to verify Apple token`          | Token doğrulama başarısız              |
| 404       | `User not found, registration required` | Kullanıcı kayıtlı değil, kayıt gerekli |
| 409       | `User already exists`                   | Kayıt sırasında kullanıcı zaten mevcut |
| 500       | `Apple login failed`                    | Sunucu hatası                          |

---

## Örnek Akış

```
1. Kullanıcı Apple Sign In butonuna tıklar
2. iOS Apple Sign In dialog'unu gösterir
3. Kullanıcı Apple ile giriş yapar
4. iOS identityToken ve diğer bilgileri döner
5. App POST /api/v1/auth/apple-login çağırır
6a. 200 OK → Giriş başarılı, token'ları sakla
6b. 404 → Kayıt formu göster, eksik bilgileri al
7. (Sadece 404 durumunda) POST /api/v1/auth/apple-register çağırır
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
