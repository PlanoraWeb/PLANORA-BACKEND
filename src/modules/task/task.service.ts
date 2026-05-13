import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, TaskFilterDto } from './task.validation';
import { notificationService } from '../notification/notification.service';

// ─── Ortak include objesi ────────────────────────────────────────
const taskInclude = {
    status: true,
    reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
};

const taskWithProjectInclude = {
    status: true,
    project: { select: { id: true, projectName: true } },
    reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
};

// ─── Filtre where objesi oluşturucu (helper) ─────────────────────
function buildFilterWhere(filters: TaskFilterDto) {
    const where: any = {};

    if (filters.status) where.statusId = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.type) where.type = filters.type;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.reporterId) where.reporterId = filters.reporterId;

    // Sprint filtresi (backlog desteği)
    if (filters.backlog === 'true') {
        where.sprintId = null; // Sprint'e atanmamış görevler
    } else if (filters.sprintId) {
        where.sprintId = filters.sprintId;
    }

    // Tarih aralığı
    if (filters.dueDateFrom || filters.dueDateTo) {
        where.dueDate = {};
        if (filters.dueDateFrom) where.dueDate.gte = new Date(filters.dueDateFrom);
        if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo);
    }

    // Arama (title veya description)
    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    return where;
}

// ─── Sıralama objesi oluşturucu ──────────────────────────────────
function buildOrderBy(filters: TaskFilterDto) {
    return { [filters.sortBy]: filters.sortOrder };
}

const taskOrderAsc = [{ order: 'asc' as const }, { createdAt: 'asc' as const }];
const taskOrderDesc = [{ order: 'desc' as const }, { createdAt: 'desc' as const }];

