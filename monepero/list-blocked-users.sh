#!/bin/bash

# Engellenmiş kullanıcıları listeleyen script
# Kullanım: ./list-blocked-users.sh

API_URL="http://localhost:3000"

echo "📋 Engellenmiş kullanıcılar listeleniyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Login olup token al
echo "🔑 Login oluyor..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" = "null" ]; then
    echo "❌ Login başarısız!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login başarılı!"

# Engellenmiş kullanıcıları getir
echo "📋 Engellenmiş kullanıcılar getiriliyor..."
BLOCKED_RESPONSE=$(curl -s -X GET $API_URL/api/v1/chat/blocked-users \
  -H "Authorization: Bearer $TOKEN")

echo "📤 Blocked Users Response: $BLOCKED_RESPONSE"

SUCCESS=$(echo $BLOCKED_RESPONSE | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
    BLOCKED_COUNT=$(echo $BLOCKED_RESPONSE | jq -r '.data | length')
    
    if [ "$BLOCKED_COUNT" -eq 0 ]; then
        echo "✅ Hiç engellenmiş kullanıcı yok!"
    else
        echo "📊 Toplam $BLOCKED_COUNT engellenmiş kullanıcı bulundu:"
        echo ""
        
        # Her engellenmiş kullanıcıyı listele
        echo $BLOCKED_RESPONSE | jq -r '.data[] | 
        "🚫 " + .blockedUser.firstName + " " + .blockedUser.lastName + 
        " (@" + .blockedUser.username + ")" +
        "\n   ID: " + .blockedUser.id +
        "\n   Sebep: " + (.reason // "Sebep belirtilmemiş") +
        "\n   Tarih: " + .createdAt +
        "\n   Engeli kaldırma: ./unblock-user.sh " + .blockedUser.id +
        "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"'
    fi
else
    ERROR_MSG=$(echo $BLOCKED_RESPONSE | jq -r '.message')
    echo "❌ Engellenmiş kullanıcılar getirilemedi: $ERROR_MSG"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 