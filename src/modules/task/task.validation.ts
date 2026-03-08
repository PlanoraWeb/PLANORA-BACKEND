import { z } from 'zod';

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Görev başlığı zorunludur'),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    type: z.enum(['BUG', 'TASK', 'STORY']).default('TASK'),
    statusId: z.string().uuid('Geçerli bir durum ID giriniz'),
    assigneeId: z.string().uuid('Geçerli bir kullanıcı ID giriniz').optional(),
    dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    type: z.enum(['BUG', 'TASK', 'STORY']).optional(),
    statusId: z.string().uuid().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
