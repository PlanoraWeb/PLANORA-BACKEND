import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { asyncHandler, authenticate } from '../../shared/middlewares';

const router = Router();

router.use(authenticate as any);

router.get('/summary', asyncHandler(dashboardController.getSummary as any));
router.get('/overview', asyncHandler(dashboardController.getOverview as any));
router.get('/analytics', asyncHandler(dashboardController.getAnalytics as any));

export { router as dashboardRoutes };
