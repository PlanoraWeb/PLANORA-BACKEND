import prisma from '../../shared/utils/prisma';

export class DashboardService {
    async getSummary(userId: string) {
        const [projectCount, openTaskCount, totalTaskCount] = await Promise.all([
            prisma.project.count({
                where: { members: { some: { userId } } },
            }),
            prisma.task.count({
                where: {
                    assigneeId: userId,
                    status: { name: { not: 'DONE' } },
                },
            }),
            prisma.task.count({
                where: { assigneeId: userId },
            }),
        ]);

        return {
            projectCount,
            openTaskCount,
            totalTaskCount,
        };
    }
}

export const dashboardService = new DashboardService();
