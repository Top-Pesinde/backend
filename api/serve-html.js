const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
    // CORS headers ekle
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let filePath = '';
    
    if (req.url === '/' || req.url === '/index.html') {
        filePath = path.join(__dirname, 'simple-chat-test.html');
    } else if (req.url === '/chat') {
        filePath = path.join(__dirname, 'chat-ui-example.html');
    } else if (req.url.startsWith('/')) {
        filePath = path.join(__dirname, req.url);
    }

    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
            <h1>404 - Sayfa Bulunamadı</h1>
            <p>Mevcut sayfalar:</p>
            <ul>
                <li><a href="/">Ana Sayfa (Simple Chat Test)</a></li>
                <li><a href="/chat">Chat UI Example</a></li>
            </ul>
        `);
        return;
    }

    // Dosya tipini belirle
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Dosyayı oku ve gönder
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(500);
            res.end(`Server Error: ${error.code}`);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🌐 HTML Server başlatıldı: http://localhost:${PORT}`);
    console.log('📄 Mevcut sayfalar:');
    console.log(`   • http://localhost:${PORT}/          - Simple Chat Test`);
    console.log(`   • http://localhost:${PORT}/chat      - Chat UI Example`);
    console.log('');
    console.log('🔧 Backend server\'ın da çalıştığından emin ol: npm run dev');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server kapatılıyor...');
    server.close(() => {
        console.log('✅ Server kapatıldı');
        process.exit(0);
    });
});