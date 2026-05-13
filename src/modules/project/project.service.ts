import prisma from '../../shared/utils/prisma';
import { AppError } from '../../shared/utils/AppError';
import { CreateProjectDto, UpdateProjectDto, AddProjectMemberDto } from './project.validation';
import { notificationService } from '../notification/notification.service';

export class ProjectService {
    async create(data: CreateProjectDto, userId: string) {
        // Proje oluştur
        const project = await prisma.project.create({
            data: {
                projectName: data.name,
                description: data.description,
                createdById: userId,
            },
        });

        // Oluşturan kişiyi "Project Admin" olarak ekle
        const projectAdminRole = await prisma.role.findFirst({
            where: { name: 'Project Admin' },
        });

        if (projectAdminRole) {
            await prisma.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: userId,
                    roleId: projectAdminRole.id,
                },
            });
        }

        // Varsayılan kanban kolonlarını oluştur
        const defaultStatuses = [
            { name: 'TODO', position: 0, isDefault: true },
            { name: 'IN_PROGRESS', position: 1, isDefault: false },
            { name: 'DONE', position: 2, isDefault: false },
        ];

        await prisma.taskStatus.createMany({
            data: defaultStatuses.map((s) => ({
                ...s,
                projectId: project.id,
            })),
        });

        return this.findById(project.id);
    }

    async findAll(userId: string) {
        return prisma.project.findMany({
            where: {
                members: { some: { userId } },
            },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true } },
                        role: { select: { name: true } },
                    },
                },
                _count: { select: { members: true, tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true } },
                        role: { select: { id: true, name: true } },
                    },
                },
                statuses: { orderBy: { position: 'asc' } },
                _count: { select: { tasks: true } },
            },
        });

        if (!project) {
            throw new AppError('Proje bulunamadı', 404, 'NOT_FOUND');
        }

        return project;
    }

    async getInsights(id: string) {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true } },
                        role: { select: { id: true, name: true } },
                    },
                },
                statuses: { orderBy: { position: 'asc' } },
                tasks: {
                    include: {
                        status: true,
                        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                    },
                    orderBy: { updatedAt: 'desc' },
                },
                sprints: {
                    include: {
                        tasks: {
                            include: {
                                status: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!project) {
            throw new AppError('Proje bulunamadÄ±', 404, 'NOT_FOUND');
        }

        const now = new Date();
        const tasks = project.tasks;
        const sprints = project.sprints;
        const activeSprint = sprints.find((sprint) => sprint.status === 'ACTIVE') ?? null;
        const doneTaskNames = new Set(['DONE', 'Done']);
        const completedTasks = tasks.filter((task) => doneTaskNames.has(task.status.name));
        const openTasks = tasks.filter((task) => !doneTaskNames.has(task.status.name));
        const backlogTasks = tasks.filter((task) => !task.sprintId);
        const overdueTasks = tasks.filter(
            (task) => task.dueDate && task.dueDate < now && !doneTaskNames.has(task.status.name),
        );

        const tasksByStatus = project.statuses.map((status) => ({
            id: status.id,
            name: status.name,
            count: tasks.filter((task) => task.statusId === status.id).length,
        }));

        const tasksByPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => ({
            priority,
            count: tasks.filter((task) => task.priority === priority).length,
        }));

        const tasksByType = ['TASK', 'BUG', 'STORY'].map((type) => ({
            type,
            count: tasks.filter((task) => task.type === type).length,
        }));

        const workload = project.members.map((member) => {
            const memberTasks = tasks.filter((task) => task.assigneeId === member.userId);
            const memberOpenTasks = memberTasks.filter((task) => !doneTaskNames.has(task.status.name));
            return {
                userId: member.userId,
                name: `${member.user.firstName} ${member.user.lastName}`.trim(),
                role: member.role.name,
                openTaskCount: memberOpenTasks.length,
                completedTaskCount: memberTasks.length - memberOpenTasks.length,
                overdueTaskCount: memberOpenTasks.filter(
                    (task) => task.dueDate && task.dueDate < now,
                ).length,
            };
        });

        const upcomingTasks = [...tasks]
            .filter((task) => task.dueDate && !doneTaskNames.has(task.status.name))
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .slice(0, 8)
            .map((task) => ({
                id: task.id,
                title: task.title,
                dueDate: task.dueDate,
                status: task.status.name,
                priority: task.priority,
                assignee: task.assignee,
                sprintId: task.sprintId,
            }));

        const recentActivity = [...tasks]
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 10)
            .map((task) => ({
                id: task.id,
                title: task.title,
                status: task.status.name,
                updatedAt: task.updatedAt,
                assignee: task.assignee,
                priority: task.priority,
                type: task.type,
            }));

        const sprintSummaries = sprints.map((sprint) => {
            const sprintDoneCount = sprint.tasks.filter((task) => doneTaskNames.has(task.status.name)).length;
            return {
                id: sprint.id,
                name: sprint.name,
                goal: sprint.goal,
                status: sprint.status,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                totalTasks: sprint.tasks.length,
                completedTasks: sprintDoneCount,
                completionRate:
                    sprint.tasks.length > 0
                        ? Math.round((sprintDoneCount / sprint.tasks.length) * 100)
                        : 0,
            };
        });

        const dueTimeline = [...tasks]
            .filter((task) => task.dueDate)
            .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
            .map((task) => ({
                id: task.id,
                title: task.title,
                dueDate: task.dueDate,
                status: task.status.name,
                sprintId: task.sprintId,
                assignee: task.assignee,
                priority: task.priority,
            }));

        return {
            project: {
                id: project.id,
                projectName: project.projectName,
                description: project.description,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                members: project.members,
                statuses: project.statuses,
            },
            summary: {
                totalTasks: tasks.length,
                openTasks: openTasks.length,
                completedTasks: completedTasks.length,
                backlogTasks: backlogTasks.length,
                overdueTasks: overdueTasks.length,
                memberCount: project.members.length,
                sprintCount: sprints.length,
                activeSprint: activeSprint
                    ? {
                          id: activeSprint.id,
                          name: activeSprint.name,
                          goal: activeSprint.goal,
                          startDate: activeSprint.startDate,
                          endDate: activeSprint.endDate,
                      }
                    : null,
                completionRate:
                    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
            },
            tasksByStatus,
            tasksByPriority,
            tasksByType,
            workload,
            upcomingTasks,
            dueTimeline,
            recentActivity,
            sprintSummaries,
            archivedTasks: completedTasks.slice(0, 25).map((task) => ({
                id: task.id,
                title: task.title,
                updatedAt: task.updatedAt,
                dueDate: task.dueDate,
                assignee: task.assignee,
                priority: task.priority,
                type: task.type,
            })),
        };
    }

    async update(id: string, data: UpdateProjectDto) {
        await this.findById(id);

        return prisma.project.update({
            where: { id },
            data: {
                ...(data.name && { projectName: data.name }),
                ...(data.description !== undefined && { description: data.description }),
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return prisma.project.delete({ where: { id } });
    }

    async addMember(projectId: string, data: AddProjectMemberDto) {
        const project = await this.findById(projectId);

        const existing = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: data.userId } },
        });

        if (existing) {
            throw new AppError('Kullanıcı zaten bu projenin üyesi', 409, 'CONFLICT');
        }

        // Role name'den roleId'yi bul
        const role = await prisma.role.findFirst({
            where: { name: data.role === 'PROJECT_ADMIN' ? 'Project Admin' : 'Member' },
        });

        if (!role) {
            throw new AppError('Belirtilen rol bulunamadı', 404, 'NOT_FOUND');
        }

        const member = await prisma.projectMember.create({
            data: {
                projectId,
                userId: data.userId,
                roleId: role.id,
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, email: true } },
                role: { select: { id: true, name: true } },
            },
        });

        await notificationService
            .create({
                type: 'PROJECT_MEMBER_ADDED',
                title: 'Added to project',
                message: `You were added to ${project.projectName}.`,
                userId: data.userId,
                metadata: {
                    projectId: project.id,
                    projectName: project.projectName,
                    role: role.name,
                },
            })
            .catch(() => null);

        return member;
    }

    async removeMember(projectId: string, userId: string) {
        const project = await this.findById(projectId);
        const member = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
        });

        if (!member) {
            throw new AppError('Kullanıcı bu projenin üyesi değil', 404, 'NOT_FOUND');
        }

        const deletedMember = await prisma.projectMember.delete({
            where: { id: member.id },
        });

        await notificationService
            .create({
                type: 'PROJECT_MEMBER_REMOVED',
                title: 'Removed from project',
                message: `Your access to ${project.projectName} was removed.`,
                userId,
                metadata: {
                    projectId: project.id,
                    projectName: project.projectName,
                },
            })
            .catch(() => null);

        return deletedMember;
    }
}

export const projectService = new ProjectService();
