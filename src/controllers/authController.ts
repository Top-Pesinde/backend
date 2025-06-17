import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse, RegisterDto, LoginDto, StatusChangeDto, SubscriptionChangeDto, UpdateProfileDto } from '../types';
import { metricsService } from '../services/metricsService';

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            const userData: RegisterDto = {
                ...req.body,
                profilePhoto: files?.profilePhoto?.[0], // Single profile photo
                documents: files?.documents || [] // Multiple documents
            };

            // Basic validation
            if (!userData.firstName || !userData.lastName || !userData.username || !userData.email || !userData.password || !userData.phone) {
                const response: ApiResponse = {
                    success: false,
                    message: 'First name, last name, username, email, phone and password are required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            if (!userData.role) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Role is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Password validation
            if (userData.password.length < 6) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Password must be at least 6 characters long',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Convert string values to boolean for lisans field
            if (userData.lisans !== undefined) {
                if (typeof userData.lisans === 'string') {
                    userData.lisans = userData.lisans === 'true';
                }
            }

            const result = await authService.register(userData);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'User registered successfully' : result.error || 'Failed to register user',
                data: result.data,
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const loginData: LoginDto = req.body;

            // Record login attempt
            metricsService.recordAuthAttempt('login');

            // Basic validation
            if (!loginData.username || !loginData.password) {
                metricsService.recordAuthFailure('login', 'missing_credentials');
                const response: ApiResponse = {
                    success: false,
                    message: 'Username and password are required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const result = await authService.login(loginData);

            // Record metrics based on result
            if (result.success) {
                metricsService.recordAuthSuccess('login');
            } else {
                metricsService.recordAuthFailure('login', result.error || 'unknown_error');
            }

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'Login successful' : result.error || 'Failed to login',
                data: result.data,
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body;

            if (!token) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Token is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const result = await authService.refreshToken(token);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'Token refreshed successfully' : result.error || 'Failed to refresh token',
                data: result.data,
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            // User bilgisi middleware tarafından req.user'a eklenir
            const user = (req as any).user;

            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not found',
                    timestamp: new Date().toISOString(),
                };
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Profile fetched successfully',
                data: user,
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    async statusChangeAuth(req: Request, res: Response): Promise<void> {
        try {
            const statusData: StatusChangeDto = req.body;

            // Basic validation
            if (!statusData.userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User ID is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            if (typeof statusData.status !== 'boolean') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Status must be true or false',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const result = await authService.changeUserStatus(statusData);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? `User status ${statusData.status ? 'activated' : 'deactivated'} successfully`
                    : result.error || 'Failed to change user status',
                data: result.data,
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    async subscriptionChangeAuth(req: Request, res: Response): Promise<void> {
        try {
            const subscriptionData: SubscriptionChangeDto = req.body;

            // Basic validation
            if (!subscriptionData.userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User ID is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            if (typeof subscriptionData.subscription !== 'boolean') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Subscription must be true or false',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const result = await authService.changeUserSubscription(subscriptionData);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? `User subscription ${subscriptionData.subscription ? 'activated' : 'deactivated'} successfully`
                    : result.error || 'Failed to change user subscription',
                data: result.data,
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    async changeUserProfile(req: Request, res: Response): Promise<void> {
        try {
            // Get user ID from the authenticated user
            const user = (req as any).user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            const profileData: UpdateProfileDto = req.body;

            // Validate at least one field is provided
            if (!profileData.email && !profileData.firstName && !profileData.lastName && profileData.location === undefined) {
                const response: ApiResponse = {
                    success: false,
                    message: 'At least one field (email, firstName, lastName, location) must be provided',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Basic email validation if provided
            if (profileData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(profileData.email)) {
                    const response: ApiResponse = {
                        success: false,
                        message: 'Invalid email format',
                        timestamp: new Date().toISOString(),
                    };
                    res.status(400).json(response);
                    return;
                }
            }

            const result = await authService.changeUserProfile(user.id, profileData);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? 'Profile updated successfully'
                    : result.error || 'Failed to update profile',
                data: result.data,
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    async changeUserPassword(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            const passwordData: any = req.body;

            // Validate current password
            if (!passwordData.currentPassword || !passwordData.newPassword) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Current password and new password are required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const result = await authService.changeUserPassword(user.id, passwordData);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? 'Password changed successfully'
                    : result.error || 'Failed to change password',
                data: result.data,
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }
}