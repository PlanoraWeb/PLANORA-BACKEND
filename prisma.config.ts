import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    // path.join ve __dirname yerine direkt string yol kullanmak daha hatasızdır
    schema: './prisma/schema.prisma',
    
    datasource: {
        url: process.env.DATABASE_URL,
    },
    
    // directUrl hatası alıyorsan, bu genellikle migration komutları 
    // sırasında .env'den otomatik okunur. Buradan çıkarabiliriz.
    migrations: {
        seed: 'tsx ./prisma/seed.ts',
    },
});