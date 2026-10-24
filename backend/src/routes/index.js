import { Router } from 'express';
import authRoutes from './authRoutes.js';
import adminDashboardRoutes from './adminDashboardRoutes.js';
import hospitalRoutes from './hospitalRoutes.js';
import adminHospitalRoutes from './adminHospitalRoutes.js';
import adminClinicRoutes from './adminClinicRoutes.js';
import clinicRoutes from './clinicRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import invitationRoutes from './invitationRoutes.js';
import userManagementRoutes from './userManagementRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import settingsRoutes from './settingsRoutes.js';

import reportRoutes from './reportRoutes.js';
import institutionRoutes from './institutionRoutes.js';
import consentRoutes from './consentRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import userRoutes from './userRoutes.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { admitPatient } from '../controllers/hospitalController.js';

const router = Router();

// Working health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'CURO Healthcare Platform API', timestamp: new Date() });
});

// Authentication & Session Routes
router.use('/auth', authRoutes);

// Super Admin Operational Portal Routes (Scoped under /admin)
router.use('/admin', adminDashboardRoutes);
router.use('/admin/hospitals', adminHospitalRoutes);
router.use('/admin/clinics', adminClinicRoutes);
router.use('/admin/applications', applicationRoutes);
router.use('/admin/invitations', invitationRoutes);
router.use('/admin/users', userManagementRoutes);
router.use('/admin/audit-logs', auditLogRoutes);
router.use('/admin/settings', settingsRoutes);

// Private Clinic Operational Routes
router.use('/clinic', clinicRoutes);
router.use('/clinics', clinicRoutes);

// Direct Aliases for Standard REST compatibility
router.use('/hospital', hospitalRoutes);
router.use('/applications', applicationRoutes);
router.use('/invitations', invitationRoutes);
router.use('/users', userRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingsRoutes);
router.use('/departments', departmentRoutes);

// Digital Consent Management
router.use('/consent', consentRoutes);
router.use('/consents', consentRoutes);

// Medical Report Analysis, Comparison & Diet Plans (Ported from medsimplify + Groq AI)
router.use('/reports', reportRoutes);

// User Portal: Clinics, Hospitals, Appointments & Prescriptions
router.use('/', institutionRoutes);

// Direct alias for patient admission: /api/patients/admit and /api/v1/patients/admit
router.post(
  '/patients/admit',
  authenticate,
  requireRole('hospital_owner', 'hospital_admin', 'manager', 'doctor'),
  admitPatient
);

export default router;
