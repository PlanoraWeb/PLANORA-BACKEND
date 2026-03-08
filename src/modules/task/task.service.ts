import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateTaskInput, UpdateTaskInput } from './task.validation';

export class TaskService {
    async create(projectId: string, reporterId: string, data: CreateTaskInput) {
        return prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority,
                type: data.type,
                statusId: data.statusId,
                projectId,
                reporterId,
                assigneeId: data.assigneeId,
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            },
            include: {
                status: true,
                reporter: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async findAllByProject(projectId: string) {
        return prisma.task.findMany({
            where: { projectId },
            include: {
                status: true,
                reporter: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                status: true,
                project: { select: { id: true, projectName: true } },
                reporter: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
            },
        });

        if (!task) {
            throw new AppError('Görev bulunamadı', 404);
        }

        return task;
    }

    async update(id: string, data: UpdateTaskInput) {
        await this.findById(id);

        return prisma.task.update({
            where: { id },
            data: {
                ...data,
                dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
            },
            include: {
                status: true,
                reporter: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.task.delete({ where: { id } });
    }

    async changeStatus(id: string, statusId: string) {
        await this.findById(id);
        return prisma.task.update({
            where: { id },
            data: { statusId },
            include: { status: true },
        });
    }

    async assignUser(id: string, assigneeId: string | null) {
        await this.findById(id);
        return prisma.task.update({
            where: { id },
            data: { assigneeId },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
            },
        });
    }
}

export const taskService = new TaskService();
