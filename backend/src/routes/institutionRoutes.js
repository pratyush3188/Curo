import { Router } from 'express';
import multer from 'multer';
import {
  getClinics,
  getClinicById,
  getHospitals,
  getHospitalById,
  bookAppointment,
  getMyAppointments,
} from '../controllers/institutionController.js';
import {
  updateAppointmentStatus,
  cancelAppointment,
} from '../controllers/appointmentController.js';
import {
  analyzePrescription,
  getMyPrescriptions,
} from '../controllers/prescriptionController.js';
import { authenticate } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

// Publicly browse clinics & hospitals (with locality filtering)
router.get('/clinics', getClinics);
router.get('/clinics/:id', authenticate, getClinicById);

router.get('/hospitals', getHospitals);
router.get('/hospitals/:id', authenticate, getHospitalById);

// Appointment booking & history (requires auth)
router.post('/appointments', authenticate, bookAppointment);
router.get('/appointments/my', authenticate, getMyAppointments);
router.patch('/appointments/:id/status', authenticate, updateAppointmentStatus);
router.post('/appointments/:id/cancel', authenticate, cancelAppointment);

// Prescription analysis & safety check (requires auth)
router.post('/prescriptions/analyze', authenticate, upload.single('file'), analyzePrescription);
router.get('/prescriptions/my', authenticate, getMyPrescriptions);

export default router;

