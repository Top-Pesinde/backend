const io = require('socket.io-client');

async function testRealtimeRead() {
    console.log('🧪 Basit Okundu Testi Başlıyor...');
    
    // Login
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'sockettest1',
            password: '123456'
        })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data.accessToken;
    
    // Socket bağlantısı
    const socket = io('http://localhost:3000', {
        auth: { token }
    });
    
    socket.on('connect', () => {
        console.log('🔌 Bağlandı');
        
        // Konuşmaya katıl
        socket.emit('join_conversation', { 
            conversationId: 'cmdc5v9w9000bo165nvptez6z' 
        });
    });
    
    // ⭐ EN ÖNEMLİ KISIM: Okundu bilgisini dinle
    socket.on('messages_read_by_user', (data) => {
        console.log('\n🎉 MESAJINIZ OKUNDU!');
        console.log('👤 Okuyan:', data.userId);
        console.log('⏰ Zaman:', new Date(data.timestamp).toLocaleTimeString());
        console.log('💬 Konuşma:', data.conversationId);
        console.log('📊 Kalan okunmamış:', data.unreadCount);
        
        // Burada UI'ı güncelle
        console.log('✅ UI güncellendi: Mesajın yanına mavi tik eklendi');
    });
    
    // Mesaj gönderildiğinde
    socket.on('message_sent_success', (data) => {
        console.log('📤 Mesaj gönderildi:', data.message.content);
        console.log('⏳ Karşı tarafın okumasını bekliyorum...');
    });
    
    // Test mesajı gönder
    setTimeout(() => {
        socket.emit('send_chat_message', {
            receiverId: 'cmdc5or7q0002o1jwmldqzulb',
            content: `Test mesajı - ${new Date().toLocaleTimeString()}`
        });
    }, 2000);
    
    // 30 saniye sonra bağlantıyı kapat
    setTimeout(() => {
        console.log('🔚 Test tamamlandı');
        socket.disconnect();
        process.exit(0);
    }, 30000);
}

testRealtimeRead().catch(console.error);