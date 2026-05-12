import { Router } from 'express';
import { projectController } from './project.controller';
import { asyncHandler, authenticate, validate } from '../../shared/middlewares';
import { createProjectSchema, updateProjectSchema, addProjectMemberSchema } from './project.validation';
import { authorizeProjectMember } from '../../shared/middlewares/authorize';

const router = Router();

router.use(authenticate as any);

// Herkes proje oluşturabilir ve listeleyebilir
router.post('/', validate(createProjectSchema), asyncHandler(projectController.create as any));
router.get('/', asyncHandler(projectController.getAll as any));

// Proje detayı — sadece üyeler
router.get('/:id', authorizeProjectMember() as any, asyncHandler(projectController.getById as any));
router.get('/:id/insights', authorizeProjectMember() as any, asyncHandler(projectController.getInsights as any));

// Güncelleme — hem PATCH (frontend) hem PUT (geriye dönük uyumluluk)
router.patch('/:id', authorizeProjectMember() as any, validate(updateProjectSchema), asyncHandler(projectController.update as any));
router.put('/:id', authorizeProjectMember() as any, validate(updateProjectSchema), asyncHandler(projectController.update as any));

// Silme — proje üyesi yeterli
router.delete('/:id', authorizeProjectMember() as any, asyncHandler(projectController.delete as any));

// Üye yönetimi — System Admin kısıtı kaldırıldı, proje üyesi yeterli (Team.jsx 403 almıyacak)
router.post('/:id/members', authorizeProjectMember() as any, validate(addProjectMemberSchema), asyncHandler(projectController.addMember as any));
router.delete('/:id/members/:userId', authorizeProjectMember() as any, asyncHandler(projectController.removeMember as any));

export { router as projectRoutes };
