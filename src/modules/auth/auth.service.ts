import prisma from '../../shared/utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env';
import { AppError } from '../../shared/utils/AppError';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto } from './auth.validation';

export class AuthService {
    // ─── Register ────────────────────────────────────────────────

    async register(data: RegisterDto) {
        const normalizedEmail = data.email.trim().toLowerCase(); // PLAN-117

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            throw new AppError('Bu e-posta adresi zaten kayıtlı', 409, 'CONFLICT');
        }

        const memberRole = await prisma.role.findFirst({
            where: { name: 'Member' },
        });

        if (!memberRole) {
            throw new AppError('Varsayılan rol bulunamadı. Seed çalıştırın.', 500, 'INTERNAL_ERROR');
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await prisma.user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: normalizedEmail,
                password: hashedPassword,
                roleId: memberRole.id,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: { select: { name: true } },
                createdAt: true,
            },
        });

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role.name,
            createdAt: user.createdAt,
        };
    }

    // ─── Login ───────────────────────────────────────────────────

    async login(data: LoginDto) {
        const normalizedEmail = data.email.trim().toLowerCase(); // PLAN-117

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { role: { select: { id: true, name: true } } },
        });

        if (!user) {
            await bcrypt.hash(data.password, 12); // timing attack önlemi
            throw new AppError('E-posta veya şifre hatalı', 401, 'UNAUTHORIZED');
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new AppError('E-posta veya şifre hatalı', 401, 'UNAUTHORIZED');
        }

        const accessToken = this.generateAccessToken(user.id, user.email, user.role.id);
        const { token: refreshToken, expiresAt } = this.generateRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role.name,
            },
        };
    }

    // ─── Refresh ─────────────────────────────────────────────────

    async refresh(data: RefreshTokenDto) {
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: data.refreshToken },
            include: { user: { include: { role: true } } },
        });

        if (!storedToken) {
            throw new AppError('Geçersiz refresh token', 401, 'UNAUTHORIZED');
        }

        if (storedToken.revokedAt) {
            await this.revokeAllUserTokens(storedToken.userId);
            throw new AppError('Token iptal edilmiş. Lütfen tekrar giriş yapın.', 401, 'TOKEN_REVOKED');
        }

        if (storedToken.expiresAt < new Date()) {
            throw new AppError('Refresh token süresi dolmuş. Lütfen tekrar giriş yapın.', 401, 'TOKEN_EXPIRED');
        }

        try {
            jwt.verify(data.refreshToken, env.JWT_REFRESH_SECRET);
        } catch {
            throw new AppError('Geçersiz refresh token imzası', 401, 'UNAUTHORIZED');
        }

        const user = storedToken.user;

        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        const newAccessToken = this.generateAccessToken(user.id, user.email, user.role.id);
        const { token: newRefreshToken, expiresAt } = this.generateRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: user.id,
                expiresAt,
            },
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    // ─── Logout (mevcut cihaz) ────────────────────────────────────

    async logout(data: LogoutDto) {
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: data.refreshToken },
        });

        if (!storedToken || storedToken.revokedAt) {
            return;
        }

        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });
    }

    // ─── Logout All (tüm cihazlar) ───────────────────────────────

    async logoutAll(userId: string) {
        await this.revokeAllUserTokens(userId);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private generateAccessToken(userId: string, email: string, roleId: string): string {
        return jwt.sign({ id: userId, email, roleId }, env.JWT_SECRET, {
            expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
        });
    }

    private generateRefreshToken(userId: string): { token: string; expiresAt: Date } {
        const expiryStr = env.JWT_REFRESH_EXPIRY;
        const multipliers: Record<string, number> = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        const match = expiryStr.match(/^(\d+)([smhd])$/);
        const expiresAt = match
            ? new Date(Date.now() + parseInt(match[1]) * (multipliers[match[2]] ?? 0))
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const token = jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
            expiresIn: expiryStr as jwt.SignOptions['expiresIn'],
        });

        return { token, expiresAt };
    }

    private async revokeAllUserTokens(userId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
}

export const authService = new AuthService();