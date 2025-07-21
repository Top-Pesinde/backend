const io = require('socket.io-client');
const readline = require('readline');

// User2 bilgileri
const user2 = {
    username: 'sockettest2',
    password: 'Test123!'
};

// Login fonksiyonu
async function login() {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user2)
    });

    const data = await response.json();
    if (data.success) {
        console.log('✅ User2 giriş yaptı:', data.data.user.username);
        return data.data.accessToken;
    } else {
        console.error('❌ Login hatası:', data.message);
        return null;
    }
}

let socket;
let conversationId = 'cmdc5v9w9000bo165nvptez6z'; // Mevcut conversation ID

async function startUser2() {
    console.log('🚀 User2 (Socket Test2) başlatılıyor...');

    try {
        // Login
        const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'sockettest2',
                password: '123456'
            })
        });

        const loginData = await loginResponse.json();

        if (!loginData.success) {
            console.error('❌ Login hatası:', loginData.message);
            return;
        }

        console.log('✅ User2 giriş yaptı:', loginData.data.user.username);
        console.log('\n💬 Mesajınızı yazın: ');

        // Socket bağlantısı
        socket = io('http://localhost:3000', {
            auth: {
                token: loginData.data.accessToken
            }
        });

        setupSocketEvents();
        setupUserInput();

    } catch (error) {
        console.error('❌ Başlatma hatası:', error);
    }
}

