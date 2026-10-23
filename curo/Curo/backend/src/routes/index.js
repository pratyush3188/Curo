import { Router } from 'express';
import authRoutes from './authRoutes.js';
import hospitalRoutes from './hospitalRoutes.js';

import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { admitPatient } from '../controllers/hospitalController.js';

const router = Router();

// Working health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Curo Hospital API' });
});

// Auth routes (register, login, me, logout)
router.use('/auth', authRoutes);

// Hospital routes (admin, manager, doctor, alerts)
router.use('/hospital', hospitalRoutes);

// Direct alias for patient admission: /api/patients/admit and /api/v1/patients/admit
router.post(
  '/patients/admit',
  authenticate,
  requireRole('hospital_owner', 'hospital_admin', 'manager', 'doctor'),
  admitPatient
);

export default router;
