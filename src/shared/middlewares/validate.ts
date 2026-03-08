import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Zod şemasıyla gelen isteği doğrulayan middleware.
 * body, query ve params ayrı ayrı doğrulanabilir.
 */
export const validate = (schema: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            if (schema.query) {
                req.query = schema.query.parse(req.query) as any;
            }
            if (schema.params) {
                req.params = schema.params.parse(req.params) as any;
            }
            next();
        } catch (err: any) {
            const message =
                err.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') ||
                'Validation failed';
            next(new AppError(message, 400));
        }
    };
};
