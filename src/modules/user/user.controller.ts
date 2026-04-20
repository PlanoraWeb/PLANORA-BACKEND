import { Request, Response } from 'express';
import { userService } from './user.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';
import { sendResponse } from '../../shared/utils/sendResponse';

export class UserController {
    async getAll(_req: Request, res: Response) {
        const users = await userService.findAll();
        sendResponse({ res, data: users });
    }

    async getById(req: Request, res: Response) {
        const user = await userService.findById(getParam(req, 'id'));
        sendResponse({ res, data: user });
    }

    async getProfile(req: AuthRequest, res: Response) {
        const user = await userService.getProfile(req.user!.id);
        sendResponse({ res, data: user });
    }

    async updateProfile(req: AuthRequest, res: Response) {
        const user = await userService.updateProfile(req.user!.id, req.body);
        sendResponse({ res, data: user, message: 'Profil başarıyla güncellendi' });
    }

    async updatePassword(req: AuthRequest, res: Response) {
        await userService.updatePassword(req.user!.id, req.body);
        sendResponse({ res, data: null, message: 'Şifreniz başarıyla değiştirildi' });
    }
}

export const userController = new UserController();
