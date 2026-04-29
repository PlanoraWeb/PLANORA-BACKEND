//Önce paketi kurman gerekiyor: npm install express-rate-limit
import rateLimit from 'express-rate-limit';

// ─── Login Rate Limiter ───────────────────────────────────────────
// 15 dakika içinde aynı IP'den max 10 login denemesi
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.',
        },
    },
});

// ─── Register Rate Limiter ────────────────────────────────────────
// 1 saat içinde aynı IP'den max 5 kayıt denemesi
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Çok fazla kayıt denemesi. Lütfen 1 saat sonra tekrar deneyin.',
        },
    },
});

// ─── Refresh Token Rate Limiter ───────────────────────────────────
// 15 dakika içinde aynı IP'den max 30 refresh isteği
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Çok fazla token yenileme isteği. Lütfen bekleyin.',
        },
    },
});