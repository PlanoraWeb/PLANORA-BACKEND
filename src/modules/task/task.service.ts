import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from './task.validation';

export class TaskService {
    async create(projectId: string, reporterId: string, data: CreateTaskDto) {
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
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    async findAllByProject(projectId: string) {
        return prisma.task.findMany({
            where: { projectId },
            include: {
                status: true,
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
            orderBy: [{ status: { position: 'asc' } }, { order: 'asc' }, { createdAt: 'desc' }],
        });
    }

    async findById(id: string) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                status: true,
                project: { select: { id: true, projectName: true } },
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });

        if (!task) {
            throw new AppError('Görev bulunamadı', 404, 'NOT_FOUND');
        }

        return task;
    }

    async update(id: string, data: UpdateTaskDto) {
        await this.findById(id);

        return prisma.task.update({
            where: { id },
            data: {
                ...data,
                dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
            },
            include: {
                status: true,
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.task.delete({ where: { id } });
    }

    async changeStatus(id: string, data: UpdateTaskStatusDto) {
        await this.findById(id);

        // statusId'nin gerçekten var olduğunu doğrula
        const statusExists = await prisma.taskStatus.findUnique({
            where: { id: data.statusId },
        });

        if (!statusExists) {
            throw new AppError('Belirtilen görev durumu bulunamadı', 404, 'NOT_FOUND');
        }

        return prisma.task.update({
            where: { id },
            data: {
                statusId: data.statusId,
                order: data.newOrder,
            },
            include: {
                status: true,
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }

    async assignUser(id: string, assigneeId: string | null) {
        await this.findById(id);

        return prisma.task.update({
            where: { id },
            data: { assigneeId },
            include: {
                status: true,
                reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        });
    }
}

export const taskService = new TaskService();