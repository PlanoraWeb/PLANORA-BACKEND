import { Request } from 'express';

/**
 * Express 5'te req.params değerleri string | string[] olarak dönüyor.
 * Bu yardımcı fonksiyon güvenli bir şekilde string olarak döndürür.
 */
export const getParam = (req: Request, name: string): string => {
    const value = req.params[name];
    if (Array.isArray(value)) {
        return value[0];
    }
    return value as string;
};
