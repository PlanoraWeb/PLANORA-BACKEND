import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateSprintDto, UpdateSprintDto, SprintFilterDto } from './sprint.validation';
import { notificationService } from '../notification/notification.service';

const sprintInclude = {
    tasks: {
        include: {
            status: true,
            assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    },
    _count: { select: { tasks: true } },
};

export class SprintService {
    async create(projectId: string, data: CreateSprintDto) {
        return prisma.sprint.create({
            data: {
                name: data.name,
                goal: data.goal,
                projectId,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
            include: sprintInclude,
        });
    }

    async findAllByProject(projectId: string, filters: SprintFilterDto) {
        const where: any = { projectId };
        if (filters.status) where.status = filters.status;

        const skip = (filters.page - 1) * filters.limit;
        const take = filters.limit;

        const [sprints, total] = await prisma.$transaction([
            prisma.sprint.findMany({
                where,
                include: sprintInclude,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.sprint.count({ where }),
        ]);

        return {
            sprints,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    }

    async findById(id: string) {
        const sprint = await prisma.sprint.findUnique({
            where: { id },
            include: sprintInclude,
        });

        if (!sprint) {
            throw new AppError('Sprint bulunamadı', 404, 'NOT_FOUND');
        }

        return sprint;
    }

    async getActiveSprint(projectId: string) {
        try {
            const sprint = await prisma.sprint.findFirst({
                where: { projectId, status: 'ACTIVE' },
                include: sprintInclude,
            });
            // Aktif sprint yoksa boş obje dön (null yerine)
            return sprint ?? null;
        } catch {
            return null;
        }
    }

    async update(id: string, data: UpdateSprintDto) {
        const existingSprint = await this.findById(id);

        // Eğer ACTIVE'e geçiliyorsa, aynı projede başka aktif sprint var mı kontrol et
        if (data.status === 'ACTIVE') {
            const existingActive = await prisma.sprint.findFirst({
                where: { projectId: existingSprint.projectId, status: 'ACTIVE', id: { not: id } },
            });

            if (existingActive) {
                throw new AppError(
                    'Bu projede zaten aktif bir sprint var. Önce mevcut sprint\'i tamamlayın.',
                    409,
                    'CONFLICT'
                );
            }
        }

        const sprint = await prisma.sprint.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate === null ? null : data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate === null ? null : data.endDate ? new Date(data.endDate) : undefined,
            },
            include: sprintInclude,
        });

        if (data.status && data.status !== existingSprint.status) {
            const projectMembers = await prisma.projectMember.findMany({
                where: { projectId: sprint.projectId },
                select: { userId: true },
            });

            const notificationType =
                data.status === 'ACTIVE' ? 'SPRINT_STARTED' : data.status === 'COMPLETED' ? 'SPRINT_COMPLETED' : null;

            if (notificationType && projectMembers.length > 0) {
                await notificationService
                    .createMany(
                        projectMembers.map((member) => ({
                            type: notificationType,
                            title: data.status === 'ACTIVE' ? 'Sprint started' : 'Sprint completed',
                            message:
                                data.status === 'ACTIVE'
                                    ? `${sprint.name} is now active.`
                                    : `${sprint.name} was completed.`,
                            userId: member.userId,
                            metadata: {
                                sprintId: sprint.id,
                                projectId: sprint.projectId,
                            },
                        })),
                    )
                    .catch(() => null);
            }
        }

        return sprint;
    }

    async delete(id: string) {
        const sprint = await this.findById(id);

        if (sprint.status === 'ACTIVE') {
            throw new AppError('Aktif bir sprint silinemez. Önce tamamlayın veya iptal edin.', 400, 'BAD_REQUEST');
        }

        // Sprint'teki görevlerin sprintId'sini null yap
        await prisma.task.updateMany({
            where: { sprintId: id },
            data: { sprintId: null },
        });

        return prisma.sprint.delete({ where: { id } });
    }

    async addTasks(sprintId: string, taskIds: string[]) {
        await this.findById(sprintId);

        await prisma.task.updateMany({
            where: { id: { in: taskIds } },
            data: { sprintId },
        });

        return this.findById(sprintId);
    }

    async removeTasks(sprintId: string, taskIds: string[]) {
        await this.findById(sprintId);

        await prisma.task.updateMany({
            where: { id: { in: taskIds }, sprintId },
            data: { sprintId: null },
        });

        return this.findById(sprintId);
    }

    // Burndown chart verisi: gün bazında kalan task sayısı
    async getBurndownData(sprintId: string) {
        const sprint = await this.findById(sprintId);

        if (!sprint.startDate || !sprint.endDate) {
            throw new AppError('Sprint başlangıç ve bitiş tarihleri gerekli', 400, 'BAD_REQUEST');
        }

        const tasks = sprint.tasks;
        const totalTasks = tasks.length;

        // Tamamlanan task'ları güne göre grupla
        const completedByDay: Record<string, number> = {};
        for (const task of tasks) {
            if (task.status.name === 'DONE' || task.status.name === 'Done') {
                const day = task.updatedAt.toISOString().split('T')[0];
                completedByDay[day] = (completedByDay[day] || 0) + 1;
            }
        }

        // Gün gün burndown hesapla
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        const now = new Date();
        const effectiveEnd = now < end ? now : end;

        const burndown: { date: string; remaining: number; ideal: number }[] = [];
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        let completed = 0;

        for (let d = new Date(start); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            completed += completedByDay[dateStr] || 0;

            const dayIndex = Math.ceil((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const ideal = totalDays > 0 ? totalTasks - (totalTasks / totalDays) * dayIndex : 0;

            burndown.push({
                date: dateStr,
                remaining: totalTasks - completed,
                ideal: Math.max(0, Math.round(ideal * 10) / 10),
            });
        }

        return {
            sprintId,
            sprintName: sprint.name,
            totalTasks,
            completedTasks: completed,
            burndown,
        };
    }

    // Velocity: tamamlanan sprint başına tamamlanan task sayısı
    async getVelocity(projectId: string) {
        try {
            // Tamamlanan sprintleri tüm task'larıyla çek, filtrelemeyi uygulama katmanında yap
            const completedSprints = await prisma.sprint.findMany({
                where: { projectId, status: 'COMPLETED' },
                include: {
                    tasks: {
                        include: { status: true },
                    },
                    _count: { select: { tasks: true } },
                },
                orderBy: { endDate: 'asc' },
                take: 10,
            });

            const velocityData = completedSprints.map((sprint) => {
                // Tamamlanan task'ları uygulama katmanında filtrele (DONE veya Done)
                const doneTasks = sprint.tasks.filter(
                    (t) => t.status.name === 'DONE' || t.status.name === 'Done',
                );
                return {
                    sprintId: sprint.id,
                    sprintName: sprint.name,
                    completedTasks: doneTasks.length,
                    totalTasks: sprint._count.tasks,
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                };
            });

            const avgVelocity =
                velocityData.length > 0
                    ? Math.round(
                          velocityData.reduce((sum, v) => sum + v.completedTasks, 0) /
                              velocityData.length,
                      )
                    : 0;

            return { velocityData, avgVelocity };
        } catch {
            // Hata durumunda boş veri dön, 500 değil
            return { velocityData: [], avgVelocity: 0 };
        }
    }
}

export const sprintService = new SprintService();
