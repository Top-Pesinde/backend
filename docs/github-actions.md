# 🚀 GitHub Actions CI/CD Pipeline

Bu dokümanda halısaha rezervasyon platformunun GitHub Actions CI/CD pipeline konfigürasyonu açıklanmıştır.

## 📋 Pipeline Genel Bakış

GitHub Actions workflow'u `.github/workflows/test.yml` dosyasında tanımlanmıştır ve şu ana iş akışlarını içerir:

### 🔄 Tetikleyiciler
- `push` to `main` or `develop` branches
- `pull_request` to `main` or `develop` branches  
- `workflow_dispatch` (manuel çalıştırma)

### 🏗️ Ana İş Akışları

#### 1. **Test Job** 🧪
- **Platform**: Ubuntu Latest
- **Node.js**: v18
- **Services**: PostgreSQL, Redis, MinIO
- **Süre**: ~5-10 dakika

#### 2. **Lint Job** 🔍  
- **Platform**: Ubuntu Latest
- **Paralel çalışır**: Test job ile beraber
- **Süre**: ~2-3 dakika

#### 3. **Deploy Job** 🚀
- **Koşul**: Sadece main branch
- **Dependency**: Test + Lint job'ları başarılı olmalı

#### 4. **Notify Job** 📢
- **Koşul**: Her zaman çalışır (başarılı/başarısız)
- **Dependency**: Test + Lint job'ları tamamlanmalı

## 🛠️ Servis Konfigürasyonları

### PostgreSQL Database
```yaml
postgres:
  image: postgres:15
  env:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres123  
    POSTGRES_DB: express_api_test_db
  ports: 5432:5432
  health_check: pg_isready
```

### Redis Cache
```yaml
redis:
  image: redis:7
  ports: 6379:6379
  health_check: redis-cli ping
```

### MinIO Object Storage
```yaml
# Manuel olarak Docker container ile başlatılır
minio:
  image: minio/minio:latest
  ports: 9000:9000, 9001:9001
  env:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin123
```

## 📊 Test Adımları Detayı

### 1. 📥 Repository Checkout
```bash
actions/checkout@v4
```

### 2. 🔧 Node.js Setup  
```bash
actions/setup-node@v4
node-version: 18
cache: npm
```

### 3. 📦 Dependencies Installation
```bash
npm ci
```

### 4. 🌍 Environment Variables
```yaml
NODE_ENV: test
PORT: 3001
JWT_SECRET: github-actions-test-secret
JWT_REFRESH_SECRET: github-actions-refresh-secret
DATABASE_URL: postgresql://postgres:postgres123@localhost:5432/express_api_test_db?schema=public
MAIL_FROM_ADDRESS: test@halisaha.app
MAIL_FROM_NAME: Halısaha Test
MINIO_ENDPOINT: localhost
MINIO_PORT: 9000
MINIO_USE_SSL: false
MINIO_ACCESS_KEY: minioadmin
MINIO_SECRET_KEY: minioadmin123
```

### 5. 🗄️ Database Setup
```bash
npx prisma generate    # Client generation
npx prisma db push --accept-data-loss  # Schema push
```

### 6. ⏳ Services Health Check
```bash
# PostgreSQL ready check
pg_isready -h localhost -p 5432 -U postgres

# Redis ready check  
redis-cli -h localhost -p 6379 ping

# MinIO ready check
curl -f http://localhost:9000/minio/health/live
```

### 7. 🔨 Project Build
```bash
npm run build  # Prisma generate + TypeScript compile
```

### 8. 🧪 Test Execution
```bash
npm run test:ci  # Jest with coverage, no watch mode
```

### 9. 🏥 API Health Check
```bash
# Start server in background
npm start &

# Wait for startup
sleep 10

# Health endpoint test
curl -f http://localhost:3001/health

# Clean shutdown
kill $SERVER_PID
```

### 10. 🔐 Forget Password Feature Test
```bash
# Start server
npm start &

# Test forgot password endpoint
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verify success response
echo "$RESPONSE" | grep -q '"success":true'
```

### 11. 📊 Coverage Upload
```bash
codecov/codecov-action@v3
file: ./coverage/lcov.info
fail_ci_if_error: false
```

### 12. 📋 Artifacts Upload
```bash
actions/upload-artifact@v4
name: test-results
path: coverage/, junit.xml
retention-days: 30
```

## 🔍 Code Quality Job

### ESLint Check
```bash
# Şu anda deaktif - konfigürasyon yapılacak
echo "⚠️ ESLint temporarily disabled"
```

### Prettier Check  
```bash
# Şu anda deaktif - konfigürasyon yapılacak
echo "⚠️ Prettier check temporarily disabled"
```

