import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Prisma 7: pg.Pool üzerinden bağlantı sağlanır.
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
// Prisma 7: Bağlantı URL'si schema.prisma yerine adapter üzerinden verilir.
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

export default prisma;