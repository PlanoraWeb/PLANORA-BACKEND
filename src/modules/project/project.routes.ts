import { Router } from 'express';
import { projectController } from './project.controller';
import { asyncHandler, authenticate, validate } from '../../shared/middlewares';
import { createProjectSchema, updateProjectSchema, addProjectMemberSchema } from './project.validation';
import { authorize, authorizeProjectMember } from '../../shared/middlewares/authorize';

const router = Router();

router.use(authenticate as any);

// Herkes proje oluşturabilir ve listeleyebilir
router.post('/', validate(createProjectSchema), asyncHandler(projectController.create as any));
router.get('/', asyncHandler(projectController.getAll as any));

// Proje detayı — sadece üyeler
router.get('/:id', authorizeProjectMember() as any, asyncHandler(projectController.getById as any));

// Güncelleme ve silme — sadece System Admin veya proje sahibi
router.put('/:id', authorizeProjectMember() as any, validate(updateProjectSchema), asyncHandler(projectController.update as any));
router.delete('/:id', authorize('System Admin') as any, asyncHandler(projectController.delete as any));

// Üye yönetimi — sadece System Admin
router.post('/:id/members', authorize('System Admin') as any, validate(addProjectMemberSchema), asyncHandler(projectController.addMember as any));
router.delete('/:id/members/:userId', authorize('System Admin') as any, asyncHandler(projectController.removeMember as any));

export { router as projectRoutes };