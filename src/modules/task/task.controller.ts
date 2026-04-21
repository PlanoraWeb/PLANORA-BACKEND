import { Response } from 'express';
import { taskService } from './task.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';
import { sendResponse } from '../../shared/utils/sendResponse';

export class TaskController {
    async create(req: AuthRequest, res: Response) {
        const task = await taskService.create(getParam(req, 'projectId'), req.user!.id, req.body);
        sendResponse({ res, statusCode: 201, data: task });
    }

    async getAllByProject(req: AuthRequest, res: Response) {
        const tasks = await taskService.findAllByProject(getParam(req, 'projectId'));
        sendResponse({ res, data: tasks });
    }

    async getById(req: AuthRequest, res: Response) {
        const task = await taskService.findById(getParam(req, 'id'));
        sendResponse({ res, data: task });
    }

    async update(req: AuthRequest, res: Response) {
        const task = await taskService.update(getParam(req, 'id'), req.body);
        sendResponse({ res, data: task });
    }

    async delete(req: AuthRequest, res: Response) {
        await taskService.delete(getParam(req, 'id'));
        sendResponse({ res, data: { message: 'Görev silindi' } });
    }

    async changeStatus(req: AuthRequest, res: Response) {
        const task = await taskService.changeStatus(getParam(req, 'id'), req.body);
        sendResponse({ res, data: task });
    }

    async assignUser(req: AuthRequest, res: Response) {
        const task = await taskService.assignUser(getParam(req, 'id'), req.body.assigneeId);
        sendResponse({ res, data: task });
    }

    // Giriş yapan kullanıcıya atanmış görevler (Tasks.jsx için)
    async getMyTasks(req: AuthRequest, res: Response) {
        const tasks = await taskService.findByAssignee(req.user!.id);
        sendResponse({ res, data: tasks });
    }
}

export const taskController = new TaskController();
