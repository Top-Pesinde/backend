# Halısaha Platform Demo Walkthrough

Bu dokümanda halısaha rezervasyon platformunun tam işleyişi demonstre edilmektedir.

## 🎯 Demo Özeti

Bu demo'da aşağıdaki işlemler gerçekleştirilmiştir:
- ✅ FOOTBALL_FIELD_OWNER kullanıcısı oluşturma
- ✅ Halısaha ilanı oluşturma
- ✅ Fotoğraf yükleme ve MinIO entegrasyonu
- ✅ API endpoint'lerinin test edilmesi

## 📋 Sistem Gereksinimleri

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL (Docker)
- **File Storage**: MinIO (Docker)
- **Authentication**: JWT
- **API Version**: v1

## 🚀 Demo Adımları

### 1. Kullanıcı Kaydı (FOOTBALL_FIELD_OWNER)

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Hasan" \
  -F "lastName=Futbol" \
  -F "username=hasanfutbol" \
  -F "email=hasan.futbol@example.com" \
  -F "password=futbol123" \
  -F "phone=+905557891234" \
  -F "role=FOOTBALL_FIELD_OWNER" \
  -F "location=İzmir Bornova" \
  -F "bio=Halısaha ve futbol sahası işletmecisi" \
  -F "profilePhoto=@image.png" \
  -F "documents=@image.png"
```

**Sonuç:**
- ✅ Kullanıcı başarıyla oluşturuldu
- ✅ Profil fotoğrafı MinIO'ya yüklendi
- ✅ Dokümanlar MinIO'ya yüklendi
- ✅ Access token ve refresh token alındı

### 2. Kullanıcı Girişi

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "hasanfutbol", "password": "futbol123"}'
```

**Sonuç:**
- ✅ Giriş başarılı
- ✅ Yeni access token alındı

### 3. Halısaha İlanı Oluşturma

```bash
curl -X POST http://localhost:3000/api/v1/field-listings \
  -H "Authorization: Bearer [ACCESS_TOKEN]" \
  -F "fieldName=Hasan'ın Halısahası" \
  -F "fieldAddress=İzmir Bornova, Atatürk Mahallesi" \
  -F "hourlyPrice=200" \
  -F "isIndoor=false" \
  -F "surfaceType=ARTIFICIAL" \
  -F "phone=+905557891234" \
  -F "contactType=WHATSAPP" \
  -F "description=Modern ve kaliteli halısaha tesisi. Şehrin en iyi lokasyonunda." \
  -F "schedules=[{\"dayOfWeek\": \"MONDAY\", \"startTime\": \"08:00\", \"endTime\": \"23:00\"}, {\"dayOfWeek\": \"TUESDAY\", \"startTime\": \"08:00\", \"endTime\": \"23:00\"}]" \
  -F "features=[\"CHANGING_ROOM\", \"SHOWER\", \"PARKING\", \"FREE_WIFI\"]" \
  -F "photos=@image.png" \
  -F "photos=@image.png"
```

**Sonuç:**
- ✅ Halısaha ilanı oluşturuldu
- ✅ Çalışma saatleri tanımlandı
- ✅ Özellikler eklendi
- Field ID: `cmc65wq6t00082nwhhzkfsfkc`

### 4. Halısaha Fotoğraf Yükleme

```bash
curl -X POST http://localhost:3000/api/v1/uploads/field-photos \
  -H "Authorization: Bearer [ACCESS_TOKEN]" \
  -F "fieldId=cmc65wq6t00082nwhhzkfsfkc" \
  -F "photos=@image.png" \
  -F "photos=@image.png"
```

**Sonuç:**
- ✅ 2 fotoğraf başarıyla yüklendi
- ✅ MinIO "fields" bucket'ına kaydedildi
- ✅ Fotoğraf URL'leri veritabanına kaydedildi

### 5. İlan Detaylarını Görüntüleme

```bash
curl -X GET http://localhost:3000/api/v1/field-listings/cmc65wq6t00082nwhhzkfsfkc
```

**Sonuç:**
- ✅ Tüm ilan detayları başarıyla getirildi
- ✅ Kullanıcı bilgileri dahil
- ✅ Fotoğraf URL'leri mevcut

## 📊 Oluşturulan Veriler

### Kullanıcı Bilgileri
```json
{
  "id": "cmc65ub9o00002nwhparrl7yy",
  "firstName": "Hasan",
  "lastName": "Futbol",
  "username": "hasanfutbol",
  "email": "hasan.futbol@example.com",
  "phone": "+905557891234",
  "location": "İzmir Bornova",
  "bio": "Halısaha ve futbol sahası işletmecisi",
  "role": "FOOTBALL_FIELD_OWNER",
  "profilePhoto": "http://localhost:9000/profile-photos/profile-cmc65ub9o00002nwhparrl7yy-1750505607577.png"
}
```

