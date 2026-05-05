import { env } from './shared/config/env';
import app from './app';
import prisma from './shared/utils/prisma';
import cron from 'node-cron';

// ─── Pre-warm: DB bağlantısını başlangıçta aç ───────────────────
prisma.$connect()
    .then(() => console.log('✅ Prisma DB bağlantısı hazır'))
    .catch((err: unknown) => console.error('❌ Prisma DB bağlantı hatası:', err));

app.listen(env.PORT, () => {
    console.log(`🚀 Planora API is running on http://localhost:${env.PORT}`);
    console.log(`📌 Environment: ${env.NODE_ENV}`);

    // ─── Self-ping keep-alive (sadece production) ────────────────
    if (env.NODE_ENV === 'production' && env.SELF_URL) {
        cron.schedule('*/14 * * * *', async () => {
            try {
                await fetch(`${env.SELF_URL}/api/ping`);
                console.log('🏓 Self-ping başarılı');
            } catch (err) {
                console.error('🏓 Self-ping hatası:', err);
            }
        });
        console.log('🏓 Self-ping cron aktif (her 14 dk)');
    }
});
