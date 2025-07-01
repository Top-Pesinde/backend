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

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/auth/register` | Kullanıcı kaydı (role-based) |
| POST | `/api/v1/auth/login` | Kullanıcı girişi |
| POST | `/api/v1/auth/refresh` | Token yenileme |
| GET | `/api/v1/auth/profile` | Kullanıcı profili (korumalı) |

### Users

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/v1/users` | Tüm kullanıcıları getir (pagination ile) |
| GET | `/api/v1/users/:id` | Belirli kullanıcıyı getir |
| POST | `/api/v1/users` | Yeni kullanıcı oluştur |
| PUT | `/api/v1/users/:id` | Kullanıcıyı güncelle |
| DELETE | `/api/v1/users/:id` | Kullanıcıyı sil |

### File Uploads (MinIO)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/uploads/profile-photo` | Profil fotoğrafı yükle |
| POST | `/api/v1/uploads/documents` | Doküman yükle (çoklu) |
| DELETE | `/api/v1/uploads/:bucketType/:fileName` | Dosya sil |
| GET | `/api/v1/uploads/:bucketType/:fileName/url` | Dosya URL'i al |
| GET | `/api/v1/uploads/:bucketType/list` | Kullanıcı dosyalarını listele |

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

# 🌐 Remote Services Setup Guide

Farklı bir PC'den PostgreSQL, Redis ve MinIO servislerinize bağlanmak için bu adımları takip edin.

## 📋 Gereksinimler

1. **Sunucu makinesi** (PostgreSQL, Redis, MinIO çalışacak)
2. **İstemci makinesi** (farklı PC - kodlama yapacağınız)
3. Network bağlantısı
4. Docker & Docker Compose (sunucu makinede)

## 🔧 Sunucu Makinesi Konfigürasyonu

### 1. Remote Docker Servisleri Başlatma

```bash
# Remote access için özel compose dosyasını kullan
docker-compose -f docker-compose.remote.yml up -d

# Veya otomatik script ile
npm run services:start:remote
```

### 2. PostgreSQL'i Remote Access İçin Hazırlama

PostgreSQL varsayılan olarak sadece localhost'tan bağlantıya izin verir. Bu ayarları değiştirin:

```bash
# PostgreSQL container'ına girin
docker exec -it express-api-postgres bash

# PostgreSQL config düzenleyin (container içinde)
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf
echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf

# PostgreSQL'i yeniden başlatın
docker-compose -f docker-compose.remote.yml restart postgres
```

### 3. Firewall Ayarları (Sunucu Makinesi)

```bash
# Ubuntu/Debian için
sudo ufw allow 5432/tcp  # PostgreSQL
sudo ufw allow 6379/tcp  # Redis
sudo ufw allow 9000/tcp  # MinIO API
sudo ufw allow 9001/tcp  # MinIO Console

# CentOS/RHEL için
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --permanent --add-port=6379/tcp
sudo firewall-cmd --permanent --add-port=9000/tcp
sudo firewall-cmd --permanent --add-port=9001/tcp
sudo firewall-cmd --reload
```

### 4. Sunucu IP Adresini Öğrenme

```bash
# Sunucunuzun IP adresini öğrenin
hostname -I
# veya
ip addr show | grep 'inet ' | grep -v '127.0.0.1'
```

## 🔄 İstemci Makinesi Konfigürasyonu

### 1. Projeyi İstemci Makinesine Klonlama

```bash
# Projeyi klonlayın
git clone <YOUR_REPO_URL>
cd monepero

# Dependencies yükleyin
npm install
```

### 2. Remote Environment Konfigürasyonu

```bash
# Remote konfigürasyonu uygula
npm run setup:remote
```

### 3. IP Adresini Güncelleme

`.env` dosyasında sunucunuzun IP adresini güncelleyin:

```bash
# packages/api/.env dosyasını düzenleyin
nano packages/api/.env
```

Aşağıdaki değerleri sunucunuzun IP'si ile değiştirin:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@YOUR_SERVER_IP:5432/express_api_db?schema=public"

# Redis
REDIS_URL="redis://YOUR_SERVER_IP:6379"

# MinIO
MINIO_ENDPOINT=YOUR_SERVER_IP
MINIO_PUBLIC_URL=http://YOUR_SERVER_IP:9000
MINIO_CONSOLE_URL=http://YOUR_SERVER_IP:9001
```

### 4. Bağlantıyı Test Etme

```bash
# Database bağlantısını test et
npx prisma db pull

# Prisma client generate et
npm run db:generate

# API'yi başlat
npm run dev
```

## 📱 Hızlı Kurulum Komutları

### Sunucu Tarafında:
```bash
# 1. Tüm servisleri remote access ile başlat
npm run services:start:remote

# 2. Servis durumunu kontrol et
docker-compose -f docker-compose.remote.yml ps

