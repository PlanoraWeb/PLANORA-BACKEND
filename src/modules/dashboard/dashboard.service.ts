import prisma from '../../shared/utils/prisma';

export class DashboardService {
    async getSummary(userId: string) {
        const [projectCount, openTaskCount, totalTaskCount, activeSprint, unreadNotificationCount] =
            await Promise.all([
                // Kullanıcının üye olduğu proje sayısı
                prisma.project.count({
                    where: { members: { some: { userId } } },
                }),
                // Açık (tamamlanmamış) görev sayısı
                prisma.task.count({
                    where: {
                        assigneeId: userId,
                        status: { name: { not: 'DONE' } },
                    },
                }),
                // Toplam atanmış görev sayısı
                prisma.task.count({
                    where: { assigneeId: userId },
                }),
                // Kullanıcının üye olduğu projelerdeki aktif sprint
                prisma.sprint.findFirst({
                    where: {
                        status: 'ACTIVE',
                        project: { members: { some: { userId } } },
                    },
                    include: {
                        project: { select: { id: true, projectName: true } },
                        _count: { select: { tasks: true } },
                    },
                    orderBy: { startDate: 'desc' },
                }),
                // Okunmamış bildirim sayısı
                prisma.notification.count({
                    where: { userId, isRead: false },
                }),
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
}

export const dashboardService = new DashboardService();
