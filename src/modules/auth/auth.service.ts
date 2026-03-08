import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env';
import { AppError } from '../../shared/utils/AppError';
import { RegisterInput, LoginInput } from './auth.validation';

export class AuthService {
    async register(data: RegisterInput) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('Bu e-posta adresi zaten kayıtlı', 409);
        }

        // Varsayılan "Member" rolünü bul
        const memberRole = await prisma.role.findFirst({
            where: { name: 'Member' },
        });

        if (!memberRole) {
            throw new AppError('Varsayılan rol bulunamadı', 500);
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                roleId: memberRole.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: { select: { id: true, name: true } },
                createdAt: true,
            },
        });

        const token = this.generateToken(user.id, user.email, user.role.id);

        return { user, token };
    }

    async login(data: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { role: { select: { id: true, name: true } } },
        });

        if (!user) {
            throw new AppError('E-posta veya şifre hatalı', 401);
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new AppError('E-posta veya şifre hatalı', 401);
        }

        const token = this.generateToken(user.id, user.email, user.role.id);

        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    private generateToken(userId: string, email: string, roleId: string): string {
        return jwt.sign({ id: userId, email, roleId }, env.JWT_SECRET, {
            expiresIn: '7d',
        });
    }
}

export const authService = new AuthService();
