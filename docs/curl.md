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
  -F "firstName=Berkay" \
  -F "lastName=Kaleci" \
  -F "username=berkay_kaleci" \
  -F "email=berkay@kaleci.com" \
  -F "password=123456" \
  -F "phone=5556667788" \
  -F "location=İstanbul/Fenerbahçe" \
  -F "bio=Profesyonel kaleci, 10 yıllık deneyim" \
  -F "role=GOALKEEPER" \
  -F "profilePhoto=@profile.png" \
  -F "documents=@image.png"


