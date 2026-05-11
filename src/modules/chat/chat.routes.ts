import { Router } from 'express';
import { z } from 'zod';
import { chatController } from './chat.controller';
import { asyncHandler, authenticate } from '../../shared/middlewares';
import { validate } from '../../shared/middlewares/validate';

const chatMessageSchema = z.object({
    body: z.object({
        message: z.string().min(1, 'Mesaj boş olamaz').max(4000, 'Mesaj çok uzun (maks 4000 karakter)'),
    }),
});

const router = Router();

// Tüm chat endpoint'leri authentication gerektirir
router.use(authenticate as any);

// POST /api/v1/chat
// Body: { message: string }
// Response: { reply: string }
router.post('/', validate(chatMessageSchema), asyncHandler(chatController.sendMessage as any));

export { router as chatRoutes };
