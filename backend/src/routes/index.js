import { Router } from 'express';
import authRoutes from './authRoutes.js';
import adminDashboardRoutes from './adminDashboardRoutes.js';
import hospitalRoutes from './hospitalRoutes.js';
import adminClinicRoutes from './adminClinicRoutes.js';
import clinicRoutes from './clinicRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import invitationRoutes from './invitationRoutes.js';
import userManagementRoutes from './userManagementRoutes.js';
import auditLogRoutes from './auditLogRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = Router();

// Working health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'CURO Healthcare Platform API', timestamp: new Date() });
});

// Authentication & Session Routes
router.use('/auth', authRoutes);

// Super Admin Operational Portal Routes (Scoped under /admin)
router.use('/admin', adminDashboardRoutes);
router.use('/admin/hospitals', hospitalRoutes);
router.use('/admin/clinics', adminClinicRoutes);
router.use('/admin/applications', applicationRoutes);
router.use('/admin/invitations', invitationRoutes);
router.use('/admin/users', userManagementRoutes);
router.use('/admin/audit-logs', auditLogRoutes);
router.use('/admin/settings', settingsRoutes);

// Private Clinic Operational Routes
router.use('/clinics', clinicRoutes);

// Direct Aliases for Standard REST compatibility
router.use('/hospitals', hospitalRoutes);
router.use('/applications', applicationRoutes);
router.use('/invitations', invitationRoutes);
router.use('/users', userManagementRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingsRoutes);

export default router;
