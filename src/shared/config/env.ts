import dotenv from 'dotenv';
dotenv.config();

export const env = {
    PORT: Number(process.env.PORT) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    // BE-05: Access token süresi 1 saat, refresh token 7 gün
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '1h',
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
    SELF_URL: process.env.SELF_URL || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};
