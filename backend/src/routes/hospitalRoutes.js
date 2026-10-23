import { Router } from 'express';
import {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  updateHospitalAccountStatus,
} from '../controllers/hospitalController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validate.js';
import {
  createHospitalSchema,
  updateHospitalSchema,
  facilityStatusSchema,
} from '../validators/adminValidators.js';

const router = Router();

router.get('/', authenticate, requireRole('super_admin'), getHospitals);
router.get('/:id', authenticate, requireRole('super_admin'), getHospitalById);
router.post('/', authenticate, requireRole('super_admin'), validate(createHospitalSchema), createHospital);
router.patch('/:id', authenticate, requireRole('super_admin'), validate(updateHospitalSchema), updateHospital);
router.patch('/:id/status', authenticate, requireRole('super_admin'), validate(facilityStatusSchema), updateHospitalAccountStatus);

export default router;
