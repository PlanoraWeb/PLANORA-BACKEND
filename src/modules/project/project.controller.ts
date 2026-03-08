import { Response } from 'express';
import { projectService } from './project.service';
import { AuthRequest } from '../../shared/types';
import { getParam } from '../../shared/utils/getParam';

export class ProjectController {
    async create(req: AuthRequest, res: Response) {
        const project = await projectService.create(req.body, req.user!.id);
        res.status(201).json({ status: 'success', data: project });
    }

    async getAll(req: AuthRequest, res: Response) {
        const projects = await projectService.findAll(req.user!.id);
        res.json({ status: 'success', data: projects });
    }

    async getById(req: AuthRequest, res: Response) {
        const project = await projectService.findById(getParam(req, 'id'));
        res.json({ status: 'success', data: project });
    }

    async update(req: AuthRequest, res: Response) {
        const project = await projectService.update(getParam(req, 'id'), req.body);
        res.json({ status: 'success', data: project });
    }

    async delete(req: AuthRequest, res: Response) {
        await projectService.delete(getParam(req, 'id'));
        res.json({ status: 'success', message: 'Proje silindi' });
    }

    async addMember(req: AuthRequest, res: Response) {
        const member = await projectService.addMember(getParam(req, 'id'), req.body);
        res.status(201).json({ status: 'success', data: member });
    }

    async removeMember(req: AuthRequest, res: Response) {
        await projectService.removeMember(getParam(req, 'id'), getParam(req, 'userId'));
        res.json({ status: 'success', message: 'Üye projeden çıkarıldı' });
    }
}

export const projectController = new ProjectController();
