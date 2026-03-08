import { Response } from 'express';
import { taskService } from './task.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';

export class TaskController {
    async create(req: AuthRequest, res: Response) {
        const task = await taskService.create(getParam(req, 'projectId'), req.user!.id, req.body);
        res.status(201).json({ status: 'success', data: task });
    }

    async getAllByProject(req: AuthRequest, res: Response) {
        const tasks = await taskService.findAllByProject(getParam(req, 'projectId'));
        res.json({ status: 'success', data: tasks });
    }

    async getById(req: AuthRequest, res: Response) {
        const task = await taskService.findById(getParam(req, 'id'));
        res.json({ status: 'success', data: task });
    }

    async update(req: AuthRequest, res: Response) {
        const task = await taskService.update(getParam(req, 'id'), req.body);
        res.json({ status: 'success', data: task });
    }

    async delete(req: AuthRequest, res: Response) {
        await taskService.delete(getParam(req, 'id'));
        res.json({ status: 'success', message: 'Görev silindi' });
    }

    async changeStatus(req: AuthRequest, res: Response) {
        const task = await taskService.changeStatus(getParam(req, 'id'), req.body.statusId);
        res.json({ status: 'success', data: task });
    }

    async assignUser(req: AuthRequest, res: Response) {
        const task = await taskService.assignUser(getParam(req, 'id'), req.body.assigneeId);
        res.json({ status: 'success', data: task });
    }
}

export const taskController = new TaskController();
