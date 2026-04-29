import { PrismaClient } from '@prisma/client/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

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