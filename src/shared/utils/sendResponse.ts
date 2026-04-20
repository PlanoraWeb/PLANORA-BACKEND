import { Response } from 'express';

interface ResponseOptions<T> {
    res: Response;
    statusCode?: number;
    message?: string;
    data?: T;
    meta?: Record<string, any>;
}

/**
 * Standart başarılı yanıt helper'ı.
 * Tüm controller'lar bu fonksiyonu kullanarak tutarlı JSON formatı döner.
 */
export const sendResponse = <T>({ res, statusCode = 200, message, data, meta }: ResponseOptions<T>) => {
    const response: Record<string, any> = {
        success: true,
        data: data ?? null,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };

    if (message) {
        response.message = message;
    }

    return res.status(statusCode).json(response);
};
