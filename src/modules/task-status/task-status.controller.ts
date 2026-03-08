import { Response } from 'express';
import { taskStatusService } from './task-status.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';

export class TaskStatusController {
    async create(req: AuthRequest, res: Response) {
        const status = await taskStatusService.create(getParam(req, 'projectId'), req.body);
        res.status(201).json({ status: 'success', data: status });
    }

    async getAllByProject(req: AuthRequest, res: Response) {
        const statuses = await taskStatusService.findAllByProject(getParam(req, 'projectId'));
        res.json({ status: 'success', data: statuses });
    }

    async update(req: AuthRequest, res: Response) {
        const status = await taskStatusService.update(getParam(req, 'id'), req.body);
        res.json({ status: 'success', data: status });
    }

    async delete(req: AuthRequest, res: Response) {
        await taskStatusService.delete(getParam(req, 'id'));
        res.json({ status: 'success', message: 'Kolon silindi' });
    }
}

export const taskStatusController = new TaskStatusController();
