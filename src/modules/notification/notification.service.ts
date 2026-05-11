import prisma from '../../shared/utils/prisma';
import { NotificationFilterDto } from './notification.validation';
import { NotificationType } from '@prisma/client';

export class NotificationService {
    // Bildirim oluştur (diğer servislerden çağrılır)
    async create(data: {
        type: NotificationType;
        title: string;
        message: string;
        userId: string;
        metadata?: Record<string, any>;
    }) {
        return prisma.notification.create({
            data: {
                type: data.type,
                title: data.title,
                message: data.message,
                userId: data.userId,
                metadata: data.metadata ?? undefined,
            },
        });
    }

    // Toplu bildirim oluştur (birden fazla kullanıcıya)
    async createMany(notifications: {
        type: NotificationType;
        title: string;
        message: string;
        userId: string;
        metadata?: Record<string, any>;
    }[]) {
        return prisma.notification.createMany({
            data: notifications.map((n) => ({
                type: n.type,
                title: n.title,
                message: n.message,
                userId: n.userId,
                metadata: n.metadata ?? undefined,
            })),
        });
    }

    // Kullanıcının bildirimlerini listele
    async findByUser(userId: string, filters: NotificationFilterDto) {
        const where: any = { userId };
        if (filters.isRead !== undefined) where.isRead = filters.isRead === 'true';
        if (filters.type) where.type = filters.type;

        const skip = (filters.page - 1) * filters.limit;
        const take = filters.limit;

        const [notifications, total, unreadCount] = await prisma.$transaction([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { userId, isRead: false } }),
        ]);

        return {
            notifications,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / filters.limit),
                unreadCount,
            },
        };
    }

    // Okunmamış bildirim sayısı
    async getUnreadCount(userId: string) {
        return prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    // Tekil bildirim okundu işaretle
    async markAsRead(id: string, userId: string) {
        return prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    // Toplu okundu işaretle
    async markManyAsRead(ids: string[], userId: string) {
        return prisma.notification.updateMany({
            where: { id: { in: ids }, userId },
            data: { isRead: true },
        });
    }

    // Tümünü okundu işaretle
    async markAllAsRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    // Bildirim sil
    async delete(id: string, userId: string) {
        return prisma.notification.deleteMany({
            where: { id, userId },
        });
    }
}

export const notificationService = new NotificationService();
