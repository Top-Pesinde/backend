import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse, Role } from '../types';
import { prisma } from '../lib/prisma';

const authService = new AuthService();

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