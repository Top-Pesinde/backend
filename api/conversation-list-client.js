const io = require('socket.io-client');
const readline = require('readline');

let socket;
let conversations = [];
let currentUser = null;

async function startConversationList() {
    console.log('🚀 Konuşma Listesi Client\'ı başlatılıyor...');

    try {
        // Login
        const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'sockettest1',
                password: '123456'
            })
        });

        const loginData = await loginResponse.json();

        if (!loginData.success) {
            console.error('❌ Login hatası:', loginData.message);
            return;
        }

        currentUser = loginData.data.user;
        console.log('✅ Giriş yaptı:', currentUser.username);
        console.log('👤 Kullanıcı ID:', currentUser.id);

        // Socket bağlantısı
        socket = io('http://localhost:3000', {
            auth: {
                token: loginData.data.accessToken
            }
        });

        setupSocketEvents();
        await loadConversations();
        setupUserInput();

    } catch (error) {
        console.error('❌ Başlatma hatası:', error);
    }
}

function setupSocketEvents() {
    socket.on('connect', () => {
        console.log('🔌 Socket bağlandı (ID:', socket.id + ')');
    });

    // Yeni mesaj geldiğinde konuşma listesini güncelle
    socket.on('new_chat_message', (data) => {
        console.log('\n🔔 YENİ MESAJ ALINDI!');
        console.log('📱 Bildirim:', data.message.sender.firstName, 'size mesaj gönderdi');
        console.log('💬 Mesaj:', data.message.content);

        // Konuşma listesini güncelle
        updateConversationList(data.message);

        // Konuşma listesini yeniden göster
        displayConversations();
    });

    // Okundu bilgisi
    socket.on('messages_read_by_user', (data) => {
        console.log('\n👁️ Mesajlarınız okundu:', data.userId);
        // Konuşma listesini güncelle
        updateReadStatus(data.conversationId);
        displayConversations();
    });

    // UnreadCount güncelleme bildirimi
    socket.on('unread_count_updated', (data) => {
        console.log('\n📊 UnreadCount güncellendi:', data.conversationId, '->', data.unreadCount);
        // Konuşma listesini güncelle
        updateUnreadCount(data.conversationId, data.unreadCount);
        displayConversations();
    });

    // Engelleme bildirimleri
    socket.on('user_blocked', (data) => {
        console.log('\n🚫 Kullanıcı engellendi:', data.blockedUser.username);
        console.log('📱 Bildirim: Artık bu kullanıcıyla mesajlaşamazsınız');
        // Konuşma listesini yenile
        loadConversations();
    });

    socket.on('user_unblocked', (data) => {
        console.log('\n✅ Kullanıcı engeli kaldırıldı:', data.unblockedUser.username);
        console.log('📱 Bildirim: Artık bu kullanıcıyla mesajlaşabilirsiniz');
        // Konuşma listesini yenile
        loadConversations();
    });

    socket.on('disconnect', () => {
        console.log('🔌 Bağlantı kesildi');
    });
}

async function loadConversations() {
    try {
        console.log('📚 Konuşmalar yükleniyor...');

        const response = await fetch('http://localhost:3000/api/v1/chat/conversations', {
            headers: {
                'Authorization': `Bearer ${socket.auth.token}`
            }
        });

        const data = await response.json();

        if (data.success && data.data) {
            conversations = data.data;
            console.log(`✅ ${conversations.length} konuşma yüklendi`);
            displayConversations();
        } else {
            console.log('❌ Konuşmalar yüklenemedi:', data.message);
        }
    } catch (error) {
        console.error('❌ Konuşma yükleme hatası:', error);
    }
}

