import { Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types/AuthRequest';

// ─── Sistem Rol Kontrolü ──────────────────────────────────────────
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

// ─── Proje Üyelik Kontrolü ────────────────────────────────────────
export const authorizeProjectMember = () => {
    return async (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Yetkilendirme gerekli', 401));
        }

        // Değeri alıp string olduğunu garanti ediyoruz
        const rawProjectId = req.params.projectId ?? req.params.id;

        if (!rawProjectId || typeof rawProjectId !== 'string') {
            return next(new AppError('Geçerli bir proje kimliği bulunamadı', 400));
        }

        const projectId = rawProjectId; // Artık kesinlikle string

        const membership = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: req.user.id,
                },
            },
        });

        // Sistem admini her projeye erişebilir
        const role = await prisma.role.findUnique({ where: { id: req.user.roleId } });
        if (!membership && role?.name !== 'System Admin') {
            return next(new AppError('Bu projeye erişim yetkiniz yok', 403));
        }

        next();
    };
};