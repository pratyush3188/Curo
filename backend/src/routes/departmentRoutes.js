import { Router } from 'express';
import {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
} from '../controllers/departmentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// Public / general listing
router.get('/', listDepartments);
router.get('/:id', getDepartmentById);

// Protected management routes
router.post(
  '/',
  authenticate,
  requireRole('hospital_owner', 'hospital_admin', 'super_admin'),
  createDepartment
);

router.put(
  '/:id',
  authenticate,
  requireRole('hospital_owner', 'hospital_admin', 'manager', 'super_admin'),
  updateDepartment
);

export default router;
