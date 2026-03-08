import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/middlewares/asyncHandler';
import { registerSchema, loginSchema } from './auth.validation';

const router = Router();

router.post(
    '/register',
    validate({ body: registerSchema }),
    asyncHandler(authController.register),
);

router.post(
    '/login',
    validate({ body: loginSchema }),
    asyncHandler(authController.login),
);

export { router as authRoutes };
