# cURL Test Commands

## Authentication

### Register New User (FOOTBALL_FIELD_OWNER)
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Fatma",
    "lastName": "Halısaha",
    "username": "fatmahalısaha",
    "email": "fatma.halısaha@example.com",
    "password": "fatma123",
    "phone": "+905551234567",
    "location": "Antalya Muratpaşa",
    "bio": "Antalya'da kaliteli halısaha hizmeti sunuyoruz",
    "role": "FOOTBALL_FIELD_OWNER"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "fatmahalısaha", "password": "fatma123"}'
```

## Field Listings

### Get Current User's All Field Listings (NEW!)
```bash
curl -X GET http://localhost:3000/api/v1/field-listings/my/listings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Current User's Field Listing (Deprecated)
```bash
curl -X GET http://localhost:3000/api/v1/field-listings/my/listing \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Field Listing
```bash
curl -X POST http://localhost:3000/api/v1/field-listings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "Antalya Premium Halısaha",
    "fieldAddress": "Muratpaşa Mahallesi, Atatürk Caddesi No:123, Muratpaşa/Antalya",
    "hourlyPrice": 200,
    "isIndoor": true,
    "surfaceType": "ARTIFICIAL",
    "phone": "+905551234567",
    "contactType": "WHATSAPP",
    "description": "Modern ve temiz halısaha tesisi. Kapalı saha, soyunma odası ve duş imkanı mevcut.",
    "schedules": [
      {
        "dayOfWeek": "MONDAY",
        "startTime": "09:00",
        "endTime": "23:00",
        "isOpen": true
      },
      {
        "dayOfWeek": "TUESDAY", 
        "startTime": "09:00",
        "endTime": "23:00",
        "isOpen": true
      },
      {
        "dayOfWeek": "WEDNESDAY",
        "startTime": "09:00", 
        "endTime": "23:00",
        "isOpen": true
      },
      {
        "dayOfWeek": "THURSDAY",
        "startTime": "09:00",
        "endTime": "23:00", 
        "isOpen": true
      },
      {
        "dayOfWeek": "FRIDAY",
        "startTime": "09:00",
        "endTime": "23:00",
        "isOpen": true
      },
      {
        "dayOfWeek": "SATURDAY", 
        "startTime": "08:00",
        "endTime": "24:00",
        "isOpen": true
      },
      {
        "dayOfWeek": "SUNDAY",
        "startTime": "08:00", 
        "endTime": "24:00",
        "isOpen": true
      }
    ],
    "features": ["CHANGING_ROOM", "SHOWER", "PARKING", "FREE_WIFI"]
  }'
```

### Get All Field Listings (Public)
```bash
curl -X GET http://localhost:3000/api/v1/field-listings
```

### Get Field Listing by ID
```bash
curl -X GET http://localhost:3000/api/v1/field-listings/FIELD_ID_HERE
```

### Deactivate Field Listing
```bash
curl -X PATCH http://localhost:3000/api/v1/field-listings/my/listing/deactivate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## File Uploads

### Upload Field Photos
```bash
curl -X POST http://localhost:3000/api/v1/uploads/field-photos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg"
```

### Update Field Photos  
```bash
curl -X PUT http://localhost:3000/api/v1/uploads/field-photos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "photos=@/path/to/photo1.jpg" \
  -F "photos=@/path/to/photo2.jpg" \
  -F "photos=@/path/to/photo3.jpg"
```


