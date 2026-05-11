import { Router } from 'express';
import { sprintController } from './sprint.controller';
import { asyncHandler, authenticate, validate } from '../../shared/middlewares';
import { createSprintSchema, updateSprintSchema, sprintTasksSchema } from './sprint.validation';

const router = Router();

router.use(authenticate as any);

// Proje bazlı sprint işlemleri
router.post('/project/:projectId', validate(createSprintSchema), asyncHandler(sprintController.create as any));
router.get('/project/:projectId', asyncHandler(sprintController.getAllByProject as any));
router.get('/project/:projectId/active', asyncHandler(sprintController.getActive as any));
router.get('/project/:projectId/velocity', asyncHandler(sprintController.getVelocity as any));

// Tekil sprint işlemleri
router.get('/:id', asyncHandler(sprintController.getById as any));
router.put('/:id', validate(updateSprintSchema), asyncHandler(sprintController.update as any));
router.patch('/:id', validate(updateSprintSchema), asyncHandler(sprintController.update as any));
router.delete('/:id', asyncHandler(sprintController.delete as any));

// Sprint task yönetimi
router.post('/:id/tasks', validate(sprintTasksSchema), asyncHandler(sprintController.addTasks as any));
router.delete('/:id/tasks', validate(sprintTasksSchema), asyncHandler(sprintController.removeTasks as any));

// Sprint burndown chart
router.get('/:id/burndown', asyncHandler(sprintController.getBurndown as any));

export { router as sprintRoutes };
