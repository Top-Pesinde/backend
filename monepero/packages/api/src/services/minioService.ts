import * as Minio from 'minio';
import { ServiceResponse } from '../types';

export class MinioService {
    private minioClient: Minio.Client;
    private readonly PROFILE_PHOTOS_BUCKET = 'profile-photos';
    private readonly DOCUMENTS_BUCKET = 'documents';
    private readonly GENERAL_UPLOADS_BUCKET = 'general-uploads';
    private readonly FIELDS_BUCKET = 'fields';

    constructor() {
        this.minioClient = new Minio.Client({
            endPoint: process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
        });

        this.initializeBuckets();
    }

    private async initializeBuckets(): Promise<void> {
        try {
            const buckets = [
                this.PROFILE_PHOTOS_BUCKET,
                this.DOCUMENTS_BUCKET,
                this.GENERAL_UPLOADS_BUCKET,
                this.FIELDS_BUCKET
            ];

            for (const bucket of buckets) {
                const exists = await this.minioClient.bucketExists(bucket);
                if (!exists) {
                    await this.minioClient.makeBucket(bucket, 'us-east-1');
                    console.log(`✅ Bucket '${bucket}' created successfully`);
                }

                // Set public policy for profile photos, documents and fields (her seferinde kontrol et)
                if (bucket === this.PROFILE_PHOTOS_BUCKET || bucket === this.DOCUMENTS_BUCKET || bucket === this.FIELDS_BUCKET) {
                    try {
                        const policy = {
                            Version: '2012-10-17',
                            Statement: [
                                {
                                    Effect: 'Allow',
                                    Principal: { AWS: ['*'] },
                                    Action: ['s3:GetObject'],
                                    Resource: [`arn:aws:s3:::${bucket}/*`]
                                }
                            ]
                        };
                        await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
                        console.log(`✅ Public policy set for bucket '${bucket}'`);
                    } catch (error) {
                        console.error(`❌ Failed to set public policy for bucket '${bucket}':`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Error initializing MinIO buckets:', error);
        }
    }

    async uploadProfilePhoto(
        file: Express.Multer.File,
        userId: string
    ): Promise<ServiceResponse<{ url: string; fileName: string }>> {
        try {
            const fileName = `profile-${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;

            await this.minioClient.putObject(
                this.PROFILE_PHOTOS_BUCKET,
                fileName,
                file.buffer,
                file.size,
                {
                    'Content-Type': file.mimetype,
                    'Cache-Control': 'max-age=31536000', // 1 year
                }
            );

            // Generate public URL for profile photo
            const baseUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
            const url = `${baseUrl}/${this.PROFILE_PHOTOS_BUCKET}/${fileName}`;

            console.log(`✅ Profile photo uploaded: ${fileName} -> ${url}`);

            return {
                success: true,
                data: { url, fileName },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error uploading profile photo:', error);
            return {
                success: false,
                error: 'Failed to upload profile photo',
                statusCode: 500,
            };
        }
    }

    async uploadProfilePhotoFromUrl(
        imageUrl: string,
        userId: string
    ): Promise<ServiceResponse<{ url: string; fileName: string }>> {
        try {
            // URL'den resmi indir
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
            }

            const imageBuffer = Buffer.from(await response.arrayBuffer());
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            
            // Dosya uzantısını belirle
            const extension = contentType.split('/')[1] || 'jpg';
            const fileName = `profile-${userId}-${Date.now()}.${extension}`;

            await this.minioClient.putObject(
                this.PROFILE_PHOTOS_BUCKET,
                fileName,
                imageBuffer,
                imageBuffer.length,
                {
                    'Content-Type': contentType,
                    'Cache-Control': 'max-age=31536000', // 1 year
                }
            );

            // Generate public URL for profile photo
            const baseUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
            const url = `${baseUrl}/${this.PROFILE_PHOTOS_BUCKET}/${fileName}`;

            console.log(`✅ Profile photo uploaded from URL: ${fileName} -> ${url}`);

            return {
                success: true,
                data: { url, fileName },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error uploading profile photo from URL:', error);
            return {
                success: false,
                error: 'Failed to upload profile photo from URL',
                statusCode: 500,
            };
        }
    }

    async uploadDocument(
        file: Express.Multer.File,
        userId: string
    ): Promise<ServiceResponse<{ url: string; fileName: string }>> {
        try {
            const fileName = `doc-${userId}-${Date.now()}-${file.originalname}`;

            await this.minioClient.putObject(
                this.DOCUMENTS_BUCKET,
                fileName,
                file.buffer,
                file.size,
                {
                    'Content-Type': file.mimetype,
                }
            );

            // Generate public URL for document (now public like profile photos)
            const baseUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
            const url = `${baseUrl}/${this.DOCUMENTS_BUCKET}/${fileName}`;

            console.log(`✅ Document uploaded: ${fileName} -> ${url}`);

            return {
                success: true,
                data: { url, fileName },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error uploading document:', error);
            return {
                success: false,
                error: 'Failed to upload document',
                statusCode: 500,
            };
        }
    }

    async uploadFieldPhoto(
        file: Express.Multer.File,
        fieldId: string
    ): Promise<ServiceResponse<{ url: string; fileName: string }>> {
        try {
            const fileName = `field-${fieldId}-${Date.now()}.${file.originalname.split('.').pop()}`;

            await this.minioClient.putObject(
                this.FIELDS_BUCKET,
                fileName,
                file.buffer,
                file.size,
                {
                    'Content-Type': file.mimetype,
                    'Cache-Control': 'max-age=31536000', // 1 year
                }
            );

            // Generate public URL for field photo
            const baseUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
            const url = `${baseUrl}/${this.FIELDS_BUCKET}/${fileName}`;

            console.log(`✅ Field photo uploaded: ${fileName} -> ${url}`);

            return {
                success: true,
                data: { url, fileName },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error uploading field photo:', error);
            return {
                success: false,
                error: 'Failed to upload field photo',
                statusCode: 500,
            };
        }
    }

    async uploadFile(
        file: Express.Multer.File,
        bucketType: 'profile' | 'document' | 'general' | 'field',
        userId?: string,
        fieldId?: string
    ): Promise<ServiceResponse<{ url: string; fileName: string }>> {
        try {
            let bucket: string;
            let fileName: string;

            switch (bucketType) {
                case 'profile':
                    bucket = this.PROFILE_PHOTOS_BUCKET;
                    fileName = `profile-${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;
                    break;
                case 'document':
                    bucket = this.DOCUMENTS_BUCKET;
                    fileName = `doc-${userId}-${Date.now()}-${file.originalname}`;
                    break;
                case 'field':
                    bucket = this.FIELDS_BUCKET;
                    fileName = `field-${fieldId}-${Date.now()}.${file.originalname.split('.').pop()}`;
                    break;
                default:
                    bucket = this.GENERAL_UPLOADS_BUCKET;
                    fileName = `${Date.now()}-${file.originalname}`;
            }

            await this.minioClient.putObject(
                bucket,
                fileName,
                file.buffer,
                file.size,
                {
                    'Content-Type': file.mimetype,
                }
            );

            // Public URL for both profile photos and documents
            const baseUrl = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000';
            const url = `${baseUrl}/${bucket}/${fileName}`;

            return {
                success: true,
                data: { url, fileName },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                error: 'Failed to upload file',
                statusCode: 500,
            };
        }
    }

    async deleteFile(bucketName: string, fileName: string): Promise<ServiceResponse<null>> {
        try {
            await this.minioClient.removeObject(bucketName, fileName);
            return {
                success: true,
                data: null,
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error deleting file:', error);
            return {
                success: false,
                error: 'Failed to delete file',
                statusCode: 500,
            };
        }
    }

    async getFileUrl(
        bucketName: string,
        fileName: string,
        expiry: number = 24 * 60 * 60
    ): Promise<ServiceResponse<{ url: string }>> {
        try {
            const url = await this.minioClient.presignedGetObject(bucketName, fileName, expiry);
            return {
                success: true,
                data: { url },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error getting file URL:', error);
            return {
                success: false,
                error: 'Failed to get file URL',
                statusCode: 500,
            };
        }
    }

    async listFiles(bucketName: string, prefix?: string): Promise<ServiceResponse<string[]>> {
        try {
            const files: string[] = [];
            const stream = this.minioClient.listObjects(bucketName, prefix, true);

            return new Promise((resolve) => {
                stream.on('data', (obj) => files.push(obj.name!));
                stream.on('end', () => {
                    resolve({
                        success: true,
                        data: files,
                        statusCode: 200,
                    });
                });
                stream.on('error', (error) => {
                    console.error('Error listing files:', error);
                    resolve({
                        success: false,
                        error: 'Failed to list files',
                        statusCode: 500,
                    });
                });
            });
        } catch (error) {
            console.error('Error listing files:', error);
            return {
                success: false,
                error: 'Failed to list files',
                statusCode: 500,
            };
        }
    }

    // Utility method to get bucket name by type
    getBucketName(type: 'profile' | 'document' | 'general' | 'field'): string {
        switch (type) {
            case 'profile':
                return this.PROFILE_PHOTOS_BUCKET;
            case 'document':
                return this.DOCUMENTS_BUCKET;
            case 'field':
                return this.FIELDS_BUCKET;
            default:
                return this.GENERAL_UPLOADS_BUCKET;
        }
    }

    /**
     * Download file as buffer for direct serving
     */
    async downloadFile(bucketName: string, fileName: string): Promise<ServiceResponse<{ buffer: Buffer; contentType: string; originalName: string }>> {
        try {
            const chunks: Buffer[] = [];
            const stream = await this.minioClient.getObject(bucketName, fileName);

            // Get object metadata to get content type
            const objectStat = await this.minioClient.statObject(bucketName, fileName);

            return new Promise((resolve, reject) => {
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const contentType = objectStat.metaData['content-type'] || 'application/octet-stream';

                    // Extract original file name from stored filename
                    let originalName = fileName;
                    if (fileName.includes('-')) {
                        // Format: doc-userId-timestamp-originalname.ext
                        const parts = fileName.split('-');
                        if (parts.length >= 4) {
                            originalName = parts.slice(3).join('-');
                        }
                    }

                    resolve({
                        success: true,
                        data: { buffer, contentType, originalName },
                        statusCode: 200,
                    });
                });
                stream.on('error', (error) => {
                    console.error('Error downloading file:', error);
                    resolve({
                        success: false,
                        error: 'Failed to download file',
                        statusCode: 500,
                    });
                });
            });
        } catch (error) {
            console.error('Error downloading file:', error);
            return {
                success: false,
                error: 'Failed to download file',
                statusCode: 500,
            };
        }
    }

    /**
     * Get file stream for downloading
     */
    async getFileStream(bucketName: string, fileName: string): Promise<ServiceResponse<{ stream: NodeJS.ReadableStream; contentType: string; originalName: string; size: number }>> {
        try {
            const stream = await this.minioClient.getObject(bucketName, fileName);
            const objectStat = await this.minioClient.statObject(bucketName, fileName);

            const contentType = objectStat.metaData['content-type'] || 'application/octet-stream';
            const size = objectStat.size;

            // Extract original file name from stored filename
            let originalName = fileName;
            if (fileName.includes('-')) {
                // Format: doc-userId-timestamp-originalname.ext
                const parts = fileName.split('-');
                if (parts.length >= 4) {
                    originalName = parts.slice(3).join('-');
                }
            }

            return {
                success: true,
                data: { stream, contentType, originalName, size },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error getting file stream:', error);
            return {
                success: false,
                error: 'Failed to get file stream',
                statusCode: 500,
            };
        }
    }

    /**
     * Get document download URL by document ID
     */
    async getDocumentDownloadUrl(documentId: string, expiry: number = 24 * 60 * 60): Promise<ServiceResponse<{ url: string; fileName: string }>> {
        try {
            // Get document from database
            const { prisma } = await import('../lib/prisma');
            const document = await prisma.document.findUnique({
                where: { id: documentId }
            });

            if (!document) {
                return {
                    success: false,
                    error: 'Document not found',
                    statusCode: 404,
                };
            }

            // Extract filename from filePath (format: http://ip:port/bucket/filename)
            const fileName = document.filePath.split('/').pop();
            if (!fileName) {
                return {
                    success: false,
                    error: 'Invalid file path',
                    statusCode: 400,
                };
            }

            let url = await this.minioClient.presignedGetObject(this.DOCUMENTS_BUCKET, fileName, expiry);

            // Replace localhost with external IP if needed
            if (url.includes('localhost')) {
                const publicUrl = process.env.MINIO_PUBLIC_URL || 'http://176.96.131.222:9000';
                const baseUrl = publicUrl.replace('http://', '').replace('https://', '');
                url = url.replace(/localhost:9000/g, baseUrl);
            }

            return {
                success: true,
                data: { url, fileName: document.fileName },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error getting document download URL:', error);
            return {
                success: false,
                error: 'Failed to get document download URL',
                statusCode: 500,
            };
        }
    }

    /**
     * Get user documents by user ID
     */
    async getUserDocuments(userId: string): Promise<ServiceResponse<any[]>> {
        try {
            const { prisma } = await import('../lib/prisma');
            const documents = await prisma.document.findMany({
                where: { userId },
                select: {
                    id: true,
                    fileName: true,
                    fileType: true,
                    filePath: true,
                    fileSize: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });

            return {
                success: true,
                data: documents,
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error getting user documents:', error);
            return {
                success: false,
                error: 'Failed to get user documents',
                statusCode: 500,
            };
        }
    }
} 