import { prisma } from '../lib/prisma';
import { ServiceResponse, Platform } from '../types';
import crypto from 'crypto';

export interface CreateSessionData {
    userId: string;
    sessionToken: string;
    deviceInfo?: string | null;
    ipAddress?: string | null;
    location?: string | null;
    platform?: Platform | null;
    expiresAt: Date;
}

export interface SessionInfo {
    id: string;
    sessionToken: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    location: string | null;
    platform: Platform | null;
    isActive: boolean;
    lastAccessedAt: Date;
    expiresAt: Date;
    createdAt: Date;
}

export class UserSessionService {
    /**
     * Yeni bir user session oluşturur
     */
    async createSession(sessionData: CreateSessionData): Promise<ServiceResponse<SessionInfo>> {
        try {
            const session = await prisma.userSession.create({
                data: {
                    userId: sessionData.userId,
                    sessionToken: sessionData.sessionToken,
                    deviceInfo: sessionData.deviceInfo || null,
                    ipAddress: sessionData.ipAddress || null,
                    location: sessionData.location || null,
                    platform: sessionData.platform || null,
                    expiresAt: sessionData.expiresAt,
                    isActive: true,
                    lastAccessedAt: new Date()
                }
            });

            return {
                success: true,
                data: {
                    id: session.id,
                    sessionToken: session.sessionToken,
                    deviceInfo: session.deviceInfo,
                    ipAddress: session.ipAddress,
                    location: session.location,
                    platform: session.platform,
                    isActive: session.isActive,
                    lastAccessedAt: session.lastAccessedAt,
                    expiresAt: session.expiresAt,
                    createdAt: session.createdAt
                },
                statusCode: 201
            };
        } catch (error) {
            console.error('Error creating session:', error);
            return {
                success: false,
                error: 'Failed to create session',
                statusCode: 500
            };
        }
    }

    /**
     * Session token ile session'ı doğrular ve günceller
     */
    async validateAndUpdateSession(sessionToken: string): Promise<ServiceResponse<SessionInfo & { userId: string }>> {
        try {
            const session = await prisma.userSession.findUnique({
                where: {
                    sessionToken: sessionToken
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            status: true
                        }
                    }
                }
            });

            if (!session) {
                return {
                    success: false,
                    error: 'Session not found',
                    statusCode: 404
                };
            }

            // Session aktif mi kontrol et
            if (!session.isActive) {
                return {
                    success: false,
                    error: 'Session is not active',
                    statusCode: 401
                };
            }

            // Session süresi dolmuş mu kontrol et
            if (session.expiresAt < new Date()) {
                // Session'ı pasif yap
                await this.deactivateSession(sessionToken);
                return {
                    success: false,
                    error: 'Session has expired',
                    statusCode: 401
                };
            }

            // Kullanıcı aktif mi kontrol et
            if (!session.user.status) {
                return {
                    success: false,
                    error: 'User account is deactivated',
                    statusCode: 403
                };
            }

            // Session'ın son erişim zamanını güncelle
            const updatedSession = await prisma.userSession.update({
                where: { sessionToken: sessionToken },
                data: { lastAccessedAt: new Date() }
            });

            return {
                success: true,
                data: {
                    id: updatedSession.id,
                    sessionToken: updatedSession.sessionToken,
                    deviceInfo: updatedSession.deviceInfo,
                    ipAddress: updatedSession.ipAddress,
                    location: updatedSession.location,
                    platform: updatedSession.platform,
                    isActive: updatedSession.isActive,
                    lastAccessedAt: updatedSession.lastAccessedAt,
                    expiresAt: updatedSession.expiresAt,
                    createdAt: updatedSession.createdAt,
                    userId: session.userId
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Error validating session:', error);
            return {
                success: false,
                error: 'Failed to validate session',
                statusCode: 500
            };
        }
    }

