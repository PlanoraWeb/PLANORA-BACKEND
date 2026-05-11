import { z } from 'zod';

export const createTaskStatusSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Kolon adı zorunludur').max(50, 'Kolon adı 50 karakteri geçemez'),
        position: z.number().int().min(0, 'Pozisyon 0 veya daha büyük olmalıdır'),
        isDefault: z.boolean().optional().default(false),
    }),
});

export const updateTaskStatusSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Kolon adı boş olamaz').max(50).optional(),
        position: z.number().int().min(0).optional(),
        isDefault: z.boolean().optional(),
    }),
});

export type CreateTaskStatusInput = z.infer<typeof createTaskStatusSchema>['body'];
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>['body'];