function displayConversations() {
    if (!conversations || conversations.length === 0) {
        console.log('\n📭 Henüz konuşma yok');
        return;
    }

    console.log('\n💬 KONUŞMALARINIZ:');
    console.log('═'.repeat(80));

    conversations.forEach((conversation, index) => {
        const otherUser = conversation.user1.id === currentUser.id ? conversation.user2 : conversation.user1;
        const lastMessage = conversation.messages[0];
        const unreadCount = conversation.unreadCount || 0;
        const blockStatus = conversation.blockStatus;

        // Engel durumu ikonları
        let statusIcon = '💬';
        let statusText = '';

        if (blockStatus) {
            if (blockStatus.isBlocked) {
                statusIcon = '🚫';
                statusText = ' (Sizi engellemiş)';
            } else if (blockStatus.hasBlocked) {
                statusIcon = '🚫';
                statusText = ' (Engellediniz)';
            } else {
                statusIcon = '✅';
                statusText = ' (Aktif)';
            }
        }

        console.log(`${index + 1}. ${statusIcon} ${otherUser.firstName} ${otherUser.lastName}`);
        console.log(`   🆔 @${otherUser.username}`);

        if (lastMessage) {
            const time = new Date(lastMessage.createdAt).toLocaleTimeString();
            const readStatus = lastMessage.isRead ? '✅' : '⏳';
            console.log(`   💬 ${lastMessage.content} (${time}) ${readStatus}`);
        } else {
            console.log(`   💬 Henüz mesaj yok`);
        }

        if (unreadCount > 0) {
            console.log(`   🔔 ${unreadCount} okunmamış mesaj`);
        }

        console.log(`   📊 ${statusText}`);
        console.log('');
    });

    console.log('═'.repeat(80));
    console.log('💡 Komutlar: send <username> <message> | block <username> | unblock <username> | blocked | help');
}

function updateConversationList(newMessage) {
    // Konuşmayı bul veya oluştur
    let conversation = conversations.find(c => c.id === newMessage.conversationId);

    if (!conversation) {
        // Yeni konuşma oluştur
        const otherUser = newMessage.sender.id === currentUser.id ? newMessage.receiver : newMessage.sender;
        conversation = {
            id: newMessage.conversationId,
            user1: newMessage.sender,
            user2: newMessage.receiver,
            lastMessage: newMessage.content,
            lastMessageAt: newMessage.createdAt,
            unreadCount: newMessage.sender.id === currentUser.id ? 0 : 1
        };
        conversations.unshift(conversation); // En üste ekle
    } else {
        // Mevcut konuşmayı güncelle
        conversation.lastMessage = newMessage.content;
        conversation.lastMessageAt = newMessage.createdAt;

        // Okunmamış mesaj sayısını güncelle
        if (newMessage.sender.id !== currentUser.id) {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        // Konuşmayı en üste taşı
        conversations = conversations.filter(c => c.id !== conversation.id);
        conversations.unshift(conversation);
    }
}

// Okundu bilgisi
function updateReadStatus(conversationId) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
        conversation.unreadCount = 0;
    }
}

// UnreadCount güncelle
function updateUnreadCount(conversationId, unreadCount) {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
        conversation.unreadCount = unreadCount;
    }
}

async function sendMessage(username, content) {
    try {
        // Kullanıcıyı bul
        const targetConversation = conversations.find(c => {
            const otherUser = c.user1.id === currentUser.id ? c.user2 : c.user1;
            return otherUser.username === username;
        });

        let receiverId;

        if (targetConversation) {
            // Mevcut konuşma
            receiverId = targetConversation.user1.id === currentUser.id ?
                targetConversation.user2.id : targetConversation.user1.id;
        } else {
            // Yeni konuşma - kullanıcıyı bul
            console.log('🔍 Kullanıcı aranıyor:', username);
            // Burada kullanıcı arama API'si çağrılabilir
            console.log('❌ Kullanıcı bulunamadı. Önce konuşma başlatın.');
            return;
        }

        // Mesaj gönder
        socket.emit('send_chat_message', {
            receiverId: receiverId,
            content: content
        });

        console.log('📤 Mesaj gönderildi:', username);

    } catch (error) {
        console.error('❌ Mesaj gönderme hatası:', error);
    }
}

async function blockUser(username) {
    try {
        // Önce kullanıcıyı bul
        const targetConversation = conversations.find(c => {
            const otherUser = c.user1.id === currentUser.id ? c.user2 : c.user1;
            return otherUser.username === username;
        });

        if (!targetConversation) {
            console.log('❌ Kullanıcı bulunamadı:', username);
            return;
        }

        const blockedUserId = targetConversation.user1.id === currentUser.id ?
            targetConversation.user2.id : targetConversation.user1.id;

        const response = await fetch('http://localhost:3000/api/v1/chat/block', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${socket.auth.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blockedUserId: blockedUserId,
                reason: 'Kullanıcı tarafından engellendi'
            })
        });
        const data = await response.json();

        if (data.success) {
            console.log(`✅ ${username} kullanıcısı engellendi.`);
            await loadConversations(); // Konuşma listesini yeniden yükle
        } else {
            console.error('❌ Kullanıcı engelleme hatası:', data.message);
        }
    } catch (error) {
        console.error('❌ Kullanıcı engelleme hatası:', error);
    }
}

