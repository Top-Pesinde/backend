import { Request, Response } from 'express';
import { MinioService } from '../services/minioService';
import { ApiResponse } from '../types';

const minioService = new MinioService();

interface AuthenticatedRequest extends Request {
    user?: any;
}

export class UploadController {
    async uploadProfilePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            const file = req.file;
            if (!file) {
                const response: ApiResponse = {
                    success: false,
                    message: 'No file uploaded',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.mimetype)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Only image files are allowed for profile photos',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const result = await minioService.uploadFile(file, 'profile', user.id);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'Profile photo uploaded successfully' : result.error || 'Failed to upload profile photo',
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

    async uploadDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                const response: ApiResponse = {
                    success: false,
                    message: 'No files uploaded',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Validate file types
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
            for (const file of files) {
                if (!allowedTypes.includes(file.mimetype)) {
                    const response: ApiResponse = {
                        success: false,
                        message: `Invalid file type: ${file.originalname}. Only PDF, DOC, DOCX, and image files are allowed`,
                        timestamp: new Date().toISOString(),
                    };
                    res.status(400).json(response);
                    return;
                }
            }

            // Upload all files
            const uploadPromises = files.map(file =>
                minioService.uploadFile(file, 'document', user.id)
            );

            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter(result => result.success);
            const failedUploads = results.filter(result => !result.success);

            if (failedUploads.length > 0) {
                const response: ApiResponse = {
                    success: false,
                    message: `${failedUploads.length} files failed to upload`,
                    data: {
                        successful: successfulUploads.map(r => r.data),
                        failed: failedUploads.map(r => r.error),
                    },
                    timestamp: new Date().toISOString(),
                };
                res.status(500).json(response);
                return;
            }

            const response: ApiResponse = {
                success: true,
                message: `${successfulUploads.length} documents uploaded successfully`,
                data: successfulUploads.map(r => r.data),
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

    async deleteFile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            const { bucketType, fileName } = req.params;
            if (!bucketType || !fileName) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Bucket type and filename are required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const validBucketTypes = ['profile', 'document', 'general'];
            if (!validBucketTypes.includes(bucketType)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid bucket type',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const bucketName = minioService.getBucketName(bucketType as 'profile' | 'document' | 'general');
            const result = await minioService.deleteFile(bucketName, fileName);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'File deleted successfully' : result.error || 'Failed to delete file',
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

    async getFileUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            const { bucketType, fileName } = req.params;
            const { expiry } = req.query;

            if (!bucketType || !fileName) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Bucket type and filename are required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const validBucketTypes = ['profile', 'document', 'general'];
            if (!validBucketTypes.includes(bucketType)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid bucket type',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const bucketName = minioService.getBucketName(bucketType as 'profile' | 'document' | 'general');
            const expirySeconds = expiry ? parseInt(expiry as string) : 24 * 60 * 60; // 24 hours default

            const result = await minioService.getFileUrl(bucketName, fileName, expirySeconds);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'File URL generated successfully' : result.error || 'Failed to generate file URL',
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

    async listUserFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            const { bucketType } = req.params;
            const validBucketTypes = ['profile', 'document', 'general'];

            if (!validBucketTypes.includes(bucketType)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid bucket type',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const bucketName = minioService.getBucketName(bucketType as 'profile' | 'document' | 'general');
            const prefix = bucketType === 'profile' ? `profile-${user.id}` : `doc-${user.id}`;

            const result = await minioService.listFiles(bucketName, prefix);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'Files listed successfully' : result.error || 'Failed to list files',
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

    async updateProfilePhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User not authenticated',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            const file = req.file;
            if (!file) {
                const response: ApiResponse = {
                    success: false,
                    message: 'No file uploaded',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.mimetype)) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Only image files are allowed for profile photos',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Import prisma to check if user has existing profile photo
            const { prisma } = await import('../lib/prisma');

            // Get user with profile photo
            const existingUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { profilePhoto: true }
            });

            // If user has existing profile photo, delete it
            if (existingUser?.profilePhoto) {
                // Extract file name from URL
                const url = existingUser.profilePhoto;
                const urlParts = url.split('/');
                const fileName = urlParts[urlParts.length - 1];

                // Delete old file from MinIO
                const bucketName = minioService.getBucketName('profile');
                await minioService.deleteFile(bucketName, fileName);
                // We continue even if delete fails, to upload the new photo
            }

            // Upload new profile photo
            const uploadResult = await minioService.uploadFile(file, 'profile', user.id);

            if (!uploadResult.success) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Failed to upload new profile photo',
                    error: uploadResult.error,
                    timestamp: new Date().toISOString(),
                };
                res.status(uploadResult.statusCode || 500).json(response);
                return;
            }

            // Update user with new profile photo URL
            await prisma.user.update({
                where: { id: user.id },
                data: { profilePhoto: uploadResult.data?.url }
            });

            const response: ApiResponse = {
                success: true,
                message: 'Profile photo updated successfully',
                data: uploadResult.data,
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
} 