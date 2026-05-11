import { Response } from 'express';
import { dashboardService } from './dashboard.service';
import { AuthRequest } from '../../shared/types';
import { sendResponse } from '../../shared/utils/sendResponse';

export class DashboardController {
    async getSummary(req: AuthRequest, res: Response) {
        const summary = await dashboardService.getSummary(req.user!.id);
        sendResponse({ res, data: summary });
    }
}

export const dashboardController = new DashboardController();
