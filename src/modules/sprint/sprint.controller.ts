import { Response } from 'express';
import { sprintService } from './sprint.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';
import { sendResponse } from '../../shared/utils/sendResponse';
import { sprintFilterSchema } from './sprint.validation';

export class SprintController {
    async create(req: AuthRequest, res: Response) {
        const sprint = await sprintService.create(getParam(req, 'projectId'), req.body);
        sendResponse({ res, statusCode: 201, data: sprint });
    }

    async getAllByProject(req: AuthRequest, res: Response) {
        const { query: filters } = sprintFilterSchema.parse({ query: req.query });
        const result = await sprintService.findAllByProject(getParam(req, 'projectId'), filters);
        sendResponse({ res, data: result.sprints, meta: result.meta });
    }

    async getById(req: AuthRequest, res: Response) {
        const sprint = await sprintService.findById(getParam(req, 'id'));
        sendResponse({ res, data: sprint });
    }

    async getActive(req: AuthRequest, res: Response) {
        const sprint = await sprintService.getActiveSprint(getParam(req, 'projectId'));
        sendResponse({ res, data: sprint });
    }

    async update(req: AuthRequest, res: Response) {
        const sprint = await sprintService.update(getParam(req, 'id'), req.body);
        sendResponse({ res, data: sprint });
    }

    async delete(req: AuthRequest, res: Response) {
        await sprintService.delete(getParam(req, 'id'));
        sendResponse({ res, data: { message: 'Sprint silindi' } });
    }

    async addTasks(req: AuthRequest, res: Response) {
        const sprint = await sprintService.addTasks(getParam(req, 'id'), req.body.taskIds);
        sendResponse({ res, data: sprint });
    }

    async removeTasks(req: AuthRequest, res: Response) {
        const sprint = await sprintService.removeTasks(getParam(req, 'id'), req.body.taskIds);
        sendResponse({ res, data: sprint });
    }

    async getBurndown(req: AuthRequest, res: Response) {
        const data = await sprintService.getBurndownData(getParam(req, 'id'));
        sendResponse({ res, data });
    }

    async getVelocity(req: AuthRequest, res: Response) {
        const data = await sprintService.getVelocity(getParam(req, 'projectId'));
        sendResponse({ res, data });
    }
}

export const sprintController = new SprintController();
