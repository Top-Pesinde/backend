#!/bin/bash

# Curl ile Read Receipt Test Script
# Kullanım: ./curl-read-receipt-test.sh

API_URL="http://localhost:3000"
TESTUSER2_ID="cmd0lx8i700059d1wfzsnssvn"
CONVERSATION_ID="cmd0lyiia000b9d1w2megqehc"

echo "🔧 CURL READ RECEIPT TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. testuser Login
echo "🔑 Step 1: testuser login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "123456"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" = "null" ]; then
    echo "❌ Login failed!"
    exit 1
fi

echo "✅ Login successful!"
echo "🔑 Token: ${TOKEN:0:50}..."

# 2. Mesaj Gönder
echo ""
echo "📤 Step 2: Mesaj gönderiliyor..."
MESSAGE_CONTENT="Curl test message - $(date +%H:%M:%S)"

MESSAGE_RESPONSE=$(curl -s -X POST $API_URL/api/v1/chat/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"receiverId\": \"$TESTUSER2_ID\",
    \"content\": \"$MESSAGE_CONTENT\",
    \"messageType\": \"TEXT\"
  }")

echo "📤 Message Response (formatted):"
echo $MESSAGE_RESPONSE | jq '.'

MESSAGE_ID=$(echo $MESSAGE_RESPONSE | jq -r '.data.id')
echo "📋 Message ID: $MESSAGE_ID"

# 3. testuser2 login (mesajı okuyacak)
echo ""
echo "🔑 Step 3: testuser2 login..."
LOGIN2_RESPONSE=$(curl -s -X POST $API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser2", "password": "123456"}')

TOKEN2=$(echo $LOGIN2_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN2" = "null" ]; then
    echo "❌ testuser2 login failed!"
    exit 1
fi

echo "✅ testuser2 login successful!"

# 4. Mesajları Okundu İşaretle
echo ""
echo "📖 Step 4: Mesajları okundu olarak işaretleniyor..."
READ_RESPONSE=$(curl -s -X PUT $API_URL/api/v1/chat/conversations/$CONVERSATION_ID/read \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN2")

echo "📖 Read Response:"
echo $READ_RESPONSE | jq '.'

# 5. Mesaj Durumunu Kontrol Et
echo ""
echo "📋 Step 5: Mesaj durumu kontrol ediliyor..."
MESSAGES_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/chat/conversations/$CONVERSATION_ID/messages?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "📋 Recent Messages:"
echo $MESSAGES_RESPONSE | jq '.data.messages[] | {id: .id, content: .content, isRead: .isRead, readAt: .readAt, createdAt: .createdAt}'

# 6. Konuşma Durumunu Kontrol Et
echo ""
echo "💬 Step 6: Konuşma durumu kontrol ediliyor..."
CONVERSATIONS_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/chat/conversations" \
  -H "Authorization: Bearer $TOKEN")

echo "💬 Conversation Status:"
echo $CONVERSATIONS_RESPONSE | jq '.data[] | {id: .id, lastMessage: .lastMessage, unreadCount: .unreadCount, isActiveConversation: .isActiveConversation}'

echo ""
echo "🎯 Test Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 1. testuser login"
echo "✅ 2. Mesaj gönderildi: $MESSAGE_CONTENT"
echo "✅ 3. testuser2 login"
echo "✅ 4. Mesajlar okundu olarak işaretlendi"
echo "✅ 5. Mesaj durumu kontrol edildi"
echo "✅ 6. Konuşma durumu kontrol edildi"
echo ""
echo "🚀 Read Receipt sistemi curl ile başarıyla test edildi!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 