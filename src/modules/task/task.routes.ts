import { Router } from 'express';
import { taskController } from './task.controller';
import { asyncHandler, authenticate, validate } from '../../shared/middlewares';
import { createTaskSchema, updateTaskSchema } from './task.validation';

const router = Router();

router.use(authenticate as any);

// Proje bazlı görevler
router.post('/project/:projectId', validate({ body: createTaskSchema }), asyncHandler(taskController.create as any));
router.get('/project/:projectId', asyncHandler(taskController.getAllByProject as any));

// Tekil görev işlemleri
router.get('/:id', asyncHandler(taskController.getById as any));
router.put('/:id', validate({ body: updateTaskSchema }), asyncHandler(taskController.update as any));
router.delete('/:id', asyncHandler(taskController.delete as any));

// Durum ve atama değişikliği
router.patch('/:id/status', asyncHandler(taskController.changeStatus as any));
router.patch('/:id/assign', asyncHandler(taskController.assignUser as any));

export { router as taskRoutes };
