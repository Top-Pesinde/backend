# API Kuralları ve Standartları

Bu dokümanda halısaha rezervasyon platformunun API kuralları, standartları ve best practice'leri tanımlanmıştır.

## 🎯 API Genel Kuralları

### 1. Temel Prensipler
- **RESTful**: Tüm endpoint'ler REST standartlarına uygun olmalıdır
- **Versioning**: API versiyonlama `/api/v1/` formatında yapılır
- **Consistency**: Tutarlı response formatları kullanılır
- **Security**: JWT tabanlı authentication zorunludur
- **Documentation**: Tüm endpoint'ler dokümante edilmelidir

### 2. Base URL
```
http://localhost:3000/api/v1
```

### 3. HTTP Status Codes
- `200 OK` - Başarılı GET/PUT istekleri
- `201 Created` - Başarılı POST istekleri
- `400 Bad Request` - Geçersiz istek
- `401 Unauthorized` - Authentication gerekli
- `403 Forbidden` - Yetki yetersiz
- `404 Not Found` - Kaynak bulunamadı
- `422 Unprocessable Entity` - Validation hatası
- `500 Internal Server Error` - Sunucu hatası

## 🔐 Authentication & Authorization

### JWT Token Kuralları
```javascript
// Header format
Authorization: Bearer <access_token>

// Token süreleri
access_token: 15 dakika
refresh_token: 7 gün
```

### Rol Bazlı Erişim (RBAC)
```javascript
// Roller
USER                 // Normal kullanıcı
GOALKEEPER          // Kaleci
REFEREE             // Hakem  
FOOTBALL_FIELD_OWNER // Halısaha sahibi
ADMIN               // Sistem yöneticisi
```

## 📝 Request/Response Formatları

### Standard Response Format
```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null,
  "timestamp": string (ISO 8601),
  "statusCode": number
}
```

### Error Response Format
```json
{
  "success": false,
  "message": string,
  "error": {
    "code": string,
    "details": object
  },
  "timestamp": string (ISO 8601),
  "statusCode": number
}
```

### Pagination Format
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🛠 Endpoint Kuralları

### 1. Authentication Endpoints
```bash
POST /api/v1/auth/register     # Kullanıcı kaydı
POST /api/v1/auth/login        # Kullanıcı girişi
POST /api/v1/auth/refresh      # Token yenileme
GET  /api/v1/auth/profile      # Profil bilgileri
PUT  /api/v1/auth/profile      # Profil güncelleme
```

### 2. User Management Endpoints
```bash
GET    /api/v1/users           # Kullanıcı listesi (ADMIN)
GET    /api/v1/users/:id       # Kullanıcı detayı
PUT    /api/v1/users/:id       # Kullanıcı güncelleme
DELETE /api/v1/users/:id       # Kullanıcı silme (ADMIN)
```

### 3. Field Listing Endpoints
```bash
GET    /api/v1/field-listings              # Tüm ilanlar
POST   /api/v1/field-listings              # İlan oluşturma (FIELD_OWNER)
GET    /api/v1/field-listings/:id          # İlan detayı
PUT    /api/v1/field-listings/:id          # İlan güncelleme (FIELD_OWNER)
DELETE /api/v1/field-listings/:id          # İlan silme (FIELD_OWNER)
GET    /api/v1/field-listings/my/listing   # Kullanıcının ilanları
```

### 4. Upload Endpoints
```bash
POST /api/v1/uploads/profile-photo    # Profil fotoğrafı
POST /api/v1/uploads/documents        # Doküman yükleme
POST /api/v1/uploads/field-photos     # Halısaha fotoğrafları (FIELD_OWNER)
PUT  /api/v1/uploads/field-photos     # Fotoğraf güncelleme (FIELD_OWNER)
```

## 📊 Data Validation Kuralları

### 1. Kullanıcı Kaydı Validation
```javascript
{
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZğüşıöçĞÜŞIÖÇ\s]+$/
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZğüşıöçĞÜŞIÖÇ\s]+$/
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    unique: true
  },
  email: {
    required: true,
    format: "email",
    unique: true
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 100
  },
  phone: {
    required: true,
    pattern: /^\+90[0-9]{10}$/
  },
  role: {
    required: true,
    enum: ["USER", "GOALKEEPER", "REFEREE", "FOOTBALL_FIELD_OWNER", "ADMIN"]
  }
}
```

### 2. Halısaha İlanı Validation
```javascript
{
  fieldName: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  fieldAddress: {
    required: true,
    minLength: 10,
    maxLength: 200
  },
  hourlyPrice: {
    required: true,
    type: "number",
    min: 50,
    max: 1000
  },
  isIndoor: {
    required: true,
    type: "boolean"
  },
  surfaceType: {
    required: true,
    enum: ["GRASS", "ARTIFICIAL", "CONCRETE", "CARPET"]
  },
  contactType: {
    required: true,
    enum: ["PHONE", "WHATSAPP"]
  },
  features: {
    type: "array",
    items: {
      enum: ["CHANGING_ROOM", "SHOWER", "PARKING", "FREE_WIFI", "TOILET", "CAFE", "TRIBUNE", "RENTAL_SHOES", "RENTAL_GLOVES"]
    }
  },
  schedules: {
    required: true,
    type: "array",
    minItems: 1,
    items: {
      dayOfWeek: {
        enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
      },
      startTime: {
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      endTime: {
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    }
  }
}
```

