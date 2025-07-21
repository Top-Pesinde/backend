#!/bin/bash

# Basit Socket Test Script
# Kullanıcıların birbirine mesaj atmasını test eder

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_URL="http://localhost:3000"

echo -e "${BLUE}🚀 Basit Socket Mesajlaşma Testi${NC}"
echo "================================"

# Sunucu kontrolü
echo -e "${YELLOW}📡 Sunucu kontrol ediliyor...${NC}"
if curl -s "$SERVER_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Sunucu çalışıyor${NC}"
    
    # Socket bağlantı sayısını göster
    CONNECTIONS=$(curl -s "$SERVER_URL/health" | jq -r '.socketConnections // 0')
    echo -e "${BLUE}📊 Aktif socket bağlantıları: $CONNECTIONS${NC}"
else
    echo -e "${RED}❌ Sunucu çalışmıyor!${NC}"
    echo -e "${YELLOW}💡 Sunucuyu başlatın: npm run dev${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Socket servisi hazır!${NC}"
echo ""
echo -e "${BLUE}📋 Test Senaryoları:${NC}"
echo "1. İki kullanıcı socket'e bağlanır"
echo "2. Kullanıcı 1 → Kullanıcı 2 mesaj gönderir"
echo "3. Kullanıcı 2 → Kullanıcı 1 mesaj gönderir"
echo "4. Typing indicator test edilir"
echo "5. Legacy mesaj formatı test edilir"
echo ""

# Node.js socket client oluştur
cat > simple_socket_client.js << 'EOF'
const io = require('socket.io-client');
const https = require('https');
const http = require('http');

// HTTP request helper
const makeRequest = (url, options, data) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: options.headers || {}
        };

        const req = client.request(requestOptions, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve(result);
                } catch (error) {
                    resolve({ success: false, error: 'Invalid JSON response' });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
};

// Test kullanıcıları için kayıt ve giriş fonksiyonları
const registerUser = async (userData) => {
    try {
        // Test için basit JSON formatında gönder
        const result = await makeRequest('http://localhost:3000/api/v1/auth/register', {
            method: 'POST',
            headers: {
                'Content∫-Type': 'application/json',
            }
        }, userData);
        
        return result;
    } catch (error) {
        console.error('Kayıt hatası:', error);
        return { success: false, error: error.message };
    }
};

