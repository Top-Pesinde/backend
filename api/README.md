# Express.js TypeScript API with Services Architecture

[![Tests](https://github.com/yourusername/backend/actions/workflows/test.yml/badge.svg)](https://github.com/yourusername/backend/actions/workflows/test.yml)
[![Code Quality](https://github.com/yourusername/backend/actions/workflows/test.yml/badge.svg?job=lint)](https://github.com/yourusername/backend/actions/workflows/test.yml)
[![Coverage](https://codecov.io/gh/yourusername/backend/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/backend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)](https://www.typescriptlang.org/)

Bu proje, Node.js, Express.js ve TypeScript kullanarak services mimarisiyle geliştirilmiş bir RESTful API'dir.

## 🏗️ Proje Yapısı

```
src/
├── controllers/          # Request handling katmanı
│   └── userController.ts
├── services/            # Business logic katmanı
│   └── userService.ts
├── routes/              # Route tanımları
│   ├── index.ts
│   └── userRoutes.ts
├── middleware/          # Middleware'ler
│   ├── errorHandler.ts
│   └── notFoundHandler.ts
├── types/               # TypeScript type tanımları
│   └── index.ts
└── index.ts            # Ana giriş dosyası
```

## 🚀 Kurulum

### Hızlı Kurulum (Önerilen)

```bash
# Setup script'ini çalıştır (PostgreSQL + Redis + Prisma)
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manuel Kurulum

1. Environment dosyasını oluşturun:

```bash
cp env.local.example .env
```

2. PostgreSQL ve Redis'i başlatın:

```bash
docker-compose up -d postgres redis
```

3. Bağımlılıkları yükleyin:

```bash
npm install
```

4. Prisma client'ını generate edin:

```bash
npx prisma generate
```

5. Veritabanını oluşturun:

```bash
npx prisma db push
```

6. Veritabanını seed edin:

```bash
npm run db:seed
```

7. Development modunda çalıştırın:

```bash
npm run dev
```

### Docker ile Tam Kurulum

```bash
# Tüm servisleri Docker ile çalıştır
docker-compose -f docker-compose.dev.yml up
```

### Production Build

```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentication

| Method | Endpoint                    | Açıklama                     |
| ------ | --------------------------- | ---------------------------- |
| POST   | `/api/v1/auth/register`     | Kullanıcı kaydı (role-based) |
| POST   | `/api/v1/auth/login`        | Kullanıcı girişi             |
| POST   | `/api/v1/auth/google-login` | Google ile giriş/kayıt       |
| POST   | `/api/v1/auth/refresh`      | Token yenileme               |
| GET    | `/api/v1/auth/profile`      | Kullanıcı profili (korumalı) |

### Users

| Method | Endpoint            | Açıklama                                 |
| ------ | ------------------- | ---------------------------------------- |
| GET    | `/api/v1/users`     | Tüm kullanıcıları getir (pagination ile) |
| GET    | `/api/v1/users/:id` | Belirli kullanıcıyı getir                |
| POST   | `/api/v1/users`     | Yeni kullanıcı oluştur                   |
| PUT    | `/api/v1/users/:id` | Kullanıcıyı güncelle                     |
| DELETE | `/api/v1/users/:id` | Kullanıcıyı sil                          |

### File Uploads (MinIO)

| Method | Endpoint                                    | Açıklama                      |
| ------ | ------------------------------------------- | ----------------------------- |
| POST   | `/api/v1/uploads/profile-photo`             | Profil fotoğrafı yükle        |
| POST   | `/api/v1/uploads/documents`                 | Doküman yükle (çoklu)         |
| DELETE | `/api/v1/uploads/:bucketType/:fileName`     | Dosya sil                     |
| GET    | `/api/v1/uploads/:bucketType/:fileName/url` | Dosya URL'i al                |
| GET    | `/api/v1/uploads/:bucketType/list`          | Kullanıcı dosyalarını listele |

### Pagination Parametreleri

- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına öğe sayısı (default: 10)
- `sortBy`: Sıralama alanı (default: createdAt)
- `sortOrder`: Sıralama yönü (asc/desc, default: desc)

Örnek: `/api/v1/users?page=1&limit=5&sortBy=name&sortOrder=asc`

## 📋 Örnek Kullanım

### Kullanıcı Kaydı (GOALKEEPER)

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "username": "ahmet_kaleci",
    "email": "ahmet@example.com",
    "password": "123456",
    "phone": "+905551234567",
    "location": "İstanbul",
    "bio": "Profesyonel kaleci",
    "role": "GOALKEEPER"
  }'
```

### Kullanıcı Girişi

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmet@example.com",
    "password": "123456"
  }'
```

### Google ile Giriş (İlk Kayıt)

```bash
curl -X POST http://localhost:3000/api/v1/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN_HERE",
    "role": "USER",
    "location": "İstanbul",
    "phone": "5551234567"
  }'
```

### Google ile Giriş (Mevcut Kullanıcı)

```bash
curl -X POST http://localhost:3000/api/v1/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN_HERE"
  }'
```

### Profil Fotoğrafı Yükleme

```bash
curl -X POST http://localhost:3000/api/v1/uploads/profile-photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profilePhoto=@profile.jpg"
```

### Doküman Yükleme (FOOTBALL_FIELD_OWNER için)

```bash
curl -X POST http://localhost:3000/api/v1/uploads/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "documents=@license.pdf" \
  -F "documents=@contract.pdf"
```

## 🏛️ Mimari

Bu proje **Services Pattern** mimarisini kullanır:

- **Controllers**: HTTP isteklerini handle eder, validation yapar
- **Services**: Business logic'i içerir, veritabanı operasyonları
- **Routes**: Endpoint tanımları ve routing
- **Middleware**: Error handling, authentication vb.
- **Types**: TypeScript interface ve type tanımları

## 🛠️ Teknolojiler

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Type safety
- **Prisma**: ORM ve database toolkit
- **PostgreSQL**: Primary database
- **MinIO**: Object storage (S3-compatible)
- **Redis**: Caching and session management
- **bcryptjs**: Password hashing
- **JWT**: Authentication tokens
- **Multer**: File upload handling
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API protection

## 📝 Environment Variables

Proje aşağıdaki environment variable'ları kullanır:

### Server Configuration

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Database Configuration

- `DATABASE_URL`: PostgreSQL connection string

### MinIO Configuration

- `MINIO_ENDPOINT`: MinIO server endpoint (default: localhost)
- `MINIO_PORT`: MinIO port (default: 9000)
- `MINIO_USE_SSL`: Use SSL connection (default: false)
- `MINIO_ACCESS_KEY`: MinIO access key (default: minioadmin)
- `MINIO_SECRET_KEY`: MinIO secret key (default: minioadmin123)
- `MINIO_PUBLIC_URL`: Public URL for MinIO (default: http://localhost:9000)

### JWT Configuration

- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: Token expiration time (default: 7d)

### Redis Configuration

- `REDIS_URL`: Redis connection string

## 🔧 Scripts

- `npm run dev`: Development modunda çalıştır
- `npm run build`: TypeScript'i compile et
- `npm start`: Production modunda çalıştır
- `npm run watch`: TypeScript watch mode
- `npm run clean`: Dist klasörünü temizle

## 🧪 Health Check

Server durumunu kontrol etmek için:

```bash
curl http://localhost:3000/health
```

## 🐳 Docker Kullanımı

### 1. Sadece Veritabanı ve MinIO

```bash
docker-compose up -d postgres redis minio
```

### 2. Tüm Stack (Development)

```bash
docker-compose -f docker-compose.dev.yml up
```

### 3. Production

```bash
docker-compose up -d
```

## 🔧 MinIO Yönetimi

- **MinIO Console**: http://localhost:9001
- **Kullanıcı**: minioadmin
- **Şifre**: minioadmin123

### Bucket'lar

- `profile-photos`: Profil fotoğrafları (public)
- `documents`: Kullanıcı dokümanları (private)
- `general-uploads`: Genel dosyalar

## 👥 Kullanıcı Rolleri

### USER

- Temel kullanıcı
- Profil fotoğrafı yükleyebilir
- Temel bilgiler yeterli

### GOALKEEPER

- Kaleci rolü
- `lisans: true` otomatik atanır
- Telefon, lokasyon ve bio zorunlu

### REFEREE

- Hakem rolü
- Telefon ve lokasyon zorunlu

### FOOTBALL_FIELD_OWNER

- Saha sahibi
- Telefon ve lokasyon zorunlu
- Doküman yükleme gerekli

## 🚀 CI/CD Pipeline

Proje GitHub Actions ile otomatik test ve deployment pipeline'ına sahiptir:

### Test Pipeline

- ✅ **Automated Testing**: Jest ile unit ve integration testleri
- ✅ **Code Quality**: ESLint ve Prettier kontrolü
- ✅ **Security Audit**: npm audit ile güvenlik kontrolü
- ✅ **Database Testing**: PostgreSQL test veritabanı
- ✅ **Service Testing**: Redis ve MinIO entegrasyonu
- ✅ **API Testing**: Health check ve endpoint testleri
- ✅ **Coverage Report**: Codecov entegrasyonu

### Pipeline Jobs

1. **🧪 Test Job**: Testler, build ve API kontrolü
2. **🔍 Lint Job**: Code quality ve security audit (paralel)
3. **🚀 Deploy Job**: Staging deployment (main branch)
4. **📢 Notify Job**: Pipeline sonuç bildirimleri

### Kullanım

```bash
# Local test pipeline
npm run test:ci
npm run build
npm run lint

# Pipeline trigger
git push origin main        # Full pipeline
git push origin develop     # Test pipeline
```

Detaylı bilgi için: [GitHub Actions Documentation](docs/github-actions.md)

## 🧪 Testing

### Test Konfigürasyonu

```bash
# Jest test framework
npm test                    # Test çalıştır
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:ci            # CI mode (no watch)
```

### Test Environment Variables

```bash
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/express_api_test_db
MAIL_FROM_ADDRESS=test@halisaha.app
JWT_SECRET=test-secret
```

## 📈 Gelecek Geliştirmeler

- [x] PostgreSQL entegrasyonu
- [x] JWT Authentication
- [x] File upload (MinIO)
- [x] Role-based authentication
- [x] Docker support
- [x] GitHub Actions CI/CD
- [x] Jest test framework
- [ ] Unit testler yazımı
- [ ] Integration testler
- [ ] Input validation (Joi/Yup)
- [ ] API documentation (Swagger)
- [ ] Logging (Winston)
- [ ] Email verification
- [ ] Real-time notifications (Socket.io)







kadikoyhalisaha
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kadikoyhalisaha",
    "password": "GizliSifre123!"
  }'




TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"yenisaha","password":"YeniSifre123!"}') && ACCESS_TOKEN=$(echo $TOKEN | jq -r '.data.accessToken') && curl -X POST http://localhost:3000/api/v1/field-listings -H "Authorization: Bearer $ACCESS_TOKEN" -F "fieldName=Yeni Saha" -F "fieldAddress=Ankara, Çankaya" -F "hourlyPrice=600" -F "isIndoor=false" -F "surfaceType=GRASS" -F "phone=5559876543" -F "contactType=WHATSAPP" -F "description=Doğal çim, duş, otopark, wifi" -F "schedules=[{\"day\":\"MONDAY\",\"startTime\":\"08:00\",\"endTime\":\"22:00\"}]" -F "features=[\"OPEN_24_7\",\"PARKING\",\"FREE_WIFI\",\"SHOWER\"]" -F "photos=@/root/api/api/image.png" -F "photos=@/root/api/api/image.png"








