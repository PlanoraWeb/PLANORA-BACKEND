import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Prisma 7: pg.Pool üzerinden bağlantı sağlanır.
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seed başlatılıyor...');

    const roles = [
        { name: 'System Admin' },
        { name: 'Project Admin' },
        { name: 'Member' },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
        console.log(`✅ Rol oluşturuldu / güncellendi: ${role.name}`);
    }

    console.log('🎉 Seed tamamlandı!');
}

main()
    .catch((e) => {
        console.error('❌ Seed hatası:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
