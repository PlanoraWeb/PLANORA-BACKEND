import { Request, Response } from 'express';
import { userService } from './user.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';

export class UserController {
    async getAll(_req: Request, res: Response) {
        const users = await userService.findAll();
        res.json({ status: 'success', data: users });
    }

    async getById(req: Request, res: Response) {
        const user = await userService.findById(getParam(req, 'id'));
        res.json({ status: 'success', data: user });
    }

    async getProfile(req: AuthRequest, res: Response) {
        const user = await userService.getProfile(req.user!.id);
        res.json({ status: 'success', data: user });
    }
}

export const userController = new UserController();
