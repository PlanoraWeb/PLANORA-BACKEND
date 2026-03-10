import { env } from './shared/config/env';
import app from './app';

app.listen(env.PORT, () => {
    console.log(`🚀 Planora API is running on http://localhost:${env.PORT}`);
    console.log(`📌 Environment: ${env.NODE_ENV}`);
});
