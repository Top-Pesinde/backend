# 👥 Kullanıcı Rolleri ve Gereksinimleri

Bu dokümanda API'mizde bulunan 4 farklı kullanıcı rolü ve her rol için gerekli/opsiyonel alanlar açıklanmaktadır.

## 📋 Genel Kurallar

### 🔹 Tüm Roller İçin Zorunlu Alanlar
```json
{
  "firstName": "string",      // Zorunlu - İsim
  "lastName": "string",       // Zorunlu - Soyisim  
  "username": "string",       // Zorunlu - Benzersiz kullanıcı adı
  "email": "string",          // Zorunlu - Benzersiz email adresi
  "password": "string",       // Zorunlu - Minimum 6 karakter
  "phone": "string",          // Zorunlu - Telefon numarası (TÜM ROLLER İÇİN!)
  "role": "Role"              // Zorunlu - USER|GOALKEEPER|REFEREE|FOOTBALL_FIELD_OWNER
}
```

### 🔹 Tüm Roller İçin Opsiyonel Alanlar
```json
{
  "profilePhoto": "File",     // Opsiyonel - Profil fotoğrafı (JPG, JPEG, PNG, GIF)
  "documents": "File[]"       // Opsiyonel - Dokümanlar (PDF, DOC, DOCX + resim formatları)  
}
```

---

## 👤 1. USER Rolü

### ✅ Zorunlu Alanlar
- firstName, lastName, username, email, password, phone *(genel zorunlu alanlar)*

### 🔹 Opsiyonel Alanlar  
- profilePhoto, documents *(genel opsiyonel alanlar)*
- location, bio, lisans *(USER için tamamen opsiyonel)*

### 📝 Özellikler
- En basit kullanıcı tipi
- Minimum bilgi gereksinimi
- Telefon numarası artık zorunlu
- Lisans varsayılan olarak `false`

### 🔧 Örnek Kayıt
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Ahmet" \
  -F "lastName=Yılmaz" \
  -F "username=ahmet_user" \
  -F "email=ahmet@example.com" \
  -F "password=123456" \
  -F "phone=+905551234567" \
  -F "role=USER" \
  -F "profilePhoto=@profile.png"
```

---

## 🥅 2. GOALKEEPER Rolü

### ✅ Zorunlu Alanlar
- firstName, lastName, username, email, password, phone *(genel zorunlu alanlar)*
- **location** *(zorunlu)*
- **bio** *(zorunlu)*

### 🔹 Opsiyonel Alanlar
- profilePhoto, documents *(genel opsiyonel alanlar)*
- **lisans** *(configurable - true/false)*

### 📝 Özellikler
- Kaleci profili
- Konum ve biyografi zorunlu
- Lisans alanı artık ayarlanabilir (önceden otomatik true'ydu)
- Profesyonel kaleci bilgileri

### 🔧 Örnek Kayıt
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Mehmet" \
  -F "lastName=Kaleci" \
  -F "username=mehmet_gk" \
  -F "email=mehmet@example.com" \
  -F "password=123456" \
  -F "phone=+905551234567" \
  -F "location=İstanbul, Türkiye" \
  -F "bio=10 yıllık deneyimli profesyonel kaleci." \
  -F "lisans=true" \
  -F "role=GOALKEEPER" \
  -F "profilePhoto=@profile.png"
```

---

## 🟨 3. REFEREE Rolü

### ✅ Zorunlu Alanlar
- firstName, lastName, username, email, password, phone *(genel zorunlu alanlar)*
- **location** *(zorunlu)*

### 🔹 Opsiyonel Alanlar
- profilePhoto, documents *(genel opsiyonel alanlar)*
- bio *(opsiyonel)*
- **lisans** *(configurable - true/false)*

### 📝 Özellikler
- Hakem profili
- Sadece konum zorunlu, biyografi opsiyonel
- Lisans alanı ayarlanabilir
- Hakem sertifika bilgileri

### 🔧 Örnek Kayıt
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Ali" \
  -F "lastName=Hakem" \
  -F "username=ali_referee" \
  -F "email=ali@example.com" \
  -F "password=123456" \
  -F "phone=+905551234567" \
  -F "location=Ankara, Türkiye" \
  -F "bio=FIFA lisanslı hakem. 8 yıllık deneyim." \
  -F "lisans=true" \
  -F "role=REFEREE" \
  -F "profilePhoto=@profile.png"
```

---

## ⚽ 4. FOOTBALL_FIELD_OWNER Rolü

### ✅ Zorunlu Alanlar
- firstName, lastName, username, email, password, phone *(genel zorunlu alanlar)*
- **location** *(zorunlu)*

### 🔹 Opsiyonel Alanlar
- profilePhoto *(genel opsiyonel alan)*
- bio *(opsiyonel)*
- lisans *(varsayılan false)*
- **documents** *(önerilen - işletme belgeleri)*

### 📝 Özellikler
- Halı saha işletmecisi profili
- Konum zorunlu (saha lokasyonu)
- Dokümanlar önerilen (lisans, sözleşme vb.)
- İşletme bilgileri

### 🔧 Örnek Kayıt
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Fatma" \
  -F "lastName=Saha" \
  -F "username=fatma_owner" \
  -F "email=fatma@example.com" \
  -F "password=123456" \
  -F "phone=+905551234567" \
  -F "location=İzmir, Türkiye" \
  -F "bio=3 farklı lokasyonda halı saha işletmecisi." \
  -F "role=FOOTBALL_FIELD_OWNER" \
  -F "profilePhoto=@profile.png" \
  -F "documents=@lisans.pdf" \
  -F "documents=@sozlesme.pdf"
```

