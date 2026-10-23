import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUserStatus,
} from '../controllers/userManagementController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { updateUserStatusSchema } from '../validators/adminValidators.js';

const router = Router();

router.get('/', authenticate, requireRole('super_admin'), getUsers);
router.get('/:id', authenticate, requireRole('super_admin'), getUserById);
router.patch('/:id/status', authenticate, requireRole('super_admin'), validate(updateUserStatusSchema), updateUserStatus);

export default router;
