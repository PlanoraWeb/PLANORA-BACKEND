import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'Error',
            message: err.message,
        });
    }

    console.error('Unexpected Error:', err);
    return res.status(500).json({
        status: 'Error',
        message: 'Internal Server Error',
    });
};
