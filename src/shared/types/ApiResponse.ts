/**
 * Tüm API yanıtları için standart yanıt formatı.
 */
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
}

/**
 * Sayfalama (pagination) bilgisi taşıyan yanıt formatı.
 */
export interface PaginatedResponse<T = any> extends ApiResponse<T> {
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
