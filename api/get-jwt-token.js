// JWT Token alma helper scripti

async function getJWTToken(username, password) {
    try {
        console.log(`🔐 ${username} için JWT token alınıyor...`);
        
        const response = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ Login başarılı!');
            console.log('👤 Kullanıcı:', data.data.user.username);
            console.log('🆔 User ID:', data.data.user.id);
            console.log('🔑 JWT Token:');
            console.log('─'.repeat(50));
            console.log(data.data.accessToken);
            console.log('─'.repeat(50));
            
            return {
                success: true,
                token: data.data.accessToken,
                user: data.data.user
            };
        } else {
            console.error('❌ Login hatası:', data.message);
            return { success: false, error: data.message };
        }
    } catch (error) {
        console.error('❌ Bağlantı hatası:', error.message);
        return { success: false, error: error.message };
    }
}

// Ana fonksiyon
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Kullanım:');
        console.log('  node get-jwt-token.js <username> <password>');
        console.log('');
        console.log('Örnekler:');
        console.log('  node get-jwt-token.js sockettest1 123456');
        console.log('  node get-jwt-token.js sockettest2 123456');
        return;
    }
    
    const [username, password] = args;
    
    console.log('🚀 JWT Token Helper');
    console.log('==================');
    
    const result = await getJWTToken(username, password);
    
    if (result.success) {
        console.log('\n📋 Bu token\'ı kopyalayıp HTML test sayfasında kullanabilirsiniz!');
        console.log('🌐 Test sayfası: simple-chat-test.html');
    }
}

// Node.js ortamında çalıştırılıyorsa
if (typeof require !== 'undefined' && require.main === module) {
    // fetch polyfill for Node.js
    if (typeof fetch === 'undefined') {
        global.fetch = require('node-fetch');
    }
    
    main().catch(console.error);
}

// Browser ortamında da kullanılabilir
if (typeof window !== 'undefined') {
    window.getJWTToken = getJWTToken;
}