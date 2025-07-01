import { ServiceResponse, PaginationParams, PaginatedResponse, User, Role } from '../types';
import { prisma } from '../lib/prisma';

interface UserFilters {
    role?: string;
    status?: boolean;
    search?: string;
}

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    usersByRole: {
        [key in Role]: number;
    };
    subscribedUsers: number;
    recentRegistrations: number; // last 7 days
}

export class UserService {
    async getAllUsers(
        paginationParams: PaginationParams,
        filters: UserFilters = {}
    ): Promise<ServiceResponse<PaginatedResponse<Omit<User, 'password'>>>> {
        try {
            const { page, limit, sortBy, sortOrder } = paginationParams;
            const { role, status, search } = filters;

            // Calculate offset
            const offset = (page - 1) * limit;

            // Build where clause
            const where: any = {};

            if (role) {
                where.role = role;
            }

            if (status !== undefined) {
                where.status = status;
            }

            if (search) {
                where.OR = [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ];
            }

            // Get total count
            const total = await prisma.user.count({ where });

            // Get users with pagination
            const users = await prisma.user.findMany({
                where,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    phone: true,
                    location: true,
                    bio: true,
                    profilePhoto: true,
                    lisans: true,
                    role: true,
                    subscription: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    documents: {
                        select: {
                            id: true,
                            fileName: true,
                            fileType: true,
                            filePath: true,
                            fileSize: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                },
                orderBy: sortBy === 'createdAt' ? { createdAt: sortOrder } :
                    sortBy === 'updatedAt' ? { updatedAt: sortOrder } :
                        sortBy === 'firstName' ? { firstName: sortOrder } :
                            sortBy === 'lastName' ? { lastName: sortOrder } :
                                sortBy === 'username' ? { username: sortOrder } :
                                    sortBy === 'email' ? { email: sortOrder } :
                                        { createdAt: sortOrder },
                skip: offset,
                take: limit,
            });

            const totalPages = Math.ceil(total / limit);

            return {
                success: true,
                data: {
                    data: users as Omit<User, 'password'>[],
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages,
                    },
                },
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error fetching users:', error);
            return {
                success: false,
                error: 'Failed to fetch users',
                statusCode: 500,
            };
        }
    }

    async getUserById(userId: string): Promise<ServiceResponse<Omit<User, 'password'>>> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    phone: true,
                    location: true,
                    bio: true,
                    profilePhoto: true,
                    lisans: true,
                    role: true,
                    subscription: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    documents: {
                        select: {
                            id: true,
                            fileName: true,
                            fileType: true,
                            filePath: true,
                            fileSize: true,
                            createdAt: true,
                            updatedAt: true,
                        }
                    }
                },
            });

            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    statusCode: 404,
                };
            }

            return {
                success: true,
                data: user as Omit<User, 'password'>,
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error fetching user:', error);
            return {
                success: false,
                error: 'Failed to fetch user',
                statusCode: 500,
            };
        }
    }

    async getUserStats(): Promise<ServiceResponse<UserStats>> {
        try {
            // Get total users
            const totalUsers = await prisma.user.count();

            // Get active/inactive users
            const activeUsers = await prisma.user.count({
                where: { status: true }
            });

            const inactiveUsers = totalUsers - activeUsers;

            // Get subscribed users
            const subscribedUsers = await prisma.user.count({
                where: { subscription: true }
            });

            // Get users by role
            const roleStats = await prisma.user.groupBy({
                by: ['role'],
                _count: {
                    id: true,
                },
            });

            const usersByRole: { [key in Role]: number } = {
                USER: 0,
                GOALKEEPER: 0,
                REFEREE: 0,
                FOOTBALL_FIELD_OWNER: 0,
                ADMIN: 0,
            };

            roleStats.forEach(stat => {
                usersByRole[stat.role as Role] = stat._count.id;
            });

            // Get recent registrations (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentRegistrations = await prisma.user.count({
                where: {
                    createdAt: {
                        gte: sevenDaysAgo,
                    }
                }
            });

            const stats: UserStats = {
                totalUsers,
                activeUsers,
                inactiveUsers,
                usersByRole,
                subscribedUsers,
                recentRegistrations,
            };

            return {
                success: true,
                data: stats,
                statusCode: 200,
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return {
                success: false,
                error: 'Failed to fetch user statistics',
                statusCode: 500,
            };
        }
    }
}
