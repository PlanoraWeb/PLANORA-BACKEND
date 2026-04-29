import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../shared/middlewares/validate';
import { asyncHandler } from '../../shared/middlewares/asyncHandler';
import { authenticate } from '../../shared/middlewares/authenticate';
import { loginLimiter, registerLimiter, refreshLimiter } from '../../shared/middlewares/rateLimiter';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    logoutSchema,
} from './auth.validation';

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────
router.post('/register', registerLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', refreshLimiter, validate(refreshTokenSchema), asyncHandler(authController.refresh));
router.post('/logout', validate(logoutSchema), asyncHandler(authController.logout));

// ─── Protected Routes ─────────────────────────────────────────────
router.post(
    '/logout-all',
    authenticate as any,
    asyncHandler(authController.logoutAll as any),
);

export { router as authRoutes };