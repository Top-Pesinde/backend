# 🌐 Remote Database Setup Guide

Farklı bir PC'den PostgreSQL veritabanınıza bağlanmak için bu adımları takip edin.

## 📋 Gereksinimler

1. PostgreSQL sunucusunun çalıştığı makine
2. İstemci makinesi (farklı PC)
3. Network bağlantısı

## 🔧 PostgreSQL Sunucusu Konfigürasyonu

### 1. PostgreSQL Konfigürasyonunu Düzenleme

```bash
# PostgreSQL config dosyasını bulma
sudo find /etc -name "postgresql.conf" 2>/dev/null
# Veya
sudo find /var/lib/postgresql -name "postgresql.conf" 2>/dev/null

# Config dosyasını düzenleme
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Aşağıdaki satırı bulun ve değiştirin:
```conf
# Eski:
#listen_addresses = 'localhost'

# Yeni (tüm IP'lerden bağlantıya izin ver):
listen_addresses = '*'

# Veya sadece belirli IP'den:
listen_addresses = 'localhost,192.168.1.100'
```

### 2. pg_hba.conf Dosyasını Düzenleme

```bash
# pg_hba.conf dosyasını bulma
sudo find /etc -name "pg_hba.conf" 2>/dev/null

# Dosyayı düzenleme
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Dosyanın sonuna ekleyin:
```conf
# IPv4 remote connections
host    all             all             0.0.0.0/0               md5

# Veya sadece belirli IP aralığı için:
host    all             all             192.168.1.0/24          md5
```

### 3. PostgreSQL'i Yeniden Başlatma

```bash
sudo systemctl restart postgresql
# Veya
sudo service postgresql restart
```

### 4. Firewall Ayarları

```bash
# Ubuntu/Debian için
sudo ufw allow 5432/tcp

# CentOS/RHEL için
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

## 🔄 İstemci Makinesi Konfigürasyonu

### 1. Environment Dosyasını Kopyalama

```bash
# API dizinine git
cd packages/api

# Remote config'i ana config olarak ayarla
cp .env.remote .env
```

### 2. IP Adresini Güncelleme

`.env` dosyasında `176.96.131.222` yerine PostgreSQL sunucunuzun IP adresini yazın:

```env
DATABASE_URL="postgresql://postgres:postgres123@YOUR_SERVER_IP:5432/express_api_db?schema=public"
```

### 3. Bağlantıyı Test Etme

```bash
# Setup script'ini çalıştırma
./scripts/setup-remote.sh

# Manuel test
npx prisma db pull
```

## 📱 Hızlı Kurulum

Otomatik kurulum için:

```bash
# Remote konfigürasyonu uygula
npm run setup:remote

# Veya manuel olarak:
cd packages/api && ./scripts/setup-remote.sh
```

## 🔒 Güvenlik Önerileri

1. **Strong Password**: Veritabanı şifrenizi güçlü yapın
2. **Specific IPs**: Mümkünse sadece belirli IP'lere izin verin
3. **SSL**: Production'da SSL kullanın
4. **VPN**: Güvenli network bağlantısı kullanın
5. **Regular Updates**: PostgreSQL ve sistem güncellemelerini yapın

## 🚨 Troubleshooting

### Bağlantı Sorunları

```bash
# Port kontrolü
netstat -tlnp | grep 5432

# PostgreSQL durumu
sudo systemctl status postgresql

# Log kontrolü
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Yaygın Hatalar

1. **Connection refused**: Firewall veya listen_addresses problemi
2. **Authentication failed**: pg_hba.conf konfigürasyonu
3. **Timeout**: Network bağlantı problemi

## 📖 Environment Dosyaları

- `.env.example`: Template dosyası
- `.env.remote`: Uzak bağlantı konfigürasyonu
- `.env.local`: Yerel development konfigürasyonu
- `.env.production`: Production konfigürasyonu 