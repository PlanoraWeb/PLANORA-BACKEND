import { Request, Response } from 'express';
import { authService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto } from './auth.validation';
import { sendResponse } from '../../shared/utils/sendResponse';
import { AuthRequest } from '../../shared/types/AuthRequest';

export class AuthController {
    async register(req: Request, res: Response) {
        const data: RegisterDto = req.body;
        const result = await authService.register(data);
        sendResponse({ res, statusCode: 201, data: result });
    }

    async login(req: Request, res: Response) {
        const data: LoginDto = req.body;
        const result = await authService.login(data);
        sendResponse({ res, statusCode: 200, data: result });
    }

    async refresh(req: Request, res: Response) {
        const data: RefreshTokenDto = req.body;
        const result = await authService.refresh(data);
        sendResponse({ res, statusCode: 200, data: result });
    }

    async logout(req: Request, res: Response) {
        const data: LogoutDto = req.body;
        await authService.logout(data);
        sendResponse({ res, statusCode: 200, data: { message: 'Başarıyla çıkış yapıldı' } });
    }

    async logoutAll(req: AuthRequest, res: Response) {
        await authService.logoutAll(req.user!.id);
        sendResponse({ res, statusCode: 200, data: { message: 'Tüm cihazlardan çıkış yapıldı' } });
    }
}

export const authController = new AuthController();