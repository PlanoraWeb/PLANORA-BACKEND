import { z } from 'zod';

export const createTaskStatusSchema = z.object({
    name: z.string().min(1, 'Kolon adı zorunludur'),
    position: z.number().int().min(0, 'Pozisyon 0 veya daha büyük olmalıdır'),
});

export const updateTaskStatusSchema = z.object({
    name: z.string().min(1).optional(),
    position: z.number().int().min(0).optional(),
});

export type CreateTaskStatusInput = z.infer<typeof createTaskStatusSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
