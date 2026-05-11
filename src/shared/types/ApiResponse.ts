/**
 * Standart başarılı API yanıt formatı.
 */
export interface ApiResponse<T = any> {
    success: true;
    data: T;
    meta: {
        timestamp: string;
        [key: string]: any;
    };
}

/**
 * Standart hata API yanıt formatı.
 */
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Array<{ field: string; message: string }>;
    };
}

/**
 * Sayfalama bilgisi taşıyan meta verisi.
 */
export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
