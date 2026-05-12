import { Response } from 'express';
import { projectService } from './project.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';
import { sendResponse } from '../../shared/utils/sendResponse';

export class ProjectController {
    async create(req: AuthRequest, res: Response) {
        const project = await projectService.create(req.body, req.user!.id);
        sendResponse({ res, statusCode: 201, data: project });
    }

    async getAll(req: AuthRequest, res: Response) {
        const projects = await projectService.findAll(req.user!.id);
        sendResponse({ res, data: projects });
    }

    async getById(req: AuthRequest, res: Response) {
        const project = await projectService.findById(getParam(req, 'id'));
        sendResponse({ res, data: project });
    }

    async getInsights(req: AuthRequest, res: Response) {
        const insights = await projectService.getInsights(getParam(req, 'id'));
        sendResponse({ res, data: insights });
    }

    async update(req: AuthRequest, res: Response) {
        const project = await projectService.update(getParam(req, 'id'), req.body);
        sendResponse({ res, data: project });
    }

    async delete(req: AuthRequest, res: Response) {
        await projectService.delete(getParam(req, 'id'));
        sendResponse({ res, data: { message: 'Proje silindi' } });
    }

    async addMember(req: AuthRequest, res: Response) {
        const member = await projectService.addMember(getParam(req, 'id'), req.body);
        sendResponse({ res, statusCode: 201, data: member });
    }

    async removeMember(req: AuthRequest, res: Response) {
        await projectService.removeMember(getParam(req, 'id'), getParam(req, 'userId'));
        sendResponse({ res, data: { message: 'Üye projeden çıkarıldı' } });
    }
}

export const projectController = new ProjectController();
