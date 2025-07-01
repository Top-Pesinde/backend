# ⚡ Quick Start Guide

Bu proje artık temizlenmiş ve production-ready durumda!

## 🎯 Sunucu Makinesi (Mevcut)

Sunucunuzda çalıştırmanız gereken komutlar:

### 1. Sunucu IP'sini Öğrenin
```bash
npm run server:ip
```
**Sonuç**: Sunucu IP'niz `176.96.131.222`

### 2. Firewall'ı Ayarlayın
```bash
npm run server:firewall
```

### 3. Remote Servisleri Başlatın
```bash
npm run services:start:remote
```

### 4. Servis Durumunu Kontrol Edin
```bash
npm run server:check
```

## 💻 Local PC (Farklı Bilgisayar)

Kendi bilgisayarınızda çalıştırmanız gereken adımlar:

### 1. Projeyi İndirin
```bash
git clone <REPO_URL>
cd monepero
npm install
```

### 2. Remote Konfigürasyonu Uygulayın
```bash
npm run setup:remote
```

### 3. IP Adresini Güncelleyin
`packages/api/.env` dosyasında aşağıdaki satırları güncelleyin:
```env
DATABASE_URL="postgresql://postgres:postgres123@176.96.131.222:5432/express_api_db?schema=public"
REDIS_URL="redis://176.96.131.222:6379"
MINIO_ENDPOINT=176.96.131.222
MINIO_PUBLIC_URL=http://176.96.131.222:9000
MINIO_CONSOLE_URL=http://176.96.131.222:9001
```

### 4. Database Setup ve Başlat
```bash
npm run db:generate
npm run dev
```

## 🌐 Erişim URL'leri

**Sunucu IP**: `176.96.131.222`

- **API**: http://176.96.131.222:3000
- **MinIO Console**: http://176.96.131.222:9001
- **Database**: 176.96.131.222:5432
- **Redis**: 176.96.131.222:6379

## 🔧 Yardımcı Komutlar

### Sunucu Yönetimi
```bash
npm run server:ip        # IP adresini öğren
npm run server:firewall  # Firewall ayarla
npm run server:check     # Servisleri kontrol et
npm run services:start:remote  # Remote servisleri başlat
npm run services:stop:remote   # Remote servisleri durdur
```

### Development
```bash
npm run dev              # Development mode
npm run build            # Build all packages
npm run test             # Run tests
npm run db:migrate       # Database migration
npm run db:studio        # Prisma Studio
```

## 🎯 Tek Komutla Başlatma

**Sunucuda**:
```bash
npm run services:start:remote && npm run server:check
```

**Local PC'de**:
```bash
npm run setup:remote && npm run dev
```

## 📚 Detaylı Rehberler

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Local kurulum
- [REMOTE_DATABASE_SETUP.md](./REMOTE_DATABASE_SETUP.md) - Remote kurulum detayları

## ✅ Kurulum Testi

Her şey çalışıyorsa şu URL'lere erişebilmelisiniz:
- MinIO Console: http://176.96.131.222:9001
- API Health: http://176.96.131.222:3000/health (API çalışıyorsa) 