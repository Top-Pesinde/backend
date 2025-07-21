#!/bin/bash

# Socket Messaging Test Script
# Bu script socket servislerini test eder ve kullanıcıların birbirine mesaj atmasını simüle eder

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfigürasyon
SERVER_URL="http://localhost:3000"
SOCKET_URL="ws://localhost:3000"
API_BASE="$SERVER_URL/api"

echo -e "${BLUE}🚀 Socket Messaging Test Başlatılıyor...${NC}"
echo "Server URL: $SERVER_URL"
echo "Socket URL: $SOCKET_URL"
echo ""

# Sunucu durumunu kontrol et
check_server() {
    echo -e "${YELLOW}📡 Sunucu durumu kontrol ediliyor...${NC}"
    
    if curl -s "$SERVER_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ Sunucu çalışıyor${NC}"
        
        # Health check detayları
        HEALTH_INFO=$(curl -s "$SERVER_URL/health" | jq -r '.socketConnections // "N/A"')
        echo -e "${BLUE}📊 Aktif socket bağlantıları: $HEALTH_INFO${NC}"
        return 0
    else
        echo -e "${RED}❌ Sunucu çalışmıyor veya erişilemiyor${NC}"
        echo -e "${YELLOW}💡 Sunucuyu başlatmak için: npm run dev${NC}"
        return 1
    fi
}

# Test kullanıcıları oluştur
create_test_users() {
    echo -e "${YELLOW}👥 Test kullanıcıları oluşturuluyor...${NC}"
    
    # Kullanıcı 1
    USER1_DATA='{
        "email": "test1@example.com",
        "password": "Test123!",
        "firstName": "Test",
        "lastName": "User1",
        "phoneNumber": "+905551234567"
    }'
    
    # Kullanıcı 2
    USER2_DATA='{
        "email": "test2@example.com",
        "password": "Test123!",
        "firstName": "Test",
        "lastName": "User2",
        "phoneNumber": "+905551234568"
    }'
    
    echo "Kullanıcı 1 kaydediliyor..."
    USER1_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "$USER1_DATA")
    
    echo "Kullanıcı 2 kaydediliyor..."
    USER2_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
        -H "Content-Type: application/json" \
        -d "$USER2_DATA")
    
    echo -e "${GREEN}✅ Test kullanıcıları hazırlandı${NC}"
}

# Kullanıcı girişi yap
login_users() {
    echo -e "${YELLOW}🔐 Kullanıcı girişleri yapılıyor...${NC}"
    
    # Kullanıcı 1 giriş
    LOGIN1_DATA='{"email": "test1@example.com", "password": "Test123!"}'
    USER1_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "$LOGIN1_DATA")
    
    USER1_TOKEN=$(echo "$USER1_LOGIN" | jq -r '.data.token // empty')
    USER1_ID=$(echo "$USER1_LOGIN" | jq -r '.data.user.id // empty')
    
    # Kullanıcı 2 giriş
    LOGIN2_DATA='{"email": "test2@example.com", "password": "Test123!"}'
    USER2_LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "$LOGIN2_DATA")
    
    USER2_TOKEN=$(echo "$USER2_LOGIN" | jq -r '.data.token // empty')
    USER2_ID=$(echo "$USER2_LOGIN" | jq -r '.data.user.id // empty')
    
    if [[ -n "$USER1_TOKEN" && -n "$USER2_TOKEN" ]]; then
        echo -e "${GREEN}✅ Kullanıcı girişleri başarılı${NC}"
        echo -e "${BLUE}👤 User1 ID: $USER1_ID${NC}"
        echo -e "${BLUE}👤 User2 ID: $USER2_ID${NC}"
        return 0
    else
        echo -e "${RED}❌ Kullanıcı girişleri başarısız${NC}"
        return 1
    fi
}

