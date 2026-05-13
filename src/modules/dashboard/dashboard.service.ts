import prisma from '../../shared/utils/prisma';

export class DashboardService {
    async getSummary(userId: string) {
        // Her sorguyu ayrı ayrı çalıştır; biri hata verirse diğerleri etkilenmesin
        const [
            projectCount,
            openTaskCount,
            totalTaskCount,
            activeSprint,
            unreadNotificationCount,
        ] = await Promise.all([
            // Kullanıcının üye olduğu proje sayısı
            prisma.project
                .count({ where: { members: { some: { userId } } } })
                .catch(() => 0),

            // Açık (tamamlanmamış) görev sayısı — NOT operatörü ile güvenli negation
            prisma.task
                .count({
                    where: {
                        assigneeId: userId,
                        NOT: { status: { name: 'DONE' } },
                    },
                })
                .catch(() => 0),

            // Toplam atanmış görev sayısı
            prisma.task
                .count({ where: { assigneeId: userId } })
                .catch(() => 0),

            // Kullanıcının üye olduğu projelerdeki aktif sprint
            prisma.sprint
                .findFirst({
                    where: {
                        status: 'ACTIVE',
                        project: { members: { some: { userId } } },
                    },
                    include: {
                        project: { select: { id: true, projectName: true } },
                        _count: { select: { tasks: true } },
                    },
                    orderBy: { startDate: 'desc' },
                })
                .catch(() => null),

            // Okunmamış bildirim sayısı
            prisma.notification
                .count({ where: { userId, isRead: false } })
                .catch(() => 0),
        ]);

        return {
            projectCount,
            openTaskCount,
            totalTaskCount,
            activeSprint: activeSprint
                ? {
                      id: activeSprint.id,
                      name: activeSprint.name,
                      projectName: activeSprint.project.projectName,
                      startDate: activeSprint.startDate,
                      endDate: activeSprint.endDate,
                      taskCount: activeSprint._count.tasks,
                  }
                : null,
            unreadNotificationCount,
        };
    }

