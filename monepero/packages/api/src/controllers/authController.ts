import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserSessionService } from '../services/userSessionService';
import { ApiResponse, RegisterDto, LoginDto, StatusChangeDto, SubscriptionChangeDto, UpdateProfileDto, UpdateContactInfoDto, ForgotPasswordDto, ResetPasswordDto, TerminateSessionDto, TerminateOtherSessionsDto } from '../types';
import { metricsService } from '../services/metricsService';

const authService = new AuthService();
const sessionService = new UserSessionService();

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
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            if (!userData.role) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Role is required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
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
                    statusCode: 400
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

            const result = await authService.register(userData, req);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'User registered successfully' : result.error || 'Failed to register user',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };

            res.status(500).json(response);
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            console.log('🔍 Login called with User-Agent:', req.headers['user-agent']);
            console.log('🔍 Login called with IP:', req.ip);

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

            const result = await authService.login(loginData, req);

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
                statusCode: result.statusCode
            };

            // Use the status code from the service result
            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
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
                    statusCode: 400
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
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
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
                    statusCode: 404
                };
                res.status(404).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: 'Profile fetched successfully',
                data: user,
                timestamp: new Date().toISOString(),
                statusCode: 200
            };

            res.status(200).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
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
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            if (typeof statusData.status !== 'boolean') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Status must be true or false',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
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
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
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
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            if (typeof subscriptionData.subscription !== 'boolean') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Subscription must be true or false',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
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
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
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
                    statusCode: 401
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
                    statusCode: 400
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
                        statusCode: 400
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
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
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
                    statusCode: 401
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
                    statusCode: 400
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
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };

            res.status(500).json(response);
        }
    }

    async deleteProfilePhoto(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const result = await authService.deleteProfilePhoto(user.id);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? 'Profile photo deleted successfully'
                    : result.error || 'Failed to delete profile photo',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };

            res.status(500).json(response);
        }
    }

    async updateContactInfo(req: Request, res: Response): Promise<void> {
        try {
            // Get user ID from the authenticated user
            const user = (req as any).user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Kullanıcı kimliği doğrulanamadı',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const contactData: UpdateContactInfoDto = req.body;

            // Validate at least one field is provided
            if (!contactData.email && !contactData.phone && contactData.location === undefined) {
                const response: ApiResponse = {
                    success: false,
                    message: 'En az bir alan (email, telefon, konum) sağlanmalıdır',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // E-posta adresi kontrolü
            if (contactData.email) {
                const existingUserWithEmail = await authService.findUserByEmail(contactData.email);

                if (existingUserWithEmail) {
                    const response: ApiResponse = {
                        success: false,
                        message: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılmaktadır',
                        timestamp: new Date().toISOString(),
                        statusCode: 400
                    };
                    res.status(400).json(response);
                    return;
                }
            }

            // Telefon numarası kontrolü
            if (contactData.phone) {
                const existingUserWithPhone = await authService.findUserByPhone(contactData.phone, user.id);

                if (existingUserWithPhone) {
                    const response: ApiResponse = {
                        success: false,
                        message: 'Bu telefon numarası başka bir kullanıcı tarafından kullanılmaktadır',
                        timestamp: new Date().toISOString(),
                        statusCode: 400
                    };
                    res.status(400).json(response);
                    return;
                }
            }

            const result = await authService.updateContactInfo(user.id, contactData);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? 'İletişim bilgileri başarıyla güncellendi'
                    : result.error || 'İletişim bilgileri güncellenirken hata oluştu',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Sunucu hatası',
                error: error instanceof Error ? error.message : 'Bilinmeyen hata',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };

            res.status(500).json(response);
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            // Get user from middleware
            const user = (req as any).user;

            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            // Get session token from JWT
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authorization header not found',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const token = authHeader.substring(7);
            const decodedToken = authService.verifyToken(token);

            if (!decodedToken || !decodedToken.jti) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid token',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            // Terminate the specific session
            const result = await sessionService.terminateSession(decodedToken.jti);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'Logout successful' : result.error || 'Failed to logout',
                data: result.success ? {
                    message: 'Session terminated successfully'
                } : undefined,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode || 500
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };

            res.status(500).json(response);
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const forgotPasswordData: ForgotPasswordDto = req.body;

            // Basic validation
            if (!forgotPasswordData.email) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Email is required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(forgotPasswordData.email)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid email format',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Record forgot password attempt
            // metricsService.recordAuthAttempt('forgot_password');

            const result = await authService.forgotPassword(forgotPasswordData);

            // Always record as success for security (don't reveal if email exists)
            // metricsService.recordAuthSuccess('forgot_password');

            const response: ApiResponse = {
                success: true,
                message: 'If the email exists, a password reset code has been sent',
                timestamp: new Date().toISOString(),
                statusCode: 200
            };

            res.status(200).json(response);
        } catch (error) {
            // metricsService.recordAuthFailure('forgot_password', 'internal_error');

            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };

            res.status(500).json(response);
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const resetPasswordData: ResetPasswordDto = req.body;

            // Basic validation
            if (!resetPasswordData.token || !resetPasswordData.newPassword) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Reset token and new password are required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Password strength validation
            if (resetPasswordData.newPassword.length < 6) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Password must be at least 6 characters long',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Token format validation (6 digit number)
            if (!/^\d{6}$/.test(resetPasswordData.token)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid reset token format',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Record reset password attempt
            // metricsService.recordAuthAttempt('reset_password');

            const result = await authService.resetPassword(resetPasswordData);

            // Record metrics based on result
            // if (result.success) {
            //     metricsService.recordAuthSuccess('reset_password');
            // } else {
            //     metricsService.recordAuthFailure('reset_password', result.error || 'unknown_error');
            // }

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? 'Password reset successfully'
                    : result.error || 'Failed to reset password',
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            // metricsService.recordAuthFailure('reset_password', 'internal_error');

            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };

            res.status(500).json(response);
        }
    }

    // Session Management Methods

    async getUserSessions(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            // Get current session token for comparison
            const authHeader = req.headers.authorization;
            let currentSessionToken: string | undefined;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const decodedToken = authService.verifyToken(token);
                currentSessionToken = decodedToken?.jti;
            }

            const result = await sessionService.getUserActiveSessions(user.id);

            if (result.success) {
                // Mark current session
                const sessions = result.data!.map(session => ({
                    id: session.id,
                    sessionToken: session.sessionToken,
                    deviceInfo: session.deviceInfo,
                    ipAddress: session.ipAddress,
                    location: session.location,
                    platform: session.platform,
                    lastAccessedAt: session.lastAccessedAt,
                    createdAt: session.createdAt,
                    isCurrent: session.sessionToken === currentSessionToken
                }));

                const response: ApiResponse = {
                    success: true,
                    message: 'User sessions retrieved successfully',
                    data: { sessions },
                    timestamp: new Date().toISOString(),
                    statusCode: 200
                };
                res.status(200).json(response);
            } else {
                const response: ApiResponse = {
                    success: false,
                    message: result.error || 'Failed to get user sessions',
                    timestamp: new Date().toISOString(),
                    statusCode: result.statusCode || 500
                };
                res.status(result.statusCode || 500).json(response);
            }
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    async terminateSession(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const { sessionToken }: TerminateSessionDto = req.body;

            if (!sessionToken) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Session token is required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            // Verify that the session belongs to the current user
            const sessionValidation = await sessionService.validateAndUpdateSession(sessionToken);
            if (!sessionValidation.success || sessionValidation.data?.userId !== user.id) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Session not found or unauthorized',
                    timestamp: new Date().toISOString(),
                    statusCode: 404
                };
                res.status(404).json(response);
                return;
            }

            const result = await sessionService.terminateSession(sessionToken);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'Session terminated successfully' : result.error || 'Failed to terminate session',
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode || 500
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    async terminateOtherSessions(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            // Get current session token
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authorization header not found',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const token = authHeader.substring(7);
            const decodedToken = authService.verifyToken(token);

            if (!decodedToken || !decodedToken.jti) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid token',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const result = await sessionService.terminateOtherUserSessions(user.id, decodedToken.jti);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? `${result.data?.terminatedCount || 0} other sessions terminated successfully`
                    : result.error || 'Failed to terminate other sessions',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode || 500
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    async terminateAllSessions(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                    statusCode: 401
                };
                res.status(401).json(response);
                return;
            }

            const result = await sessionService.terminateAllUserSessions(user.id);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? `${result.data?.terminatedCount || 0} sessions terminated successfully`
                    : result.error || 'Failed to terminate all sessions',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode || 500
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    // Admin Session Management Methods

    async getSessionStats(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user || user.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Admin access required',
                    timestamp: new Date().toISOString(),
                    statusCode: 403
                };
                res.status(403).json(response);
                return;
            }

            const result = await sessionService.getSessionStats();

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'Session statistics retrieved successfully' : result.error || 'Failed to get session stats',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode || 500
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    async runComprehensiveCleanup(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user || user.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Admin access required',
                    timestamp: new Date().toISOString(),
                    statusCode: 403
                };
                res.status(403).json(response);
                return;
            }

            const result = await sessionService.comprehensiveSessionCleanup();

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? `Comprehensive cleanup completed: ${result.data?.totalDeleted || 0} sessions deleted`
                    : result.error || 'Failed to run comprehensive cleanup',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode || 500
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }

    async cleanupUserSessions(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;

            if (!user || user.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Admin access required',
                    timestamp: new Date().toISOString(),
                    statusCode: 403
                };
                res.status(403).json(response);
                return;
            }

            const { userId, daysOld = 7 }: { userId: string; daysOld?: number } = req.body;

            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User ID is required',
                    timestamp: new Date().toISOString(),
                    statusCode: 400
                };
                res.status(400).json(response);
                return;
            }

            const result = await sessionService.cleanupUserOldSessions(userId, daysOld);

            const response: ApiResponse = {
                success: result.success,
                message: result.success
                    ? `User sessions cleanup completed: ${result.data?.deletedCount || 0} sessions deleted`
                    : result.error || 'Failed to cleanup user sessions',
                data: result.data,
                timestamp: new Date().toISOString(),
                statusCode: result.statusCode || 500
            };

            res.status(result.statusCode || 500).json(response);
        } catch (error) {
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                statusCode: 500
            };
            res.status(500).json(response);
        }
    }
}