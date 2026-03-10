import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types/AuthRequest';

/**
 * Belirtilen rol isimlerine sahip kullanıcıların erişimine izin veren middleware.
 * authenticate middleware'inden sonra kullanılmalıdır.
 *
 * Kullanım: authorize('System Admin', 'Project Admin')
 */
export const authorize = (...allowedRoles: string[]) => {
    return async (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Yetkilendirme gerekli', 401));
        }

        const role = await prisma.role.findUnique({
            where: { id: req.user.roleId },
        });

        if (!role || !allowedRoles.includes(role.name)) {
            return next(new AppError('Bu işlem için yetkiniz yok', 403));
        }

        next();
    };
};
