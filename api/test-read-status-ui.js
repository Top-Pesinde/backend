const io = require('socket.io-client');

// User1 - Mesaj gönderen (UI'da okundu durumunu görecek)
async function startUser1() {
    console.log('🚀 User1 başlatılıyor (Mesaj gönderen)...');

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
    const userId = loginData.data.user.id;

    // Socket bağlantısı
    const socket = io('http://localhost:3000', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('🔌 User1 bağlandı');

        // Konuşmaya katıl
        socket.emit('join_conversation', {
            conversationId: 'cmdc5v9w9000bo165nvptez6z'
        });
    });

    // 🎯 OKUNDU BİLGİSİNİ DİNLE
    socket.on('messages_read_by_user', (data) => {
        console.log('\n🎉 ===== MESAJINIZ OKUNDU! =====');
        console.log('👤 Okuyan kullanıcı:', data.readerInfo?.username || data.userId);
        console.log('⏰ Okunma zamanı:', new Date(data.timestamp).toLocaleString());
        console.log('💬 Konuşma ID:', data.conversationId);
        console.log('📊 Kalan okunmamış:', data.unreadCount);
        console.log('💌 Mesaj:', data.message);
        console.log('================================\n');

        // UI güncelleme simülasyonu
        console.log('🎨 UI GÜNCELLENİYOR:');
        console.log('   ✓ Tek tik → ✓✓ Çift tik (Mavi)');
        console.log('   🔔 Toast bildirimi gösteriliyor');
        console.log('   🎵 Bildirim sesi çalınıyor');
    });

    // Mesaj gönderildiğinde
    socket.on('message_sent_success', (data) => {
        console.log('📤 Mesaj gönderildi:', data.message.content);
        console.log('⏳ Karşı tarafın okumasını bekliyorum...');
        console.log('🎨 UI: Mesajın yanında tek tik (✓) gösteriliyor');
    });

    // Test mesajı gönder
    setTimeout(() => {
        const testMessage = `Test mesajı - ${new Date().toLocaleTimeString()}`;
        console.log('📨 Test mesajı gönderiliyor:', testMessage);

        socket.emit('send_chat_message', {
            receiverId: 'cmdc5or7q0002o1jwmldqzulb', // User2 ID
            content: testMessage,
            messageType: 'TEXT'
        });
    }, 2000);

    // Her 10 saniyede bir test mesajı gönder
    setInterval(() => {
        const testMessage = `Otomatik test - ${new Date().toLocaleTimeString()}`;
        console.log('🤖 Otomatik mesaj gönderiliyor:', testMessage);

        socket.emit('send_chat_message', {
            receiverId: 'cmdc5or7q0002o1jwmldqzulb',
            content: testMessage,
            messageType: 'TEXT'
        });
    }, 10000);
}

// User2 - Mesaj alan (otomatik okuyan)
async function startUser2() {
    console.log('🚀 User2 başlatılıyor (Mesaj alan)...');

    // Login
    const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'sockettest2',
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
        console.log('🔌 User2 bağlandı');

        // Konuşmaya katıl (bu otomatik okundu tetikler)
        socket.emit('join_conversation', {
            conversationId: 'cmdc5v9w9000bo165nvptez6z'
        });
    });

    // Yeni mesaj geldiğinde
    socket.on('new_chat_message', (data) => {
        console.log('📩 User2: Yeni mesaj alındı:', data.message.content);

        // 2 saniye sonra otomatik okundu işaretle
        setTimeout(() => {
            console.log('📖 User2: Mesajı okundu olarak işaretliyorum...');
            socket.emit('mark_messages_read', {
                conversationId: data.message.conversationId
            });
        }, 2000);
    });

    // Okundu işaretleme başarılı
    socket.on('messages_marked_read', (data) => {
        console.log('✅ User2: Mesajlar okundu olarak işaretlendi');
    });
}

// Ana fonksiyon
async function main() {
    const args = process.argv.slice(2);

    if (args[0] === 'user1') {
        await startUser1();
    } else if (args[0] === 'user2') {
        await startUser2();
    } else {
        console.log('Kullanım:');
        console.log('  node test-read-status-ui.js user1  # Mesaj gönderen');
        console.log('  node test-read-status-ui.js user2  # Mesaj alan');
        console.log('');
        console.log('İki terminal açıp her birinde farklı kullanıcı çalıştırın.');
    }
}

main().catch(console.error);