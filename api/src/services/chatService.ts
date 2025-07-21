import { prisma } from '../lib/prisma';
import { Conversation, Message, UserBlock, MessageType } from '@prisma/client';

export class ChatService {
    // İki kullanıcı arasında konuşma bulur veya oluşturur
    async findOrCreateConversation(user1Id: string, user2Id: string): Promise<{
        success: boolean;
        data?: Conversation;
        error?: string;
    }> {
        try {
            // Kullanıcıların birbirini engellediğini kontrol et
            const isBlocked = await this.checkIfBlocked(user1Id, user2Id);
            if (isBlocked) {
                return {
                    success: false,
                    error: 'Bu kullanıcı ile mesajlaşamazsınız.'
                };
            }

            // Mevcut konuşmayı ara (her iki yönde de)
            let conversation = await prisma.conversation.findFirst({
                where: {
                    OR: [
                        { user1Id, user2Id },
                        { user1Id: user2Id, user2Id: user1Id }
                    ],
                    isActive: true
                },
                include: {
                    user1: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    user2: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    }
                }
            });

            // Konuşma yoksa oluştur
            if (!conversation) {
                conversation = await prisma.conversation.create({
                    data: {
                        user1Id,
                        user2Id
                    },
                    include: {
                        user1: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                                profilePhoto: true
                            }
                        },
                        user2: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                username: true,
                                profilePhoto: true
                            }
                        }
                    }
                });
            }

            return {
                success: true,
                data: conversation
            };
        } catch (error) {
            console.error('Konuşma bulma/oluşturma hatası:', error);
            return {
                success: false,
                error: 'Konuşma işlemi başarısız oldu'
            };
        }
    }

    // Mesaj gönder
    async sendMessage(data: {
        senderId: string;
        receiverId: string;
        content: string;
        messageType?: MessageType;
        replyToId?: string;
        attachmentUrl?: string;
    }): Promise<{
        success: boolean;
        data?: Message & { conversation: Conversation };
        error?: string;
    }> {
        try {
            const { senderId, receiverId, content, messageType = 'TEXT', replyToId, attachmentUrl } = data;

            // Kullanıcıların birbirini engellediğini kontrol et
            const isBlocked = await this.checkIfBlocked(senderId, receiverId);
            if (isBlocked) {
                // Ban kontrolü yap
                const isBanned = await this.checkIfBanned(senderId, receiverId);
                if (isBanned) {
                    return {
                        success: false,
                        error: 'Bu kullanıcı kalıcı olarak banlandı. Mesaj gönderemezsiniz.'
                    };
                }

                return {
                    success: false,
                    error: 'Bu kullanıcıya mesaj gönderemezsiniz.'
                };
            }

            // Konuşmayı bul veya oluştur
            const conversationResult = await this.findOrCreateConversation(senderId, receiverId);
            if (!conversationResult.success || !conversationResult.data) {
                return {
                    success: false,
                    error: conversationResult.error || 'Konuşma oluşturulamadı'
                };
            }

            const conversation = conversationResult.data;

            // Mesajı oluştur
            const message = await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId,
                    receiverId,
                    content,
                    messageType,
                    replyToId,
                    attachmentUrl
                },
                include: {
                    conversation: {
                        include: {
                            user1: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true,
                                    profilePhoto: true
                                }
                            },
                            user2: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true,
                                    profilePhoto: true
                                }
                            }
                        }
                    },
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    replyTo: {
                        select: {
                            id: true,
                            content: true,
                            senderId: true,
                            messageType: true
                        }
                    }
                }
            });

            // Konuşmanın son mesajını güncelle
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessage: content.length > 100 ? content.substring(0, 100) + '...' : content,
                    lastMessageAt: new Date()
                }
            });

            return {
                success: true,
                data: message
            };
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
            return {
                success: false,
                error: 'Mesaj gönderilemedi'
            };
        }
    }

    // Konuşmanın mesajlarını getir
    async getConversationMessages(
        conversationId: string,
        userId: string,
        page: number = 1,
        limit: number = 50,
        fromDate?: Date
    ): Promise<{
        success: boolean;
        data?: {
            messages: any[];
            totalCount: number;
            hasMore: boolean;
        };
        error?: string;
    }> {
        try {
            // Kullanıcının bu konuşmaya erişiminin olduğunu kontrol et
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    OR: [
                        { user1Id: userId },
                        { user2Id: userId }
                    ],
                    isActive: true
                }
            });

            if (!conversation) {
                return {
                    success: false,
                    error: 'Konuşma bulunamadı veya erişim yetkiniz yok'
                };
            }

            const skip = (page - 1) * limit;

            // Tarih filtresi için where koşulunu hazırla
            const messageWhere: any = {
                conversationId,
                isDeleted: false
            };

            // Eğer fromDate verilmişse, o tarihten itibaren mesajları getir
            if (fromDate) {
                messageWhere.createdAt = {
                    gte: fromDate
                };
            }

            // Mesajları getir
            const messages = await prisma.message.findMany({
                where: messageWhere,
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    replyTo: {
                        select: {
                            id: true,
                            content: true,
                            senderId: true,
                            messageType: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            });

            // Toplam mesaj sayısı (filtrelenmiş)
            const totalCount = await prisma.message.count({
                where: messageWhere
            });

            const hasMore = skip + messages.length < totalCount;

            // Mesajları TR formatında tarihe çevir
            const formattedMessages = messages.map(message => ({
                ...message,
                createdAt: message.createdAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                readAt: message.readAt ? message.readAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : null,
                editedAt: message.editedAt ? message.editedAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : null
            }));

            return {
                success: true,
                data: {
                    messages: formattedMessages.reverse(), // En eski mesajdan en yeniye doğru sırala
                    totalCount,
                    hasMore
                }
            };
        } catch (error) {
            console.error('Mesajları getirme hatası:', error);
            return {
                success: false,
                error: 'Mesajlar getirilemedi'
            };
        }
    }

    // Konuşmanın TÜM mesajlarını getir (sınırlama olmadan)
    async getAllConversationMessages(
        conversationId: string,
        userId: string
    ): Promise<{
        success: boolean;
        data?: any[];
        error?: string;
    }> {
        try {
            // Kullanıcının bu konuşmaya erişiminin olduğunu kontrol et
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    OR: [
                        { user1Id: userId },
                        { user2Id: userId }
                    ],
                    isActive: true
                }
            });

            if (!conversation) {
                return {
                    success: false,
                    error: 'Konuşma bulunamadı veya erişim yetkiniz yok'
                };
            }

            // TÜM mesajları getir (limit yok)
            const messages = await prisma.message.findMany({
                where: {
                    conversationId,
                    isDeleted: false
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    replyTo: {
                        select: {
                            id: true,
                            content: true,
                            senderId: true,
                            messageType: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'asc' // En eski mesajdan en yeniye doğru
                }
            });

            // Mesajları TR formatında tarihe çevir
            const formattedMessages = messages.map(message => ({
                ...message,
                createdAt: message.createdAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                readAt: message.readAt ? message.readAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : null,
                editedAt: message.editedAt ? message.editedAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : null
            }));

            return {
                success: true,
                data: formattedMessages
            };
        } catch (error) {
            console.error('Tüm mesajları getirme hatası:', error);
            return {
                success: false,
                error: 'Tüm mesajlar getirilemedi'
            };
        }
    }

    // Mesajı ID ile getir (okundu durumu kontrolü için)
    async getMessageById(messageId: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> {
        try {
            const message = await prisma.message.findUnique({
                where: {
                    id: messageId,
                    isDeleted: false
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    conversation: {
                        select: {
                            id: true,
                            user1Id: true,
                            user2Id: true
                        }
                    }
                }
            });

            if (!message) {
                return {
                    success: false,
                    error: 'Mesaj bulunamadı'
                };
            }

            // Mesajı TR formatında tarihe çevir
            const formattedMessage = {
                ...message,
                createdAt: message.createdAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                readAt: message.readAt ? message.readAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : null,
                editedAt: message.editedAt ? message.editedAt.toLocaleString('tr-TR', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : null
            };

            return {
                success: true,
                data: formattedMessage
            };
        } catch (error) {
            console.error('Mesaj getirme hatası:', error);
            return {
                success: false,
                error: 'Mesaj getirilemedi'
            };
        }
    }

    // Kullanıcının konuşmalarını getir (son mesaj dahil)
    async getUserConversationsWithLastMessage(userId: string): Promise<{
        success: boolean;
        data?: any[];
        error?: string;
    }> {
        try {
            const conversations = await prisma.conversation.findMany({
                where: {
                    OR: [
                        { user1Id: userId },
                        { user2Id: userId }
                    ]
                    // isActive: true filtresini kaldırdık - engellenen kullanıcılar da görünsün
                },
                include: {
                    user1: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    user2: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    }
                },
                orderBy: {
                    lastMessageAt: 'desc'
                }
            });

            // Her konuşma için son mesaj, okunmamış mesaj sayısını ve engel durumunu hesapla
            const conversationsWithDetails = await Promise.all(
                conversations.map(async (conversation) => {
                    const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

                    // Son mesajı getir (tam detaylarıyla)
                    const lastMessage = await prisma.message.findFirst({
                        where: {
                            conversationId: conversation.id,
                            isDeleted: false
                        },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true,
                                    profilePhoto: true
                                }
                            },
                            receiver: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    username: true,
                                    profilePhoto: true
                                }
                            }
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    });

                    // Okunmamış mesaj sayısı
                    const unreadCount = await prisma.message.count({
                        where: {
                            conversationId: conversation.id,
                            receiverId: userId,
                            isRead: false,
                            isDeleted: false
                        }
                    });

                    // Engel durumu kontrol et
                    const blockStatus = await this.checkBlockStatus(userId, otherUserId);

                    // Son mesajı TR formatında tarihe çevir
                    const formattedLastMessage = lastMessage ? {
                        ...lastMessage,
                        createdAt: lastMessage.createdAt.toLocaleString('tr-TR', {
                            timeZone: 'Europe/Istanbul',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }),
                        readAt: lastMessage.readAt ? lastMessage.readAt.toLocaleString('tr-TR', {
                            timeZone: 'Europe/Istanbul',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        }) : null
                    } : null;

                    return {
                        ...conversation,
                        lastMessage: formattedLastMessage,
                        unreadCount,
                        blockStatus: {
                            isBlocked: blockStatus.isBlocked,
                            hasBlocked: blockStatus.hasBlocked,
                            canMessage: !blockStatus.isBlocked && !blockStatus.hasBlocked
                        }
                    };
                })
            );

            return {
                success: true,
                data: conversationsWithDetails
            };
        } catch (error) {
            console.error('Konuşmaları getirme hatası:', error);
            return {
                success: false,
                error: 'Konuşmalar getirilemedi'
            };
        }
    }

    // Kullanıcının konuşmalarını getir (eski metod - geriye dönük uyumluluk için)
    async getUserConversations(userId: string): Promise<{
        success: boolean;
        data?: any[];
        error?: string;
    }> {
        // Yeni metodu çağır
        return this.getUserConversationsWithLastMessage(userId);
    }

    // Mesajı okundu olarak işaretle
    async markMessageAsRead(messageId: string, userId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const message = await prisma.message.findFirst({
                where: {
                    id: messageId,
                    receiverId: userId,
                    isRead: false
                }
            });

            if (!message) {
                return {
                    success: false,
                    error: 'Mesaj bulunamadı veya zaten okundu'
                };
            }

            await prisma.message.update({
                where: { id: messageId },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Mesaj okundu işaretleme hatası:', error);
            return {
                success: false,
                error: 'Mesaj okundu olarak işaretlenemedi'
            };
        }
    }

    // Konuşmadaki tüm mesajları okundu olarak işaretle
    async markConversationAsRead(conversationId: string, userId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            await prisma.message.updateMany({
                where: {
                    conversationId,
                    receiverId: userId,
                    isRead: false
                },
                data: {
                    isRead: true,
                    readAt: new Date()
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Konuşma okundu işaretleme hatası:', error);
            return {
                success: false,
                error: 'Konuşma okundu olarak işaretlenemedi'
            };
        }
    }

    // Kullanıcı engelle
    async blockUser(blockedById: string, blockedUserId: string, reason?: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            if (blockedById === blockedUserId) {
                return {
                    success: false,
                    error: 'Kendinizi engelleyemezsiniz'
                };
            }

            // Zaten engellenmiş mi kontrol et
            const existingBlock = await prisma.userBlock.findUnique({
                where: {
                    blockedById_blockedUserId: {
                        blockedById,
                        blockedUserId
                    }
                }
            });

            if (existingBlock) {
                return {
                    success: false,
                    error: 'Bu kullanıcı zaten engellenmiş'
                };
            }

            // Engelleme kaydı oluştur
            await prisma.userBlock.create({
                data: {
                    blockedById,
                    blockedUserId,
                    reason
                }
            });

            // Mevcut konuşmayı pasif hale getir
            await prisma.conversation.updateMany({
                where: {
                    OR: [
                        { user1Id: blockedById, user2Id: blockedUserId },
                        { user1Id: blockedUserId, user2Id: blockedById }
                    ]
                },
                data: {
                    isActive: false
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Kullanıcı engelleme hatası:', error);
            return {
                success: false,
                error: 'Kullanıcı engellenemedi'
            };
        }
    }

    // Kullanıcı engelini kaldır
    async unblockUser(blockedById: string, blockedUserId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const deletedBlock = await prisma.userBlock.deleteMany({
                where: {
                    blockedById,
                    blockedUserId
                }
            });

            if (deletedBlock.count === 0) {
                return {
                    success: false,
                    error: 'Engelleme kaydı bulunamadı'
                };
            }

            // Konuşmayı tekrar aktif hale getir
            await prisma.conversation.updateMany({
                where: {
                    OR: [
                        { user1Id: blockedById, user2Id: blockedUserId },
                        { user1Id: blockedUserId, user2Id: blockedById }
                    ]
                },
                data: {
                    isActive: true
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Kullanıcı engel kaldırma hatası:', error);
            return {
                success: false,
                error: 'Engel kaldırılamadı'
            };
        }
    }

    // Engellenmiş kullanıcıları getir
    async getBlockedUsers(userId: string): Promise<{
        success: boolean;
        data?: UserBlock[];
        error?: string;
    }> {
        try {
            const blockedUsers = await prisma.userBlock.findMany({
                where: {
                    blockedById: userId
                },
                include: {
                    blockedUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            return {
                success: true,
                data: blockedUsers
            };
        } catch (error) {
            console.error('Engellenmiş kullanıcıları getirme hatası:', error);
            return {
                success: false,
                error: 'Engellenmiş kullanıcılar getirilemedi'
            };
        }
    }

    // İki kullanıcının birbirini engellediğini kontrol et
    async checkIfBlocked(user1Id: string, user2Id: string): Promise<boolean> {
        try {
            const block = await prisma.userBlock.findFirst({
                where: {
                    OR: [
                        { blockedById: user1Id, blockedUserId: user2Id },
                        { blockedById: user2Id, blockedUserId: user1Id }
                    ]
                }
            });

            return !!block;
        } catch (error) {
            console.error('Engelleme kontrolü hatası:', error);
            return false;
        }
    }

    // Engel durumunu detaylı kontrol et
    async checkBlockStatus(user1Id: string, user2Id: string): Promise<{
        isBlocked: boolean;
        hasBlocked: boolean;
    }> {
        try {
            const user1BlockedUser2 = await prisma.userBlock.findUnique({
                where: {
                    blockedById_blockedUserId: {
                        blockedById: user1Id,
                        blockedUserId: user2Id
                    }
                }
            });

            const user2BlockedUser1 = await prisma.userBlock.findUnique({
                where: {
                    blockedById_blockedUserId: {
                        blockedById: user2Id,
                        blockedUserId: user1Id
                    }
                }
            });

            return {
                isBlocked: !!user2BlockedUser1, // User2, User1'i engellemiş mi?
                hasBlocked: !!user1BlockedUser2  // User1, User2'yi engellemiş mi?
            };
        } catch (error) {
            console.error('Engel durumu kontrolü hatası:', error);
            return {
                isBlocked: false,
                hasBlocked: false
            };
        }
    }

    // İki kullanıcının birbirini banladığını kontrol et
    async checkIfBanned(user1Id: string, user2Id: string): Promise<boolean> {
        try {
            const ban = await prisma.userBlock.findFirst({
                where: {
                    OR: [
                        { blockedById: user1Id, blockedUserId: user2Id, reason: { startsWith: "BAN" } },
                        { blockedById: user2Id, blockedUserId: user1Id, reason: { startsWith: "BAN" } }
                    ]
                }
            });

            return !!ban;
        } catch (error) {
            console.error('Ban kontrolü hatası:', error);
            return false;
        }
    }

    // Mesajı sil
    async deleteMessage(messageId: string, userId: string): Promise<{
        success: boolean;
        error?: string;
    }> {
        try {
            const message = await prisma.message.findFirst({
                where: {
                    id: messageId,
                    senderId: userId,
                    isDeleted: false
                }
            });

            if (!message) {
                return {
                    success: false,
                    error: 'Mesaj bulunamadı veya silme yetkiniz yok'
                };
            }

            await prisma.message.update({
                where: { id: messageId },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    content: 'Bu mesaj silindi'
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Mesaj silme hatası:', error);
            return {
                success: false,
                error: 'Mesaj silinemedi'
            };
        }
    }

    // Mesajı düzenle
    async editMessage(messageId: string, userId: string, newContent: string): Promise<{
        success: boolean;
        data?: Message;
        error?: string;
    }> {
        try {
            const message = await prisma.message.findFirst({
                where: {
                    id: messageId,
                    senderId: userId,
                    isDeleted: false
                }
            });

            if (!message) {
                return {
                    success: false,
                    error: 'Mesaj bulunamadı veya düzenleme yetkiniz yok'
                };
            }

            // 5 dakikadan eski mesajları düzenlemeye izin verme
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (message.createdAt < fiveMinutesAgo) {
                return {
                    success: false,
                    error: 'Mesaj düzenlemek için çok geç'
                };
            }

            const updatedMessage = await prisma.message.update({
                where: { id: messageId },
                data: {
                    content: newContent,
                    isEdited: true,
                    editedAt: new Date()
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    }
                }
            });

            return {
                success: true,
                data: updatedMessage
            };
        } catch (error) {
            console.error('Mesaj düzenleme hatası:', error);
            return {
                success: false,
                error: 'Mesaj düzenlenemedi'
            };
        }
    }

    // Konuşma detayını getir
    async getConversationDetail(conversationId: string, userId: string, targetDate?: Date): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> {
        try {
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    user1: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    },
                    user2: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePhoto: true
                        }
                    }
                }
            });

            if (!conversation) {
                return { success: false, error: 'Konuşma bulunamadı' };
            }

            const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

            // Tarih filtresi için where koşulunu hazırla
            const messageWhere: any = {
                conversationId,
                isDeleted: false
            };

            // Eğer targetDate verilmişse, o tarihteki mesajları getir
            if (targetDate) {
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);

                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);

                messageWhere.createdAt = {
                    gte: startOfDay,
                    lte: endOfDay
                };
            }

            // Hem kendi hem karşı tarafın mesajlarını getir (eski->yeni)
            const allMessages = await prisma.message.findMany({
                where: messageWhere,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    isRead: true,
                    senderId: true,
                    receiverId: true
                },
                orderBy: { createdAt: 'asc' } // Eski mesajlar önce (ilk mesaj en üstte)
            });

            // İlk mesajı al (en eski mesaj)
            const firstMessage = allMessages.length > 0 ? allMessages[0] : null;

            const totalMessages = await prisma.message.count({ where: { conversationId } });
            const unreadCount = await prisma.message.count({
                where: {
                    conversationId,
                    receiverId: userId,
                    isRead: false,
                    isDeleted: false
                }
            });

            const blockStatus = await this.checkBlockStatus(userId, otherUserId);

            return {
                success: true,
                data: {
                    ...conversation,
                    stats: {
                        totalMessages,
                        unreadCount,
                        firstMessage: firstMessage, // İlk mesaj bilgisi
                        targetDate: targetDate?.toISOString() || null
                    },
                    allMessages: allMessages, // Filtrelenmiş mesajlar
                    blockStatus: {
                        isBlocked: blockStatus.isBlocked,
                        hasBlocked: blockStatus.hasBlocked,
                        canMessage: !blockStatus.isBlocked && !blockStatus.hasBlocked
                    }
                }
            };
        } catch (error) {
            console.error('Konuşma detayı getirme hatası:', error);
            return { success: false, error: 'Konuşma detayı getirilemedi' };
        }
    }

    // Konuşmadaki okunmamış mesaj sayısını getir
    async getUnreadCount(conversationId: string, userId: string): Promise<number> {
        try {
            const count = await prisma.message.count({
                where: {
                    conversationId,
                    receiverId: userId,
                    isRead: false,
                    isDeleted: false
                }
            });
            return count;
        } catch (error) {
            console.error('Okunmamış mesaj sayısı getirme hatası:', error);
            return 0;
        }
    }

    // Bir konuşmadaki okunmamış mesajları getir
    async getUnreadMessages(conversationId: string, userId: string) {
        try {
            return await prisma.message.findMany({
                where: {
                    conversationId,
                    receiverId: userId,
                    isRead: false,
                    isDeleted: false
                },
                orderBy: { createdAt: 'asc' }
            });
        } catch (error) {
            console.error('Okunmamış mesajları getirme hatası:', error);
            return [];
        }
    }
}

export const chatService = new ChatService(); 