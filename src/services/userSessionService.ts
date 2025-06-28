import { prisma } from '../lib/prisma';
import { ServiceResponse, Platform } from '../types';
import crypto from 'crypto';

export interface CreateSessionData {
    userId: string;
    sessionToken: string; // JWT jti claim'i
    deviceInfo?: string;
    ipAddress?: string;
    location?: string;
    platform?: Platform;
    expiresAt: Date;
}

export interface SessionInfo {
    id: string;
    sessionToken: string;
    deviceInfo?: string;
    ipAddress?: string;
    location?: string;
    platform?: Platform;
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
                    deviceInfo: sessionData.deviceInfo,
                    ipAddress: sessionData.ipAddress,
                    location: sessionData.location,
                    platform: sessionData.platform,
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
                    deviceInfo: session.deviceInfo || undefined,
                    ipAddress: session.ipAddress || undefined,
                    location: session.location || undefined,
                    platform: session.platform || undefined,
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
                    deviceInfo: updatedSession.deviceInfo || undefined,
                    ipAddress: updatedSession.ipAddress || undefined,
                    location: updatedSession.location || undefined,
                    platform: updatedSession.platform || undefined,
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
                deviceInfo: session.deviceInfo || undefined,
                ipAddress: session.ipAddress || undefined,
                location: session.location || undefined,
                platform: session.platform || undefined,
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
    parseDeviceInfo(userAgent?: string): string | undefined {
        if (!userAgent) return undefined;

        // User-Agent'ı basit şekilde parse et
        const platform = this.detectPlatform(userAgent);
        const browser = this.detectBrowser(userAgent);

        return `${platform} - ${browser}`;
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
     * Browser'ı detect eder
     */
    private detectBrowser(userAgent: string): string {
        const ua = userAgent.toLowerCase();

        if (ua.includes('chrome')) return 'Chrome';
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('safari')) return 'Safari';
        if (ua.includes('edge')) return 'Edge';
        if (ua.includes('opera')) return 'Opera';

        return 'Unknown Browser';
    }

    /**
     * IP adresinden lokasyon tahmin eder (basit implementasyon)
     */
    async getLocationFromIP(ipAddress?: string): Promise<string | undefined> {
        if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
            return 'Local';
        }

        // Gerçek implementasyonda GeoIP servisi kullanılabilir
        // Şimdilik basit bir implementasyon
        return 'Unknown Location';
    }
} 