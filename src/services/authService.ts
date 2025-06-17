import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ServiceResponse, RegisterDto, LoginDto, AuthResponse, JwtPayload, Role, StatusChangeDto, SubscriptionChangeDto } from '../types';
import { prisma } from '../lib/prisma';

export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
    private readonly ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    private readonly REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    private readonly SALT_ROUNDS = 12;

    async register(userData: RegisterDto): Promise<ServiceResponse<AuthResponse>> {
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

            // Generate JWT tokens
            const tokenPayload = {
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role as Role,
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

    async login(loginData: LoginDto): Promise<ServiceResponse<AuthResponse>> {
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

            // Generate JWT tokens
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role as Role,
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
} 