import { Request, Response } from 'express';
import { authService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto } from './auth.validation';
import { sendResponse } from '../../shared/utils/sendResponse';

export class AuthController {
    // Kullanıcı Kaydı
    async register(req: Request, res: Response) {
        const data: RegisterDto = req.body;
        const result = await authService.register(data);
        sendResponse({ res, statusCode: 201, data: result });
    }

    // Kullanıcı Girişi
    async login(req: Request, res: Response) {
        const data: LoginDto = req.body;
        const result = await authService.login(data);
        sendResponse({ res, statusCode: 200, data: result });
    }

    // Token Yenileme
    async refresh(req: Request, res: Response) {
        const data: RefreshTokenDto = req.body;
        const result = await authService.refresh(data);
        sendResponse({ res, statusCode: 200, data: result });
    }

    // Mevcut Cihazdan Çıkış
    async logout(req: Request, res: Response) {
        const data: LogoutDto = req.body;
        await authService.logout(data);
        sendResponse({ res, statusCode: 200, message: 'Başarıyla çıkış yapıldı.' });
    }

    // Tüm Cihazlardan Çıkış
    async logoutAll(req: Request, res: Response) {
        const userId = (req as any).user.id; // Auth middleware'inden gelen user id
        await authService.logoutAll(userId);
        sendResponse({ res, statusCode: 200, message: 'Tüm cihazlardan çıkış yapıldı.' });
    }
}

export const authController = new AuthController();