import { Response } from 'express';
import { notificationService } from './notification.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';
import { sendResponse } from '../../shared/utils/sendResponse';
import { notificationFilterSchema } from './notification.validation';

export class NotificationController {
    async getAll(req: AuthRequest, res: Response) {
        const { query: filters } = notificationFilterSchema.parse({ query: req.query });
        const result = await notificationService.findByUser(req.user!.id, filters);
        sendResponse({ res, data: result.notifications, meta: result.meta });
    }

    async getUnreadCount(req: AuthRequest, res: Response) {
        const count = await notificationService.getUnreadCount(req.user!.id);
        sendResponse({ res, data: { unreadCount: count } });
    }

    async markAsRead(req: AuthRequest, res: Response) {
        await notificationService.markAsRead(getParam(req, 'id'), req.user!.id);
        sendResponse({ res, data: { message: 'Bildirim okundu olarak işaretlendi' } });
    }

    async markManyAsRead(req: AuthRequest, res: Response) {
        await notificationService.markManyAsRead(req.body.ids, req.user!.id);
        sendResponse({ res, data: { message: 'Bildirimler okundu olarak işaretlendi' } });
    }

    async markAllAsRead(req: AuthRequest, res: Response) {
        await notificationService.markAllAsRead(req.user!.id);
        sendResponse({ res, data: { message: 'Tüm bildirimler okundu olarak işaretlendi' } });
    }

    async delete(req: AuthRequest, res: Response) {
        await notificationService.delete(getParam(req, 'id'), req.user!.id);
        sendResponse({ res, data: { message: 'Bildirim silindi' } });
    }
}

export const notificationController = new NotificationController();