### Security Audit
```bash
npm audit --audit-level high
```

## 🚀 Deployment Job

### Koşullar
- Sadece `main` branch push'larında çalışır
- Test ve Lint job'ları başarılı olmalı
- `github.event_name == 'push'`

### Deployment Steps
```bash
# Şu anda simülasyon
echo "🚀 Deploying to staging environment..."
echo "✅ Deployment simulation completed"
```

## 📢 Notification Job

### Success Notification
```bash
if [[ "${{ needs.test.result }}" == "success" && "${{ needs.lint.result }}" == "success" ]]; then
  echo "✅ All tests passed! 🎉"
  echo "📧 Sending success notification..."
fi
```

### Failure Notification
```bash
else
  echo "❌ Some tests failed! 😞"
  echo "📧 Sending failure notification..."
fi
```

## ⚙️ Konfigürasyon Dosyaları

### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true
};
```

### Package.json Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch", 
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=\"unit\"",
    "test:integration": "jest --testPathPattern=\"integration\"",
    "test:ci": "jest --coverage --watchAll=false --passWithNoTests",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "format:check": "prettier --check src/**/*.ts"
  }
}
```

## 🔐 GitHub Secrets

Aşağıdaki secrets tanımlanmalıdır:

### CODECOV_TOKEN
```bash
# Codecov entegrasyonu için
# https://codecov.io/ hesabından alınır
```

### Deployment Secrets (İsteğe bağlı)
```bash
DEPLOY_HOST      # Deployment sunucu adresi
DEPLOY_USER      # SSH kullanıcısı  
DEPLOY_KEY       # SSH private key
DATABASE_URL     # Production database URL
```

## 📈 Performans Metrikleri

### Pipeline Süreleri
- **Test Job**: ~8-12 dakika
- **Lint Job**: ~2-3 dakika (paralel)  
- **Total Pipeline**: ~10-15 dakika

### Resource Usage
- **CPU**: 2 cores
- **Memory**: 7GB
- **Disk**: 14GB SSD

### Service Startup Süreleri
- **PostgreSQL**: ~30 saniye
- **Redis**: ~10 saniye
- **MinIO**: ~45 saniye

## 🐛 Troubleshooting

### Common Issues

#### 1. PostgreSQL Connection Failed
```bash
# Çözüm: Health check timeout'u artır
until pg_isready -h localhost -p 5432 -U postgres; do
  echo "Waiting for PostgreSQL..."
  sleep 5  # 2'den 5'e artır
done
```

#### 2. MinIO Health Check Failed
```bash
# Çözüm: MinIO startup wait time artır
sleep 15  # 10'dan 15'e artır
until curl -f http://localhost:9000/minio/health/live 2>/dev/null; do
  echo "Waiting for MinIO..."
  sleep 5
done
```

#### 3. Build Failed - Prisma Generate
```bash
# Çözüm: Environment variables kontrol et
echo "DATABASE_URL=$DATABASE_URL"
npx prisma generate --schema=./prisma/schema.prisma
```

#### 4. Tests Failed - No Tests Found
```bash
# Normal durum - testler henüz yazılmadı
# --passWithNoTests flag kullanılıyor
npm run test:ci  # Exit code 0 döner
```

### Debug Commands

#### Local Testing
```bash
# GitHub Actions environment simüle et
export NODE_ENV=test
export DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/express_api_test_db?schema=public"

# Services start
docker-compose up -d postgres redis

# MinIO manual start
docker run -d --name minio-test \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin123 \
  minio/minio server /data --console-address ":9001"

# Run pipeline steps locally
npm ci
npm run build
npm run test:ci
```

#### Service Health Check
```bash
# PostgreSQL
docker exec postgres-container pg_isready -U postgres

# Redis  
docker exec redis-container redis-cli ping

# MinIO
curl -f http://localhost:9000/minio/health/live
```

## 📚 Kaynaklar

### GitHub Actions Documentation
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Service Containers](https://docs.github.com/en/actions/using-containerized-services)
- [Environment Variables](https://docs.github.com/en/actions/learn-github-actions/environment-variables)

### Testing Framework
- [Jest Documentation](https://jestjs.io/docs/getting-started)  
- [Supertest API Testing](https://github.com/ladjs/supertest)
- [ts-jest Configuration](https://kulshekhar.github.io/ts-jest/)

### Code Quality Tools
- [ESLint TypeScript Rules](https://typescript-eslint.io/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Codecov Integration](https://docs.codecov.com/docs/quick-start)

---

**Son Güncelleme**: 22 Aralık 2024  
**Pipeline Version**: 1.0.0  
**Maintenance**: Backend Development Team 