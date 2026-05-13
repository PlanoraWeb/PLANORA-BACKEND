import { Response } from 'express';
import { dashboardService } from './dashboard.service';
import { AuthRequest } from '../../shared/types';
import { sendResponse } from '../../shared/utils/sendResponse';

export class DashboardController {
    async getSummary(req: AuthRequest, res: Response) {
        const summary = await dashboardService.getSummary(req.user!.id);
        sendResponse({ res, data: summary });
    }

    async getOverview(req: AuthRequest, res: Response) {
        const overview = await dashboardService.getOverview(req.user!.id);
        sendResponse({ res, data: overview });
    }

    async getAnalytics(req: AuthRequest, res: Response) {
        const analytics = await dashboardService.getAnalytics(req.user!.id);
        sendResponse({ res, data: analytics });
    }
}

export const dashboardController = new DashboardController();
