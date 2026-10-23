import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import {
  createManager,
  getAdminStats,
  getManagers,
  createDoctor,
  getDepartmentStats,
  getDepartmentPatients,
  getDepartmentDoctors,
  getDoctorPatients,
  resolvePatient,
  getDoctorStats,
  getAlerts,
  acknowledgeAlert,
  admitPatient,
} from '../controllers/hospitalController.js';

const router = Router();

// Protect all hospital routes with authentication
router.use(authenticate);

// ================= OWNER & ADMIN ROUTES =================
router.post(
  ['/owner/create-manager', '/admin/create-manager'],
  requireRole('hospital_owner', 'hospital_admin'),
  createManager
);

router.get(
  ['/owner/stats', '/admin/stats'],
  requireRole('hospital_owner', 'hospital_admin'),
  getAdminStats
);

router.get(
  ['/owner/managers', '/admin/managers'],
  requireRole('hospital_owner', 'hospital_admin'),
  getManagers
);

// ================= MANAGER ROUTES =================
router.post(
  '/manager/create-doctor',
  requireRole('manager'),
  createDoctor
);

router.get(
  '/manager/department-stats',
  requireRole('manager'),
  getDepartmentStats
);

router.get(
  '/manager/patients',
  requireRole('manager'),
  getDepartmentPatients
);

router.get(
  '/manager/doctors',
  requireRole('manager'),
  getDepartmentDoctors
);

// ================= DOCTOR ROUTES =================
router.get(
  '/doctor/patients',
  requireRole('doctor'),
  getDoctorPatients
);

router.put(
  '/doctor/patient/:id/resolve',
  requireRole('doctor', 'hospital_owner', 'hospital_admin'),
  resolvePatient
);

router.get(
  '/doctor/stats',
  requireRole('doctor'),
  getDoctorStats
);

// ================= ALERTS ROUTES =================
router.get(
  '/alerts',
  requireRole('hospital_owner', 'hospital_admin', 'manager', 'doctor'),
  getAlerts
);

router.put(
  '/alerts/:id/acknowledge',
  requireRole('hospital_owner', 'hospital_admin', 'manager', 'doctor'),
  acknowledgeAlert
);

// ================= ADMISSION & ML TRIAGE ROUTE =================
router.post(
  '/patients/admit',
  requireRole('hospital_owner', 'hospital_admin', 'manager', 'doctor'),
  admitPatient
);

export default router;
