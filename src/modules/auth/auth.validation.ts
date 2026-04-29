import { z } from 'zod';

// ─── Register ────────────────────────────────────────────────────

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Geçersiz e-posta formatı.'),
        password: z
            .string()
            .min(8, 'Parola en az 8 karakter olmalıdır.')
            .regex(/[A-Z]/, 'Parola en az bir büyük harf içermelidir.')
            .regex(/[0-9]/, 'Parola en az bir rakam içermelidir.'),
        firstName: z.string().min(2, 'İsim en az 2 karakter olmalıdır.').max(50),
        lastName: z.string().min(2, 'Soyisim en az 2 karakter olmalıdır.').max(50),
    }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];

// ─── Login ───────────────────────────────────────────────────────

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Geçersiz e-posta formatı.'),
        password: z.string().min(1, 'Parola alanı boş bırakılamaz.'),
    }),
});

export type LoginDto = z.infer<typeof loginSchema>['body'];
