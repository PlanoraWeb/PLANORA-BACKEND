import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// ─── Module Routes ────────────────────────────────────────────────
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { projectRoutes } from './modules/project/project.routes';
import { taskRoutes } from './modules/task/task.routes';
import { taskStatusRoutes } from './modules/task-status/task-status.routes';

// ─── Shared Middlewares ───────────────────────────────────────────
import { errorHandler } from './shared/middlewares/errorHandler';

const app = express();

// ─── Global Middlewares ───────────────────────────────────────────
app.use(helmet());

// CORS Yapılandırması: Sadece belirlenen domainlere izin verir
const allowedOrigins = [
    'http://localhost:5173',
    'https://planora-frontend-rho.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS Error: Origin not allowed'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'OK',
            message: 'Planora API is running',
        },
        meta: { timestamp: new Date().toISOString() },
    });
});

// ─── API Routes v1 (Modüler Monolitik) ───────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/task-statuses', taskStatusRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'İstenen kaynak bulunamadı',
        },
    });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

export default app;