function setupSocketEvents() {
    socket.on('connect', () => {
        console.log('🔌 User2 socket bağlandı (ID:', socket.id + ')');
        console.log('💬 Mesaj göndermek için direkt yazın:');

        // Otomatik olarak mevcut konuşma odasına katıl
        if (conversationId) {
            socket.emit('join_conversation', { conversationId: conversationId });
            console.log('👥 Mevcut konuşma odasına otomatik katılım:', conversationId);
        }
    });

    socket.on('new_chat_message', (data) => {
        console.log('\n💬 User1:', data.message?.content);
        console.log('🔍 Debug - new_chat_message data:', JSON.stringify(data, null, 2));

        // Conversation ID'yi sakla
        if (data.message?.conversationId && !conversationId) {
            conversationId = data.message.conversationId;
            console.log('📝 Conversation ID kaydedildi:', conversationId);

            // Otomatik olarak konuşma odasına katıl
            socket.emit('join_conversation', { conversationId: conversationId });
            console.log('👥 Konuşma odasına otomatik katılım:', conversationId);
        }

        // Mesajı otomatik olarak okundu olarak işaretle
        if (data.message?.conversationId) {
            setTimeout(() => {
                socket.emit('mark_messages_read', { conversationId: data.message.conversationId });
                console.log('📖 Mesaj otomatik olarak okundu olarak işaretleniyor...');
            }, 1000); // 1 saniye sonra okundu olarak işaretle
        }

        // Yeni mesaj bildirimi
        console.log('🔔 YENİ MESAJ ALINDI!');
        console.log('📱 Bildirim: User1 size mesaj gönderdi');

        console.log('💬 Mesajınızı yazın: ');
    });

    // Mesaj gönderme hata durumları
    socket.on('message_send_error', (data) => {
        console.log('\n❌ MESAJ GÖNDERME HATASI:');
        console.log('🚫 Hata:', data.error);
        console.log('🔍 Hata Tipi:', data.type);

        switch (data.type) {
            case 'BLOCKED_BY_OTHER':
                console.log('📱 Bildirim: Bu kullanıcı sizi engellemiş');
                console.log('💡 Çözüm: Kullanıcının engeli kaldırmasını bekleyin');
                break;
            case 'BLOCKED_BY_YOU':
                console.log('📱 Bildirim: Bu kullanıcıyı siz engellemişsiniz');
                console.log('💡 Çözüm: "unblock" komutu ile engeli kaldırın');
                break;
            case 'BANNED':
                console.log('📱 Bildirim: Bu kullanıcı kalıcı olarak banlandı');
                console.log('💡 Çözüm: Bu kullanıcıyla artık mesajlaşamazsınız');
                break;
            default:
                console.log('📱 Bildirim: Mesaj gönderilemedi');
                break;
        }

        if (data.blockStatus) {
            console.log('🔍 Engel Durumu:');
            console.log('   Sizi engellemiş:', data.blockStatus.isBlocked ? 'Evet' : 'Hayır');
            console.log('   Siz engellemişsiniz:', data.blockStatus.hasBlocked ? 'Evet' : 'Hayır');
        }

        console.log('💬 Mesajınızı yazın: ');
    });

    socket.on('message_sent_success', (data) => {
        console.log('\n✅ Mesaj başarıyla gönderildi!');
        console.log('📤 Gönderilen:', data.message?.content);
    });

    socket.on('user_typing_start', () => {
        console.log('\n⌨️ User1 yazıyor...');
        console.log('🔍 Debug - user_typing_start received');
    });

    socket.on('user_typing_stop', () => {
        console.log('\n⏹️ User1 yazmayı bıraktı');
        console.log('🔍 Debug - user_typing_stop received');
        console.log('💬 Mesajınızı yazın: ');
    });

    // Konuşma odası event'leri
    socket.on('conversation_joined', (data) => {
        console.log('\n👥 Konuşma odasına katıldınız:', data.conversationId);
        console.log('🔍 Debug - conversation_joined data:', JSON.stringify(data, null, 2));
    });

    socket.on('conversation_left', (data) => {
        console.log('\n👋 Konuşma odasından ayrıldınız:', data.conversationId);
        console.log('🔍 Debug - conversation_left data:', JSON.stringify(data, null, 2));
    });

    // Okundu bilgisi event'leri
    socket.on('messages_marked_read', (data) => {
        console.log('\n✅ Mesajlarınız okundu olarak işaretlendi:', data.conversationId);
        console.log('🔍 Debug - messages_marked_read data:', JSON.stringify(data, null, 2));
    });

    socket.on('messages_read_by_user', (data) => {
        if (data.readerInfo) {
            console.log(`\n👁️ ${data.readerInfo.username} mesajlarınızı okudu! (Kullanıcı ID: ${data.readerInfo.id})`);
        } else {
            console.log('\n👁️ Karşı taraf mesajlarınızı okudu:', data.userId);
        }
        console.log('🔍 Debug - messages_read_by_user data:', JSON.stringify(data, null, 2));
    });

    // UnreadCount güncelleme bildirimi
    socket.on('unread_count_updated', (data) => {
        console.log('\n📊 UnreadCount güncellendi:');
        console.log('   Konuşma ID:', data.conversationId);
        console.log('   Okunmamış mesaj:', data.unreadCount);
        console.log('🔍 Debug - unread_count_updated data:', JSON.stringify(data, null, 2));
    });

    // Engelleme bildirimleri
    socket.on('user_blocked', (data) => {
        console.log('\n🚫 Kullanıcı engellendi:', data.blockedUser?.username || 'Bilinmeyen kullanıcı');
        console.log('📱 Bildirim: Artık bu kullanıcıyla mesajlaşamazsınız');
        console.log('🔍 Debug - user_blocked data:', JSON.stringify(data, null, 2));
    });

    socket.on('user_unblocked', (data) => {
        console.log('\n✅ Kullanıcı engeli kaldırıldı:', data.unblockedUser?.username || 'Bilinmeyen kullanıcı');
        console.log('📱 Bildirim: Artık bu kullanıcıyla mesajlaşabilirsiniz');
        console.log('🔍 Debug - user_unblocked data:', JSON.stringify(data, null, 2));
    });

    socket.on('disconnect', () => {
        console.log('🔌 User2 bağlantısı kesildi');
    });

    socket.on('message_sent_success', (data) => {
        console.log('\n✅ Mesaj başarıyla gönderildi!');
        console.log('📤 Gönderilen:', data.message?.content);
    });

    // Debug için tüm event'leri logla
    const originalEmit = socket.emit;
    socket.emit = function (event, ...args) {
        console.log('🔍 Debug - Emitting:', event, args);
        return originalEmit.apply(this, [event, ...args]);
    };

    return socket;
}

