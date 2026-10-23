import { Router } from 'express';
import {
  getApplications,
  getApplicationById,
  markUnderReview,
  approveApplication,
  rejectApplication,
  requestMoreInformation,
} from '../controllers/applicationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import {
  approveApplicationSchema,
  rejectApplicationSchema,
  requestInfoSchema,
} from '../validators/adminValidators.js';

const router = Router();

router.get('/', authenticate, requireRole('super_admin'), getApplications);
router.get('/:id', authenticate, requireRole('super_admin'), getApplicationById);
router.patch('/:id/review', authenticate, requireRole('super_admin'), markUnderReview);
router.patch('/:id/approve', authenticate, requireRole('super_admin'), validate(approveApplicationSchema), approveApplication);
router.patch('/:id/reject', authenticate, requireRole('super_admin'), validate(rejectApplicationSchema), rejectApplication);
router.patch('/:id/request-info', authenticate, requireRole('super_admin'), validate(requestInfoSchema), requestMoreInformation);

export default router;
