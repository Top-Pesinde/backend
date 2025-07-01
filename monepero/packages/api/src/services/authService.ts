import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ServiceResponse, RegisterDto, LoginDto, AuthResponse, JwtPayload, Role, StatusChangeDto, SubscriptionChangeDto, UpdateProfileDto, ChangePasswordDto, UpdateContactInfoDto, ForgotPasswordDto, ResetPasswordDto, Platform } from '../types';
import { prisma } from '../lib/prisma';
import { sendEmail } from '../mail';
import { UserSessionService } from './userSessionService';

export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
    private readonly ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    private readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    private readonly SALT_ROUNDS = 12;
    private sessionService = new UserSessionService();

    async register(userData: RegisterDto, req?: any): Promise<ServiceResponse<AuthResponse>> {
        try {
            // Check if email or username already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: userData.email },
                        { username: userData.username }
                    ]
                }
            });

            if (existingUser) {
                return {
                    success: false,
                    error: existingUser.email === userData.email ? 'Email already exists' : 'Username already exists',
                    statusCode: 400,
                };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

            // Validate role-specific requirements
            const validationResult = this.validateRoleRequirements(userData);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    error: validationResult.error,
                    statusCode: 400,
                };
            }

            // Convert lisans to boolean if it's a string
            let lisansValue = false;
            if (userData.lisans !== undefined) {
                if (typeof userData.lisans === 'boolean') {
                    lisansValue = userData.lisans;
                } else {
                    // Convert string to boolean
                    const lisansStr = String(userData.lisans);
                    lisansValue = lisansStr.toLowerCase() === 'true';
                }
            }

            // Create user first (without files)
            const newUser = await prisma.user.create({
                data: {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    username: userData.username,
                    email: userData.email,
                    password: hashedPassword,
                    phone: userData.phone,
                    location: userData.location,
                    bio: userData.bio,
                    profilePhoto: null, // Will be updated after upload
                    role: userData.role,
                    lisans: lisansValue,
                },
                include: {
                    documents: true,
                }
            });

            // Upload profile photo with real user ID
            if (userData.profilePhoto) {
                const { MinioService } = await import('../services/minioService');
                const minioService = new MinioService();

                const uploadResult = await minioService.uploadProfilePhoto(userData.profilePhoto, newUser.id);

                if (uploadResult.success) {
                    // Update user with profile photo URL
                    await prisma.user.update({
                        where: { id: newUser.id },
                        data: { profilePhoto: uploadResult.data?.url }
                    });

                    // Update newUser object for response
                    newUser.profilePhoto = uploadResult.data?.url as string;
                }
            }

            // Handle document upload for all roles (if documents provided)
            if (userData.documents && userData.documents.length > 0) {
                await this.handleDocumentUpload(newUser.id, userData.documents);

                // Refresh user data with documents
                const updatedUser = await prisma.user.findUnique({
                    where: { id: newUser.id },
                    include: { documents: true }
                });
                if (updatedUser) {
                    newUser.documents = updatedUser.documents;
                }
            }

            // Generate session token
            const sessionToken = this.sessionService.generateSessionToken();

            // Device bilgilerini al - User-Agent yerine direkt gelen bilgileri kullan
            let deviceInfo: string | null = null;
            let platform: Platform | null = null;

            // Eğer deviceName veya browserName varsa, onları kullan
            if (userData.deviceName || userData.browserName) {
                deviceInfo = this.sessionService.parseDeviceInfo(
                    undefined, // User-Agent kullanmıyoruz
                    userData.deviceName,
                    userData.browserName
                );
                platform = userData.platform || null;
            } else {
                // Fallback: User-Agent'dan parse et (eski uyumluluk için)
                const userAgent = req?.headers?.['user-agent'];
                deviceInfo = this.sessionService.parseDeviceInfo(userAgent);
                platform = userData.platform || this.sessionService.detectPlatform(userAgent || '');
            }

            // Get IP address
            const ipAddress = req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress;

            // Get location - koordinatlardan, sonra frontend'den, sonra IP'den
            let location: string | null = null;
            if (userData.latitude && userData.longitude) {
                // Koordinatlardan şehir adını al
                location = await this.sessionService.getLocationFromCoordinates(
                    userData.latitude,
                    userData.longitude
                );
            } else if (userData.sessionLocation) {
                // Eski uyumluluk için string location
                location = userData.sessionLocation;
            } else {
                // IP'den tahmin et
                location = await this.sessionService.getLocationFromIP(ipAddress);
            }

            const sessionExpiresAt = new Date();
            if (this.REFRESH_TOKEN_EXPIRES_IN.includes('m')) {
                const minutes = parseInt(this.REFRESH_TOKEN_EXPIRES_IN.replace('m', ''));
                sessionExpiresAt.setMinutes(sessionExpiresAt.getMinutes() + minutes);
            } else if (this.REFRESH_TOKEN_EXPIRES_IN.includes('h')) {
                const hours = parseInt(this.REFRESH_TOKEN_EXPIRES_IN.replace('h', ''));
                sessionExpiresAt.setHours(sessionExpiresAt.getHours() + hours);
            } else if (this.REFRESH_TOKEN_EXPIRES_IN.includes('d')) {
                const days = parseInt(this.REFRESH_TOKEN_EXPIRES_IN.replace('d', ''));
                sessionExpiresAt.setDate(sessionExpiresAt.getDate() + days);
            }

            // Create session
            const sessionResult = await this.sessionService.createSession({
                userId: newUser.id,
                sessionToken,
                deviceInfo,
                ipAddress,
                location,
                platform,
                expiresAt: sessionExpiresAt
            });

            if (!sessionResult.success) {
                console.error('Failed to create session:', sessionResult.error);
                return {
                    success: false,
                    error: 'Failed to create session',
                    statusCode: 500,
                };
            }

            // Generate JWT tokens with session token as jti
            const tokenPayload: JwtPayload = {
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role as Role,
                jti: sessionToken,
            };

            const accessToken = this.generateAccessToken(tokenPayload);
            const refreshToken = this.generateRefreshToken(tokenPayload);

            // Remove password from response
            const { password: _, ...userWithoutPassword } = newUser;

            return {
                success: true,
                data: {
                    user: userWithoutPassword,
                    accessToken,
                    refreshToken,
                    accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
                    refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
                    sessionInfo: {
                        sessionId: sessionResult.data!.id,
                        deviceInfo: sessionResult.data!.deviceInfo,
                        location: sessionResult.data!.location,
                        platform: sessionResult.data!.platform,
                    }
                },
                statusCode: 201,
            };
        } catch (error) {
            console.error('Error during registration:', error);
            return {
                success: false,
                error: 'Failed to register user',
                statusCode: 500,
            };
        }
    }

    async login(loginData: LoginDto, req?: any): Promise<ServiceResponse<AuthResponse>> {
        try {
            // Find user by username
            const user = await prisma.user.findUnique({
                where: { username: loginData.username },
                include: {
                    documents: true,
                }
            });

            if (!user) {
                return {
                    success: false,
                    error: 'Invalid username or password',
                    statusCode: 401,
                };
            }

            // Check if user is active
            if (!user.status) {
                return {
                    success: false,
                    error: 'Account is deactivated. Please contact support.',
                    statusCode: 403,
                };
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    error: 'Invalid username or password',
                    statusCode: 401,
                };
            }

            // Generate session token
            const sessionToken = this.sessionService.generateSessionToken();

            // Device bilgilerini al - User-Agent yerine direkt gelen bilgileri kullan
            let deviceInfo: string | null = null;
            let platform: Platform | null = null;

            // Eğer deviceName veya browserName varsa, onları kullan
            if (loginData.deviceName || loginData.browserName) {
                deviceInfo = this.sessionService.parseDeviceInfo(
                    undefined, // User-Agent kullanmıyoruz
                    loginData.deviceName,
                    loginData.browserName
                );
                platform = loginData.platform || null;
            } else {
                // Fallback: User-Agent'dan parse et (eski uyumluluk için)
                const userAgent = req?.headers?.['user-agent'];
                deviceInfo = this.sessionService.parseDeviceInfo(userAgent);
                platform = loginData.platform || this.sessionService.detectPlatform(userAgent || '');
            }

            // Get IP address
            const ipAddress = req?.ip || req?.connection?.remoteAddress || req?.socket?.remoteAddress;

            // Get location - koordinatlardan, sonra frontend'den, sonra IP'den
            let location: string | null = null;
            if (loginData.latitude && loginData.longitude) {
                // Koordinatlardan şehir adını al
                location = await this.sessionService.getLocationFromCoordinates(
                    loginData.latitude,
                    loginData.longitude
                );
            } else if (loginData.location) {
                // Eski uyumluluk için string location
                location = loginData.location;
            } else {
                // IP'den tahmin et
                location = await this.sessionService.getLocationFromIP(ipAddress);
            }

            // Calculate session expiration (same as refresh token - 7 days)
            const sessionExpiresAt = new Date();
            if (this.REFRESH_TOKEN_EXPIRES_IN.includes('m')) {
                const minutes = parseInt(this.REFRESH_TOKEN_EXPIRES_IN.replace('m', ''));
                sessionExpiresAt.setMinutes(sessionExpiresAt.getMinutes() + minutes);
            } else if (this.REFRESH_TOKEN_EXPIRES_IN.includes('h')) {
                const hours = parseInt(this.REFRESH_TOKEN_EXPIRES_IN.replace('h', ''));
                sessionExpiresAt.setHours(sessionExpiresAt.getHours() + hours);
            } else if (this.REFRESH_TOKEN_EXPIRES_IN.includes('d')) {
                const days = parseInt(this.REFRESH_TOKEN_EXPIRES_IN.replace('d', ''));
                sessionExpiresAt.setDate(sessionExpiresAt.getDate() + days);
            }

            // Create session
            const sessionResult = await this.sessionService.createSession({
                userId: user.id,
                sessionToken,
                deviceInfo,
                ipAddress,
                location,
                platform,
                expiresAt: sessionExpiresAt
            });

            if (!sessionResult.success) {
                console.error('Failed to create session:', sessionResult.error);
                return {
                    success: false,
                    error: 'Failed to create session',
                    statusCode: 500,
                };
            }

            // Generate JWT tokens with session token as jti
            const tokenPayload: JwtPayload = {
                userId: user.id,
                email: user.email,
                role: user.role as Role,
                jti: sessionToken,
            };

            const accessToken = this.generateAccessToken(tokenPayload);
            const refreshToken = this.generateRefreshToken(tokenPayload);

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            return {
                success: true,
                data: {
                    user: userWithoutPassword,
                    accessToken,
                    refreshToken,
                    accessTokenExpiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
                    refreshTokenExpiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
                    sessionInfo: {
                        sessionId: sessionResult.data!.id,
                        deviceInfo: sessionResult.data!.deviceInfo,
                        location: sessionResult.data!.location,
                        platform: sessionResult.data!.platform,
                    }
                },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error during login:', error);
            return {
                success: false,
                error: 'Failed to login',
                statusCode: 500,
            };
        }
    }

    private generateAccessToken(payload: JwtPayload): string {
        return jwt.sign(payload, this.JWT_SECRET as any, {
            expiresIn: this.ACCESS_TOKEN_EXPIRES_IN as any,
        });
    }

    private generateRefreshToken(payload: JwtPayload): string {
        return jwt.sign(payload, this.JWT_REFRESH_SECRET as any, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN as any,
        });
    }

    verifyToken(token: string): JwtPayload | null {
        try {
            return jwt.verify(token, this.JWT_SECRET as jwt.Secret) as JwtPayload;
        } catch (error) {
            return null;
        }
    }

    verifyRefreshToken(token: string): JwtPayload | null {
        try {
            return jwt.verify(token, this.JWT_REFRESH_SECRET as jwt.Secret) as JwtPayload;
        } catch (error) {
            return null;
        }
    }

    private validateRoleRequirements(userData: RegisterDto): { isValid: boolean; error?: string } {
        // Phone is now required for ALL roles
        if (!userData.phone) {
            return {
                isValid: false,
                error: 'Phone number is required for all roles'
            };
        }

        switch (userData.role) {
            case 'USER':
                // USER için sadece phone zorunlu (yukarıda kontrol edildi)
                return { isValid: true };

            case 'GOALKEEPER':
                if (!userData.location || !userData.bio) {
                    return {
                        isValid: false,
                        error: 'Location and bio are required for GOALKEEPER role'
                    };
                }
                return { isValid: true };

            case 'REFEREE':
                if (!userData.location) {
                    return {
                        isValid: false,
                        error: 'Location is required for REFEREE role'
                    };
                }
                return { isValid: true };

            case 'FOOTBALL_FIELD_OWNER':
                if (!userData.location) {
                    return {
                        isValid: false,
                        error: 'Location is required for FOOTBALL_FIELD_OWNER role'
                    };
                }
                return { isValid: true };

            case 'ADMIN':
                // ADMIN için sadece phone zorunlu (yukarıda kontrol edildi)
                return { isValid: true };

            default:
                return {
                    isValid: false,
                    error: 'Invalid role specified'
                };
        }
    }

    private async handleDocumentUpload(userId: string, files: any[]): Promise<void> {
        try {
            const { MinioService } = await import('../services/minioService');
            const minioService = new MinioService();

            const documentPromises = files.map(async (file) => {
                // Upload to MinIO first
                const uploadResult = await minioService.uploadDocument(file, userId);

                if (uploadResult.success) {
                    // Then save to database with MinIO info
                    return prisma.document.create({
                        data: {
                            fileName: file.originalname,
                            fileType: file.mimetype,
                            filePath: uploadResult.data?.fileName || '', // MinIO file name
                            fileSize: file.size,
                            userId,
                        }
                    });
                }
                throw new Error(`Failed to upload ${file.originalname}`);
            });

            await Promise.all(documentPromises);
            console.log(`✅ Successfully uploaded ${files.length} documents for user ${userId}`);
        } catch (error) {
            console.error('Error uploading documents:', error);
            throw new Error('Failed to upload documents');
        }
    }

    async refreshToken(refreshToken: string): Promise<ServiceResponse<{ accessToken: string; refreshToken: string }>> {
        try {
            const payload = this.verifyRefreshToken(refreshToken);
            if (!payload) {
                return {
                    success: false,
                    error: 'Invalid refresh token',
                    statusCode: 401,
                };
            }

            // Session token'ı da kontrol et ve yenile
            if (payload.jti) {
                const sessionValidation = await this.sessionService.validateAndUpdateSession(payload.jti);
                if (!sessionValidation.success) {
                    return {
                        success: false,
                        error: 'Session is invalid or expired',
                        statusCode: 401,
                    };
                }

                // Session token'ın expire süresini uzat (7 gün)
                const newSessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                const sessionRefresh = await this.sessionService.refreshSessionToken(payload.jti, newSessionExpiresAt);
                if (!sessionRefresh.success) {
                    return {
                        success: false,
                        error: 'Failed to refresh session',
                        statusCode: 500,
                    };
                }
            }

            // Generate new tokens
            const tokenPayload = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
            };

            const newAccessToken = this.generateAccessToken(tokenPayload);
            const newRefreshToken = this.generateRefreshToken(tokenPayload);

            return {
                success: true,
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error refreshing token:', error);
            return {
                success: false,
                error: 'Failed to refresh token',
                statusCode: 500,
            };
        }
    }

    async changeUserStatus(statusData: StatusChangeDto): Promise<ServiceResponse<{ user: any }>> {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: statusData.userId },
                include: { documents: true }
            });

            if (!existingUser) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404,
                };
            }

            // Update user status
            const updatedUser = await prisma.user.update({
                where: { id: statusData.userId },
                data: { status: statusData.status },
                include: { documents: true }
            });

            // Remove password from response
            const { password: _, ...userWithoutPassword } = updatedUser;

            return {
                success: true,
                data: { user: userWithoutPassword },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error changing user status:', error);
            return {
                success: false,
                error: 'Failed to change user status',
                statusCode: 500,
            };
        }
    }

    async changeUserSubscription(subscriptionData: SubscriptionChangeDto): Promise<ServiceResponse<{ user: any }>> {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: subscriptionData.userId },
                include: { documents: true }
            });

            if (!existingUser) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404,
                };
            }

            // Update user subscription
            const updatedUser = await prisma.user.update({
                where: { id: subscriptionData.userId },
                data: { subscription: subscriptionData.subscription },
                include: { documents: true }
            });

            // Remove password from response
            const { password: _, ...userWithoutPassword } = updatedUser;

            return {
                success: true,
                data: { user: userWithoutPassword },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error changing user subscription:', error);
            return {
                success: false,
                error: 'Failed to change user subscription',
                statusCode: 500,
            };
        }
    }

    async changeUserProfile(userId: string, profileData: UpdateProfileDto): Promise<ServiceResponse<{ user: any }>> {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { documents: true }
            });

            if (!existingUser) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404,
                };
            }

            // Check if email is being updated and if it's already in use
            if (profileData.email && profileData.email !== existingUser.email) {
                const emailExists = await prisma.user.findFirst({
                    where: {
                        email: profileData.email,
                        id: { not: userId } // Exclude current user
                    }
                });

                if (emailExists) {
                    return {
                        success: false,
                        error: 'Email already exists',
                        statusCode: 400,
                    };
                }
            }

            // Prepare update data
            const updateData: any = {};
            if (profileData.email) updateData.email = profileData.email;
            if (profileData.firstName) updateData.firstName = profileData.firstName;
            if (profileData.lastName) updateData.lastName = profileData.lastName;
            if (profileData.location !== undefined) updateData.location = profileData.location;

            // Update user profile
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                include: { documents: true }
            });

            // Remove password from response
            const { password: _, ...userWithoutPassword } = updatedUser;

            return {
                success: true,
                data: { user: userWithoutPassword },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return {
                success: false,
                error: 'Failed to update user profile',
                statusCode: 500,
            };
        }
    }

    async changeUserPassword(userId: string, passwordData: ChangePasswordDto): Promise<ServiceResponse> {
        try {
            // Get user from database
            const user = await prisma.user.findFirst({
                where: { id: userId },
                select: { id: true, password: true }
            });

            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404
                };
            }

            const isPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);

            if (!isPasswordValid) {
                return {
                    success: false,
                    error: 'Current password is incorrect',
                    statusCode: 401
                };
            }

            // Validate new password
            if (passwordData.newPassword.length < 6) {
                return {
                    success: false,
                    error: 'New password must be at least 6 characters long',
                    statusCode: 400
                };
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(passwordData.newPassword, 10);

            // Update user password
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword }
            })

            return {
                success: true,
                statusCode: 200
            };
        } catch (error) {
            console.error('Error changing password:', error);
            return {
                success: false,
                error: 'Failed to change password',
                statusCode: 500
            };
        }
    }

    async deleteProfilePhoto(userId: string): Promise<ServiceResponse<{ user: any }>> {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    profilePhoto: true
                }
            });

            if (!existingUser) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404,
                };
            }

            // Check if user has a profile photo
            if (!existingUser.profilePhoto) {
                return {
                    success: false,
                    error: 'User does not have a profile photo',
                    statusCode: 400,
                };
            }

            // Extract file name from URL
            const url = existingUser.profilePhoto;
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];

            // Delete file from MinIO
            const { MinioService } = await import('../services/minioService');
            const minioService = new MinioService();

            const bucketName = minioService.getBucketName('profile');
            const deleteResult = await minioService.deleteFile(bucketName, fileName);

            if (!deleteResult.success) {
                return {
                    success: false,
                    error: 'Failed to delete profile photo from storage',
                    statusCode: 500,
                };
            }

            // Update user profile to remove photo reference
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: { profilePhoto: null },
                include: { documents: true }
            });

            // Remove password from response
            const { password: _, ...userWithoutPassword } = updatedUser;

            return {
                success: true,
                data: { user: userWithoutPassword },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error deleting profile photo:', error);
            return {
                success: false,
                error: 'Failed to delete profile photo',
                statusCode: 500,
            };
        }
    }

    private validatePhoneNumber(phone: string): boolean {
        // Türkiye telefon numarası formatı validasyonu
        // Kabul edilen formatlar:
        // +90XXXXXXXXXX, 90XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
        const phoneRegex = /^(\+90|90|0)?[5][0-9]{9}$/;

        // Sadece sayıları al
        const numbersOnly = phone.replace(/\D/g, '');

        // +90 ile başlıyorsa 90'ı çıkar
        let normalizedPhone = numbersOnly;
        if (normalizedPhone.startsWith('90') && normalizedPhone.length === 12) {
            normalizedPhone = normalizedPhone.substring(2);
        }

        // 0 ile başlıyorsa 0'ı çıkar
        if (normalizedPhone.startsWith('0') && normalizedPhone.length === 11) {
            normalizedPhone = normalizedPhone.substring(1);
        }

        // Son kontrol: 10 haneli ve 5 ile başlamalı
        return normalizedPhone.length === 10 && normalizedPhone.startsWith('5');
    }

    private normalizePhoneNumber(phone: string): string {
        // Telefon numarasını standart formata çevir: 5XXXXXXXXX
        const numbersOnly = phone.replace(/\D/g, '');

        let normalizedPhone = numbersOnly;
        if (normalizedPhone.startsWith('90') && normalizedPhone.length === 12) {
            normalizedPhone = normalizedPhone.substring(2);
        }

        if (normalizedPhone.startsWith('0') && normalizedPhone.length === 11) {
            normalizedPhone = normalizedPhone.substring(1);
        }

        return normalizedPhone;
    }

    async updateContactInfo(userId: string, contactData: UpdateContactInfoDto): Promise<ServiceResponse<{ user: any }>> {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { documents: true }
            });

            if (!existingUser) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404,
                };
            }

            // Validate email format if provided
            if (contactData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(contactData.email)) {
                    return {
                        success: false,
                        error: 'Invalid email format',
                        statusCode: 400,
                    };
                }

                // Check if email already exists (exclude current user)
                if (contactData.email !== existingUser.email) {
                    const emailExists = await prisma.user.findFirst({
                        where: {
                            email: contactData.email,
                            id: { not: userId }
                        }
                    });

                    if (emailExists) {
                        return {
                            success: false,
                            error: 'Email already exists',
                            statusCode: 400,
                        };
                    }
                }
            }

            // Validate phone number if provided
            let normalizedPhone: string | undefined;
            if (contactData.phone) {
                if (!this.validatePhoneNumber(contactData.phone)) {
                    return {
                        success: false,
                        error: 'Invalid phone number format. Please use Turkish mobile number format (5XXXXXXXXX)',
                        statusCode: 400,
                    };
                }

                normalizedPhone = this.normalizePhoneNumber(contactData.phone);

                // Normalize existing user's phone for comparison
                const existingUserNormalizedPhone = this.normalizePhoneNumber(existingUser.phone);

                // Check if phone already exists (exclude current user)
                if (normalizedPhone !== existingUserNormalizedPhone) {
                    const phoneExists = await prisma.user.findFirst({
                        where: {
                            phone: normalizedPhone,
                            id: { not: userId }
                        }
                    });

                    if (phoneExists) {
                        return {
                            success: false,
                            error: 'Phone number already exists',
                            statusCode: 400,
                        };
                    }
                }
            }

            // At least one field must be provided
            if (!contactData.email && !contactData.phone && contactData.location === undefined) {
                return {
                    success: false,
                    error: 'At least one field (email, phone, location) must be provided',
                    statusCode: 400,
                };
            }

            // Prepare update data
            const updateData: any = {};
            if (contactData.email) updateData.email = contactData.email;
            if (normalizedPhone) updateData.phone = normalizedPhone;
            if (contactData.location !== undefined) updateData.location = contactData.location;

            // Update user contact info
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                include: { documents: true }
            });

            // Remove password from response
            const { password: _, ...userWithoutPassword } = updatedUser;

            return {
                success: true,
                data: { user: userWithoutPassword },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error updating contact info:', error);
            return {
                success: false,
                error: 'Failed to update contact info',
                statusCode: 500,
            };
        }
    }

    async forgotPassword(forgotPasswordData: ForgotPasswordDto): Promise<ServiceResponse> {
        try {
            const { email } = forgotPasswordData;

            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) {
                // Security: Don't reveal if email exists or not
                return {
                    success: true,
                    statusCode: 200,
                };
            }

            // Check if user is active
            if (!user.status) {
                return {
                    success: false,
                    error: 'Account is deactivated. Please contact support.',
                    statusCode: 403,
                };
            }

            // Generate reset token (6-digit code for better UX)
            const resetToken = crypto.randomInt(100000, 999999).toString();

            // Set token expiration (15 minutes from now)
            const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

            // Get Turkish time for display
            const turkishExpireTime = new Date(resetTokenExpires).toLocaleString('tr-TR', {
                timeZone: 'Europe/Istanbul',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Save reset token to database
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpires
                }
            });

            // Prepare email content
            const subject = '🔐 Halısaha App - Şifre Sıfırlama Kodu';
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                        .header { text-align: center; margin-bottom: 30px; }
                        .logo { color: #007bff; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                        .title { color: #333; font-size: 24px; margin-bottom: 10px; }
                        .subtitle { color: #666; font-size: 16px; }
                        .reset-code { 
                            background: linear-gradient(135deg, #007bff, #0056b3); 
                            color: white; 
                            font-size: 36px; 
                            font-weight: bold; 
                            text-align: center; 
                            padding: 20px; 
                            border-radius: 8px; 
                            margin: 30px 0; 
                            letter-spacing: 8px;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        .content { line-height: 1.6; color: #333; margin: 20px 0; }
                        .warning { 
                            background: #fff3cd; 
                            color: #856404; 
                            padding: 15px; 
                            border-radius: 6px; 
                            border-left: 4px solid #ffc107; 
                            margin: 20px 0; 
                        }
                        .footer { 
                            text-align: center; 
                            margin-top: 40px; 
                            padding-top: 20px; 
                            border-top: 1px solid #eee; 
                            color: #666; 
                            font-size: 14px; 
                        }
                        .btn { 
                            display: inline-block; 
                            background: #28a745; 
                            color: white; 
                            padding: 12px 30px; 
                            text-decoration: none; 
                            border-radius: 6px; 
                            font-weight: bold; 
                            margin: 10px 5px; 
                        }
                        .security-info { 
                            background: #e7f3ff; 
                            padding: 15px; 
                            border-radius: 6px; 
                            margin: 20px 0; 
                            border-left: 4px solid #007bff; 
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">⚽ Halısaha App</div>
                            <div class="title">Şifre Sıfırlama Talebi</div>
                            <div class="subtitle">Güvenli şifre sıfırlama kodu</div>
                        </div>
                        
                        <div class="content">
                            <p>Merhaba <strong>${user.firstName} ${user.lastName}</strong>,</p>
                            <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki 6 haneli kodu kullanarak yeni şifrenizi oluşturabilirsiniz:</p>
                        </div>
                        
                        <div class="reset-code">${resetToken}</div>
                        
                                                 <div class="warning">
                             <strong>⚠️ Önemli Güvenlik Bilgisi:</strong><br>
                             • Bu kod <strong>${turkishExpireTime}</strong> tarihine kadar geçerlidir<br>
                             • Kodu kimseyle paylaşmayın<br>
                             • Bu talebi siz yapmadıysanız, bu emaili görmezden gelin
                         </div>
                         
                         <div class="security-info">
                             <h4>🔒 Güvenlik Detayları:</h4>
                             <ul>
                                 <li><strong>Talep Zamanı:</strong> ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</li>
                                 <li><strong>Geçerlilik Bitiş:</strong> ${turkishExpireTime}</li>
                                 <li><strong>Email:</strong> ${user.email}</li>
                                 <li><strong>Kullanıcı:</strong> ${user.username}</li>
                             </ul>
                         </div>
                        
                        <div class="content">
                            <h4>📱 Nasıl Kullanılır?</h4>
                            <ol>
                                <li>Halısaha App'te "Şifremi Unuttum" sayfasına gidin</li>
                                <li>Yukarıdaki 6 haneli kodu girin</li>
                                <li>Yeni şifrenizi belirleyin</li>
                                <li>Güvenli giriş yapın</li>
                            </ol>
                        </div>
                        
                        <div class="footer">
                            <p>Bu email otomatik olarak gönderilmiştir, lütfen yanıtlamayın.</p>
                            <p><strong>Halısaha Rezervasyon Platformu</strong> © 2025</p>
                            <p>Güvenli, hızlı ve kolay halısaha rezervasyonu</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Send reset email
            const emailSent = await sendEmail(user.email, subject, htmlContent);

            if (!emailSent) {
                console.error('Failed to send reset password email');
                return {
                    success: false,
                    error: 'Failed to send reset email',
                    statusCode: 500,
                };
            }

            console.log(`✅ Reset password email sent to: ${user.email}`);

            return {
                success: true,
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error in forgot password:', error);
            return {
                success: false,
                error: 'Failed to process forgot password request',
                statusCode: 500,
            };
        }
    }

    async resetPassword(resetPasswordData: ResetPasswordDto): Promise<ServiceResponse> {
        try {
            const { token, newPassword } = resetPasswordData;

            // Validate password strength (minimum 6 characters)
            if (!newPassword || newPassword.length < 6) {
                return {
                    success: false,
                    error: 'Password must be at least 6 characters long',
                    statusCode: 400,
                };
            }

            // Find user by reset token
            const user = await prisma.user.findFirst({
                where: {
                    resetToken: token,
                    resetTokenExpires: {
                        gt: new Date() // Token must not be expired
                    }
                }
            });

            if (!user) {
                return {
                    success: false,
                    error: 'Invalid or expired reset token',
                    statusCode: 400,
                };
            }

            // Check if user is active
            if (!user.status) {
                return {
                    success: false,
                    error: 'Account is deactivated. Please contact support.',
                    statusCode: 403,
                };
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

            // Update user password and clear reset token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpires: null
                }
            });

            // Send confirmation email
            const subject = '✅ Halısaha App - Şifre Başarıyla Değiştirildi';
            const confirmationHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
                        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                        .header { text-align: center; margin-bottom: 30px; }
                        .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                        .info { background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1 style="color: #007bff;">⚽ Halısaha App</h1>
                            <h2 style="color: #28a745;">Şifre Başarıyla Değiştirildi</h2>
                        </div>
                        
                        <div class="success">
                            <h3>✅ Başarılı!</h3>
                            <p>Hesabınızın şifresi başarıyla değiştirilmiştir.</p>
                        </div>
                        
                        <div class="info">
                            <h4>📋 İşlem Detayları:</h4>
                            <ul>
                                <li><strong>Kullanıcı:</strong> ${user.firstName} ${user.lastName}</li>
                                <li><strong>Email:</strong> ${user.email}</li>
                                                                 <li><strong>Değişiklik Zamanı:</strong> ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}</li>
                            </ul>
                        </div>
                        
                        <p>Artık yeni şifrenizle hesabınıza giriş yapabilirsiniz.</p>
                        
                        <p><strong>Güvenlik:</strong> Bu değişikliği siz yapmadıysanız, lütfen derhal bizimle iletişime geçin.</p>
                        
                        <div class="footer">
                            <p><strong>Halısaha Rezervasyon Platformu</strong> © 2025</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Send confirmation email (don't fail if this fails)
            try {
                await sendEmail(user.email, subject, confirmationHtml);
                console.log(`✅ Password reset confirmation email sent to: ${user.email}`);
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Continue anyway, password reset was successful
            }

            console.log(`✅ Password reset successful for user: ${user.email}`);

            return {
                success: true,
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error in reset password:', error);
            return {
                success: false,
                error: 'Failed to reset password',
                statusCode: 500,
            };
        }
    }

}