// Mesaj geçmişini getir
async function getMessageHistory(conversationId) {
    try {
        console.log('📚 Mesaj geçmişi getiriliyor...');

        // Login token'ını al
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

        // Mesajları getir
        const response = await fetch(`http://localhost:3000/api/v1/chat/conversations/${conversationId}/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            console.log('\n📚 MESAJ GEÇMİŞİ:');
            console.log('═'.repeat(50));

            data.data.forEach((message, index) => {
                const sender = message.sender.username === 'sockettest2' ? '👤 Siz' : '👥 User1';
                const time = new Date(message.createdAt).toLocaleTimeString();
                const readStatus = message.isRead ? '✅' : '⏳';

                console.log(`${index + 1}. ${sender} (${time}) ${readStatus}`);
                console.log(`   💬 ${message.content}`);
                console.log('');
            });

            console.log('═'.repeat(50));
        } else {
            console.log('❌ Mesaj geçmişi alınamadı:', data.message);
        }
    } catch (error) {
        console.error('❌ Mesaj geçmişi hatası:', error);
    }
}

// Engel durumu kontrol et
async function checkBlockStatus(otherUserId) {
    try {
        console.log('🔍 Engel durumu kontrol ediliyor...');

        // Login token'ını al
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

        // Engel durumunu kontrol et
        const response = await fetch(`http://localhost:3000/api/v1/chat/block-status/${otherUserId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            if (data.data.isBlocked) {
                console.log('🚫 Bu kullanıcı sizi engellemiş');
            } else if (data.data.hasBlocked) {
                console.log('🚫 Bu kullanıcıyı siz engellemişsiniz');
            } else {
                console.log('✅ Engelleme durumu yok - normal mesajlaşma mümkün');
            }
        } else {
            console.log('❌ Engel durumu kontrol edilemedi:', data.message);
        }
    } catch (error) {
        console.error('❌ Engel durumu kontrol hatası:', error);
    }
}

// Kullanıcı engelle
async function blockUser(otherUserId, reason = 'Kullanıcı tarafından engellendi') {
    try {
        console.log('🚫 Kullanıcı engelleniyor...');

        // Login token'ını al
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

        // Kullanıcıyı engelle
        const response = await fetch('http://localhost:3000/api/v1/chat/block', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blockedUserId: otherUserId,
                reason: reason
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Kullanıcı başarıyla engellendi');
        } else {
            console.log('❌ Kullanıcı engellenemedi:', data.message);
        }
    } catch (error) {
        console.error('❌ Kullanıcı engelleme hatası:', error);
    }
}

// Engel kaldır
async function unblockUser(otherUserId) {
    try {
        console.log('✅ Engel kaldırılıyor...');

        // Login token'ını al
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

        // Engel kaldır
        const response = await fetch('http://localhost:3000/api/v1/chat/unblock', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blockedUserId: otherUserId
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Engel başarıyla kaldırıldı');
        } else {
            console.log('❌ Engel kaldırılamadı:', data.message);
        }
    } catch (error) {
        console.error('❌ Engel kaldırma hatası:', error);
    }
}

// Engellenen kullanıcıları listele
async function showBlockedUsers() {
    try {
        console.log('📵 Engellenen kullanıcılar getiriliyor...');

        // Login token'ını al
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

        // Engellenen kullanıcıları getir
        const response = await fetch('http://localhost:3000/api/v1/chat/blocked-users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            console.log('\n📵 ENGELLENEN KULLANICILAR:');
            console.log('═'.repeat(50));
            if (data.data.length === 0) {
                console.log('📭 Engellenen kullanıcı yok');
            } else {
                data.data.forEach((block, index) => {
                    console.log(`${index + 1}. 👤 ${block.blockedUser.firstName} ${block.blockedUser.lastName}`);
                    console.log(`   🆔 ${block.blockedUser.username}`);
                    console.log(`   📅 ${new Date(block.createdAt).toLocaleDateString()}`);
                    if (block.reason) {
                        console.log(`   💬 Sebep: ${block.reason}`);
                    }
                    console.log('');
                });
            }
            console.log('═'.repeat(50));
        } else {
            console.log('❌ Engellenen kullanıcılar yüklenemedi:', data.message);
        }
    } catch (error) {
        console.error('❌ Engellenen kullanıcılar yükleme hatası:', error);
    }
}

