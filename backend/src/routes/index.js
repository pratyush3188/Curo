import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

// Working health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth routes (register, login, me, logout)
router.use('/auth', authRoutes);
// router.use('/users', userRouter);
// router.use('/clinics', clinicRouter);
// router.use('/hospitals', hospitalRouter);
// router.use('/departments', departmentRouter);
// router.use('/appointments', appointmentRouter);
// router.use('/reports', reportRouter);
// router.use('/prescriptions', prescriptionRouter);
// router.use('/consents', consentRouter);
// router.use('/audit-logs', auditLogRouter);

export default router;
