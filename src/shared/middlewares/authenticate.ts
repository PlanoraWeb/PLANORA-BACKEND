import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types/AuthRequest';

/**
 * JWT token doğrulama middleware'i.
 * Authorization: Bearer <token> formatında token bekler.
 */
export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('Yetkilendirme token\'ı bulunamadı', 401));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as {
            id: string;
            email: string;
            roleId: string;
        };

        req.user = {
            id: decoded.id,
            email: decoded.email,
            roleId: decoded.roleId,
        };

        next();
    } catch {
        return next(new AppError('Geçersiz veya süresi dolmuş token', 401));
    }
};
