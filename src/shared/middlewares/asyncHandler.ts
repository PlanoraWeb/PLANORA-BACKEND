import { Request, Response, NextFunction } from 'express';

/**
 * Async controller fonksiyonlarını try/catch ile sarmalar.
 * Hataları otomatik olarak Express error handler'a iletir.
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
