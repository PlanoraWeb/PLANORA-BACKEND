import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

/**
 * Zod şemasıyla gelen isteği doğrulayan middleware.
 * Schema z.object({ body, query, params }) formatında olmalıdır.
 */
export const validate = (schema: ZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Gönderilen veriler kurallara uymuyor.',
                        details: error.issues.map((e) => ({
                            field: e.path.join('.'),
                            message: e.message,
                        })),
                    },
                });
            }
            return next(error);
        }
    };
};
