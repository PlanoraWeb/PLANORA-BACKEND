import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';

export class UserService {
    async findAll() {
        return prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { id: true, name: true } },
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { id: true, name: true } },
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new AppError('Kullanıcı bulunamadı', 404);
        }

        return user;
    }

    async getProfile(userId: string) {
        return this.findById(userId);
    }
}

export const userService = new UserService();
