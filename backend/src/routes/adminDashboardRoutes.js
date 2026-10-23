import { Router } from 'express';
import { getDashboardStats, getAnalytics } from '../controllers/adminDashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/dashboard', authenticate, requireRole('super_admin'), getDashboardStats);
router.get('/analytics', authenticate, requireRole('super_admin'), getAnalytics);

export default router;