### Halısaha İlan Bilgileri
```json
{
  "id": "cmc65wq6t00082nwhhzkfsfkc",
  "fieldName": "Hasan'ın Halısahası",
  "fieldAddress": "İzmir Bornova, Atatürk Mahallesi",
  "hourlyPrice": 200,
  "isIndoor": false,
  "surfaceType": "ARTIFICIAL",
  "phone": "+905557891234",
  "contactType": "WHATSAPP",
  "description": "Modern ve kaliteli halısaha tesisi. Şehrin en iyi lokasyonunda.",
  "isActive": true
}
```

### Çalışma Saatleri
- **Pazartesi**: 08:00 - 23:00
- **Salı**: 08:00 - 23:00

### Özellikler
- ✅ Soyunma Odası (CHANGING_ROOM)
- ✅ Duş (SHOWER)
- ✅ Otopark (PARKING)
- ✅ Ücretsiz WiFi (FREE_WIFI)

### Fotoğraflar
- **Fotoğraf 1**: `http://localhost:9000/fields/field-cmc65wq6t00082nwhhzkfsfkc-1750505720247.png`
- **Fotoğraf 2**: `http://localhost:9000/fields/field-cmc65wq6t00082nwhhzkfsfkc-1750505720292.png`

## 🔧 Teknik Detaylar

### Kullanılan Enum Değerleri

**SurfaceType:**
- `GRASS` - Doğal çim
- `ARTIFICIAL` - Suni çim ✅ (kullanıldı)
- `CONCRETE` - Beton
- `CARPET` - Halı

**ContactType:**
- `PHONE` - Telefon
- `WHATSAPP` - WhatsApp ✅ (kullanıldı)

**FeatureType:**
- `CHANGING_ROOM` - Soyunma Odası ✅
- `SHOWER` - Duş ✅
- `PARKING` - Otopark ✅
- `FREE_WIFI` - Ücretsiz WiFi ✅
- `TOILET` - Tuvalet
- `CAFE` - Kafeterya
- `TRIBUNE` - Tribün
- `RENTAL_SHOES` - Kiralık Ayakkabı
- `RENTAL_GLOVES` - Kiralık Eldiven

**DayOfWeek:**
- `MONDAY` - Pazartesi ✅
- `TUESDAY` - Salı ✅
- `WEDNESDAY` - Çarşamba
- `THURSDAY` - Perşembe
- `FRIDAY` - Cuma
- `SATURDAY` - Cumartesi
- `SUNDAY` - Pazar

### MinIO Buckets
- **profile-photos**: Kullanıcı profil fotoğrafları
- **documents**: Kullanıcı dokümanları
- **fields**: Halısaha fotoğrafları ✅
- **general-uploads**: Genel dosyalar

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Kullanıcı kaydı ✅
- `POST /api/v1/auth/login` - Kullanıcı girişi ✅
- `GET /api/v1/auth/profile` - Profil bilgileri

### Field Listings
- `POST /api/v1/field-listings` - İlan oluşturma ✅
- `GET /api/v1/field-listings/:id` - İlan detayları ✅
- `GET /api/v1/field-listings` - Tüm ilanlar
- `GET /api/v1/field-listings/my/listing` - Kullanıcının ilanı

### Uploads
- `POST /api/v1/uploads/field-photos` - Halısaha fotoğrafları ✅
- `PUT /api/v1/uploads/field-photos` - Fotoğraf güncelleme
- `POST /api/v1/uploads/profile-photo` - Profil fotoğrafı
- `POST /api/v1/uploads/documents` - Doküman yükleme

## ✅ Test Sonuçları

### Başarılı İşlemler
1. ✅ Kullanıcı kaydı ve profil fotoğrafı yükleme
2. ✅ Doküman yükleme ve MinIO entegrasyonu
3. ✅ JWT authentication ve token yenileme
4. ✅ Halısaha ilanı oluşturma
5. ✅ Çalışma saatleri ve özellik tanımlama
6. ✅ Ayrı endpoint ile fotoğraf yükleme
7. ✅ Veritabanı ile MinIO senkronizasyonu
8. ✅ API response formatları

### Sistem Performansı
- **Response Time**: < 1 saniye
- **File Upload**: Başarılı (839KB dosya)
- **Database**: PostgreSQL bağlantısı stabil
- **Storage**: MinIO bucket politikaları aktif

## 🔗 Faydalı Linkler

- **Health Check**: http://localhost:3000/health
- **Metrics**: http://localhost:3000/api/metrics
- **API Info**: http://localhost:3000/api
- **MinIO Console**: http://localhost:9001
- **Profile Photos**: http://localhost:9000/profile-photos/
- **Field Photos**: http://localhost:9000/fields/
- **Documents**: http://localhost:9000/documents/

## 📝 Notlar

1. **Token Süresi**: Access token 15 dakika, refresh token 7 gün
2. **Dosya Limitleri**: Maksimum 3 fotoğraf per field
3. **Rol Yetkileri**: FOOTBALL_FIELD_OWNER sadece kendi ilanını yönetebilir
4. **MinIO**: Public bucket politikası aktif
5. **Validation**: Tüm required field'lar kontrol ediliyor

---

**Demo Tarihi**: 21 Haziran 2025, 14:35 TSI  
**Platform Versiyonu**: 1.0.0  
**Test Durumu**: ✅ BAŞARILI 