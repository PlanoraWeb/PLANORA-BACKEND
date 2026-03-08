import { Router } from 'express';
import { projectController } from './project.controller';
import { asyncHandler, authenticate, validate } from '../../shared/middlewares';
import { createProjectSchema, updateProjectSchema, addMemberSchema } from './project.validation';

const router = Router();

router.use(authenticate as any);

router.post('/', validate({ body: createProjectSchema }), asyncHandler(projectController.create as any));
router.get('/', asyncHandler(projectController.getAll as any));
router.get('/:id', asyncHandler(projectController.getById as any));
router.put('/:id', validate({ body: updateProjectSchema }), asyncHandler(projectController.update as any));
router.delete('/:id', asyncHandler(projectController.delete as any));

// Üye yönetimi
router.post('/:id/members', validate({ body: addMemberSchema }), asyncHandler(projectController.addMember as any));
router.delete('/:id/members/:userId', asyncHandler(projectController.removeMember as any));

export { router as projectRoutes };