---

## 📁 Dosya Yükleme Kuralları

### 🖼️ Profil Fotoğrafı
- **Desteklenen formatlar:** JPG, JPEG, PNG, GIF
- **Maksimum boyut:** 5MB
- **Bucket:** `profile-photos` (herkese açık)
- **URL formatı:** `http://localhost:9000/profile-photos/profile-{userId}-{timestamp}.{ext}`

### 📄 Dokümanlar
- **Desteklenen formatlar:** PDF, DOC, DOCX, JPG, JPEG, PNG, GIF
- **Maksimum boyut:** 5MB per dosya
- **Maksimum dosya sayısı:** 5 adet
- **Bucket:** `documents` (herkese açık)
- **URL formatı:** `http://localhost:9000/documents/doc-{userId}-{timestamp}-{filename}`

---

## 🔄 Değişiklik Geçmişi

### v2.1 - En Son Güncellemeler
- ✅ **Subscription (Abonelik) sistemi eklendi** (default: false)
- ✅ **Status (Aktif/Pasif) kontrol sistemi** (default: true)
- ✅ **Pasif kullanıcılar giriş yapamaz** (403 Forbidden)

### v2.0 - Son Güncellemeler
- ✅ **Phone artık TÜM roller için zorunlu** (önceden USER için opsiyoneldi)
- ✅ **Lisans alanı GOALKEEPER ve REFEREE için configurable** (önceden GOALKEEPER için otomatik true'ydu)
- ✅ **Tüm dosyalar MinIO'ya herkese açık** olarak kaydediliyor
- ✅ **Memory storage** kullanımı (disk'e kaydetme yok)
- ✅ **Gerçek user ID** ile dosya isimlendirme

### v1.0 - İlk Versiyon
- Temel rol sistemı
- Dosya yükleme altyapısı
- MinIO entegrasyonu

---

## 🚨 Hata Senaryoları

### Eksik Zorunlu Alan
```bash
# USER için phone eksik
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Test" \
  -F "lastName=User" \
  -F "username=test" \
  -F "email=test@example.com" \
  -F "password=123456" \
  -F "role=USER"

# Response: "Phone number is required for all roles"
```

### Rol-Spesifik Eksik Alan
```bash
# GOALKEEPER için location ve bio eksik
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Test" \
  -F "lastName=Kaleci" \
  -F "username=test_gk" \
  -F "email=test@example.com" \
  -F "password=123456" \
  -F "phone=+905551234567" \
  -F "role=GOALKEEPER"

# Response: "Location and bio are required for GOALKEEPER role"
```

### Desteklenmeyen Dosya Formatı
```bash
# .txt dosyası desteklenmiyor
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Test" \
  -F "lastName=User" \
  -F "username=test" \
  -F "email=test@example.com" \
  -F "password=123456" \
  -F "phone=+905551234567" \
  -F "role=USER" \
  -F "profilePhoto=@test.txt"

# Response: "Only documents and images are allowed"
```

---

## 🎯 API Endpoints

- **POST** `/api/v1/auth/register` - Kullanıcı kaydı
- **POST** `/api/v1/auth/login` - Kullanıcı girişi  
- **GET** `/api/v1/auth/profile` - Profil bilgileri (token gerekli)
- **POST** `/api/v1/auth/refresh` - Token yenileme
- **PUT** `/api/v1/auth/status` - Kullanıcı aktif/pasif durumu değiştirme (token gerekli)
- **PUT** `/api/v1/auth/subscription` - Kullanıcı abonelik durumu değiştirme (token gerekli)

---

## 🔧 Yeni API Örnekleri

### Kullanıcı Status Değiştirme
```bash
# Kullanıcıyı pasif yap
curl -X PUT http://localhost:3000/api/v1/auth/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","status":false}'

# Kullanıcıyı aktif yap
curl -X PUT http://localhost:3000/api/v1/auth/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","status":true}'
```

### Kullanıcı Subscription Değiştirme
```bash
# Aboneliği aktif et
curl -X PUT http://localhost:3000/api/v1/auth/subscription \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","subscription":true}'

# Aboneliği pasif et
curl -X PUT http://localhost:3000/api/v1/auth/subscription \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","subscription":false}'
```

### Pasif Kullanıcı Giriş Denemesi
```bash
# Bu 403 Forbidden döner
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pasif_user","password":"123456"}'

# Response: "Account is deactivated. Please contact support."
```

---

## 🔗 Bağlantılı Dökümanlar

- [API Dokümantasyonu](./api-documentation.md)
- [MinIO Konfigürasyonu](./minio-setup.md)
- [Database Schema](./database-schema.md)
- [Test Örnekleri](../register-examples.md) 