import { Router } from 'express';
import { userController } from './user.controller';
import { asyncHandler } from '../../shared/middlewares/asyncHandler';
import { authenticate } from '../../shared/middlewares/authenticate';

const router = Router();

// Tüm user rotaları JWT ile korunuyor
router.use(authenticate as any);

router.get('/me', asyncHandler(userController.getProfile as any));
router.put('/me', asyncHandler(userController.updateProfile as any));
router.put('/me/password', asyncHandler(userController.updatePassword as any));
router.get('/', asyncHandler(userController.getAll));
router.get('/:id', asyncHandler(userController.getById));

export { router as userRoutes };
