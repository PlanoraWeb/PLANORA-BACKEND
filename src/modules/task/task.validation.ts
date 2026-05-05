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
        dueDate: z.string().datetime({ message: 'Geçerli bir tarih giriniz' }).optional(),
    }),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>['body'];

// ─── Task Güncelleme ────────────────────────────────────────────

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Görev başlığı boş olamaz').optional(),
        description: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        type: z.enum(['BUG', 'TASK', 'STORY']).optional(),
        statusId: z.string().uuid('Geçerli bir durum ID giriniz').optional(),
        assigneeId: z.string().uuid('Geçerli bir kullanıcı ID giriniz').nullable().optional(),
        dueDate: z.string().datetime({ message: 'Geçerli bir tarih giriniz' }).nullable().optional(),
    }),
});

export type UpdateTaskDto = z.infer<typeof updateTaskSchema>['body'];

// ─── Task Durum Güncelleme (Kanban D&D) ─────────────────────────
// statusId kullanılır — sabit enum değil, dinamik TaskStatus kaydına referans verir

export const updateTaskStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid('Geçersiz görev kimliği'),
    }),
    body: z.object({
        statusId: z.string().uuid('Geçerli bir durum ID giriniz'),
        newOrder: z.number().int().nonnegative('Sıralama değeri negatif olamaz'),
    }),
});

export type UpdateTaskStatusDto = z.infer<typeof updateTaskStatusSchema>['body'];

// ─── Task Filtreleme (Query Params) ─────────────────────────────

export const taskFilterSchema = z.object({
    query: z.object({
        // Filtreleme
        status: z.string().uuid('Geçerli bir durum ID giriniz').optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        type: z.enum(['BUG', 'TASK', 'STORY']).optional(),
        assigneeId: z.string().uuid('Geçerli bir kullanıcı ID giriniz').optional(),
        reporterId: z.string().uuid('Geçerli bir kullanıcı ID giriniz').optional(),

        // Sprint filtresi (backlog için)
        sprintId: z.string().uuid('Geçerli bir sprint ID giriniz').optional(),
        backlog: z.enum(['true', 'false']).optional(),

        // Arama (title + description)
        search: z.string().optional(),

        // Tarih aralığı
        dueDateFrom: z.string().datetime({ message: 'Geçerli bir başlangıç tarihi giriniz' }).optional(),
        dueDateTo: z.string().datetime({ message: 'Geçerli bir bitiş tarihi giriniz' }).optional(),

        // Sayfalama
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),

        // Sıralama
        sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title', 'order']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
});

export type TaskFilterDto = z.infer<typeof taskFilterSchema>['query'];