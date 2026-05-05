import { z } from 'zod';

// ─── Sprint Oluşturma ────────────────────────────────────────────

export const createSprintSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Sprint adı zorunludur'),
        goal: z.string().optional(),
        startDate: z.string().datetime({ message: 'Geçerli bir başlangıç tarihi giriniz' }).optional(),
        endDate: z.string().datetime({ message: 'Geçerli bir bitiş tarihi giriniz' }).optional(),
    }),
});

export type CreateSprintDto = z.infer<typeof createSprintSchema>['body'];

// ─── Sprint Güncelleme ───────────────────────────────────────────

export const updateSprintSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Sprint adı boş olamaz').optional(),
        goal: z.string().nullable().optional(),
        status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
        startDate: z.string().datetime({ message: 'Geçerli bir başlangıç tarihi giriniz' }).nullable().optional(),
        endDate: z.string().datetime({ message: 'Geçerli bir bitiş tarihi giriniz' }).nullable().optional(),
    }),
});

export type UpdateSprintDto = z.infer<typeof updateSprintSchema>['body'];

// ─── Sprint'e Task Atama / Çıkarma ──────────────────────────────

export const sprintTasksSchema = z.object({
    body: z.object({
        taskIds: z.array(z.string().uuid('Geçerli bir görev ID giriniz')).min(1, 'En az bir görev seçilmelidir'),
    }),
});

export type SprintTasksDto = z.infer<typeof sprintTasksSchema>['body'];

// ─── Sprint Filtreleme (Query) ───────────────────────────────────

export const sprintFilterSchema = z.object({
    query: z.object({
        status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(50).default(10),
    }),
});

export type SprintFilterDto = z.infer<typeof sprintFilterSchema>['query'];
