import { Request, Response } from 'express';
import { MinioService } from '../services/minioService';
import { ApiResponse } from '../types';

const minioService = new MinioService();

interface AuthenticatedRequest extends Request {
    user?: any;
    body: any;
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

    async uploadFieldPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
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

            // Check if user is FOOTBALL_FIELD_OWNER
            if (user.role !== 'FOOTBALL_FIELD_OWNER') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Only football field owners can upload field photos',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                const response: ApiResponse = {
                    success: false,
                    message: 'No photos uploaded',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            if (files.length < 2 || files.length > 3) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Please upload 2-3 field photos',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Validate file types (only images)
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            for (const file of files) {
                if (!allowedTypes.includes(file.mimetype)) {
                    const response: ApiResponse = {
                        success: false,
                        message: `Invalid file type: ${file.originalname}. Only image files are allowed`,
                        timestamp: new Date().toISOString(),
                    };
                    res.status(400).json(response);
                    return;
                }
            }

            // Get fieldId from body or use temp ID
            const fieldId = req.body.fieldId || `temp-${user.id}-${Date.now()}`;

            // Upload all photos to MinIO
            const uploadPromises = files.map(file =>
                minioService.uploadFile(file, 'field', user.id, fieldId)
            );

            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter(result => result.success);
            const failedUploads = results.filter(result => !result.success);

            if (failedUploads.length > 0) {
                const response: ApiResponse = {
                    success: false,
                    message: `${failedUploads.length} photos failed to upload`,
                    data: {
                        successful: successfulUploads.map(r => r.data),
                        failed: failedUploads.map(r => r.error),
                    },
                    timestamp: new Date().toISOString(),
                };
                res.status(500).json(response);
                return;
            }

            // If fieldId is not temp (real field exists), save to database
            if (!fieldId.startsWith('temp-')) {
                try {
                    const { prisma } = await import('../lib/prisma');

                    // Check if field belongs to user
                    const fieldListing = await prisma.fieldListing.findFirst({
                        where: {
                            id: fieldId,
                            userId: user.id
                        }
                    });

                    if (fieldListing) {
                        // Save photos to database
                        const photoData = successfulUploads.map((result, index) => ({
                            id: `photo${index + 1}_${fieldId}`,
                            fieldListingId: fieldId,
                            photoUrl: result.data!.url,
                            photoOrder: index + 1
                        }));

                        await prisma.fieldPhoto.createMany({
                            data: photoData,
                            skipDuplicates: true
                        });
                    }
                } catch (dbError) {
                    console.error('Database save error (continuing):', dbError);
                    // Continue even if database save fails
                }
            }

            const response: ApiResponse = {
                success: true,
                message: `${successfulUploads.length} field photos uploaded successfully`,
                data: {
                    fieldId,
                    photos: successfulUploads.map(r => r.data)
                },
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

    async updateFieldPhotos(req: AuthenticatedRequest, res: Response): Promise<void> {
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

            // Check if user is FOOTBALL_FIELD_OWNER
            if (user.role !== 'FOOTBALL_FIELD_OWNER') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Only football field owners can update field photos',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                const response: ApiResponse = {
                    success: false,
                    message: 'No photos uploaded',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            if (files.length < 2 || files.length > 3) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Please upload 2-3 field photos',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Validate file types (only images)
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            for (const file of files) {
                if (!allowedTypes.includes(file.mimetype)) {
                    const response: ApiResponse = {
                        success: false,
                        message: `Invalid file type: ${file.originalname}. Only image files are allowed`,
                        timestamp: new Date().toISOString(),
                    };
                    res.status(400).json(response);
                    return;
                }
            }

            const fieldId = req.body.fieldId;
            if (!fieldId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Field ID is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Import prisma for database operations
            const { prisma } = await import('../lib/prisma');

            // Check if field belongs to user
            const fieldListing = await prisma.fieldListing.findFirst({
                where: {
                    id: fieldId,
                    userId: user.id
                }
            });

            if (!fieldListing) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Field not found or you do not have permission to update it',
                    timestamp: new Date().toISOString(),
                };
                res.status(404).json(response);
                return;
            }

            // Delete existing photos from database and MinIO
            const existingPhotos = await prisma.fieldPhoto.findMany({
                where: { fieldListingId: fieldId }
            });

            // Delete old photos from MinIO
            for (const photo of existingPhotos) {
                try {
                    const fileName = photo.photoUrl.split('/').pop();
                    if (fileName) {
                        const bucketName = minioService.getBucketName('field');
                        await minioService.deleteFile(bucketName, fileName);
                    }
                } catch (deleteError) {
                    console.error('Error deleting old photo from MinIO:', deleteError);
                    // Continue even if deletion fails
                }
            }

            // Delete old photos from database
            await prisma.fieldPhoto.deleteMany({
                where: { fieldListingId: fieldId }
            });

            // Upload new photos to MinIO
            const uploadPromises = files.map(file =>
                minioService.uploadFile(file, 'field', user.id, fieldId)
            );

            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter(result => result.success);
            const failedUploads = results.filter(result => !result.success);

            if (failedUploads.length > 0) {
                const response: ApiResponse = {
                    success: false,
                    message: `${failedUploads.length} photos failed to upload`,
                    data: {
                        successful: successfulUploads.map(r => r.data),
                        failed: failedUploads.map(r => r.error),
                    },
                    timestamp: new Date().toISOString(),
                };
                res.status(500).json(response);
                return;
            }

            // Save new photos to database
            const photoData = successfulUploads.map((result, index) => ({
                id: `photo${index + 1}_${fieldId}_${Date.now()}`,
                fieldListingId: fieldId,
                photoUrl: result.data!.url,
                photoOrder: index + 1
            }));

            await prisma.fieldPhoto.createMany({
                data: photoData
            });

            const response: ApiResponse = {
                success: true,
                message: `${successfulUploads.length} field photos updated successfully`,
                data: {
                    fieldId,
                    photos: successfulUploads.map(r => r.data)
                },
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