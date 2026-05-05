import { Router } from 'express';
import { notificationController } from './notification.controller';
import { asyncHandler, authenticate, validate } from '../../shared/middlewares';
import { markReadSchema } from './notification.validation';

const router = Router();

router.use(authenticate as any);

// Bildirim listesi (filtreleme destekli)
router.get('/', asyncHandler(notificationController.getAll as any));

// Okunmamış bildirim sayısı
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount as any));

// Tümünü okundu işaretle
router.patch('/read-all', asyncHandler(notificationController.markAllAsRead as any));

// Toplu okundu işaretle
router.patch('/read', validate(markReadSchema), asyncHandler(notificationController.markManyAsRead as any));

// Tekil bildirim işlemleri
router.patch('/:id/read', asyncHandler(notificationController.markAsRead as any));
router.delete('/:id', asyncHandler(notificationController.delete as any));

export { router as notificationRoutes };