// Yardım menüsü
function showHelp() {
    console.log('\n📖 KULLANILABİLİR KOMUTLAR:');
    console.log('═'.repeat(50));
    console.log('💬 Mesaj göndermek için direkt yazın');
    console.log('📖 read     - Mesajları okundu olarak işaretle');
    console.log('📚 history  - Mesaj geçmişini göster');
    console.log('🔍 status   - Engel durumunu kontrol et');
    console.log('🚫 block    - Kullanıcıyı engelle');
    console.log('✅ unblock  - Engel kaldır');
    console.log('📵 blocked  - Engellenen kullanıcıları göster');
    console.log('❓ help     - Bu yardım menüsünü göster');
    console.log('═'.repeat(50));
}

function setupUserInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', (input) => {
        const trimmedInput = input.trim();

        if (trimmedInput === '') return;

        // Özel komutlar
        if (trimmedInput === 'read') {
            // Mesajları okundu olarak işaretle
            const convId = conversationId || 'test';
            socket.emit('mark_messages_read', { conversationId: convId });
            console.log('📖 Mesajlar okundu olarak işaretleniyor... (Conversation ID:', convId + ')');
            console.log('💬 Mesajınızı yazın: ');
            return;
        }

        if (trimmedInput === 'history') {
            // Mesaj geçmişini getir
            if (conversationId) {
                getMessageHistory(conversationId);
            } else {
                console.log('❌ Henüz conversation ID yok. Önce mesaj gönderin.');
            }
            console.log('💬 Mesajınızı yazın: ');
            return;
        }

        if (trimmedInput === 'help') {
            showHelp();
            console.log('💬 Mesajınızı yazın: ');
            return;
        }

        if (trimmedInput === 'status') {
            // Engel durumunu kontrol et
            const otherUserId = 'cmdc5or8c0005o1jwjv9uqroo'; // User1 ID
            checkBlockStatus(otherUserId);
            console.log('💬 Mesajınızı yazın: ');
            return;
        }

        if (trimmedInput === 'block') {
            // Kullanıcıyı engelle
            const otherUserId = 'cmdc5or8c0005o1jwjv9uqroo'; // User1 ID
            blockUser(otherUserId);
            console.log('💬 Mesajınızı yazın: ');
            return;
        }

        if (trimmedInput === 'unblock') {
            // Engel kaldır
            const otherUserId = 'cmdc5or8c0005o1jwjv9uqroo'; // User1 ID
            unblockUser(otherUserId);
            console.log('💬 Mesajınızı yazın: ');
            return;
        }

        if (trimmedInput === 'blocked') {
            // Engellenen kullanıcıları göster
            showBlockedUsers();
            console.log('💬 Mesajınızı yazın: ');
            return;
        }

        // Typing başlat
        socket.emit('typing_start', { conversationId: conversationId || 'test', receiverId: 'cmdc5or8c0005o1jwjv9uqroo' });

        // Mesaj gönder
        socket.emit('send_chat_message', {
            receiverId: 'cmdc5or8c0005o1jwjv9uqroo',
            content: trimmedInput
        });

        // Typing durdur
        socket.emit('typing_stop', { conversationId: conversationId || 'test', receiverId: 'cmdc5or8c0005o1jwjv9uqroo' });

        console.log('💬 Mesajınızı yazın: ');
    });
}

// Ana fonksiyon
async function main() {
    await startUser2();
}

main().catch(console.error); 