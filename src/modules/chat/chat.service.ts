import OpenAI from 'openai';
import prisma from '../../shared/utils/prisma';
import { env } from '../../shared/config/env';
import { AppError } from '../../shared/utils/AppError';

const SYSTEM_PROMPT = `
Sen Planora'nın çalışma alanı asistanısın.
- Her zaman Türkçe cevap ver.
- Kullanıcının mevcut workspace verisi verildiyse, proje/sprint/görev/bildirim ile ilgili cevaplarında sadece bu veriye dayan.
- Veride olmayan bir şeyi olmuş gibi söyleme.
- Kullanıcı "aktif projem var mı", "aktif sprintim ne", "bildirimlerim neler", "görevlerim nasıl" gibi sorular sorarsa doğrudan kendi verisini özetle.
- Cevapların kısa, net ve ürün içi yardımcı tonda olsun.
`.trim();

type WorkspaceSnapshot = {
    firstName: string;
    projectCount: number;
    activeProjects: string[];
    activeSprintNames: string[];
    assignedOpenTasks: Array<{
        title: string;
        projectName: string;
        status: string;
        priority: string;
        dueDate: Date | null;
    }>;
    completedTaskCount: number;
    overdueTaskCount: number;
    unreadNotificationCount: number;
    latestNotifications: Array<{
        title: string;
        message: string;
        createdAt: Date;
    }>;
};

export class ChatService {
    private getClient(): OpenAI {
        if (!env.OPENAI_API_KEY) {
            throw new AppError(
                'OpenAI API anahtarı yapılandırılmamış. Lütfen .env dosyasına OPENAI_API_KEY ekleyin.',
                503,
                'SERVICE_UNAVAILABLE',
            );
        }
        return new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

    private async getWorkspaceSnapshot(userId: string): Promise<WorkspaceSnapshot> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                memberships: {
                    include: {
                        project: {
                            include: {
                                sprints: {
                                    where: { status: 'ACTIVE' },
                                    select: { id: true, name: true },
                                },
                            },
                        },
                    },
                },
                assignedTasks: {
                    include: {
                        status: true,
                        project: { select: { projectName: true } },
                    },
                    orderBy: { updatedAt: 'desc' },
                },
                notifications: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: {
                        title: true,
                        message: true,
                        createdAt: true,
                        isRead: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AppError('Kullanıcı bulunamadı', 404, 'NOT_FOUND');
        }

        const doneTaskNames = new Set(['DONE', 'Done']);
        const activeProjects = user.memberships.map((membership) => membership.project.projectName);
        const activeSprintNames = user.memberships.flatMap((membership) =>
            membership.project.sprints.map((sprint) => sprint.name),
        );
        const assignedOpenTasks = user.assignedTasks
            .filter((task) => !doneTaskNames.has(task.status.name))
            .map((task) => ({
                title: task.title,
                projectName: task.project.projectName,
                status: task.status.name,
                priority: task.priority,
                dueDate: task.dueDate,
            }));
        const completedTaskCount = user.assignedTasks.filter((task) => doneTaskNames.has(task.status.name)).length;
        const overdueTaskCount = assignedOpenTasks.filter((task) => task.dueDate && task.dueDate < new Date()).length;
        const unreadNotificationCount = user.notifications.filter((notification) => !notification.isRead).length;

        return {
            firstName: user.firstName,
            projectCount: activeProjects.length,
            activeProjects,
            activeSprintNames,
            assignedOpenTasks,
            completedTaskCount,
            overdueTaskCount,
            unreadNotificationCount,
            latestNotifications: user.notifications.map((notification) => ({
                title: notification.title,
                message: notification.message,
                createdAt: notification.createdAt,
            })),
        };
    }

    private normalize(text: string) {
        return text
            .toLocaleLowerCase('tr-TR')
            .replaceAll('ı', 'i')
            .replaceAll('ğ', 'g')
            .replaceAll('ü', 'u')
            .replaceAll('ş', 's')
            .replaceAll('ö', 'o')
            .replaceAll('ç', 'c');
    }