    async getOverview(userId: string) {
        const memberProjects = await prisma.project.findMany({
            where: { members: { some: { userId } } },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                tasks: {
                    include: {
                        status: { select: { name: true } },
                    },
                },
                sprints: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                    include: {
                        tasks: {
                            include: {
                                status: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const assignedTasks = await prisma.task.findMany({
            where: {
                assigneeId: userId,
            },
            include: {
                status: { select: { name: true } },
                project: { select: { id: true, projectName: true } },
                sprint: { select: { id: true, name: true } },
            },
            orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
        });

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 6,
        });

        const now = new Date();
        const weekAhead = new Date(now);
        weekAhead.setDate(weekAhead.getDate() + 7);

        const openAssignedTasks = assignedTasks.filter(
            (task) => task.status?.name !== 'DONE'
        );
        const completedAssignedTasks = assignedTasks.filter(
            (task) => task.status?.name === 'DONE'
        );
        const overdueTasks = openAssignedTasks.filter(
            (task) => task.dueDate && task.dueDate < now
        );
        const dueSoonTasks = openAssignedTasks.filter(
            (task) => task.dueDate && task.dueDate >= now && task.dueDate <= weekAhead
        );

        const activeSprintRecord =
            memberProjects
                .flatMap((project) =>
                    project.sprints.map((sprint) => ({
                        ...sprint,
                        project: { id: project.id, projectName: project.projectName },
                    }))
                )
                .sort(
                    (a, b) =>
                        new Date(b.startDate || b.createdAt).getTime() -
                        new Date(a.startDate || a.createdAt).getTime()
                )[0] || null;

        const statusBreakdownMap = new Map<string, number>();
        openAssignedTasks.forEach((task) => {
            const key = task.status?.name || 'Unknown';
            statusBreakdownMap.set(key, (statusBreakdownMap.get(key) || 0) + 1);
        });

        return {
            greeting: {
                hour: now.getHours(),
                generatedAt: now.toISOString(),
            },
            metrics: {
                activeProjectCount: memberProjects.length,
                openTaskCount: openAssignedTasks.length,
                completedTaskCount: completedAssignedTasks.length,
                overdueTaskCount: overdueTasks.length,
                unreadNotificationCount: notifications.filter((item) => !item.isRead).length,
                dueSoonTaskCount: dueSoonTasks.length,
            },
            activeSprint: activeSprintRecord
                ? {
                      id: activeSprintRecord.id,
                      name: activeSprintRecord.name,
                      goal: activeSprintRecord.goal,
                      startDate: activeSprintRecord.startDate,
                      endDate: activeSprintRecord.endDate,
                      project: activeSprintRecord.project,
                      taskCount: activeSprintRecord.tasks.length,
                      completedTaskCount: activeSprintRecord.tasks.filter(
                          (task) => task.status?.name === 'DONE'
                      ).length,
                  }
                : null,
            activeProjects: memberProjects.slice(0, 4).map((project) => {
                const totalTasks = project.tasks.length;
                const doneTasks = project.tasks.filter(
                    (task) => task.status?.name === 'DONE'
                ).length;
                const activeSprint = project.sprints[0] || null;

                return {
                    id: project.id,
                    name: project.projectName,
                    description: project.description,
                    memberCount: project.members.length,
                    totalTasks,
                    doneTasks,
                    openTasks: totalTasks - doneTasks,
                    completionRate: totalTasks
                        ? Math.round((doneTasks / totalTasks) * 100)
                        : 0,
                    activeSprintName: activeSprint?.name || null,
                };
            }),
            upcomingTasks: openAssignedTasks.slice(0, 6).map((task) => ({
                id: task.id,
                title: task.title,
                priority: task.priority,
                dueDate: task.dueDate,
                statusName: task.status?.name || 'Unknown',
                project: task.project,
                sprint: task.sprint,
            })),
            workload: {
                open: openAssignedTasks.length,
                completed: completedAssignedTasks.length,
                overdue: overdueTasks.length,
                dueSoon: dueSoonTasks.length,
            },
            statusBreakdown: Array.from(statusBreakdownMap.entries()).map(([name, count]) => ({
                name,
                count,
            })),
            recentNotifications: notifications.map((item) => ({
                id: item.id,
                title: item.title,
                message: item.message,
                type: item.type,
                isRead: item.isRead,
                createdAt: item.createdAt,
            })),
        };
    }

    async getAnalytics(userId: string) {
        const projectMemberships = await prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });

        const projectIds = projectMemberships.map((membership) => membership.projectId);
        if (projectIds.length === 0) {
            return {
                summary: {
                    totalProjects: 0,
                    totalTasks: 0,
                    completedTasks: 0,
                    openTasks: 0,
                    activeSprints: 0,
                    completionRate: 0,
                },
                completionSeries: [],
                statusDistribution: [],
                priorityDistribution: [],
                typeDistribution: [],
                projectPerformance: [],
                sprintPerformance: [],
                notificationDistribution: [],
            };
        }

        const [projects, tasks, sprints, notifications] = await Promise.all([
            prisma.project.findMany({
                where: { id: { in: projectIds } },
                include: {
                    tasks: {
                        include: {
                            status: { select: { name: true } },
                        },
                    },
                },
            }),
            prisma.task.findMany({
                where: { projectId: { in: projectIds } },
                include: {
                    status: { select: { name: true } },
                    project: { select: { id: true, projectName: true } },
                },
            }),
            prisma.sprint.findMany({
                where: { projectId: { in: projectIds } },
                include: {
                    tasks: {
                        include: {
                            status: { select: { name: true } },
                        },
                    },
                    project: { select: { id: true, projectName: true } },
                },
            }),
            prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
        ]);

        const doneTasks = tasks.filter((task) => task.status?.name === 'DONE');
        const openTasks = tasks.filter((task) => task.status?.name !== 'DONE');
        const activeSprints = sprints.filter((sprint) => sprint.status === 'ACTIVE');

        const now = new Date();
        const completionSeries = Array.from({ length: 7 }, (_, index) => {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            start.setDate(now.getDate() - (6 - index));
            const end = new Date(start);
            end.setDate(start.getDate() + 1);

            return {
                date: start.toISOString().slice(0, 10),
                label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: doneTasks.filter(
                    (task) => task.updatedAt >= start && task.updatedAt < end
                ).length,
            };
        });

        const mapDistribution = <T extends string>(values: T[]) => {
            const counts = new Map<string, number>();
            values.forEach((value) => {
                counts.set(value, (counts.get(value) || 0) + 1);
            });
            return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
        };

        return {
            summary: {
                totalProjects: projects.length,
                totalTasks: tasks.length,
                completedTasks: doneTasks.length,
                openTasks: openTasks.length,
                activeSprints: activeSprints.length,
                completionRate: tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
            },
            completionSeries,
            statusDistribution: mapDistribution(
                tasks.map((task) => task.status?.name || 'Unknown')
            ),
            priorityDistribution: mapDistribution(tasks.map((task) => task.priority)),
            typeDistribution: mapDistribution(tasks.map((task) => task.type)),
            notificationDistribution: mapDistribution(
                notifications.map((notification) => notification.type)
            ),
            projectPerformance: projects.map((project) => {
                const totalTasks = project.tasks.length;
                const completedTasks = project.tasks.filter(
                    (task) => task.status?.name === 'DONE'
                ).length;

                return {
                    id: project.id,
                    name: project.projectName,
                    totalTasks,
                    completedTasks,
                    openTasks: totalTasks - completedTasks,
                    completionRate: totalTasks
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0,
                };
            }),
            sprintPerformance: sprints.map((sprint) => {
                const totalTasks = sprint.tasks.length;
                const completedTasks = sprint.tasks.filter(
                    (task) => task.status?.name === 'DONE'
                ).length;

                return {
                    id: sprint.id,
                    name: sprint.name,
                    status: sprint.status,
                    projectName: sprint.project.projectName,
                    totalTasks,
                    completedTasks,
                    completionRate: totalTasks
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0,
                };
            }),
        };
    }
}

export const dashboardService = new DashboardService();
