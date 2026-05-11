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
}

export const dashboardService = new DashboardService();
