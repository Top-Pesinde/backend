curl -X POST http://176.96.131.222:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User", 
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "phone": "+905551234567",
    "role": "ADMIN"
  }'





  curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "firstName=hasanali" \
  -F "lastName=arıkan" \
  -F "username=hasanali" \
  -F "email=hasanali@kaleci.com" \
  -F "password=123456" \
  -F "phone=23123123123213" \
  -F "location=İstanbul/Fenerbahçe" \
  -F "bio=Profesyonel kaleci, 10 yıllık deneyim" \
  -F "role=GOALKEEPER" \
  -F "profilePhoto=@profile.png" \
  -F "documents=@image.png"




curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hasanali",
    "password": "123456"
  }'


curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." => refresh token 
  }'

  


"success":true,"message":"Login successful","data":{"user":{"id":"cmc1vfq0o0000ycjpyo31z3c5","firstName":"Berkay","lastName":"Kaleci","username":"berkay_kaleci","email":"berkay@kaleci.com","phone":"5556667788","location":"İstanbul/Fenerbahçe","bio":"Profesyonel kaleci, 10 yıllık deneyim","profilePhoto":"http://localhost:9000/profile-photos/profile-cmc1vfq0o0000ycjpyo31z3c5-1750246265987.png","lisans":false,"role":"GOALKEEPER","subscription":false,"createdAt":"2025-06-18T11:31:05.977Z","updatedAt":"2025-06-18T12:06:11.441Z","status":true,"documents":[{"id":"cmc1vfq2f0002ycjp46byqghr","fileName":"dummy.pdf","fileType":"application/pdf","filePath":"doc-cmc1vfq0o0000ycjpyo31z3c5-1750246266023-dummy.pdf","fileSize":13264,"userId":"cmc1vfq0o0000ycjpyo31z3c5","createdAt":"2025-06-18T11:31:06.040Z","updatedAt":"2025-06-18T11:31:06.040Z"}]},"accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWMxdmZxMG8wMDAweWNqcHlvMzF6M2M1IiwiZW1haWwiOiJiZXJrYXlAa2FsZWNpLmNvbSIsInJvbGUiOiJHT0FMS0VFUEVSIiwiaWF0IjoxNzUwMjUwMzQxLCJleHAiOjE3NTAyNTEyNDF9.09rbRG1oqhkpC8xzGN4dYl5-kecb0eHbod8AG08zbCc","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWMxdmZxMG8wMDAweWNqcHlvMzF6M2M1IiwiZW1haWwiOiJiZXJrYXlAa2FsZWNpLmNvbSIsInJvbGUiOiJHT0FMS0VFUEVSIiwiaWF0IjoxNzUwMjUwMzQxLCJleHAiOjE3NTA4NTUxNDF9.-PHl487ggVXvof4ki7D6Jg1OGX90n_9O726qlx0m7cM","accessTokenExpiresIn":"15m","refreshTokenExpiresIn":"7d"},"timestamp":"2025-06-18T12:39:01.91


{"success":true,"message":"Login successful","data":{"user":{"id":"cmc0f6sv100005ku5n2k9j2n2","firstName":"Berkay","lastName":"Kaleci","username":"berkay_kaleci","email":"berkay@kaleci.com","phone":"5556667788","location":"İstanbul/Fenerbahçe","bio":"Profesyonel kaleci, 10 yıllık deneyim","profilePhoto":"http://176.96.131.222:9000/profile-photos/profile-cmc0f6sv100005ku5n2k9j2n2-1750158509739.png","lisans":false,"role":"GOALKEEPER","subscription":false,"createdAt":"2025-06-17T11:08:29.725Z","updatedAt":"2025-06-17T11:08:29.776Z","status":true,"documents":[{"id":"cmc0f6sxq00025ku56uk8fjoe","fileName":"image.png","fileType":"image/png","filePath":"doc-cmc0f6sv100005ku5n2k9j2n2-1750158509782-image.png","fileSize":839695,"userId":"cmc0f6sv100005ku5n2k9j2n2","createdAt":"2025-06-17T11:08:29.822Z","updatedAt":"2025-06-17T11:08:29.822Z"}]},"accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWMwZjZzdjEwMDAwNWt1NW4yazlqMm4yIiwiZW1haWwiOiJiZXJrYXlAa2FsZWNpLmNvbSIsInJvbGUiOiJHT0FMS0VFUEVSIiwiaWF0IjoxNzUwMTU4NzY4LCJleHAiOjE3NTAxNTk2Njh9.4j1lVxnOobFJcaqVI8pnJsnzSspyO7VuQrSa-QePaI0","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWMwZjZzdjEwMDAwNWt1NW4yazlqMm4yIiwiZW1haWwiOiJiZXJrYXlAa2FsZWNpLmNvbSIsInJvbGUiOiJHT0FMS0VFUEVSIiwiaWF0IjoxNzUwMTU4NzY4LCJleHAiOjE3NTA3NjM1Njh9.coi99wQS7wnTz4lKMtV6JNDNpKdRuv_FtCK3f-JDHDE","accessTokenExpiresIn":"15m","refreshTokenExpiresIn":"7d"},"timestamp":"2025-06-17T11:12:48.491Z"}root@ubuntu:~/services# 


eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWMwZjZzdjEwMDAwNWt1NW4yazlqMm4yIiwiZW1haWwiOiJiZXJrYXlAa2FsZWNpLmNvbSIsInJvbGUiOiJHT0FMS0VFUEVSIiwiaWF0IjoxNzUwMTU4NjkwLCJleHAiOjE3NTAxNTk1OTB9.JBHRX1W_gSkmTl_tP5Vim_7_vA3AkZNG_sRT3znBc00




eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWMwZjZzdjEwMDAwNWt1NW4yazlqMm4yIiwiZW1haWwiOiJiZXJrYXlAa2FsZWNpLmNvbSIsInJvbGUiOiJHT0FMS0VFUEVSIiwiaWF0IjoxNzUwMTU4NzY4LCJleHAiOjE3NTAxNTk2Njh9.4j1lVxnOobFJcaqVI8pnJsnzSspyO7VuQrSa-QePaI0



curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWMwZjZzdjEwMDAwNWt1NW4yazlqMm4yIiwiZW1haWwiOiJiZXJrYXlAa2FsZWNpLmNvbSIsInJvbGUiOiJHT0FMS0VFUEVSIiwiaWF0IjoxNzUwMTU4NzY4LCJleHAiOjE3NTAxNTk2Njh9.4j1lVxnOobFJcaqVI8pnJsnzSspyO7VuQrSa-QePaI0" \
  -d '{
    "currentPassword": "123456",
    "newPassword": "yeni_sifre123"
  }'

# İletişim Bilgilerini Güncelleme
curl -X PUT http://localhost:3000/api/v1/auth/contact-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "email": "yeni_email@example.com",
    "phone": "5551234567",
    "location": "Ankara"
  }'

# Sadece telefon güncelleme
curl -X PUT http://localhost:3000/api/v1/auth/contact-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "phone": "+905551234567"
  }'

# Sadece email güncelleme
curl -X PUT http://localhost:3000/api/v1/auth/contact-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "email": "new_email@example.com"
  }'

# Sadece location güncelleme
curl -X PUT http://localhost:3000/api/v1/auth/contact-info \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "location": "İstanbul/Beşiktaş"
  }'