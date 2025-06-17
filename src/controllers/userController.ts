import { Request, Response } from 'express';
import { ApiResponse, PaginationParams, PaginatedResponse, User } from '../types';
import { UserService } from '../services/userService';
import { MinioService } from '../services/minioService';

const userService = new UserService();
const minioService = new MinioService();

export class UserController {
    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            // Parse pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const sortBy = req.query.sortBy as string || 'createdAt';
            const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';
            const role = req.query.role as string;
            const status = req.query.status as string;
            const search = req.query.search as string;

            const paginationParams: PaginationParams = {
                page,
                limit,
                sortBy,
                sortOrder,
            };

            const filters = {
                role,
                status: status ? status === 'true' : undefined,
                search,
            };

            const result = await userService.getAllUsers(paginationParams, filters);

            const response: ApiResponse<PaginatedResponse<User>> = {
                success: result.success,
                message: result.success ? 'Users fetched successfully' : result.error || 'Failed to fetch users',
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

    async getUserById(req: Request, res: Response): Promise<void> {
        try {
            // Check if user is authenticated and is ADMIN
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            const { userId } = req.params;

            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User ID is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const result = await userService.getUserById(userId);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'User fetched successfully' : result.error || 'Failed to fetch user',
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

    async getUserStats(req: Request, res: Response): Promise<void> {
        try {
            // Check if user is authenticated and is ADMIN
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            const result = await userService.getUserStats();

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'User statistics fetched successfully' : result.error || 'Failed to fetch user statistics',
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

    async getFootballFieldOwners(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            // Parse pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const sortBy = req.query.sortBy as string || 'createdAt';
            const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';
            const search = req.query.search as string;

            const paginationParams: PaginationParams = {
                page,
                limit,
                sortBy,
                sortOrder,
            };

            // Filter only FOOTBALL_FIELD_OWNER users
            const filters = {
                role: 'FOOTBALL_FIELD_OWNER',
                search,
            };

            const result = await userService.getAllUsers(paginationParams, filters);

            const response: ApiResponse<PaginatedResponse<User>> = {
                success: result.success,
                message: result.success ? 'Football field owners fetched successfully' : result.error || 'Failed to fetch football field owners',
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

    /**
     * Admin only: Download document by document ID
     */
    async downloadDocument(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            const { documentId } = req.params;

            if (!documentId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Document ID is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Get document info from database
            const { prisma } = await import('../lib/prisma');
            const document = await prisma.document.findUnique({
                where: { id: documentId },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            });

            if (!document) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Document not found',
                    timestamp: new Date().toISOString(),
                };
                res.status(404).json(response);
                return;
            }

            // Extract filename from filePath
            const fileName = document.filePath.split('/').pop();
            if (!fileName) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid file path',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Get file stream from MinIO
            const fileResult = await minioService.getFileStream('documents', fileName);

            if (!fileResult.success) {
                const response: ApiResponse = {
                    success: false,
                    message: fileResult.error || 'Failed to get file',
                    timestamp: new Date().toISOString(),
                };
                res.status(fileResult.statusCode || 500).json(response);
                return;
            }

            // Set headers for file download
            res.setHeader('Content-Type', fileResult.data!.contentType);
            res.setHeader('Content-Length', fileResult.data!.size);
            res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

            // Log download activity
            console.log(`📥 Admin ${currentUser.username} downloaded document: ${document.fileName} (user: ${document.user.username})`);

            // Pipe the file stream to response
            fileResult.data!.stream.pipe(res);

        } catch (error) {
            console.error('Error downloading document:', error);
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    /**
     * Admin only: Get document download URL
     */
    async getDocumentDownloadUrl(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            const { documentId } = req.params;
            const expiry = parseInt(req.query.expiry as string) || 24 * 60 * 60; // Default 24 hours

            if (!documentId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Document ID is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            const result = await minioService.getDocumentDownloadUrl(documentId, expiry);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'Download URL generated successfully' : result.error || 'Failed to generate download URL',
                data: result.data,
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);

        } catch (error) {
            console.error('Error getting document download URL:', error);
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    /**
     * Admin only: Get all documents with user info
     */
    async getAllDocuments(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            // Parse pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const sortBy = req.query.sortBy as string || 'createdAt';
            const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';
            const search = req.query.search as string;
            const fileType = req.query.fileType as string;

            const offset = (page - 1) * limit;

            // Build where clause
            const where: any = {};

            if (search) {
                where.OR = [
                    { fileName: { contains: search, mode: 'insensitive' } },
                    {
                        user: {
                            OR: [
                                { firstName: { contains: search, mode: 'insensitive' } },
                                { lastName: { contains: search, mode: 'insensitive' } },
                                { username: { contains: search, mode: 'insensitive' } },
                            ]
                        }
                    },
                ];
            }

            if (fileType) {
                where.fileType = { contains: fileType, mode: 'insensitive' };
            }

            // Get total count
            const { prisma } = await import('../lib/prisma');
            const total = await prisma.document.count({ where });

            // Get documents with user info
            const documents = await prisma.document.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            email: true,
                            role: true,
                            status: true
                        }
                    }
                },
                orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder } :
                    sortBy === 'updatedAt' ? { updatedAt: sortOrder } :
                        sortBy === 'fileName' ? { fileName: sortOrder } :
                            sortBy === 'fileSize' ? { fileSize: sortOrder } :
                                { createdAt: sortOrder },
                skip: offset,
                take: limit,
            });

            const totalPages = Math.ceil(total / limit);

            const response: ApiResponse = {
                success: true,
                message: 'Documents fetched successfully',
                data: {
                    data: documents,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                    },
                },
                timestamp: new Date().toISOString(),
            };

            res.status(200).json(response);

        } catch (error) {
            console.error('Error fetching documents:', error);
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    /**
     * Admin only: Get user documents by user ID
     */
    async getUserDocuments(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            const { userId } = req.params;

            if (!userId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User ID is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Check if user exists
            const { prisma } = await import('../lib/prisma');
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    role: true,
                    status: true
                }
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

            const result = await minioService.getUserDocuments(userId);

            const response: ApiResponse = {
                success: result.success,
                message: result.success ? 'User documents fetched successfully' : result.error || 'Failed to fetch user documents',
                data: {
                    user,
                    documents: result.data || []
                },
                timestamp: new Date().toISOString(),
            };

            res.status(result.statusCode || 500).json(response);

        } catch (error) {
            console.error('Error fetching user documents:', error);
            const response: ApiResponse = {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };

            res.status(500).json(response);
        }
    }

    /**
     * Admin only: Download document by user ID and document ID
     */
    async downloadUserDocument(req: Request, res: Response): Promise<void> {
        try {
            const currentUser = (req as any).user as User;

            if (!currentUser) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }

            if (currentUser.role !== 'ADMIN') {
                const response: ApiResponse = {
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }

            const { userId, documentId } = req.params;

            if (!userId || !documentId) {
                const response: ApiResponse = {
                    success: false,
                    message: 'User ID and Document ID are required',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Get document info from database with user validation
            const { prisma } = await import('../lib/prisma');
            const document = await prisma.document.findFirst({
                where: {
                    id: documentId,
                    userId: userId
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            username: true
                        }
                    }
                }
            });

            if (!document) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Document not found for this user',
                    timestamp: new Date().toISOString(),
                };
                res.status(404).json(response);
                return;
            }

            // Extract filename from filePath
            const fileName = document.filePath.split('/').pop();
            if (!fileName) {
                const response: ApiResponse = {
                    success: false,
                    message: 'Invalid file path',
                    timestamp: new Date().toISOString(),
                };
                res.status(400).json(response);
                return;
            }

            // Get file stream from MinIO
            const fileResult = await minioService.getFileStream('documents', fileName);

            if (!fileResult.success) {
                const response: ApiResponse = {
                    success: false,
                    message: fileResult.error || 'Failed to get file',
                    timestamp: new Date().toISOString(),
                };
                res.status(fileResult.statusCode || 500).json(response);
                return;
            }

            // Set headers for file download
            res.setHeader('Content-Type', fileResult.data!.contentType);
            res.setHeader('Content-Length', fileResult.data!.size);
            res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

            // Log download activity
            console.log(`📥 Admin ${currentUser.username} downloaded document: ${document.fileName} (user: ${document.user.username})`);

            // Pipe the file stream to response
            fileResult.data!.stream.pipe(res);

        } catch (error) {
            console.error('Error downloading user document:', error);
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
