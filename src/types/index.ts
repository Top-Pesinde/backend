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
    deviceInfo?: string;
    platform?: Platform;
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
    sessionInfo?: {
        sessionId: string;
        deviceInfo?: string;
        location?: string;
        platform?: Platform;
    };
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
    jti?: string; // JWT ID - session token için
    iat?: number;
    exp?: number;
}

export interface CustomRequest extends Request {
    user?: User;
    body: any;
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[]; };
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

export interface ForgotPasswordDto {
    email: string;
}

export interface ResetPasswordDto {
    token: string;
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
    startTime?: string | null; // Format: "HH:MM" - nullable for closed days
    endTime?: string | null;   // Format: "HH:MM" - nullable for closed days
    isOpen: boolean;           // false means closed/holiday
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
    startTime?: string; // Format: "HH:MM" - optional for closed days
    endTime?: string;   // Format: "HH:MM" - optional for closed days
    isOpen?: boolean;   // false means closed/holiday, default true
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
    isActive?: boolean;
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

// Goalkeeper & Referee Listing Types
export interface GoalkeeperListing {
    id: string;
    userId: string;
    title: string;
    location: string;
    description: string;
    hasLicense: boolean;
    hourlyPrice: number | string; // Can be Decimal from Prisma or number from input
    bio: string;
    phone: string;
    contactType: ContactType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: User;
}

export interface RefereeListing {
    id: string;
    userId: string;
    title: string;
    location: string;
    description: string;
    hasLicense: boolean;
    hourlyPrice: number | string; // Can be Decimal from Prisma or number from input
    bio: string;
    phone: string;
    contactType: ContactType;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    user?: User;
}

export interface CreateGoalkeeperListingDto {
    title: string;
    location: string;
    description: string;
    hasLicense?: boolean;
    hourlyPrice: number;
    bio: string;
    phone: string;
    contactType?: ContactType;
}

export interface CreateRefereeListingDto {
    title: string;
    location: string;
    description: string;
    hasLicense?: boolean;
    hourlyPrice: number;
    bio: string;
    phone: string;
    contactType?: ContactType;
}

export interface UpdateGoalkeeperListingDto {
    title?: string;
    location?: string;
    description?: string;
    hasLicense?: boolean;
    hourlyPrice?: number;
    bio?: string;
    phone?: string;
    contactType?: ContactType;
    isActive?: boolean;
}

export interface UpdateRefereeListingDto {
    title?: string;
    location?: string;
    description?: string;
    hasLicense?: boolean;
    hourlyPrice?: number;
    bio?: string;
    phone?: string;
    contactType?: ContactType;
    isActive?: boolean;
}

export interface ServiceListingFilterDto {
    minPrice?: number;
    maxPrice?: number;
    hasLicense?: boolean;
    location?: string;
    search?: string; // For title or bio search
}

// ========================
// FCM Token Types
// ========================

export type Platform = 'IOS' | 'ANDROID' | 'WEB';

export interface FcmToken {
    id: string;
    userId: string;
    token: string;
    platform: Platform;
    deviceId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateFcmTokenDto {
    token: string;
    platform: Platform;
    deviceId?: string;
}

export interface UpdateFcmTokenDto {
    token?: string;
    platform?: Platform;
    deviceId?: string;
    isActive?: boolean;
}

// Session Management Types
export interface UserSession {
    id: string;
    userId: string;
    sessionToken: string;
    deviceInfo?: string;
    ipAddress?: string;
    location?: string;
    platform?: Platform;
    isActive: boolean;
    lastAccessedAt: Date;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface SessionListDto {
    sessions: {
        id: string;
        deviceInfo?: string;
        ipAddress?: string;
        location?: string;
        platform?: Platform;
        lastAccessedAt: Date;
        createdAt: Date;
        isCurrent: boolean;
    }[];
}

export interface TerminateSessionDto {
    sessionToken: string;
}

export interface TerminateOtherSessionsDto {
    keepCurrent: boolean;
}
