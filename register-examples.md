# 🚀 Register ile Profil Fotoğrafı Yükleme Örnekleri

## 1. GOALKEEPER - Profil Fotoğrafı ile Kayıt

```bash
# Önce test için profil fotoğrafı indir
curl -o goalkeeper.jpg "https://via.placeholder.com/300x300/00aa00/ffffff?text=GOALKEEPER"

# GOALKEEPER kaydı (profil fotoğrafı ile, lisans configurable)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Ahmet" \
  -F "lastName=Kaya" \
  -F "username=ahmet_kaleci" \
  -F "email=ahmet@example.com" \
  -F "password=123456" \
  -F "phone=+905551234567" \
  -F "location=İstanbul, Türkiye" \
  -F "bio=10 yıllık deneyimli profesyonel kaleci. Süper Lig deneyimi var." \
  -F "lisans=true" \
  -F "role=GOALKEEPER" \
  -F "profilePhoto=@goalkeeper.jpg"
```

## 2. FOOTBALL_FIELD_OWNER - Profil Fotoğrafı + Dokümanlar

```bash
# Test dosyaları oluştur
curl -o owner.jpg "https://via.placeholder.com/300x300/ff6600/ffffff?text=OWNER"
echo "Bu bir örnek lisans belgesidir - Saha İşletme Belgesi" > lisans.pdf
echo "Bu bir örnek sözleşme belgesidir - Kira Sözleşmesi" > sozlesme.pdf

# FOOTBALL_FIELD_OWNER kaydı (profil fotoğrafı + dokümanlar)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Mehmet" \
  -F "lastName=Özkan" \
  -F "username=mehmet_saha" \
  -F "email=mehmet@example.com" \
  -F "password=123456" \
  -F "phone=+905559876543" \
  -F "location=Ankara, Türkiye" \
  -F "bio=3 farklı lokasyonda halı saha işletmecisi. 15 yıllık deneyim." \
  -F "role=FOOTBALL_FIELD_OWNER" \
  -F "profilePhoto=@owner.jpg" \
  -F "documents=@lisans.pdf" \
  -F "documents=@sozlesme.pdf"
```

## 3. REFEREE - Profil Fotoğrafı ile Kayıt

```bash
# Profil fotoğrafı indir
curl -o referee.jpg "https://via.placeholder.com/300x300/ffaa00/000000?text=REFEREE"

# REFEREE kaydı (lisans configurable)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Ali" \
  -F "lastName=Demir" \
  -F "username=ali_hakem" \
  -F "email=ali@example.com" \
  -F "password=123456" \
  -F "phone=+905554567890" \
  -F "location=İzmir, Türkiye" \
  -F "bio=FIFA lisanslı hakem. 8 yıllık deneyim." \
  -F "lisans=true" \
  -F "role=REFEREE" \
  -F "profilePhoto=@referee.jpg"
```

## 4. USER - Profil Fotoğrafı ile Kayıt

```bash
# Profil fotoğrafı indir
curl -o user.jpg "https://via.placeholder.com/300x300/6666ff/ffffff?text=USER"

# USER kaydı (phone artık zorunlu)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Fatma" \
  -F "lastName=Yılmaz" \
  -F "username=fatma_user" \
  -F "email=fatma@example.com" \
  -F "password=123456" \
  -F "phone=+905557778899" \
  -F "role=USER" \
  -F "profilePhoto=@user.jpg"
```

## 5. Login ve Profil Kontrolü

```bash
# Login yap (artık username ile)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ahmet_kaleci",
    "password": "123456"
  }'

# Response'dan token'i kopyala ve profili kontrol et
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📋 Test Senaryosu

1. **Servisleri başlat:**
```bash
docker-compose up -d
npm run dev
npx prisma db push
```

2. **Tüm kullanıcıları sırayla kaydet** (yukarıdaki 4 örnek)

3. **Her kullanıcı ile login ol** ve profil bilgilerini kontrol et

4. **MinIO Console'da dosyaları kontrol et:**
   - URL: http://localhost:9001
   - User: minioadmin
   - Pass: minioadmin123

## 🎯 Beklenen Sonuçlar

- **GOALKEEPER**: `lisans: true` (configurable), profil fotoğrafı MinIO'ya kaydedildi
- **FOOTBALL_FIELD_OWNER**: Profil fotoğrafı + dokümanlar MinIO'ya kaydedildi
- **REFEREE**: `lisans: true` (configurable), profil fotoğrafı MinIO'ya kaydedildi  
- **USER**: Phone zorunlu, profil fotoğrafı MinIO'ya kaydedildi

📝 **Önemli Değişiklikler:**
- Phone artık TÜM roller için zorunlu
- Lisans alanı GOALKEEPER ve REFEREE için ayarlanabilir (opsiyonel)
- Tüm dosyalar gerçek user ID ile MinIO'ya kaydediliyor
- Database'de doğru MinIO dosya path'leri saklanıyor

## 📁 MinIO Bucket Yapısı

```
profile-photos/
├── profile-USER_ID-TIMESTAMP.jpg
├── profile-USER_ID-TIMESTAMP.jpg
└── ...

documents/
├── doc-USER_ID-TIMESTAMP-lisans.pdf
├── doc-USER_ID-TIMESTAMP-sozlesme.pdf
└── ...
```

## 🔧 Hata Durumları

### GOALKEEPER için eksik bilgi:
```bash
# Bu hata verir (phone, location, bio eksik)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Test" \
  -F "lastName=Kaleci" \
  -F "username=test_kaleci" \
  -F "email=test@example.com" \
  -F "password=123456" \
  -F "role=GOALKEEPER"
# Hata: "Phone number is required for all roles" veya "Location and bio are required for GOALKEEPER role"
```

### USER için eksik phone:
```bash
# Bu hata verir (phone eksik)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Test" \
  -F "lastName=User" \
  -F "username=test_user" \
  -F "email=test@example.com" \
  -F "password=123456" \
  -F "role=USER"
# Hata: "Phone number is required for all roles"
```

### Desteklenmeyen dosya formatı:
```bash
# Bu hata verir (.txt desteklenmiyor)
echo "test" > test.txt
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=Test" \
  -F "lastName=User" \
  -F "username=test_user" \
  -F "email=test2@example.com" \
  -F "password=123456" \
  -F "role=USER" \
  -F "profilePhoto=@test.txt"
```

Bu örnekler ile tam functional test yapabilirsin! 🚀⚽ 