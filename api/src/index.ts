import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { UserSessionService } from './services/userSessionService';
import { initializeSocket } from './services/socket';
import { router as apiRoutes } from './routes';

const app = express();
const httpServer = http.createServer(app);
const PORT = 3000; // Fixed port for API server

// Socket.IO'yu başlat
const socketService = initializeSocket(httpServer);

// Rate limiting (geçici olarak kapatıldı - test için)
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//     message: 'Too many requests from this IP, please try again later.',
// });

// Middleware
app.use(helmet());
app.use(cors({
    origin: "*", // Tüm origin'lere izin ver
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
    credentials: false
}));
app.use(metricsMiddleware); // Add metrics collection before rate limiting
// app.use(limiter); // Rate limit geçici olarak kapatıldı
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        socketConnections: socketService.getConnectedUsersCount()
    });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
    console.log(`🔗 API base URL: http://localhost:${PORT}/api`);
    console.log(`🌐 External access: http://176.96.131.222:${PORT}/api`);
    console.log(`📡 Socket.IO endpoint: ws://176.96.131.222:${PORT}`);

    const sessionService = new UserSessionService();
    console.log('🧹 Running initial comprehensive session cleanup...');
    const initialCleanup = await sessionService.comprehensiveSessionCleanup();
    if (initialCleanup.success) {
        console.log(`✅ Initial cleanup completed: ${initialCleanup.data?.totalDeleted || 0} sessions deleted`);
    } else {
        console.error('❌ Initial cleanup failed:', initialCleanup.error);
    }

    // Schedule periodic comprehensive cleanup every 30 minutes
    setInterval(async () => {
        try {
            console.log('🧹 Running scheduled comprehensive session cleanup...');
            const cleanup = await sessionService.comprehensiveSessionCleanup();
            if (cleanup.success) {
                console.log(`✅ Scheduled cleanup completed: ${cleanup.data?.totalDeleted || 0} sessions deleted`);
            } else {
                console.error('❌ Scheduled cleanup failed:', cleanup.error);
            }
        } catch (error) {
            console.error('❌ Session cleanup error:', error);
        }
    }, 30 * 60 * 1000); // 30 minutes = 30 * 60 * 1000 milliseconds

    // Schedule basic cleanup every 15 minutes for expired sessions
    setInterval(async () => {
        try {
            console.log('🧹 Running basic session cleanup...');
            const cleanup = await sessionService.cleanupExpiredSessions();
            if (cleanup.success && cleanup.data && cleanup.data.deletedCount > 0) {
                console.log(`✅ Basic cleanup completed: ${cleanup.data.deletedCount} expired sessions deleted`);
            }
        } catch (error) {
            console.error('❌ Basic session cleanup error:', error);
        }
    }, 15 * 60 * 1000); // 15 minutes

    console.log('⏰ Session cleanup scheduled:');
    console.log('   - Comprehensive cleanup: every 30 minutes');
    console.log('   - Basic cleanup: every 15 minutes');
}); 