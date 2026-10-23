import { Router } from 'express';
import {
  registerClinicPublic,
  getAllClinics,
  getClinicById,
  updateClinicProfile,
  addOrUpdateService,
  removeService,
  getDoctors,
  getDoctorById,
  saveDoctor,
  toggleDoctorActive,
  getAvailableSlots,
  getAppointments,
  getAppointmentById,
  createAppointmentRequest,
  updateAppointment,
  confirmSlot,
  proposeAlternative,
  rejectAppointment,
  getPatients,
  getPatientById,
  savePatient,
  getConsultations,
  getConsultationById,
  saveConsultation,
  getCommunications,
  sendMessage,
  getDashboardMetrics,
  resetAllData,
} from '../controllers/clinicController.js';

const router = Router();

// Public registration for Clinic
router.post('/register', registerClinicPublic);

// Demo data reset
router.post('/reset-all-data', resetAllData);

// Clinics
router.get('/', getAllClinics);
router.get('/:clinicId', getClinicById);
router.put('/:clinicId', updateClinicProfile);
router.post('/:clinicId/services', addOrUpdateService);
router.delete('/:clinicId/services/:serviceId', removeService);

// Dashboard metrics
router.get('/:clinicId/metrics', getDashboardMetrics);

// Doctors
router.get('/:clinicId/doctors', getDoctors);
router.get('/:clinicId/doctors/:doctorId', getDoctorById);
router.post('/:clinicId/doctors', saveDoctor);
router.patch('/:clinicId/doctors/:doctorId/toggle-active', toggleDoctorActive);
router.get('/:clinicId/doctors/:doctorId/slots', getAvailableSlots);

// Appointments
router.get('/:clinicId/appointments', getAppointments);
router.get('/:clinicId/appointments/:appointmentId', getAppointmentById);
router.post('/:clinicId/appointments', createAppointmentRequest);
router.put('/:clinicId/appointments/:appointmentId', updateAppointment);
router.post('/:clinicId/appointments/:appointmentId/confirm', confirmSlot);
router.post('/:clinicId/appointments/:appointmentId/propose-alternative', proposeAlternative);
router.post('/:clinicId/appointments/:appointmentId/reject', rejectAppointment);

// Patients
router.get('/:clinicId/patients', getPatients);
router.get('/:clinicId/patients/:patientId', getPatientById);
router.post('/:clinicId/patients', savePatient);

// Consultations
router.get('/:clinicId/consultations', getConsultations);
router.get('/:clinicId/consultations/:consultationId', getConsultationById);
router.post('/:clinicId/consultations', saveConsultation);

// Communications
router.get('/:clinicId/communications', getCommunications);
router.post('/:clinicId/communications', sendMessage);

export default router;