    /**
     * Belirli bir session'ı sonlandırır (logout)
     */
    async terminateSession(sessionToken: string): Promise<ServiceResponse<void>> {
        try {
            const session = await prisma.userSession.findUnique({
                where: { sessionToken: sessionToken }
            });

            if (!session) {
                return {
                    success: false,
                    error: 'Session not found',
                    statusCode: 404
                };
            }

            // Session'ı veritabanından tamamen sil
            await prisma.userSession.delete({
                where: { sessionToken: sessionToken }
            });

            return {
                success: true,
                statusCode: 200
            };
        } catch (error) {
            console.error('Error terminating session:', error);
            return {
                success: false,
                error: 'Failed to terminate session',
                statusCode: 500
            };
        }
    }

    /**
     * Kullanıcının tüm aktif session'larını sonlandırır
     */
    async terminateAllUserSessions(userId: string): Promise<ServiceResponse<{ terminatedCount: number }>> {
        try {
            const result = await prisma.userSession.deleteMany({
                where: {
                    userId: userId,
                    isActive: true
                }
            });

            return {
                success: true,
                data: { terminatedCount: result.count },
                statusCode: 200
            };
        } catch (error) {
            console.error('Error terminating all user sessions:', error);
            return {
                success: false,
                error: 'Failed to terminate all sessions',
                statusCode: 500
            };
        }
    }

    /**
     * Belirli bir session haricinde kullanıcının diğer session'larını sonlandırır
     */
    async terminateOtherUserSessions(userId: string, currentSessionToken: string): Promise<ServiceResponse<{ terminatedCount: number }>> {
        try {
            const result = await prisma.userSession.deleteMany({
                where: {
                    userId: userId,
                    isActive: true,
                    sessionToken: {
                        not: currentSessionToken
                    }
                }
            });

            return {
                success: true,
                data: { terminatedCount: result.count },
                statusCode: 200
            };
        } catch (error) {
            console.error('Error terminating other user sessions:', error);
            return {
                success: false,
                error: 'Failed to terminate other sessions',
                statusCode: 500
            };
        }
    }

    /**
     * Kullanıcının aktif session'larını listeler
     */
    async getUserActiveSessions(userId: string): Promise<ServiceResponse<SessionInfo[]>> {
        try {
            const sessions = await prisma.userSession.findMany({
                where: {
                    userId: userId,
                    isActive: true,
                    expiresAt: {
                        gt: new Date() // Süresi dolmamış olanlar
                    }
                },
                orderBy: { lastAccessedAt: 'desc' }
            });

            const sessionInfos: SessionInfo[] = sessions.map(session => ({
                id: session.id,
                sessionToken: session.sessionToken,
                deviceInfo: session.deviceInfo,
                ipAddress: session.ipAddress,
                location: session.location,
                platform: session.platform,
                isActive: session.isActive,
                lastAccessedAt: session.lastAccessedAt,
                expiresAt: session.expiresAt,
                createdAt: session.createdAt
            }));

            return {
                success: true,
                data: sessionInfos,
                statusCode: 200
            };
        } catch (error) {
            console.error('Error getting user active sessions:', error);
            return {
                success: false,
                error: 'Failed to get user sessions',
                statusCode: 500
            };
        }
    }

    /**
     * Session'ı pasif yapar (süresi dolmuş session'lar için)
     */
    private async deactivateSession(sessionToken: string): Promise<void> {
        try {
            await prisma.userSession.delete({
                where: { sessionToken: sessionToken }
            });
        } catch (error) {
            console.error('Error deactivating session:', error);
        }
    }

    /**
     * Süresi dolmuş session'ları temizler (cleanup job için)
     */
    async cleanupExpiredSessions(): Promise<ServiceResponse<{ deletedCount: number }>> {
        try {
            const result = await prisma.userSession.deleteMany({
                where: {
                    expiresAt: { lt: new Date() } // Sadece süresi dolmuş olanlar
                }
            });

            console.log(`🧹 Cleaned up ${result.count} expired sessions`);

            return {
                success: true,
                data: { deletedCount: result.count },
                statusCode: 200
            };
        } catch (error) {
            console.error('Error cleaning up expired sessions:', error);
            return {
                success: false,
                error: 'Failed to cleanup expired sessions',
                statusCode: 500
            };
        }
    }

