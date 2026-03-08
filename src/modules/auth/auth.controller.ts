import { Request, Response } from 'express';
import { authService } from './auth.service';
import { RegisterInput, LoginInput } from './auth.validation';

export class AuthController {
    async register(req: Request, res: Response) {
        const data: RegisterInput = req.body;
        const result = await authService.register(data);

        res.status(201).json({
            status: 'success',
            message: 'Kayıt başarılı',
            data: result,
        });
    }

    async login(req: Request, res: Response) {
        const data: LoginInput = req.body;
        const result = await authService.login(data);

        res.status(200).json({
            status: 'success',
            message: 'Giriş başarılı',
            data: result,
        });
    }
}

export const authController = new AuthController();
