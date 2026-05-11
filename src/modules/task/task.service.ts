import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, TaskFilterDto } from './task.validation';

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
            include: taskInclude,
        });
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
        await this.findById(id);

        return prisma.task.update({
            where: { id },
            data: {
                ...data,
                dueDate: data.dueDate === null ? null : data.dueDate ? new Date(data.dueDate) : undefined,
            },
            include: taskInclude,
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.task.delete({ where: { id } });
    }

    async changeStatus(id: string, data: UpdateTaskStatusDto) {
        await this.findById(id);

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
            include: taskInclude,
        });
    }

    async assignUser(id: string, assigneeId: string | null) {
        await this.findById(id);

        return prisma.task.update({
            where: { id },
            data: { assigneeId },
            include: taskInclude,
        });
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
