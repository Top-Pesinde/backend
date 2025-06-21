import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
    statusCode?: number;
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
    fieldListing?: FieldListing;
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

export interface UpdateProfileDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    location?: string;
}

export interface UpdateContactInfoDto {
    email?: string;
    phone?: string;
    location?: string;
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

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

// Field Listing Types
export type SurfaceType = 'GRASS' | 'ARTIFICIAL' | 'CONCRETE' | 'CARPET';
export type ContactType = 'PHONE' | 'WHATSAPP';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type FeatureType =
    // Teknik Özellikler
    'OPEN_24_7' | 'ONLINE_RESERVATION' | 'FREE_WIFI' | 'SECURITY_CAMERA' |
    // Olanaklar
    'CHANGING_ROOM' | 'SHOWER' | 'TOILET' | 'PARKING' | 'CAFE' | 'TRIBUNE' | 'RENTAL_SHOES' | 'RENTAL_GLOVES';

export interface FieldSchedule {
    id: string;
    fieldListingId: string;
    dayOfWeek: DayOfWeek;
    startTime: string; // Format: "HH:MM"
    endTime: string;   // Format: "HH:MM"
}

export interface FieldFeature {
    id: string;
    fieldListingId: string;
    featureType: FeatureType;
}

export interface FieldPhoto {
    id: string;
    fieldListingId: string;
    photoUrl: string;
    photoOrder: number;
}

export interface SubField {
    id: string;
    fieldListingId: string;
    name: string;
    surfaceType: SurfaceType;
    hourlyPrice: number;
    isIndoor: boolean;
}

export interface FieldListing {
    id: string;
    userId: string;
    fieldName: string;
    fieldAddress: string;
    hourlyPrice: number;
    isIndoor: boolean;
    surfaceType: SurfaceType;
    phone: string;
    contactType: ContactType;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: User;
    schedules: FieldSchedule[];
    features: FieldFeature[];
    photos: FieldPhoto[];
    subFields: SubField[];
}

export interface FieldScheduleDto {
    dayOfWeek: DayOfWeek;
    startTime: string; // Format: "HH:MM"
    endTime: string;   // Format: "HH:MM"
}

export interface SubFieldDto {
    name: string;
    surfaceType: SurfaceType;
    hourlyPrice: number;
    isIndoor: boolean;
}

export interface CreateFieldListingDto {
    fieldName: string;
    fieldAddress: string;
    hourlyPrice: number;
    isIndoor: boolean;
    surfaceType: SurfaceType;
    phone: string;
    contactType: ContactType;
    description?: string;
    schedules: FieldScheduleDto[];
    features: FeatureType[];
    subFields?: SubFieldDto[];
    photos?: any[]; // Multer file objects
}

export interface UpdateFieldListingDto {
    fieldName?: string;
    fieldAddress?: string;
    hourlyPrice?: number;
    isIndoor?: boolean;
    surfaceType?: SurfaceType;
    phone?: string;
    contactType?: ContactType;
    description?: string;
    schedules?: FieldScheduleDto[];
    features?: FeatureType[];
    subFields?: SubFieldDto[];
    photos?: any[]; // Multer file objects
}

export interface FieldListingFilterDto {
    surfaceType?: SurfaceType;
    isIndoor?: boolean;
    minPrice?: number;
    maxPrice?: number;
    features?: FeatureType[];
    dayOfWeek?: DayOfWeek;
    startTime?: string;
    endTime?: string;
    search?: string; // For field name or address search
}
