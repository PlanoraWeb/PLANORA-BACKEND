import { Response } from 'express';
import { taskStatusService } from './task-status.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';
import { sendResponse } from '../../shared/utils/sendResponse';

export class TaskStatusController {
    async create(req: AuthRequest, res: Response) {
        const status = await taskStatusService.create(getParam(req, 'projectId'), req.body);
        sendResponse({ res, statusCode: 201, data: status });
    }

    async getAllByProject(req: AuthRequest, res: Response) {
        const statuses = await taskStatusService.findAllByProject(getParam(req, 'projectId'));
        sendResponse({ res, data: statuses });
    }

    async update(req: AuthRequest, res: Response) {
        const status = await taskStatusService.update(getParam(req, 'id'), req.body);
        sendResponse({ res, data: status });
    }

    async delete(req: AuthRequest, res: Response) {
        await taskStatusService.delete(getParam(req, 'id'));
        sendResponse({ res, data: { message: 'Kolon silindi' } });
    }
}

export const taskStatusController = new TaskStatusController();
