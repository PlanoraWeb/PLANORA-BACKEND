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
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: 'Planora API is running',
        timestamp: new Date().toISOString(),
    });
});

// ─── API Routes (Modüler Monolitik) ──────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/task-statuses', taskStatusRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({ status: 'Error', message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

export default app;
