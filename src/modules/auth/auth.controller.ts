import { Request, Response } from 'express';
import { authService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.validation';
import { sendResponse } from '../../shared/utils/sendResponse';

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
}

export const authController = new AuthController();