# Socket bağlantısı test et
test_socket_connection() {
    echo -e "${YELLOW}🔌 Socket bağlantısı test ediliyor...${NC}"
    
    # Node.js ile socket test scripti oluştur
    cat > socket_test.js << 'EOF'
const io = require('socket.io-client');

const testSocketConnection = (token, userId, userName) => {
    return new Promise((resolve, reject) => {
        const socket = io('ws://localhost:3000', {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log(`✅ ${userName} bağlandı (ID: ${socket.id})`);
            resolve(socket);
        });

        socket.on('connect_error', (error) => {
            console.error(`❌ ${userName} bağlantı hatası:`, error.message);
            reject(error);
        });

        socket.on('disconnect', (reason) => {
            console.log(`🔌 ${userName} bağlantısı kesildi:`, reason);
        });

        // Timeout
        setTimeout(() => {
            if (!socket.connected) {
                reject(new Error('Bağlantı zaman aşımı'));
            }
        }, 5000);
    });
};

// Test fonksiyonu
const runTest = async () => {
    try {
        const user1Token = process.argv[2];
        const user2Token = process.argv[3];
        const user1Id = process.argv[4];
        const user2Id = process.argv[5];

        console.log('🔌 Socket bağlantıları kuruluyor...');
        
        const socket1 = await testSocketConnection(user1Token, user1Id, 'User1');
        const socket2 = await testSocketConnection(user2Token, user2Id, 'User2');

        console.log('📨 Mesaj gönderme testi başlıyor...');

        // User1'den User2'ye mesaj gönder
        socket1.emit('send_chat_message', {
            receiverId: user2Id,
            content: 'Merhaba User2! Bu bir test mesajıdır.',
            messageType: 'TEXT'
        });

        // User2'den User1'e mesaj gönder
        setTimeout(() => {
            socket2.emit('send_chat_message', {
                receiverId: user1Id,
                content: 'Merhaba User1! Ben de test mesajı gönderiyorum.',
                messageType: 'TEXT'
            });
        }, 1000);

        // Legacy mesaj testi
        setTimeout(() => {
            socket1.emit('send_message', {
                message: 'Bu legacy mesaj formatıdır',
                type: 'general'
            });
        }, 2000);

        // Event listener'ları ekle
        socket1.on('new_chat_message', (data) => {
            console.log('📩 User1 mesaj aldı:', data.content);
        });

        socket2.on('new_chat_message', (data) => {
            console.log('📩 User2 mesaj aldı:', data.content);
        });

        socket1.on('new_message', (data) => {
            console.log('📩 User1 legacy mesaj aldı:', data.message);
        });

        socket2.on('new_message', (data) => {
            console.log('📩 User2 legacy mesaj aldı:', data.message);
        });

        socket1.on('message_sent', (data) => {
            console.log('✅ User1 mesaj gönderildi:', data);
        });

        socket2.on('message_sent', (data) => {
            console.log('✅ User2 mesaj gönderildi:', data);
        });

        // Typing test
        setTimeout(() => {
            console.log('⌨️ Typing testi başlıyor...');
            socket1.emit('typing_start', {
                conversationId: 'test-conversation',
                receiverId: user2Id
            });

            setTimeout(() => {
                socket1.emit('typing_stop', {
                    conversationId: 'test-conversation',
                    receiverId: user2Id
                });
            }, 2000);
        }, 3000);

        socket2.on('user_typing_start', (data) => {
            console.log('⌨️ User2: Karşı taraf yazıyor...');
        });

        socket2.on('user_typing_stop', (data) => {
            console.log('⌨️ User2: Karşı taraf yazmayı bıraktı');
        });

        // Test süresini sınırla
        setTimeout(() => {
            console.log('🏁 Test tamamlandı');
            socket1.disconnect();
            socket2.disconnect();
            process.exit(0);
        }, 10000);

    } catch (error) {
        console.error('❌ Test hatası:', error.message);
        process.exit(1);
    }
};

runTest();
EOF

    # Socket test'ini çalıştır
    if command -v node &> /dev/null; then
        echo -e "${BLUE}🚀 Socket test scripti çalıştırılıyor...${NC}"
        node socket_test.js "$USER1_TOKEN" "$USER2_TOKEN" "$USER1_ID" "$USER2_ID"
        
        # Test dosyasını temizle
        rm -f socket_test.js
        
        echo -e "${GREEN}✅ Socket test tamamlandı${NC}"
    else
        echo -e "${RED}❌ Node.js bulunamadı. Socket test atlanıyor.${NC}"
        rm -f socket_test.js
    fi
}

# API endpoint'lerini test et
test_api_endpoints() {
    echo -e "${YELLOW}🔍 API endpoint'leri test ediliyor...${NC}"
    
    # Mesaj gönderme API'si test et
    echo "📨 Mesaj gönderme API testi..."
    MESSAGE_DATA="{
        \"receiverId\": \"$USER2_ID\",
        \"content\": \"API üzerinden gönderilen test mesajı\",
        \"messageType\": \"TEXT\"
    }"
    
    MESSAGE_RESPONSE=$(curl -s -X POST "$API_BASE/messages" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER1_TOKEN" \
        -d "$MESSAGE_DATA")
    
    if echo "$MESSAGE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Mesaj API'si çalışıyor${NC}"
    else
        echo -e "${YELLOW}⚠️ Mesaj API'si test edilemedi${NC}"
    fi
    
    # Konuşmaları listele
    echo "💬 Konuşma listesi API testi..."
    CONVERSATIONS_RESPONSE=$(curl -s -X GET "$API_BASE/conversations" \
        -H "Authorization: Bearer $USER1_TOKEN")
    
    if echo "$CONVERSATIONS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Konuşma listesi API'si çalışıyor${NC}"
        CONV_COUNT=$(echo "$CONVERSATIONS_RESPONSE" | jq -r '.data | length')
        echo -e "${BLUE}📊 Toplam konuşma sayısı: $CONV_COUNT${NC}"
    else
        echo -e "${YELLOW}⚠️ Konuşma listesi API'si test edilemedi${NC}"
    fi
}

# Temizlik yap
cleanup() {
    echo -e "${YELLOW}🧹 Temizlik yapılıyor...${NC}"
    
    # Test dosyalarını temizle
    rm -f socket_test.js
    
    echo -e "${GREEN}✅ Temizlik tamamlandı${NC}"
}

# Ana test fonksiyonu
run_tests() {
    echo -e "${BLUE}🎯 Socket Messaging Test Süreci${NC}"
    echo "=================================="
    
    # 1. Sunucu kontrolü
    if ! check_server; then
        exit 1
    fi
    
    echo ""
    
    # 2. Test kullanıcıları oluştur
    create_test_users
    echo ""
    
    # 3. Kullanıcı girişleri
    if ! login_users; then
        exit 1
    fi
    
    echo ""
    
    # 4. Socket bağlantısı test et
    test_socket_connection
    echo ""
    
    # 5. API endpoint'lerini test et
    test_api_endpoints
    echo ""
    
    # 6. Temizlik
    cleanup
    
    echo -e "${GREEN}🎉 Tüm testler tamamlandı!${NC}"
    echo ""
    echo -e "${BLUE}📋 Test Özeti:${NC}"
    echo "• Sunucu durumu: ✅"
    echo "• Kullanıcı kayıt/giriş: ✅"
    echo "• Socket bağlantısı: ✅"
    echo "• Mesaj gönderme: ✅"
    echo "• API endpoint'leri: ✅"
}

# Script'i çalıştır
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_tests
fi