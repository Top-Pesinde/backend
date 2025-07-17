#!/bin/bash

FIELD_LISTING_ID="cmd4eue5s001ujxaxq6eus6qg"

for i in $(seq 1 25); do
  USERNAME="topluuser$i"
  EMAIL="topluuser$i@example.com"
  PASSWORD="TopluSifre123!"

  # 1. Register ol
  curl -s -X POST http://localhost:3000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"Toplu$i\",\"lastName\":\"Kullanici$i\",\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"phone\":\"55510000$((100 + i))\",\"role\":\"USER\",\"location\":\"Test City\"}" > /dev/null

  # 2. Login ol ve accessToken al
  TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

  ACCESS_TOKEN=$(echo $TOKEN | jq -r '.data.accessToken')

  if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo "[$USERNAME] Login başarısız! Token alınamadı."
    continue
  fi

  # 3. Teklif için gün ve saat üret
  GUN=$((21 + (i % 7))) # 21-27 arası günler
  BAS_SAAT=$((10 + (i % 8))) # 10-17 arası saatler
  BIT_SAAT=$((BAS_SAAT + 1))

  MATCH_DATE="2025-07-$GUN"
  START_TIME=$(printf "%02d:00" $BAS_SAAT)
  END_TIME=$(printf "%02d:00" $BIT_SAAT)
  PRICE=$((1200 + i * 5))

  echo "[$USERNAME] Teklif: $MATCH_DATE $START_TIME-$END_TIME"

  # 4. Teklif at
  curl -s -X POST http://localhost:3000/api/v1/field-offers \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"fieldListingId\":\"$FIELD_LISTING_ID\",\"matchDate\":\"$MATCH_DATE\",\"startTime\":\"$START_TIME\",\"endTime\":\"$END_TIME\",\"offeredPrice\":$PRICE,\"description\":\"Toplu farklı kullanıcı teklifi $i\"}" \
    | jq '.message, .statusCode'
done




curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ali",
    "lastName": "Veli",
    "username": "aliveli123",
    "email": "aliveli123@example.com",
    "password": "GizliSifre123!",
    "phone": "05377285105",
    "location": "Istanbul",
    "bio": "Futbolu severim",
    "role": "ADMIN"
  }'