import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  resetDemoData,
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import { updateSettingsSchema } from '../validators/adminValidators.js';

const router = Router();

router.get('/', authenticate, requireRole('super_admin'), getSettings);
router.put('/', authenticate, requireRole('super_admin'), validate(updateSettingsSchema), updateSettings);
router.post('/reset', authenticate, requireRole('super_admin'), resetDemoData);

export default router;
