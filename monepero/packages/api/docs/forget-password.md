# 🔐 Forget Password (Şifre Sıfırlama) Özelliği

Halısaha Rezervasyon Platformu için güvenli şifre sıfırlama sistemi.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [API Endpoints](#api-endpoints)
- [Kullanım Örnekleri](#kullanım-örnekleri)
- [Email Templates](#email-templates)
- [Güvenlik Özellikleri](#güvenlik-özellikleri)
- [Database Schema](#database-schema)
- [Test Senaryoları](#test-senaryoları)

## 🎯 Genel Bakış

Forget Password özelliği, kullanıcıların şifrelerini unuttuklarında güvenli bir şekilde yeni şifre belirlemelerine olanak tanır.

### Akış
1. **Email Gönderimi**: Kullanıcı email adresi ile şifre sıfırlama talebi
2. **OTP Oluşturma**: 6 haneli kod oluşturulur ve database'e kaydedilir
3. **Email Gönderimi**: Türkiye saati ile güzel template'li email gönderilir
4. **Şifre Sıfırlama**: OTP kodu ile yeni şifre belirlenir
5. **Onay Emaili**: Başarılı değişiklik için onay emaili

## 🚀 API Endpoints

### 1. Forgot Password - OTP Gönderme

**POST** `/api/v1/auth/forgot-password`

Kullanıcının email adresine şifre sıfırlama kodu gönderir.

#### Request Body
```json
{
  "email": "kullanici@email.com"
}
```

#### Response
```json
{
  "success": true,
  "message": "If the email exists, a password reset code has been sent",
  "timestamp": "2025-06-28T10:41:00.000Z",
  "statusCode": 200
}
```

#### Curl Örneği
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
-H "Content-Type: application/json" \
-d '{"email":"hasanaliarikan077@gmail.com"}'
```

---

### 2. Reset Password - Şifre Sıfırlama

**POST** `/api/v1/auth/reset-password`

OTP kodu ile yeni şifre belirlenir.

#### Request Body
```json
{
  "token": "123456",
  "newPassword": "yeniSifre123"
}
```

#### Response
```json
{
  "success": true,
  "message": "Password reset successfully",
  "timestamp": "2025-06-28T10:42:00.000Z",
  "statusCode": 200
}
```

#### Curl Örneği
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
-H "Content-Type: application/json" \
-d '{"token":"123456","newPassword":"yeniSifre123"}'
```

## 📧 Email Templates

### Reset Code Email

Kullanıcıya gönderilen şifre sıfırlama kodu emaili:

- **Konu**: `🔐 Halısaha App - Şifre Sıfırlama Kodu`
- **6 haneli OTP kodu**: Büyük ve net görünüm
- **Türkiye saati**: Token geçerlilik süresi
- **Güvenlik uyarıları**: Önemli bilgiler
- **Kullanım talimatları**: Adım adım rehber

### Confirmation Email

Şifre değişikliği sonrası onay emaili:

- **Konu**: `✅ Halısaha App - Şifre Başarıyla Değiştirildi`
- **Başarı mesajı**: Şifre değişikliği onayı
- **İşlem detayları**: Kullanıcı ve zaman bilgisi
- **Güvenlik notu**: Şüpheli aktivite uyarısı

## 🔒 Güvenlik Özellikleri

### Token Güvenliği
- **6 haneli OTP**: Kolay kullanım için
- **15 dakika geçerlilik**: Güvenlik için kısa süre
- **Tek kullanım**: Token kullanıldıktan sonra otomatik silme
- **Zaman aşımı**: Otomatik expire kontrolü

### Email Güvenliği
- **Sender doğrulaması**: `toppesinde30@gmail.com`
- **HTML email**: Modern ve güvenli template
- **Brevo SMTP**: Güvenilir email servisi
- **No-reply**: Cevap verilmemesi için uyarı

### Validation
- **Email format**: RFC uyumlu email kontrolü
- **Password strength**: Minimum 6 karakter
- **Token format**: Sadece 6 haneli sayı
- **Rate limiting**: API abuse koruması

## 💾 Database Schema

### User Table (users)

```sql
-- Yeni eklenen alanlar
resetToken         VARCHAR(6)    NULL,     -- 6 haneli OTP kodu
resetTokenExpires  TIMESTAMP     NULL      -- Token geçerlilik süresi
```

### Example Database Entry
```sql
INSERT INTO users (
  email, reset_token, reset_token_expires
) VALUES (
  'hasanaliarikan077@gmail.com',
  '712019',
  '2025-06-28 10:55:55'
);
```

## 🧪 Test Senaryoları

### ✅ Başarılı Senaryo

1. **OTP Gönderme**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
   -H "Content-Type: application/json" \
   -d '{"email":"hasanaliarikan077@gmail.com"}'
   ```
   
2. **Database Kontrolü**
   ```sql
   SELECT email, reset_token, reset_token_expires 
   FROM users 
   WHERE email = 'hasanaliarikan077@gmail.com';
   ```
   
3. **Şifre Sıfırlama**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/reset-password \
   -H "Content-Type: application/json" \
   -d '{"token":"712019","newPassword":"yeniSifre123"}'
   ```
   
4. **Login Test**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username":"hasanaliarikan077","password":"yeniSifre123"}'
   ```

### ❌ Hata Senaryoları

#### 1. Geçersiz Email
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
-H "Content-Type: application/json" \
-d '{"email":"gecersiz-email"}'
```
**Response**: `400 - Invalid email format`

#### 2. Geçersiz Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
-H "Content-Type: application/json" \
-d '{"token":"123","newPassword":"yeniSifre123"}'
```
**Response**: `400 - Invalid reset token format`

#### 3. Expired Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
-H "Content-Type: application/json" \
-d '{"token":"111111","newPassword":"yeniSifre123"}'
```
**Response**: `400 - Invalid or expired reset token`

#### 4. Zayıf Şifre
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
-H "Content-Type: application/json" \
-d '{"token":"123456","newPassword":"123"}'
```
**Response**: `400 - Password must be at least 6 characters long`

## 🌍 Türkiye Saati Desteği

### Timezone Ayarları
- **Database**: UTC saati ile kayıt
- **Email**: Europe/Istanbul timezone (UTC+3)
- **Display**: Türkçe format (gg.aa.yyyy ss:dd)

### Örnek Saat Dönüşümü
```javascript
// Database UTC: 10:55:55
// Email Türkiye: 13:55 (UTC+3)
const turkishTime = new Date(resetTokenExpires).toLocaleString('tr-TR', {
  timeZone: 'Europe/Istanbul',
  day: '2-digit',
  month: '2-digit', 
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
```

## 📊 Monitoring & Metrics

### Log Mesajları
```javascript
console.log(`✅ Reset password email sent to: ${user.email}`);
console.log(`✅ Password reset successful for user: ${user.email}`);
console.error('❌ Email sending failed:', error);
```

### Metrics (Commented Out)
```javascript
// metricsService.recordAuthAttempt('forgot_password');
// metricsService.recordAuthSuccess('forgot_password');
// metricsService.recordAuthFailure('forgot_password', 'internal_error');
```

## 🔧 Konfigürasyon

### Environment Variables
```bash
# Email Configuration
MAIL_FROM_ADDRESS=toppesinde30@gmail.com
MAIL_FROM_NAME=Halısaha App

# SMTP Settings (in mail.ts)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=90bc05001@smtp-brevo.com
SMTP_PASS=J7mDIhn4KTfrHwtg
```

### Constants
```javascript
// Token expiration: 15 minutes
const RESET_TOKEN_EXPIRY = 15 * 60 * 1000;

// Token length: 6 digits
const TOKEN_LENGTH = 6;

// Password minimum length
const MIN_PASSWORD_LENGTH = 6;
```

## 🚨 Önemli Notlar

1. **Güvenlik**: Email varlığını asla doğrudan bildirmeyin
2. **Token Temizliği**: Kullanım sonrası token'ları silin
3. **Rate Limiting**: Brute force saldırılara karşı koruma
4. **Email Logs**: Başarılı/başarısız email gönderimlerini logla
5. **Error Handling**: Kullanıcı dostu hata mesajları

## 📞 İletişim

Bu özellik hakkında sorularınız için:
- **Email**: hasanaliarikan077@gmail.com
- **Documentation**: Bu dosya
- **Test Environment**: http://localhost:3000/api/v1/auth/

---

**Son Güncelleme**: 28 Haziran 2025  
**Versiyon**: 1.0.0  
**Durum**: Production Ready ✅ 