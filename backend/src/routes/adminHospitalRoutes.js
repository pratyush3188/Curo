import { Router } from 'express';
import {
  getAdminHospitals,
  getAdminHospitalById,
  createAdminHospital,
  updateAdminHospital,
  updateHospitalAccountStatus,
} from '../controllers/adminHospitalController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', authenticate, requireRole('super_admin'), getAdminHospitals);
router.get('/:id', authenticate, requireRole('super_admin'), getAdminHospitalById);
router.post('/', authenticate, requireRole('super_admin'), createAdminHospital);
router.patch('/:id', authenticate, requireRole('super_admin'), updateAdminHospital);
router.patch('/:id/status', authenticate, requireRole('super_admin'), updateHospitalAccountStatus);

export default router;
