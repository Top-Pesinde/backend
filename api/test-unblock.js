const fetch = require('node-fetch');

async function testUnblock() {
    try {
        console.log('🧪 Engel kaldırma testi başlatılıyor...\n');

        // 1. User1 olarak login ol
        console.log('1️⃣ User1 login oluyor...');
        const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        const token = loginData.data.accessToken;
        console.log('✅ User1 login başarılı\n');

        // 2. Engellenen kullanıcıları listele
        console.log('2️⃣ Engellenen kullanıcılar listeleniyor...');
        const blockedResponse = await fetch('http://localhost:3000/api/v1/chat/blocked-users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const blockedData = await blockedResponse.json();
        console.log('📋 Engellenen kullanıcılar:', JSON.stringify(blockedData, null, 2));

        if (blockedData.success && blockedData.data && blockedData.data.length > 0) {
            const blockedUser = blockedData.data[0];
            console.log(`\n🎯 Engellenecek kullanıcı: ${blockedUser.blockedUser.username} (ID: ${blockedUser.blockedUserId})`);

            // 3. Engel kaldır
            console.log('\n3️⃣ Engel kaldırılıyor...');
            const unblockResponse = await fetch('http://localhost:3000/api/v1/chat/unblock', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    blockedUserId: blockedUser.blockedUserId
                })
            });

            const unblockData = await unblockResponse.json();
            console.log('📤 Engel kaldırma response:', JSON.stringify(unblockData, null, 2));

            if (unblockData.success) {
                console.log('✅ Engel başarıyla kaldırıldı!');
            } else {
                console.log('❌ Engel kaldırılamadı:', unblockData.message);
            }

            // 4. Tekrar engellenen kullanıcıları kontrol et
            console.log('\n4️⃣ Engellenen kullanıcılar tekrar kontrol ediliyor...');
            const blockedResponse2 = await fetch('http://localhost:3000/api/v1/chat/blocked-users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const blockedData2 = await blockedResponse2.json();
            console.log('📋 Güncel engellenen kullanıcılar:', JSON.stringify(blockedData2, null, 2));

        } else {
            console.log('📭 Engellenen kullanıcı yok');
        }

    } catch (error) {
        console.error('❌ Test hatası:', error);
    }
}

testUnblock(); 