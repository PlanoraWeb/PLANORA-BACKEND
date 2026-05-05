import { z } from 'zod';

// ─── Bildirim Filtreleme (Query) ─────────────────────────────────

export const notificationFilterSchema = z.object({
    query: z.object({
        isRead: z.enum(['true', 'false']).optional(),
        type: z.enum([
            'TASK_ASSIGNED', 'TASK_UNASSIGNED', 'TASK_STATUS_CHANGED',
            'TASK_COMMENT', 'TASK_MENTION',
            'SPRINT_STARTED', 'SPRINT_COMPLETED',
            'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_REMOVED',
        ]).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(50).default(20),
    }),
});

export type NotificationFilterDto = z.infer<typeof notificationFilterSchema>['query'];

// ─── Toplu Okundu İşaretle ───────────────────────────────────────

export const markReadSchema = z.object({
    body: z.object({
        ids: z.array(z.string().uuid('Geçerli bir bildirim ID giriniz')).min(1, 'En az bir bildirim seçilmelidir'),
    }),
});

export type MarkReadDto = z.infer<typeof markReadSchema>['body'];