async function getNextTaskOrder(client: any, projectId: string, statusId: string, excludeId?: string) {
    const lastTask = await client.task.findFirst({
        where: {
            projectId,
            statusId,
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        orderBy: taskOrderDesc,
        select: { order: true },
    });

    return lastTask ? lastTask.order + 1 : 0;
}

export class TaskService {
    async create(projectId: string, reporterId: string, data: CreateTaskDto) {
        const nextOrder = await getNextTaskOrder(prisma, projectId, data.statusId);

        const task = await prisma.task.create({
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
                order: nextOrder,
            },
            include: taskInclude,
        });

        if (task.assignee?.id && task.assignee.id !== reporterId) {
            await notificationService
                .create({
                    type: 'TASK_ASSIGNED',
                    title: 'New task assigned',
                    message: `You were assigned to "${task.title}".`,
                    userId: task.assignee.id,
                    metadata: {
                        taskId: task.id,
                        projectId,
                        statusId: task.statusId,
                    },
                })
                .catch(() => null);
        }

        return task;
    }

    async findAllByProject(projectId: string, filters: TaskFilterDto) {
        const filterWhere = buildFilterWhere(filters);
        const where = { projectId, ...filterWhere };

        const skip = (filters.page - 1) * filters.limit;
        const take = filters.limit;

        const [tasks, total] = await prisma.$transaction([
            prisma.task.findMany({
                where,
                include: taskInclude,
                orderBy: buildOrderBy(filters),
                skip,
                take,
            }),
            prisma.task.count({ where }),
        ]);

        return {
            tasks,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    }

    async findById(id: string) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: taskWithProjectInclude,
        });

        if (!task) {
            throw new AppError('Görev bulunamadı', 404, 'NOT_FOUND');
        }

        return task;
    }

    async update(id: string, data: UpdateTaskDto) {
        const existingTask = await this.findById(id);
        const nextData: any = {
            ...data,
            dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
        };

        if (data.statusId && data.statusId !== existingTask.statusId) {
            nextData.order = await getNextTaskOrder(
                prisma,
                existingTask.project.id,
                data.statusId,
                id,
            );
        }

        const task = await prisma.task.update({
            where: { id },
            data: nextData,
            include: taskInclude,
        });

        if (
            task.assignee?.id &&
            task.assignee.id !== existingTask.assignee?.id &&
            task.assignee.id !== existingTask.reporter.id
        ) {
            await notificationService
                .create({
                    type: 'TASK_ASSIGNED',
                    title: 'Task assigned',
                    message: `You were assigned to "${task.title}".`,
                    userId: task.assignee.id,
                    metadata: {
                        taskId: task.id,
                        projectId: existingTask.project.id,
                        statusId: task.statusId,
                    },
                })
                .catch(() => null);
        }

        if (existingTask.assignee?.id && !task.assignee?.id) {
            await notificationService
                .create({
                    type: 'TASK_UNASSIGNED',
                    title: 'Task unassigned',
                    message: `"${task.title}" is no longer assigned to you.`,
                    userId: existingTask.assignee.id,
                    metadata: {
                        taskId: task.id,
                        projectId: existingTask.project.id,
                    },
                })
                .catch(() => null);
        }

        return task;
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.task.delete({ where: { id } });
    }

    async changeStatus(id: string, data: UpdateTaskStatusDto) {
        const existingTask = await this.findById(id);

        const statusExists = await prisma.taskStatus.findUnique({
            where: { id: data.statusId },
        });

        if (!statusExists) {
            throw new AppError('Belirtilen görev durumu bulunamadı', 404, 'NOT_FOUND');
        }

        const task = await prisma.$transaction(async (transaction) => {
            const sourceTaskIds = (
                await transaction.task.findMany({
                    where: { statusId: existingTask.statusId },
                    orderBy: taskOrderAsc,
                    select: { id: true },
                })
            ).map((task) => task.id);

            const destinationTaskIds =
                data.statusId === existingTask.statusId
                    ? sourceTaskIds.filter((taskId) => taskId !== id)
                    : (
                          await transaction.task.findMany({
                              where: { statusId: data.statusId, id: { not: id } },
                              orderBy: taskOrderAsc,
                              select: { id: true },
                          })
                      ).map((task) => task.id);

            const clampedDestinationIndex = Math.max(
                0,
                Math.min(data.newOrder, destinationTaskIds.length),
            );

            const nextDestinationIds = [...destinationTaskIds];
            nextDestinationIds.splice(clampedDestinationIndex, 0, id);

            if (data.statusId === existingTask.statusId) {
                await Promise.all(
                    nextDestinationIds.map((taskId, index) =>
                        transaction.task.update({
                            where: { id: taskId },
                            data: { order: index },
                        }),
                    ),
                );
            } else {
                const nextSourceIds = sourceTaskIds.filter((taskId) => taskId !== id);

                await Promise.all([
                    ...nextSourceIds.map((taskId, index) =>
                        transaction.task.update({
                            where: { id: taskId },
                            data: { order: index },
                        }),
                    ),
                    ...nextDestinationIds.map((taskId, index) =>
                        transaction.task.update({
                            where: { id: taskId },
                            data:
                                taskId === id
                                    ? { statusId: data.statusId, order: index }
                                    : { order: index },
                        }),
                    ),
                ]);
            }

            return transaction.task.findUnique({
                where: { id },
                include: taskInclude,
            });
        });

        if (!task) {
            throw new AppError('GÃ¶rev bulunamadÄ±', 404, 'NOT_FOUND');
        }

        if (task.assignee?.id) {
            await notificationService
                .create({
                    type: 'TASK_STATUS_CHANGED',
                    title: 'Task status updated',
                    message: `"${task.title}" moved to ${task.status.name}.`,
                    userId: task.assignee.id,
                    metadata: {
                        taskId: task.id,
                        previousStatus: existingTask.status.name,
                        nextStatus: task.status.name,
                        projectId: existingTask.project.id,
                    },
                })
                .catch(() => null);
        }

        return task;
    }

    async assignUser(id: string, assigneeId: string | null) {
        const existingTask = await this.findById(id);

        const task = await prisma.task.update({
            where: { id },
            data: { assigneeId },
            include: taskInclude,
        });

        if (existingTask.assignee?.id && existingTask.assignee.id !== assigneeId) {
            await notificationService
                .create({
                    type: 'TASK_UNASSIGNED',
                    title: 'Task unassigned',
                    message: `"${task.title}" is no longer assigned to you.`,
                    userId: existingTask.assignee.id,
                    metadata: {
                        taskId: task.id,
                        projectId: existingTask.project.id,
                    },
                })
                .catch(() => null);
        }

        if (task.assignee?.id && task.assignee.id !== existingTask.reporter.id) {
            await notificationService
                .create({
                    type: 'TASK_ASSIGNED',
                    title: 'Task assigned',
                    message: `You were assigned to "${task.title}".`,
                    userId: task.assignee.id,
                    metadata: {
                        taskId: task.id,
                        projectId: existingTask.project.id,
                    },
                })
                .catch(() => null);
        }

        return task;
    }

    // Kullanıcıya atanmış görevler (Tasks.jsx / GET /tasks/me için)
    async findByAssignee(userId: string, filters: TaskFilterDto) {
        const filterWhere = buildFilterWhere(filters);
        const where = { assigneeId: userId, ...filterWhere };

        const skip = (filters.page - 1) * filters.limit;
        const take = filters.limit;

        const [tasks, total] = await prisma.$transaction([
            prisma.task.findMany({
                where,
                include: taskWithProjectInclude,
                orderBy: buildOrderBy(filters),
                skip,
                take,
            }),
            prisma.task.count({ where }),
        ]);

        return {
            tasks,
            meta: {
                total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(total / filters.limit),
            },
        };
    }
}

export const taskService = new TaskService();