    /**
     * Kapsamlı session temizleme - tüm eski session'ları siler
     */
    async comprehensiveSessionCleanup(): Promise<ServiceResponse<{
        expiredDeleted: number;
        oldDeleted: number;
        totalDeleted: number;
    }>> {
        try {
            const now = new Date();
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // 1. Süresi dolmuş session'ları sil
            const expiredResult = await prisma.userSession.deleteMany({
                where: {
                    expiresAt: { lt: now }
                }
            });

            // 2. 1 aydan eski tüm session'ları sil (aktif olsa bile)
            const oldResult = await prisma.userSession.deleteMany({
                where: {
                    createdAt: { lt: oneMonthAgo }
                }
            });

            const totalDeleted = expiredResult.count + oldResult.count;

            console.log(`🧹 Comprehensive cleanup completed:`);
            console.log(`   - Expired sessions: ${expiredResult.count}`);
            console.log(`   - Old sessions: ${oldResult.count}`);
            console.log(`   - Total deleted: ${totalDeleted}`);

            return {
                success: true,
                data: {
                    expiredDeleted: expiredResult.count,
                    oldDeleted: oldResult.count,
                    totalDeleted
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Error in comprehensive session cleanup:', error);
            return {
                success: false,
                error: 'Failed to perform comprehensive cleanup',
                statusCode: 500
            };
        }
    }

    /**
     * Belirli bir kullanıcının eski session'larını temizler
     */
    async cleanupUserOldSessions(userId: string, daysOld: number = 7): Promise<ServiceResponse<{ deletedCount: number }>> {
        try {
            const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

            const result = await prisma.userSession.deleteMany({
                where: {
                    userId: userId,
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { createdAt: { lt: cutoffDate } }
                    ]
                }
            });

            console.log(`🧹 Cleaned up ${result.count} old sessions for user ${userId}`);

            return {
                success: true,
                data: { deletedCount: result.count },
                statusCode: 200
            };
        } catch (error) {
            console.error('Error cleaning up user old sessions:', error);
            return {
                success: false,
                error: 'Failed to cleanup user old sessions',
                statusCode: 500
            };
        }
    }

    /**
     * Session istatistiklerini getirir
     */
    async getSessionStats(): Promise<ServiceResponse<{
        totalSessions: number;
        activeSessions: number;
        expiredSessions: number;
        sessionsByPlatform: { platform: string; count: number }[];
    }>> {
        try {
            const now = new Date();

            // Toplam session sayısı
            const totalSessions = await prisma.userSession.count();

            // Aktif session sayısı
            const activeSessions = await prisma.userSession.count({
                where: {
                    isActive: true,
                    expiresAt: { gt: now }
                }
            });

            // Süresi dolmuş session sayısı
            const expiredSessions = await prisma.userSession.count({
                where: {
                    expiresAt: { lt: now }
                }
            });

            // Platform bazında session sayıları
            const sessionsByPlatform = await prisma.userSession.groupBy({
                by: ['platform'],
                _count: {
                    platform: true
                },
                where: {
                    isActive: true,
                    expiresAt: { gt: now }
                }
            });

            const platformStats = sessionsByPlatform.map(item => ({
                platform: item.platform || 'UNKNOWN',
                count: item._count.platform
            }));

            return {
                success: true,
                data: {
                    totalSessions,
                    activeSessions,
                    expiredSessions,
                    sessionsByPlatform: platformStats
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Error getting session stats:', error);
            return {
                success: false,
                error: 'Failed to get session stats',
                statusCode: 500
            };
        }
    }

    /**
     * Benzersiz session token oluşturur
     */
    generateSessionToken(): string {
        return crypto.randomUUID();
    }

    /**
     * Device info'yu parse eder
     */
    parseDeviceInfo(userAgent?: string, deviceName?: string, browserName?: string): string | null {
        // Eğer deviceName veya browserName varsa, onları kullan
        if (deviceName || browserName) {
            return `${deviceName || 'Unknown Device'} - ${browserName || 'Unknown Browser'}`;
        }
        if (!userAgent) return null;

        // User-Agent'ı parse et
        const platform = this.detectPlatform(userAgent);
        const browser = this.detectBrowser(userAgent);
        const device = this.detectDevice(userAgent);

        return `${device} - ${browser}`;
    }

    /**
     * Platform'u detect eder
     */
    detectPlatform(userAgent: string): Platform {
        const ua = userAgent.toLowerCase();

        if (ua.includes('android')) return 'ANDROID';
        if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'IOS';
        return 'WEB';
    }

    /**
     * Device'ı detect eder
     */
    private detectDevice(userAgent: string): string {
        const ua = userAgent.toLowerCase();

        // iPhone detection - daha spesifik
        if (ua.includes('iphone')) {
            // iPhone model detection
            if (ua.includes('iphone os 17')) return 'iPhone (iOS 17)';
            if (ua.includes('iphone os 16')) return 'iPhone (iOS 16)';
            if (ua.includes('iphone os 15')) return 'iPhone (iOS 15)';
            if (ua.includes('iphone os 14')) return 'iPhone (iOS 14)';
            return 'iPhone';
        }

        // iPad detection
        if (ua.includes('ipad')) {
            if (ua.includes('ipad os 17')) return 'iPad (iPadOS 17)';
            if (ua.includes('ipad os 16')) return 'iPad (iPadOS 16)';
            if (ua.includes('ipad os 15')) return 'iPad (iPadOS 15)';
            return 'iPad';
        }

        // Android devices
        if (ua.includes('android')) {
            // Android version detection
            if (ua.includes('android 14')) return 'Android Phone (Android 14)';
            if (ua.includes('android 13')) return 'Android Phone (Android 13)';
            if (ua.includes('android 12')) return 'Android Phone (Android 12)';
            if (ua.includes('android 11')) return 'Android Phone (Android 11)';

            // Device type detection
            if (ua.includes('mobile')) return 'Android Phone';
            if (ua.includes('tablet')) return 'Android Tablet';

            // Specific device detection
            if (ua.includes('samsung')) return 'Samsung Android';
            if (ua.includes('huawei')) return 'Huawei Android';
            if (ua.includes('xiaomi')) return 'Xiaomi Android';
            if (ua.includes('oneplus')) return 'OnePlus Android';

            return 'Android Device';
        }

        // Desktop operating systems
        if (ua.includes('windows')) {
            if (ua.includes('windows nt 11')) return 'Windows 11';
            if (ua.includes('windows nt 10')) return 'Windows 10';
            if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
            if (ua.includes('windows nt 6.2')) return 'Windows 8';
            if (ua.includes('windows nt 6.1')) return 'Windows 7';
            return 'Windows';
        }

        if (ua.includes('mac os x')) {
            if (ua.includes('mac os x 10_15') || ua.includes('mac os x 10.15')) return 'macOS Catalina';
            if (ua.includes('mac os x 10_14') || ua.includes('mac os x 10.14')) return 'macOS Mojave';
            if (ua.includes('mac os x 10_13') || ua.includes('mac os x 10.13')) return 'macOS High Sierra';
            if (ua.includes('mac os x 11')) return 'macOS Big Sur';
            if (ua.includes('mac os x 12')) return 'macOS Monterey';
            if (ua.includes('mac os x 13')) return 'macOS Ventura';
            if (ua.includes('mac os x 14')) return 'macOS Sonoma';
            return 'macOS';
        }

        if (ua.includes('linux')) {
            if (ua.includes('ubuntu')) return 'Ubuntu Linux';
            if (ua.includes('fedora')) return 'Fedora Linux';
            if (ua.includes('debian')) return 'Debian Linux';
            if (ua.includes('centos')) return 'CentOS Linux';
            if (ua.includes('redhat')) return 'Red Hat Linux';
            return 'Linux';
        }

        return 'Desktop';
    }

    /**
     * Browser'ı detect eder
     */
    private detectBrowser(userAgent: string): string {
        const ua = userAgent.toLowerCase();

        // Chrome variants
        if (ua.includes('chrome')) {
            if (ua.includes('edg')) return 'Edge';
            if (ua.includes('opr') || ua.includes('opera')) return 'Opera';
            if (ua.includes('chromium')) return 'Chromium';
            return 'Chrome';
        }

        // Firefox
        if (ua.includes('firefox')) {
            if (ua.includes('seamonkey')) return 'SeaMonkey';
            return 'Firefox';
        }

        // Safari
        if (ua.includes('safari')) {
            if (ua.includes('chrome')) return 'Chrome'; // Chrome includes Safari in UA
            return 'Safari';
        }

        // Edge
        if (ua.includes('edg')) return 'Edge';

        // Opera
        if (ua.includes('opr') || ua.includes('opera')) return 'Opera';

        // Internet Explorer
        if (ua.includes('msie') || ua.includes('trident')) return 'Internet Explorer';

        // Mobile browsers
        if (ua.includes('mobile safari')) return 'Safari Mobile';
        if (ua.includes('chrome mobile')) return 'Chrome Mobile';
        if (ua.includes('firefox mobile')) return 'Firefox Mobile';

        // Fallback
        return 'Web Browser';
    }

    /**
     * IP adresinden lokasyon tahmin eder (basit implementasyon)
     */
    async getLocationFromIP(ipAddress?: string): Promise<string | null> {
        if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
            return 'Local';
        }

        // Gerçek implementasyonda GeoIP servisi kullanılabilir
        // Şimdilik basit bir implementasyon
        return 'Unknown Location';
    }

    /**
     * Koordinatlardan şehir adını alır
     */
    async getLocationFromCoordinates(latitude?: number, longitude?: number): Promise<string | null> {
        if (!latitude || !longitude) {
            return null;
        }

        try {
            // Gerçek implementasyonda Reverse Geocoding API kullanılabilir
            // Örnek: Google Maps Geocoding API, OpenStreetMap Nominatim API

            // Şimdilik basit bir implementasyon - koordinatları string olarak döndür
            return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            // Gerçek implementasyon örneği:
            // const response = await fetch(
            //     `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            // );
            // const data = await response.json();
            // return data.display_name || `${latitude}, ${longitude}`;

        } catch (error) {
            console.error('Error getting location from coordinates:', error);
            return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
    }

    /**
     * Session token'ı yeniler (expire süresini uzatır)
     */
    async refreshSessionToken(sessionToken: string, newExpiresAt: Date): Promise<ServiceResponse<SessionInfo>> {
        try {
            const session = await prisma.userSession.findUnique({
                where: { sessionToken: sessionToken }
            });

            if (!session) {
                return {
                    success: false,
                    error: 'Session not found',
                    statusCode: 404
                };
            }

            // Session aktif mi kontrol et
            if (!session.isActive) {
                return {
                    success: false,
                    error: 'Session is not active',
                    statusCode: 401
                };
            }

            // Session süresi dolmuş mu kontrol et
            if (session.expiresAt < new Date()) {
                // Session'ı pasif yap
                await this.deactivateSession(sessionToken);
                return {
                    success: false,
                    error: 'Session has expired',
                    statusCode: 401
                };
            }

            // Session'ı yenile
            const updatedSession = await prisma.userSession.update({
                where: { sessionToken: sessionToken },
                data: {
                    expiresAt: newExpiresAt,
                    lastAccessedAt: new Date()
                }
            });

            return {
                success: true,
                data: {
                    id: updatedSession.id,
                    sessionToken: updatedSession.sessionToken,
                    deviceInfo: updatedSession.deviceInfo,
                    ipAddress: updatedSession.ipAddress,
                    location: updatedSession.location,
                    platform: updatedSession.platform,
                    isActive: updatedSession.isActive,
                    lastAccessedAt: updatedSession.lastAccessedAt,
                    expiresAt: updatedSession.expiresAt,
                    createdAt: updatedSession.createdAt
                },
                statusCode: 200
            };
        } catch (error) {
            console.error('Error refreshing session token:', error);
            return {
                success: false,
                error: 'Failed to refresh session token',
                statusCode: 500
            };
        }
    }
} 