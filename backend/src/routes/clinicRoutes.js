import { Router } from 'express';
import {
  getClinics,
  getClinicById,
  createClinic,
  updateClinic,
  updateClinicAccountStatus,
} from '../controllers/clinicController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import {
  createClinicSchema,
  updateClinicSchema,
  facilityStatusSchema,
} from '../validators/adminValidators.js';

const router = Router();

router.get('/', authenticate, requireRole('super_admin'), getClinics);
router.get('/:id', authenticate, requireRole('super_admin'), getClinicById);
router.post('/', authenticate, requireRole('super_admin'), validate(createClinicSchema), createClinic);
router.patch('/:id', authenticate, requireRole('super_admin'), validate(updateClinicSchema), updateClinic);
router.patch('/:id/status', authenticate, requireRole('super_admin'), validate(facilityStatusSchema), updateClinicAccountStatus);

export default router;
