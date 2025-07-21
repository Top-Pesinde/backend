const io = require('socket.io-client');

// Test: 5 saniye sonra bildirim sistemi
async function testDelayedNotification() {
    console.log('🧪 5 Saniye Sonra Bildirim Testi Başlıyor...');
    
    // User1 - Mesaj gönderen
    const user1Token = await getToken('sockettest1', '123456');
    const user1Socket = io('http://localhost:3000', {
        auth: { token: user1Token }
    });
    
    // User2 - Mesaj alan (bildirim alacak)
    const user2Token = await getToken('sockettest2', '123456');
    const user2Socket = io('http://localhost:3000', {
        auth: { token: user2Token }
    });
    
    // User1 bağlantısı
    user1Socket.on('connect', () => {
        console.log('🔌 User1 bağlandı');
        
        // Konuşmaya katıl
        user1Socket.emit('join_conversation', { 
            conversationId: 'cmdc5v9w9000bo165nvptez6z' 
        });
    });
    
    // User2 bağlantısı
    user2Socket.on('connect', () => {
        console.log('🔌 User2 bağlandı');
        
        // Konuşmaya katılma (mesajları otomatik okundu yapmamak için)
        // user2Socket.emit('join_conversation', { 
        //     conversationId: 'cmdc5v9w9000bo165nvptez6z' 
        // });
    });
    
    // User2: Yeni mesaj geldiğinde
    user2Socket.on('new_chat_message', (data) => {
        console.log('📩 User2: Yeni mesaj alındı:', data.message.content);
        console.log('⏳ User2: Mesajı OKUMUYORUM (5 saniye bekleyeceğim)');
        
        // Mesajı OKUMUYORUZ - bildirim gelmeli
        // setTimeout(() => {
        //     user2Socket.emit('mark_messages_read', { 
        //         conversationId: data.message.conversationId 
        //     });
        // }, 2000);
    });
    
    // User2: 5 saniye sonra bildirim geldiğinde
    user2Socket.on('message_notification', (data) => {
        console.log('\n🔔 ===== BİLDİRİM ALINDI! =====');
        console.log('📱 Bildirim Tipi:', data.type);
        console.log('👤 Gönderen:', data.senderName);
        console.log('💬 Mesaj:', data.content);
        console.log('🆔 Mesaj ID:', data.messageId);
        console.log('⏰ Zaman:', new Date(data.timestamp).toLocaleString());
        console.log('================================\n');
    });
    
    // User1: Mesaj gönderildiğinde
    user1Socket.on('message_sent_success', (data) => {
        console.log('📤 User1: Mesaj gönderildi:', data.message.content);
        console.log('⏰ User1: 5 saniye sonra bildirim gönderilecek (eğer okunmazsa)');
    });
    
    // 2 saniye sonra test mesajı gönder
    setTimeout(() => {
        const testMessage = `Test mesajı - ${new Date().toLocaleTimeString()}`;
        console.log('📨 User1: Test mesajı gönderiliyor:', testMessage);
        
        user1Socket.emit('send_chat_message', {
            receiverId: 'cmdc5or7q0002o1jwmldqzulb', // User2 ID
            content: testMessage,
            messageType: 'TEXT'
        });
    }, 2000);
    
    // Test senaryoları
    setTimeout(() => {
        console.log('\n📋 TEST SENARYOLARI:');
        console.log('1. ✅ Mesaj gönderildi');
        console.log('2. ⏳ User2 mesajı OKUMADI');
        console.log('3. ⏰ 5 saniye bekleniyor...');
        console.log('4. 🔔 Bildirim gelecek!');
    }, 3000);
    
    // 15 saniye sonra test'i bitir
    setTimeout(() => {
        console.log('\n🏁 Test tamamlandı');
        user1Socket.disconnect();
        user2Socket.disconnect();
        process.exit(0);
    }, 15000);
}

// Test 2: Mesaj okunduğunda bildirim gönderilmemesi
async function testNoNotificationWhenRead() {
    console.log('🧪 Okundu Mesaj İçin Bildirim Yok Testi...');
    
    const user1Token = await getToken('sockettest1', '123456');
    const user1Socket = io('http://localhost:3000', {
        auth: { token: user1Token }
    });
    
    const user2Token = await getToken('sockettest2', '123456');
    const user2Socket = io('http://localhost:3000', {
        auth: { token: user2Token }
    });
    
    user1Socket.on('connect', () => {
        console.log('🔌 User1 bağlandı');
        user1Socket.emit('join_conversation', { 
            conversationId: 'cmdc5v9w9000bo165nvptez6z' 
        });
    });
    
    user2Socket.on('connect', () => {
        console.log('🔌 User2 bağlandı');
        user2Socket.emit('join_conversation', { 
            conversationId: 'cmdc5v9w9000bo165nvptez6z' 
        });
    });
    
    // User2: Mesaj geldiğinde hemen oku
    user2Socket.on('new_chat_message', (data) => {
        console.log('📩 User2: Yeni mesaj alındı:', data.message.content);
        console.log('📖 User2: Mesajı HEMEN okuyorum');
        
        // Mesajı hemen okundu olarak işaretle
        setTimeout(() => {
            user2Socket.emit('mark_messages_read', { 
                conversationId: data.message.conversationId 
            });
            console.log('✅ User2: Mesaj okundu olarak işaretlendi');
        }, 1000);
    });
    
    // User2: Bildirim gelmemeli
    user2Socket.on('message_notification', (data) => {
        console.log('❌ HATA: Bildirim geldi ama gelmemeli!', data);
    });
    
    user1Socket.on('message_sent_success', (data) => {
        console.log('📤 User1: Mesaj gönderildi:', data.message.content);
        console.log('⏰ User1: 5 saniye sonra bildirim GÖNDERİLMEMELİ (çünkü okunacak)');
    });
    
    setTimeout(() => {
        const testMessage = `Okunacak mesaj - ${new Date().toLocaleTimeString()}`;
        console.log('📨 User1: Test mesajı gönderiliyor:', testMessage);
        
        user1Socket.emit('send_chat_message', {
            receiverId: 'cmdc5or7q0002o1jwmldqzulb',
            content: testMessage,
            messageType: 'TEXT'
        });
    }, 2000);
    
    setTimeout(() => {
        console.log('\n📋 TEST SENARYOLARI:');
        console.log('1. ✅ Mesaj gönderildi');
        console.log('2. 📖 User2 mesajı HEMEN okudu');
        console.log('3. ⏰ 5 saniye bekleniyor...');
        console.log('4. ❌ Bildirim GÖNDERİLMEMELİ!');
    }, 3000);
    
    setTimeout(() => {
        console.log('\n🏁 Test tamamlandı - Bildirim gelmedi ise başarılı!');
        user1Socket.disconnect();
        user2Socket.disconnect();
        process.exit(0);
    }, 10000);
}

// JWT token alma fonksiyonu
async function getToken(username, password) {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    return data.data.accessToken;
}

// Ana fonksiyon
async function main() {
    const args = process.argv.slice(2);
    
    if (args[0] === 'test1') {
        await testDelayedNotification();
    } else if (args[0] === 'test2') {
        await testNoNotificationWhenRead();
    } else {
        console.log('Kullanım:');
        console.log('  node test-delayed-notification.js test1  # 5 saniye sonra bildirim testi');
        console.log('  node test-delayed-notification.js test2  # Okundu mesaj için bildirim yok testi');
    }
}

main().catch(console.error);