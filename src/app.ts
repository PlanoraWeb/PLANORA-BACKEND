import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// ─── Module Routes ────────────────────────────────────────────────
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/user/user.routes';
import { projectRoutes } from './modules/project/project.routes';
import { taskRoutes } from './modules/task/task.routes';
import { taskStatusRoutes } from './modules/task-status/task-status.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { sprintRoutes } from './modules/sprint/sprint.routes';
import { notificationRoutes } from './modules/notification/notification.routes';
import { chatRoutes } from './modules/chat/chat.routes';

// ─── Shared Middlewares ───────────────────────────────────────────
import { errorHandler } from './shared/middlewares/errorHandler';

const app = express();

// ─── Global Middlewares ───────────────────────────────────────────
app.use(helmet());

// ─── CORS Yapılandırması ──────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'https://planora-frontend-rho.vercel.app',
];

app.use(cors({
    origin: (origin, callback) => {
        // Origin yoksa (Postman, curl, vb.) izin ver
        if (!origin) return callback(null, true);
        // Production origin listesi
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Development: tüm localhost originlerine izin ver
        if (process.env.NODE_ENV !== 'production' && origin.match(/^http:\/\/localhost:\d+$/)) {
            return callback(null, true);
        }
        callback(new Error('CORS Error: Origin not allowed'));
    },
    credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        data: { status: 'OK', message: 'Planora API is running' },
        meta: { timestamp: new Date().toISOString() },
    });
});

// ─── Ping (Keep-alive / Cold Start) ──────────────────────────────
app.get('/api/ping', (_req: Request, res: Response) => {
    res.status(200).send('pong');
});

// ─── API Routes v1 ───────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/task-statuses', taskStatusRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/sprints', sprintRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/chat', chatRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'İstenen kaynak bulunamadı' },
    });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

export default app;