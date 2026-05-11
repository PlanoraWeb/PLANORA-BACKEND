import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/utils/AppError';

export class UserService {
    async findAll() {
        return prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
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
                firstName: true,
                lastName: true,
                email: true,
                role: { select: { id: true, name: true } },
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new AppError('Kullanıcı bulunamadı', 404, 'NOT_FOUND');
        }

        return user;
    }

    async getProfile(userId: string) {
        return this.findById(userId);
    }

    async updateProfile(userId: string, data: { firstName?: string; lastName?: string }) {
        const updateData: any = {};
        if (data.firstName) updateData.firstName = data.firstName;
        if (data.lastName) updateData.lastName = data.lastName;

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: { select: { id: true, name: true } },
                createdAt: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async updatePassword(userId: string, data: { oldPassword?: string; newPassword?: string }) {
        if (!data.oldPassword || !data.newPassword) {
            throw new AppError('Mevcut şifre ve yeni şifre zorunludur', 400, 'BAD_REQUEST');
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError('Kullanıcı bulunamadı', 404, 'NOT_FOUND');
        }

        const isPasswordValid = await bcrypt.compare(data.oldPassword, user.password);
        if (!isPasswordValid) {
            throw new AppError('Mevcut şifreniz hatalı', 401, 'UNAUTHORIZED');
        }

        const hashedPassword = await bcrypt.hash(data.newPassword, 12);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return true;
    }
}

export const userService = new UserService();
