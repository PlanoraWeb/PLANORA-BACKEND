import { z } from 'zod';

export const createProjectSchema = z.object({
    projectName: z.string().min(2, 'Proje adı en az 2 karakter olmalıdır'),
    description: z.string().optional(),
});

export const updateProjectSchema = z.object({
    projectName: z.string().min(2, 'Proje adı en az 2 karakter olmalıdır').optional(),
    description: z.string().optional(),
});

export const addMemberSchema = z.object({
    userId: z.string().uuid('Geçerli bir kullanıcı ID giriniz'),
    roleId: z.string().uuid('Geçerli bir rol ID giriniz'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
