import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { UserSessionService } from '../services/userSessionService';
import { ApiResponse, Role } from '../types';
import { prisma } from '../lib/prisma';

const authService = new AuthService();
const sessionService = new UserSessionService();

interface AuthenticatedRequest extends Request {
    user?: any;
}

export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            const response: ApiResponse = {
                success: false,
                message: 'Access token is required',
                timestamp: new Date().toISOString(),
            };
            res.status(401).json(response);
            return;
        }

        const payload = authService.verifyToken(token);
        if (!payload) {
            const response: ApiResponse = {
                success: false,
                message: 'Invalid or expired token',
                timestamp: new Date().toISOString(),
            };
            res.status(403).json(response);
            return;
        }

        // Validate session if jti (session token) exists
        if (payload.jti) {
            const sessionResult = await sessionService.validateAndUpdateSession(payload.jti);
            if (!sessionResult.success) {
                let message = 'Session invalid or expired';
                let statusCode = 401;

                if (sessionResult.error === 'User account is deactivated') {
                    message = 'Account is deactivated';
                    statusCode = 403;
                } else if (sessionResult.error === 'Session has expired') {
                    message = 'Session has expired, please login again';
                    statusCode = 401;
                } else if (sessionResult.error === 'Session is not active') {
                    message = 'Session is not active, please login again';
                    statusCode = 401;
                }

                const response: ApiResponse = {
                    success: false,
                    message,
                    timestamp: new Date().toISOString(),
                };
                res.status(statusCode).json(response);
                return;
            }

            // Check if session is close to expiring (within 1 day) and refresh it
            const session = sessionResult.data;
            if (session && session.expiresAt) {
                const now = new Date();
                const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                // If session expires within 1 day, refresh it
                if (session.expiresAt < oneDayFromNow) {
                    const newExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
                    await sessionService.refreshSessionToken(payload.jti, newExpiresAt);
                }
            }

            // Session is valid, user info is already validated by session service
            // Use the userId from session validation for extra security
            if (sessionResult.data?.userId !== payload.userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Token and session mismatch',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }
        } else {
            // For tokens without jti (old tokens), check if user has any active sessions
            // If no active sessions exist, force re-login
            const activeSessions = await sessionService.getUserActiveSessions(payload.userId);
            if (!activeSessions.success || activeSessions.data?.length === 0) {
                const response: ApiResponse = {
                    success: false,
                    message: 'No active sessions found, please login again',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }
        }

        // Get fresh user data from database
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            include: { documents: true },
        });

        if (!user) {
            const response: ApiResponse = {
                success: false,
                message: 'User not found',
                timestamp: new Date().toISOString(),
            };
            res.status(404).json(response);
            return;
        }

        // Double-check user status (session service also checks this, but extra safety)
        if (!user.status) {
            const response: ApiResponse = {
                success: false,
                message: 'Account is deactivated',
                timestamp: new Date().toISOString(),
            };
            res.status(403).json(response);
            return;
        }

        // Remove password from user object
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        const response: ApiResponse = {
            success: false,
            message: 'Authentication failed',
            timestamp: new Date().toISOString(),
        };
        res.status(500).json(response);
    }
};

export const authorizeRoles = (...roles: Role[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        const user = req.user;

        if (!user) {
            const response: ApiResponse = {
                success: false,
                message: 'Authentication required',
                timestamp: new Date().toISOString(),
            };
            res.status(401).json(response);
            return;
        }

        if (!roles.includes(user.role)) {
            const response: ApiResponse = {
                success: false,
                message: 'Insufficient permissions',
                timestamp: new Date().toISOString(),
            };
            res.status(403).json(response);
            return;
        }

        next();
    };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const payload = authService.verifyToken(token);
            if (payload) {
                const user = await prisma.user.findUnique({
                    where: { id: payload.userId },
                    include: { documents: true },
                });

                if (user) {
                    const { password: _, ...userWithoutPassword } = user;
                    req.user = userWithoutPassword;
                }
            }
        }

        next();
    } catch (error) {
        next();
    }
}; 