# 3. IP adresini not alın
hostname -I
```

### İstemci Tarafında:
```bash
# 1. Projeyi klonla ve setup et
git clone <REPO_URL> && cd monepero && npm install

# 2. Remote config uygula
npm run setup:remote

# 3. IP adresini güncelle (.env dosyasında)
# YOUR_SERVER_IP → gerçek sunucu IP'si

# 4. Test ve başlat
npm run db:generate && npm run dev
```

## 🗂️ MinIO (Object Storage) Remote Access

### MinIO Console Erişimi

Web arayüzü üzerinden MinIO'yu yönetebilirsiniz:

- **URL**: `http://YOUR_SERVER_IP:9001`
- **Username**: `minioadmin`
- **Password**: `minioadmin123`

### MinIO API Kullanımı

```javascript
// API'nizde MinIO kullanımı
const minioEndpoint = process.env.MINIO_ENDPOINT; // YOUR_SERVER_IP
const minioPort = process.env.MINIO_PORT; // 9000
const publicUrl = process.env.MINIO_PUBLIC_URL; // http://YOUR_SERVER_IP:9000
```

### Otomatik Bucket'lar

Sistem başlatıldığında otomatik olarak oluşturulan bucket'lar:
- `profile-photos` (public)
- `documents` (private)
- `general-uploads` (private)
- `fields` (public)

## 🐳 Docker Compose Remote Konfigürasyonu

`docker-compose.remote.yml` dosyası tüm servisleri external access için konfigüre eder:

```yaml
# PostgreSQL - 0.0.0.0:5432 (tüm interface'lerden erişim)
# Redis - 0.0.0.0:6379 (protected-mode kapalı)
# MinIO - 0.0.0.0:9000, 0.0.0.0:9001 (API ve Console)
```

## 🔒 Güvenlik Önerileri

1. **Strong Passwords**: Veritabanı şifrelerini güçlü yapın
2. **Specific IPs**: Mümkünse sadece belirli IP'lere izin verin
3. **VPN**: Güvenli network bağlantısı kullanın
4. **Firewall**: Gereksiz portları kapatın
5. **SSL**: Production'da SSL kullanın

## 🚨 Troubleshooting

### Bağlantı Sorunları

```bash
# Port kontrolü (sunucu)
netstat -tlnp | grep -E "5432|6379|9000|9001"

# Docker servis durumu
docker-compose -f docker-compose.remote.yml ps

# Firewall durumu
sudo ufw status
```

### Test Komutları

```bash
# PostgreSQL bağlantı testi (istemci)
pg_isready -h YOUR_SERVER_IP -p 5432 -U postgres

# Redis bağlantı testi (istemci)
redis-cli -h YOUR_SERVER_IP -p 6379 ping

# MinIO bağlantı testi (istemci)
curl http://YOUR_SERVER_IP:9000/minio/health/live
```

### Yaygın Hatalar

**Database:**
1. **Connection refused**: Firewall veya PostgreSQL config problemi
2. **Authentication failed**: pg_hba.conf ayarları
3. **Timeout**: Network bağlantı problemi

**MinIO:**
1. **Access denied**: Bucket policy veya credentials problemi
2. **Connection timeout**: Firewall veya port problemi
3. **CORS errors**: Browser'dan erişimde CORS ayarları

**Redis:**
1. **NOAUTH error**: Redis protected-mode problemi
2. **Connection refused**: Bind address veya firewall problemi

## 📖 Kullanılabilir Komutlar

### Sunucu Makinesi:
```bash
npm run services:start:remote # Remote servisleri başlat
npm run services:stop:remote  # Remote servisleri durdur
docker-compose -f docker-compose.remote.yml logs -f # Logları izle
```

### İstemci Makinesi:
```bash
npm run setup:remote          # Remote konfigürasyon uygula
npm run setup:local           # Local konfigürasyona geri dön
npm run dev                   # API'yi geliştirme modunda çalıştır
npm run build                 # Build et
npm run db:migrate            # Database migration
npm run db:studio             # Prisma Studio
```

## 🔗 Servis URL'leri

**Sunucu IP'nizi `192.168.1.100` olarak varsayalım:**

- **API**: `http://192.168.1.100:3000`
- **PostgreSQL**: `192.168.1.100:5432`
- **Redis**: `192.168.1.100:6379`
- **MinIO API**: `http://192.168.1.100:9000`
- **MinIO Console**: `http://192.168.1.100:9001`

## 💡 Development Workflow

1. **Sunucuda**: Docker servisleri başlatın
2. **İstemcide**: Proje klonlayın ve setup yapın
3. **IP güncelleyin**: .env dosyasında sunucu IP'sini yazın
4. **Test edin**: Bağlantıları kontrol edin
5. **Geliştirin**: Normal şekilde kod yazın

Bu kurulum ile farklı PC'lerden aynı veritabanı ve servisleri kullanabilirsiniz! 