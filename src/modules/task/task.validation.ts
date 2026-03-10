import { z } from 'zod';

// ─── Task Oluşturma ─────────────────────────────────────────────

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Görev başlığı zorunludur'),
        description: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
        type: z.enum(['BUG', 'TASK', 'STORY']).default('TASK'),
        statusId: z.string().uuid('Geçerli bir durum ID giriniz'),
        assigneeId: z.string().uuid('Geçerli bir kullanıcı ID giriniz').optional(),
        dueDate: z.string().datetime().optional(),
    }),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>['body'];

// ─── Task Güncelleme ────────────────────────────────────────────

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        type: z.enum(['BUG', 'TASK', 'STORY']).optional(),
        statusId: z.string().uuid().optional(),
        assigneeId: z.string().uuid().nullable().optional(),
        dueDate: z.string().datetime().nullable().optional(),
    }),
});

export type UpdateTaskDto = z.infer<typeof updateTaskSchema>['body'];

// ─── Task Durum Güncelleme (Kanban D&D) ─────────────────────────

export const updateTaskStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Geçersiz görev kimliği.'),
    }),
    body: z.object({
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE'], {
            error: 'Durum yalnızca TODO, IN_PROGRESS veya DONE olabilir.',
        }),
        newOrder: z.number().int().nonnegative('Sıralama değeri negatif olamaz.'),
    }),
});

export type UpdateTaskStatusDto = z.infer<typeof updateTaskStatusSchema>['body'];