async function unblockUser(username) {
    try {
        // Engellenen kullanıcıları getir
        const response = await fetch('http://localhost:3000/api/v1/chat/blocked-users', {
            headers: {
                'Authorization': `Bearer ${socket.auth.token}`
            }
        });
        const data = await response.json();

        if (data.success && data.data) {
            const blockedUser = data.data.find(block =>
                block.blockedUser.username === username
            );

            if (!blockedUser) {
                console.log('❌ Bu kullanıcı engellenmemiş:', username);
                return;
            }

            const unblockResponse = await fetch('http://localhost:3000/api/v1/chat/unblock', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${socket.auth.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    blockedUserId: blockedUser.blockedUserId
                })
            });
            const unblockData = await unblockResponse.json();

            if (unblockData.success) {
                console.log(`✅ ${username} kullanıcısı engeli kaldırıldı.`);
                await loadConversations(); // Konuşma listesini yeniden yükle
            } else {
                console.error('❌ Kullanıcı engeli kaldırma hatası:', unblockData.message);
            }
        } else {
            console.log('❌ Engellenen kullanıcılar yüklenemedi:', data.message);
        }
    } catch (error) {
        console.error('❌ Kullanıcı engeli kaldırma hatası:', error);
    }
}

async function showBlockedUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/v1/chat/blocked-users', {
            headers: {
                'Authorization': `Bearer ${socket.auth.token}`
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

function setupUserInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', async (input) => {
        const trimmedInput = input.trim();

        if (trimmedInput === '') return;

        // Komutları işle
        if (trimmedInput === 'refresh') {
            await loadConversations();
            return;
        }

        if (trimmedInput === 'help') {
            showHelp();
            return;
        }

        if (trimmedInput.startsWith('block ')) {
            const username = trimmedInput.split(' ')[1];
            if (username) {
                await blockUser(username);
            } else {
                console.log('❌ Kullanım: block <username>');
            }
            return;
        }

        if (trimmedInput.startsWith('unblock ')) {
            const username = trimmedInput.split(' ')[1];
            if (username) {
                await unblockUser(username);
            } else {
                console.log('❌ Kullanım: unblock <username>');
            }
            return;
        }

        if (trimmedInput === 'blocked') {
            await showBlockedUsers();
            return;
        }

        if (trimmedInput.startsWith('send ')) {
            const parts = trimmedInput.split(' ');
            if (parts.length >= 3) {
                const username = parts[1];
                const message = parts.slice(2).join(' ');
                await sendMessage(username, message);
            } else {
                console.log('❌ Kullanım: send <username> <message>');
            }
            return;
        }

        // Normal mesaj - varsayılan kullanıcıya gönder
        if (conversations.length > 0) {
            const firstConversation = conversations[0];
            const otherUser = firstConversation.user1.id === currentUser.id ?
                firstConversation.user2 : firstConversation.user1;
            await sendMessage(otherUser.username, trimmedInput);
        } else {
            console.log('❌ Henüz konuşmanız yok. Önce bir kullanıcıya mesaj gönderin.');
        }
    });
}

function showHelp() {
    console.log('\n📖 KULLANILABİLİR KOMUTLAR:');
    console.log('═'.repeat(50));
    console.log('refresh                    - Konuşma listesini yenile');
    console.log('send <username> <message>  - Belirli kullanıcıya mesaj gönder');
    console.log('block <username>           - Kullanıcıyı engelle');
    console.log('unblock <username>         - Kullanıcı engelini kaldır');
    console.log('blocked                    - Engellenen kullanıcıları göster');
    console.log('help                       - Bu yardım menüsünü göster');
    console.log('💬 Direkt yazın            - İlk konuşmaya mesaj gönder');
    console.log('═'.repeat(50));
}

// Ana fonksiyon
async function main() {
    await startConversationList();
}

main(); 