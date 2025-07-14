#!/bin/bash

# Gerçek zamanlı mesaj okundu özelliğini test etmek için basit bir betik

echo "Monepero Gerçek Zamanlı Mesaj Okundu Özelliği Test Betiği"
echo "=================================================="
echo ""

# Kullanıcı bilgileri
USER1_EMAIL="test1@example.com"
USER1_PASSWORD="password123"
USER2_EMAIL="test2@example.com"
USER2_PASSWORD="password123"

# API URL
API_URL="http://localhost:3000/api"

# Renk kodları
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${YELLOW}1. İki test kullanıcısı için token alınıyor...${NC}"

# Kullanıcı 1 için token al
USER1_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$USER1_EMAIL"'", "password":"'"$USER1_PASSWORD"'"}' | \
  grep -o '"token":"[^"]*"' | cut -d '"' -f 4)

if [ -z "$USER1_TOKEN" ]; then
  echo -e "${RED}Hata: Kullanıcı 1 için token alınamadı!${NC}"
  exit 1
fi

echo -e "${GREEN}Kullanıcı 1 token alındı.${NC}"

# Kullanıcı 2 için token al
USER2_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$USER2_EMAIL"'", "password":"'"$USER2_PASSWORD"'"}' | \
  grep -o '"token":"[^"]*"' | cut -d '"' -f 4)

if [ -z "$USER2_TOKEN" ]; then
  echo -e "${RED}Hata: Kullanıcı 2 için token alınamadı!${NC}"
  exit 1
fi

echo -e "${GREEN}Kullanıcı 2 token alındı.${NC}"
echo ""

# Kullanıcı 1'in ID'sini al
USER1_ID=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $USER1_TOKEN" | \
  grep -o '"id":"[^"]*"' | head -1 | cut -d '"' -f 4)

if [ -z "$USER1_ID" ]; then
  echo -e "${RED}Hata: Kullanıcı 1 ID'si alınamadı!${NC}"
  exit 1
fi

# Kullanıcı 2'nin ID'sini al
USER2_ID=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $USER2_TOKEN" | \
  grep -o '"id":"[^"]*"' | head -1 | cut -d '"' -f 4)

if [ -z "$USER2_ID" ]; then
  echo -e "${RED}Hata: Kullanıcı 2 ID'si alınamadı!${NC}"
  exit 1
fi

echo -e "${YELLOW}2. Kullanıcılar arasında konuşma başlatılıyor...${NC}"

# Konuşma başlat veya mevcut konuşmayı getir
CONVERSATION_RESPONSE=$(curl -s -X POST "$API_URL/chat/conversations" \
  -H "Authorization: Bearer $USER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId":"'"$USER2_ID"'"}' \
)

CONVERSATION_ID=$(echo "$CONVERSATION_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d '"' -f 4)

if [ -z "$CONVERSATION_ID" ]; then
  echo -e "${RED}Hata: Konuşma ID'si alınamadı!${NC}"
  exit 1
fi

echo -e "${GREEN}Konuşma başlatıldı. Konuşma ID: $CONVERSATION_ID${NC}"
echo ""

echo -e "${YELLOW}3. Test Senaryosu: Gerçek Zamanlı Mesaj Okundu Özelliği${NC}"
echo -e "${BLUE}Bu özelliği test etmek için aşağıdaki adımları izleyin:${NC}"
echo ""
echo -e "1. İki farklı tarayıcı penceresi açın (veya gizli mod kullanın)"
echo -e "2. Birinci pencerede $USER1_EMAIL ile giriş yapın"
echo -e "3. İkinci pencerede $USER2_EMAIL ile giriş yapın"
echo -e "4. Her iki pencerede de aynı konuşmayı açın (Konuşma ID: $CONVERSATION_ID)"
echo -e "5. Birinci kullanıcıdan ikinci kullanıcıya mesaj gönderin"
echo -e "6. İkinci kullanıcı konuşma ekranındaysa, mesaj otomatik olarak okundu olarak işaretlenecektir"
echo -e "7. Birinci kullanıcının ekranında mesajın okunduğunu gösteren işaret (mavi tik) görünecektir"
echo ""
echo -e "${YELLOW}4. Socket.IO Bağlantı Bilgileri:${NC}"
echo -e "Kullanıcı 1 Token: ${BLUE}$USER1_TOKEN${NC}"
echo -e "Kullanıcı 2 Token: ${BLUE}$USER2_TOKEN${NC}"
echo -e "Konuşma ID: ${BLUE}$CONVERSATION_ID${NC}"
echo ""
echo -e "${YELLOW}5. Socket.IO Olayları:${NC}"
echo -e "- ${BLUE}join_conversation${NC}: Konuşmaya katılmak için"
echo -e "- ${BLUE}send_chat_message${NC}: Mesaj göndermek için"
echo -e "- ${BLUE}new_chat_message${NC}: Yeni mesaj alındığında"
echo -e "- ${BLUE}message_read${NC}: Bir mesaj okunduğunda"
echo -e "- ${BLUE}messages_read_by_user${NC}: Kullanıcı mesajları okuduğunda"
echo -e "- ${BLUE}user_joined_conversation${NC}: Bir kullanıcı konuşmaya katıldığında"
echo -e "- ${BLUE}user_left_conversation${NC}: Bir kullanıcı konuşmadan ayrıldığında"
echo ""
echo -e "${GREEN}Test betiği tamamlandı. İyi testler!${NC}"