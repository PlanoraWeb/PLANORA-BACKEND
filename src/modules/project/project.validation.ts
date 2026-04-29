import { z } from 'zod';

// ─── Proje Oluşturma ────────────────────────────────────────────

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(3, 'Proje adı en az 3 karakter olmalıdır.').max(100),
        description: z.string().max(500, 'Açıklama 500 karakteri geçemez.').optional(),
    }),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>['body'];

// ─── Proje Güncelleme ───────────────────────────────────────────

export const updateProjectSchema = z.object({
    body: z.object({
        name: z.string().min(3, 'Proje adı en az 3 karakter olmalıdır.').max(100).optional(),
        description: z.string().max(500, 'Açıklama 500 karakteri geçemez.').optional(),
    }),
});

export type UpdateProjectDto = z.infer<typeof updateProjectSchema>['body'];

// ─── Projeye Üye Ekleme ─────────────────────────────────────────

export const addProjectMemberSchema = z.object({
    params: z.object({
        id: z.string().uuid('Geçersiz proje kimliği.'),
    }),
    body: z.object({
        userId: z.string().uuid('Geçersiz kullanıcı kimliği.'),
        role: z.enum(['PROJECT_ADMIN', 'MEMBER'], {
            error: 'Geçersiz rol tipi. Sadece PROJECT_ADMIN veya MEMBER atanabilir.',
        }),
    }),
});

export type AddProjectMemberDto = z.infer<typeof addProjectMemberSchema>['body'];