    private buildDirectResponse(message: string, snapshot: WorkspaceSnapshot): string | null {
        const normalized = this.normalize(message);
        const hasProjectIntent = normalized.includes('proje');
        const hasSprintIntent = normalized.includes('sprint');
        const hasNotificationIntent = normalized.includes('bildirim');
        const hasTaskIntent = normalized.includes('gorev') || normalized.includes('task');
        if (!hasProjectIntent && !hasSprintIntent && !hasNotificationIntent && !hasTaskIntent) {
            return null;
        }

        const sections: string[] = [];

        if (hasProjectIntent) {
            sections.push(
                snapshot.projectCount === 0
                    ? `Aktif proje üyeliğin görünmüyor.`
                    : `${snapshot.projectCount} aktif projen var: ${snapshot.activeProjects.join(', ')}.`,
            );
        }

        if (hasSprintIntent) {
            sections.push(
                snapshot.activeSprintNames.length === 0
                    ? `Şu anda aktif sprint görünmüyor.`
                    : `Aktif sprintlerin: ${snapshot.activeSprintNames.join(', ')}.`,
            );
        }

        if (hasNotificationIntent) {
            if (snapshot.latestNotifications.length === 0) {
                sections.push(`Şu anda bildirim görünmüyor.`);
            } else {
                const lines = snapshot.latestNotifications
                    .slice(0, 4)
                    .map((item) => `- ${item.title}: ${item.message}`)
                    .join('\n');
                sections.push(
                    `Okunmamış bildirim sayın ${snapshot.unreadNotificationCount}.\nSon bildirimlerin:\n${lines}`,
                );
            }
        }

        if (hasTaskIntent) {
            const openTaskCount = snapshot.assignedOpenTasks.length;
            if (openTaskCount === 0) {
                sections.push(
                    `Şu anda üstünde açık görev görünmüyor. Tamamlanan görev sayın ${snapshot.completedTaskCount}.`,
                );
            } else {
                const taskLines = snapshot.assignedOpenTasks
                    .slice(0, 5)
                    .map((task) => {
                        const due = task.dueDate ? `, teslim ${task.dueDate.toLocaleDateString('tr-TR')}` : '';
                        return `- ${task.title} (${task.projectName}, ${task.status}, ${task.priority}${due})`;
                    })
                    .join('\n');
                sections.push(
                    `Üstünde ${openTaskCount} açık görev var. Geciken görev sayın ${snapshot.overdueTaskCount}.\n${taskLines}`,
                );
            }
        }

        return `${snapshot.firstName}, ${sections.join('\n\n')}`;
    }

    private buildContextPrompt(snapshot: WorkspaceSnapshot): string {
        const openTasks = snapshot.assignedOpenTasks
            .slice(0, 8)
            .map((task) => {
                const due = task.dueDate ? task.dueDate.toLocaleDateString('tr-TR') : 'tarih yok';
                return `${task.title} | proje: ${task.projectName} | durum: ${task.status} | öncelik: ${task.priority} | teslim: ${due}`;
            })
            .join('\n');

        const notifications = snapshot.latestNotifications
            .map((item) => `${item.title} | ${item.message}`)
            .join('\n');

        return `
KULLANICI SNAPSHOT:
- Kullanıcı adı: ${snapshot.firstName}
- Aktif proje sayısı: ${snapshot.projectCount}
- Aktif projeler: ${snapshot.activeProjects.join(', ') || 'yok'}
- Aktif sprintler: ${snapshot.activeSprintNames.join(', ') || 'yok'}
- Açık görev sayısı: ${snapshot.assignedOpenTasks.length}
- Tamamlanan görev sayısı: ${snapshot.completedTaskCount}
- Geciken görev sayısı: ${snapshot.overdueTaskCount}
- Okunmamış bildirim sayısı: ${snapshot.unreadNotificationCount}

AÇIK GÖREVLER:
${openTasks || 'yok'}

SON BİLDİRİMLER:
${notifications || 'yok'}
`.trim();
    }

    async chat(userId: string, message: string): Promise<string> {
        const snapshot = await this.getWorkspaceSnapshot(userId);
        const directResponse = this.buildDirectResponse(message, snapshot);

        if (directResponse) {
            return directResponse;
        }

        const client = this.getClient();

        const completion = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'system', content: this.buildContextPrompt(snapshot) },
                { role: 'user', content: message },
            ],
            max_tokens: 700,
            temperature: 0.3,
        });

        const reply = completion.choices[0]?.message?.content;

        if (!reply) {
            throw new AppError('OpenAI yanıt döndürmedi', 502, 'BAD_GATEWAY');
        }

        return reply;
    }
}

export const chatService = new ChatService();
