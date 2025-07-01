# 🚀 Monepero

Express.js API monorepo projesi - Turborepo ile yönetilen, PostgreSQL, Redis ve MinIO destekli modern web API.

## 🚀 Hızlı Başlangıç

```bash
# 1. Dependencies yükle
npm install

# 2. Local environment ayarla
npm run setup:local

# 3. Docker servisleri başlat
npm run services:start

# 4. Database setup
npm run db:generate
npm run db:migrate

# 5. Development mode
npm run dev
```

**Detaylı kurulum için:** [LOCAL_SETUP.md](./LOCAL_SETUP.md)

## Geliştirme

```bash
# Tüm paketleri geliştirme modunda çalıştır
npm run dev

# Belirli bir paketi çalıştır
npx turbo run dev --filter=express-api-services
```

## Build

```bash
# Tüm paketleri build et
npm run build

# Belirli bir paketi build et
npx turbo run build --filter=express-api-services
```

## Test

```bash
# Tüm testleri çalıştır
npm run test

# Belirli bir pakette test çalıştır
npx turbo run test --filter=express-api-services
```

## Veritabanı

```bash
# Prisma schema'yı generate et
npm run db:generate

# Veritabanını push et
npm run db:push

# Migration çalıştır
npm run db:migrate
```

## 📦 Paketler

- **`packages/api`** - Express.js API with TypeScript
  - PostgreSQL (Prisma ORM)
  - Redis (Caching)
  - MinIO (Object Storage)
  - JWT Authentication
  - Express Rate Limiting
  - Monitoring (Prometheus + Grafana)

## 🌐 URLs (Local)

- **API**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
- **Grafana**: http://localhost:3001 
- **Prometheus**: http://localhost:9090

## Özellikler

- 🚀 **Turborepo** - Hızlı build ve cache sistemi
- 📦 **Workspaces** - NPM workspaces desteği
- 🔄 **Hot Reload** - Geliştirme sırasında otomatik yenileme
- 🧪 **Testing** - Jest ile test desteği
- 🔍 **Linting** - ESLint ve Prettier
- 🗄️ **Database** - Prisma ORM
- 🐳 **Docker** - Containerized services
- 🔄 **Remote Access** - Multi-PC development support

## 📚 Dokümantasyon

- [Local Setup Guide](./LOCAL_SETUP.md) - Local PC kurulumu
- [Remote Setup Guide](./REMOTE_DATABASE_SETUP.md) - Uzak sunucu bağlantısı

## 🔧 Servis Yönetimi

```bash
# Local servisleri başlat/durdur
npm run services:start
npm run services:stop

# Remote servisleri başlat/durdur  
npm run services:start:remote
npm run services:stop:remote

# Environment değiştir
npm run setup:local    # Local environment
npm run setup:remote   # Remote environment
``` 