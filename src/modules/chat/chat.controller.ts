import { Response } from 'express';
import { chatService } from './chat.service';
import { AuthRequest } from '../../shared/types';
import { sendResponse } from '../../shared/utils/sendResponse';

export class ChatController {
    async sendMessage(req: AuthRequest, res: Response) {
        const { message } = req.body as { message: string };
        const reply = await chatService.chat(req.user!.id, message);
        sendResponse({ res, data: { reply } });
    }
}

export const chatController = new ChatController();
