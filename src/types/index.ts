import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}

export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode?: number;
}

export type Role = 'USER' | 'GOALKEEPER' | 'REFEREE' | 'FOOTBALL_FIELD_OWNER' | 'ADMIN';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string; // Now required for all roles
    location?: string | null;
    bio?: string | null;
    profilePhoto?: string | null;
    lisans: boolean;
    role: Role;
    subscription: boolean; // User subscription status (default false)
    status: boolean; // User active/inactive status
    createdAt: Date;
    updatedAt: Date;
    documents?: Document[];
}

export interface Document {
    id: string;
    fileName: string;
    fileType: string;
    filePath: string;
    fileSize: number;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserDto {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string; // Now required for all roles
    location?: string;
    bio?: string;
    profilePhoto?: string;
    lisans?: boolean;
    role?: Role;
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
    profilePhoto?: string;
    lisans?: boolean;
    role?: Role;
}

export interface RegisterDto {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    phone: string; // Now required for all roles
    location?: string;
    bio?: string;
    profilePhoto?: any; // Multer file object
    lisans?: boolean; // Now configurable for GOALKEEPER and REFEREE
    role: Role;
    documents?: any[]; // Multer file objects
}

export interface LoginDto {
    username: string;
    password: string;
}

export interface StatusChangeDto {
    userId: string;
    status: boolean;
}

export interface SubscriptionChangeDto {
    userId: string;
    subscription: boolean;
}

export interface AuthResponse {
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export interface CustomRequest extends Request {
    user?: User;
}

export interface CustomResponse extends Response { }

export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
} 