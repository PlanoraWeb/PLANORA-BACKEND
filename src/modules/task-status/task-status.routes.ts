import { Router } from 'express';
import { taskStatusController } from './task-status.controller';
import { asyncHandler, authenticate, validate } from '../../shared/middlewares';
import { createTaskStatusSchema, updateTaskStatusSchema } from './task-status.validation';

const router = Router();

router.use(authenticate as any);

// Proje bazlı kolon işlemleri
router.post('/project/:projectId', validate({ body: createTaskStatusSchema }), asyncHandler(taskStatusController.create as any));
router.get('/project/:projectId', asyncHandler(taskStatusController.getAllByProject as any));

// Tekil kolon işlemleri
router.put('/:id', validate({ body: updateTaskStatusSchema }), asyncHandler(taskStatusController.update as any));
router.delete('/:id', asyncHandler(taskStatusController.delete as any));

export { router as taskStatusRoutes };
