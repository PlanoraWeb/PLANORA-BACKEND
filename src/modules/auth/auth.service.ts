import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env';
import { AppError } from '../../shared/utils/AppError';
import { RegisterDto, LoginDto } from './auth.validation';

export class AuthService {
    async register(data: RegisterDto) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('Bu e-posta adresi zaten kayıtlı', 409, 'CONFLICT');
        }

        // Varsayılan "Member" rolünü bul
        const memberRole = await prisma.role.findFirst({
            where: { name: 'Member' },
        });

        if (!memberRole) {
            throw new AppError('Varsayılan rol bulunamadı', 500, 'INTERNAL_ERROR');
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: hashedPassword,
                roleId: memberRole.id,
            },
            select: {
                id: true,
                email: true,
                role: { select: { name: true } },
            },
        });

        return {
            id: user.id,
            email: user.email,
            role: user.role.name,
        };
    }

    async login(data: LoginDto) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: { role: { select: { id: true, name: true } } },
        });

        if (!user) {
            throw new AppError('E-posta veya şifre hatalı', 401, 'UNAUTHORIZED');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new AppError('E-posta veya şifre hatalı', 401, 'UNAUTHORIZED');
        }

        const accessToken = this.generateAccessToken(user.id, user.email, user.role.id);
        const refreshToken = this.generateRefreshToken(user.id);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                role: user.role.name,
            },
        };
    }

    private generateAccessToken(userId: string, email: string, roleId: string): string {
        return jwt.sign({ id: userId, email, roleId }, env.JWT_SECRET, {
            expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
        });
    }

    private generateRefreshToken(userId: string): string {
        return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
            expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
        });
    }
}

export const authService = new AuthService();