const loginUser = async (loginData) => {
    try {
        const result = await makeRequest('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        }, loginData);
        
        return result;
    } catch (error) {
        console.error('Giriş hatası:', error);
        return { success: false, error: error.message };
    }
};

// Test kullanıcı bilgileri
const testUsers = [
    {
        firstName: 'Socket',
        lastName: 'Test1',
        username: 'sockettest1',
        email: 'sockettest1@example.com',
        password: 'Test123!',
        phone: '+905551234567',
        role: 'USER',
        location: 'İstanbul'
    },
    {
        firstName: 'Socket',
        lastName: 'Test2', 
        username: 'sockettest2',
        email: 'sockettest2@example.com',
        password: 'Test123!',
        phone: '+905551234568',
        role: 'USER',
        location: 'İstanbul'
    }
];

const createSocketClient = (token, user) => {
    const socket = io('http://localhost:3000', {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling'],
        forceNew: true
    });

    socket.on('connect', () => {
        console.log(`✅ ${user.firstName} bağlandı (Socket ID: ${socket.id})`);
    });

    socket.on('connect_error', (error) => {
        console.error(`❌ ${user.firstName} bağlantı hatası:`, error.message);
    });

    socket.on('disconnect', (reason) => {
        console.log(`🔌 ${user.firstName} bağlantısı kesildi: ${reason}`);
    });

    

    // Mesaj alma event'leri
    socket.on('new_message', (data) => {
        console.log(`📩 ${user.firstName} mesaj aldı: "${data.message}"`);
    });

    socket.on('new_chat_message', (data) => {
        // Artık content yerine data.message.content kullanıyoruz
        console.log(`💬 ${user.firstName} chat mesajı aldı: "${data.message?.content}"`);
    });

    socket.on('message_sent', (data) => {
        // Legacy için messageId, yeni için message.id
        const id = data.messageId || data.message?.id;
        console.log(`✅ ${user.firstName} mesaj gönderildi (ID: ${id})`);
    });

    socket.on('user_typing_start', () => {
        console.log(`⌨️ ${user.firstName}: Karşı taraf yazıyor...`);
    });

    socket.on('user_typing_stop', () => {
        console.log(`⌨️ ${user.firstName}: Karşı taraf yazmayı bıraktı`);
    });

    socket.on('error', (error) => {
        console.error(`❌ ${user.firstName} socket hatası:`, error);
    });

    return socket;
};

// Test senaryosunu çalıştır
const runTest = async () => {
    console.log('�  Test kullanıcıları kaydediliyor...\n');
    
    // Kullanıcıları kaydet
    const user1Register = await registerUser(testUsers[0]);
    const user2Register = await registerUser(testUsers[1]);
    
    if (!user1Register.success && !user1Register.message?.includes('already exists')) {
        console.error('❌ User1 kaydedilemedi:', user1Register.message);
    } else {
        console.log('✅ User1 kaydedildi veya zaten mevcut');
    }
    
    if (!user2Register.success && !user2Register.message?.includes('already exists')) {
        console.error('❌ User2 kaydedilemedi:', user2Register.message);
    } else {
        console.log('✅ User2 kaydedildi veya zaten mevcut');
    }
    
    console.log('\n🔐 Kullanıcı girişleri yapılıyor...\n');
    
    // Kullanıcı girişleri
    const user1Login = await loginUser({
        username: testUsers[0].username,
        password: testUsers[0].password
    });
    
    const user2Login = await loginUser({
        username: testUsers[1].username,
        password: testUsers[1].password
    });
    
    if (!user1Login.success) {
        console.error('❌ User1 giriş yapamadı:', user1Login.message);
        return;
    }
    
    if (!user2Login.success) {
        console.error('❌ User2 giriş yapamadı:', user2Login.message);
        return;
    }
    
    console.log('✅ Her iki kullanıcı da giriş yaptı');
    console.log(`👤 User1 ID: ${user1Login.data.user.id}`);
    console.log(`👤 User2 ID: ${user2Login.data.user.id}`);
    console.log('🔍 User1 Login Response:', JSON.stringify(user1Login.data, null, 2));
    console.log('🔍 User2 Login Response:', JSON.stringify(user2Login.data, null, 2));
    
    console.log('\n🔌 Socket bağlantıları kuruluyor...\n');
    
    const socket1 = createSocketClient(user1Login.data.accessToken, testUsers[0]);
    const socket2 = createSocketClient(user2Login.data.accessToken, testUsers[1]);

    // Bağlantıların kurulmasını bekle
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n📨 Mesaj gönderme testleri başlıyor...\n');

    // Test 1: Legacy mesaj formatı
    setTimeout(() => {
        console.log('🧪 Test 1: Legacy mesaj formatı');
        socket1.emit('send_message', {
            message: 'Merhaba! Bu legacy format mesajıdır.',
            type: 'general'
        });
    }, 1000);

    // Test 2: Chat mesaj formatı
    setTimeout(() => {
        console.log('🧪 Test 2: Chat mesaj formatı');
        socket2.emit('send_chat_message', {
            receiverId: user1Login.data.user.id,
            content: 'Merhaba! Bu yeni chat formatıdır.',
            messageType: 'TEXT'
        });
    }, 3000);

    // Test 3: Typing indicator
    setTimeout(() => {
        console.log('🧪 Test 3: Typing indicator');
        socket1.emit('typing_start', {
            conversationId: 'test-conversation',
            receiverId: user2Login.data.user.id
        });

        setTimeout(() => {
            socket1.emit('typing_stop', {
                conversationId: 'test-conversation',
                receiverId: user2Login.data.user.id
            });
        }, 2000);
    }, 5000);

    // Test 4: Ping-Pong
    setTimeout(() => {
        console.log('🧪 Test 4: Ping-Pong');
        socket1.emit('ping');
        socket2.emit('ping');
    }, 8000);

    socket1.on('pong', () => {
        console.log('🏓 User1 pong aldı');
    });

    socket2.on('pong', () => {
        console.log('🏓 User2 pong aldı');
    });

    // Test sonlandır
    setTimeout(() => {
        console.log('\n🏁 Test tamamlandı');
        socket1.disconnect();
        socket2.disconnect();
        process.exit(0);
    }, 15000);
};

runTest().catch(console.error);
EOF

# Socket test'ini çalıştır
if command -v node &> /dev/null; then
    echo -e "${BLUE}🚀 Socket test başlatılıyor...${NC}"
    echo ""
    
    # socket.io-client paketini kontrol et ve gerekirse yükle
    if ! node -e "require('socket.io-client')" 2>/dev/null; then
        echo -e "${YELLOW}📦 socket.io-client paketi yükleniyor...${NC}"
        npm install socket.io-client --no-save 2>/dev/null || {
            echo -e "${RED}❌ socket.io-client paketi yüklenemedi!${NC}"
            echo -e "${YELLOW}💡 Manuel yükleme: npm install socket.io-client${NC}"
            rm -f simple_socket_client.js
            exit 1
        }
        echo -e "${GREEN}✅ socket.io-client paketi yüklendi${NC}"
    fi
    
    node simple_socket_client.js
    
    # Test dosyasını temizle
    rm -f simple_socket_client.js
    
    echo ""
    echo -e "${GREEN}✅ Test tamamlandı!${NC}"
else
    echo -e "${RED}❌ Node.js bulunamadı!${NC}"
    echo -e "${YELLOW}💡 Node.js yükleyin: brew install node${NC}"
    rm -f simple_socket_client.js
    exit 1
fi