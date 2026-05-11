import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateTaskStatusInput, UpdateTaskStatusInput } from './task-status.validation';

export class TaskStatusService {
    async create(projectId: string, data: CreateTaskStatusInput) {
        return prisma.taskStatus.create({
            data: {
                name: data.name,
                position: data.position,
                projectId,
            },
        });
    }

    async findAllByProject(projectId: string) {
        const statuses = await prisma.taskStatus.findMany({
            where: { projectId },
            include: { _count: { select: { tasks: true } } },
            orderBy: { position: 'asc' },
        });

        // Proje için hiç kolon yoksa (eski projeler için migration) varsayılanları oluştur
        if (statuses.length === 0) {
            const defaultStatuses = [
                { name: 'TODO', position: 0, isDefault: true },
                { name: 'IN_PROGRESS', position: 1, isDefault: false },
                { name: 'DONE', position: 2, isDefault: false },
            ];

            await prisma.taskStatus.createMany({
                data: defaultStatuses.map((s) => ({ ...s, projectId })),
                skipDuplicates: true,
            });

            return prisma.taskStatus.findMany({
                where: { projectId },
                include: { _count: { select: { tasks: true } } },
                orderBy: { position: 'asc' },
            });
        }

        return statuses;
    }

    async findById(id: string) {
        const status = await prisma.taskStatus.findUnique({
            where: { id },
            include: { _count: { select: { tasks: true } } },
        });

        if (!status) {
            throw new AppError('Görev durumu bulunamadı', 404);
        }

        return status;
    }

    async update(id: string, data: UpdateTaskStatusInput) {
        await this.findById(id);
        return prisma.taskStatus.update({ where: { id }, data });
    }

    async delete(id: string) {
        const status = await this.findById(id);

        if (status.isDefault) {
            throw new AppError('Varsayılan kolon silinemez', 400);
        }

        return prisma.taskStatus.delete({ where: { id } });
    }
}

export const taskStatusService = new TaskStatusService();
