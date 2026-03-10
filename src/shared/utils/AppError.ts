export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, code?: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || AppError.defaultCode(statusCode);
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }

    private static defaultCode(statusCode: number): string {
        const map: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            500: 'INTERNAL_ERROR',
        };
        return map[statusCode] || 'UNKNOWN_ERROR';
    }
}