## 🖼 File Upload Kuralları

### 1. Dosya Tipleri
```javascript
// Profil fotoğrafları
profilePhoto: {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSize: "5MB",
  dimensions: "min: 100x100, max: 2000x2000"
}

// Halısaha fotoğrafları  
fieldPhotos: {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSize: "10MB",
  maxCount: 3,
  dimensions: "min: 300x300, max: 4000x4000"
}

// Dokümanlar
documents: {
  allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
  maxSize: "20MB",
  maxCount: 5
}
```

### 2. MinIO Bucket Yapısı
```javascript
buckets: {
  "profile-photos": "Kullanıcı profil fotoğrafları",
  "documents": "Kullanıcı dokümanları", 
  "fields": "Halısaha fotoğrafları",
  "general-uploads": "Genel dosyalar"
}
```

### 3. Dosya Adlandırma
```javascript
// Format: {type}-{userId}-{timestamp}.{extension}
profilePhoto: "profile-{userId}-{timestamp}.{ext}"
fieldPhoto: "field-{fieldId}-{timestamp}.{ext}"
document: "doc-{userId}-{timestamp}-{originalName}.{ext}"
```

## 🔍 Query Parameters

### 1. Pagination
```javascript
// Default values
page: 1          // Sayfa numarası
limit: 10        // Sayfa başına öğe (max: 100)
sort: "createdAt"  // Sıralama alanı
order: "desc"    // Sıralama yönü (asc/desc)
```

### 2. Filtering
```javascript
// Field Listing filtreleme
location: string     // Lokasyon filtreleme
minPrice: number     // Minimum fiyat
maxPrice: number     // Maksimum fiyat
isIndoor: boolean    // Kapalı/açık saha
surfaceType: enum    // Zemin tipi
features: array      // Özellikler (OR operatörü)
```

### 3. Search
```javascript
search: string       // Genel arama (fieldName, fieldAddress)
```

## ⚡ Performance Kuralları

### 1. Rate Limiting
```javascript
// Global rate limit
general: "100 req/15min per IP"

// Authentication endpoints
auth: "5 req/15min per IP"

// Upload endpoints  
uploads: "10 req/15min per user"
```

### 2. Caching
```javascript
// Redis cache stratejisi
userProfile: "1 hour"
fieldListings: "30 minutes" 
fieldDetails: "1 hour"
```

### 3. Database Optimization
```javascript
// Index'ler
users: ["email", "username", "role"]
fieldListings: ["userId", "isActive", "location", "hourlyPrice"]
schedules: ["fieldListingId", "dayOfWeek"]
features: ["fieldListingId", "featureType"]
```

## 🔒 Security Kuralları

### 1. Input Sanitization
- Tüm user input'ları sanitize edilmelidir
- SQL injection koruması
- XSS koruması
- Path traversal koruması

### 2. CORS Policy
```javascript
corsOptions: {
  origin: ["http://localhost:3000", "https://yourdomain.com"],
  credentials: true,
  optionsSuccessStatus: 200
}
```

### 3. Helmet.js Security Headers
```javascript
helmet: {
  contentSecurityPolicy: true,
  hsts: true,
  noSniff: true,
  frameguard: true
}
```

## 📋 Testing Kuralları

### 1. Unit Tests
- Tüm service fonksiyonları test edilmelidir
- Controller'lar test edilmelidir
- Minimum %80 code coverage

### 2. Integration Tests
- API endpoint'leri test edilmelidir
- Database operasyonları test edilmelidir
- File upload işlemleri test edilmelidir

### 3. Test Data
```javascript
// Test kullanıcıları
testUsers: {
  admin: "admin@test.com",
  fieldOwner: "owner@test.com", 
  user: "user@test.com"
}

// Test senaryoları
scenarios: [
  "Kullanıcı kaydı ve girişi",
  "İlan oluşturma ve güncelleme",
  "Fotoğraf yükleme",
  "Yetki kontrolleri"
]
```

## 📊 Monitoring & Metrics

### 1. Health Check
```bash
GET /health
# Response: { status: "OK", timestamp: "...", uptime: "..." }
```

### 2. Metrics Endpoint
```bash
GET /api/metrics
# Prometheus formatında metrikler
```

### 3. Logging
```javascript
logLevels: {
  error: "Kritik hatalar",
  warn: "Uyarılar", 
  info: "Genel bilgiler",
  debug: "Debug bilgileri"
}

logFormat: {
  timestamp: "ISO 8601",
  level: "string",
  message: "string",
  metadata: "object"
}
```

## 🚀 Deployment Kuralları

### 1. Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_POOL_SIZE=10

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Server
PORT=3000
NODE_ENV=production
```

### 2. Docker Configuration
```dockerfile
# Multi-stage build
# Production optimized
# Health checks included
# Non-root user
```

### 3. CI/CD Pipeline
```yaml
stages:
  - test
  - build  
  - deploy
  
requirements:
  - All tests pass
  - Code coverage > 80%
  - Security scan pass
  - Performance benchmarks pass
```

---

**Doküman Versiyonu**: 1.0.0  
**Son Güncelleme**: 22 Haziran 2025  
**Sorumlu**: Backend Development Team 