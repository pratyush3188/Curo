import mongoose from 'mongoose';
import { Clinic } from '../models/Clinic.js';
import { Hospital } from '../models/Hospital.js';
import { Appointment } from '../models/Appointment.js';
import { Report } from '../models/Report.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const inMemoryAppointments = [];

// Seed initial clinics & hospitals if database is empty
export const seedInstitutionsIfEmpty = async () => {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const clinicCount = await Clinic.countDocuments();
  if (clinicCount === 0) {
    await Clinic.create([
      {
        name: 'Apollo Family Health Clinic',
        licenseNumber: 'CLI-MH-2023-01',
        locality: 'Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Shop 4, Greenfield Heights, Link Road, Andheri West, Mumbai',
        phone: '+91 22 2630 1122',
        email: 'andheri@apolloclinic.com',
        rating: 4.8,
        imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
        overview: 'Premier community family clinic specializing in general medicine, child wellness, diabetic care, and preventive health screenings.',
        doctors: [
          {
            name: 'Dr. Ananya Sharma',
            specialization: 'General Physician & Diabetologist',
            qualification: 'MBBS, MD (Medicine)',
            experienceYears: 12,
            consultationFee: 600,
            availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            availableSlots: ['09:30 AM', '11:00 AM', '04:30 PM', '06:00 PM'],
            rating: 4.9,
          },
          {
            name: 'Dr. Rahul Mehta',
            specialization: 'Pediatrician & Child Health',
            qualification: 'MBBS, DCH, DNB (Pediatrics)',
            experienceYears: 8,
            consultationFee: 700,
            availableDays: ['Mon', 'Wed', 'Fri'],
            availableSlots: ['10:00 AM', '12:00 PM', '05:00 PM'],
            rating: 4.8,
          },
        ],
      },
      {
        name: 'MaxCare Multispecialty Clinic',
        licenseNumber: 'CLI-MH-2023-02',
        locality: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: '2nd Floor, Ocean Pearl Plaza, Hill Road, Bandra West, Mumbai',
        phone: '+91 22 2640 4455',
        email: 'bandra@maxcareclinic.com',
        rating: 4.7,
        imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
        overview: 'Specialized diagnostic consultations, cardiology screening, and ENT care clinic with advanced digital ECG and ultrasound.',
        doctors: [
          {
            name: 'Dr. Suresh Nair',
            specialization: 'Consultant Cardiologist',
            qualification: 'MBBS, MD, DM (Cardiology)',
            experienceYears: 15,
            consultationFee: 1000,
            availableDays: ['Tue', 'Thu', 'Sat'],
            availableSlots: ['11:00 AM', '02:00 PM', '06:00 PM'],
            rating: 4.9,
          },
          {
            name: 'Dr. Priya Desai',
            specialization: 'Dermatologist & Cosmetologist',
            qualification: 'MBBS, MD (Dermatology)',
            experienceYears: 9,
            consultationFee: 800,
            availableDays: ['Mon', 'Tue', 'Wed', 'Fri'],
            availableSlots: ['03:00 PM', '04:30 PM', '06:30 PM'],
            rating: 4.7,
          },
        ],
      },
      {
        name: 'Sunrise Wellness Clinic',
        licenseNumber: 'CLI-KA-2023-03',
        locality: 'Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        address: '100ft Road, 12th Main, Indiranagar, Bangalore',
        phone: '+91 80 4122 8899',
        email: 'indiranagar@sunrisehealth.org',
        rating: 4.9,
        imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
        overview: 'Holistic patient wellness and integrated health checkups with pathology test labs and daily doctor consultations.',
        doctors: [
          {
            name: 'Dr. Sneha Roy',
            specialization: 'Consultant Obstetrician & Gynecologist',
            qualification: 'MBBS, MS (OBGYN)',
            experienceYears: 11,
            consultationFee: 750,
            availableDays: ['Mon', 'Wed', 'Thu', 'Sat'],
            availableSlots: ['10:00 AM', '11:30 AM', '04:00 PM'],
            rating: 4.9,
          },
        ],
      },
    ]);
  }

  const hospitalCount = await Hospital.countDocuments();
  if (hospitalCount === 0) {
    await Hospital.create([
      {
        name: 'Lilavati Hospital & Research Centre',
        registrationNumber: 'HOSP-MH-1029',
        locality: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050',
        phone: '+91 22 2675 1000',
        emergencyHelpline: '+91 22 2656 8000',
        email: 'info@lilavatihospital.com',
        rating: 4.9,
        totalBeds: 450,
        icuBedsAvailable: 24,
        imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1200',
        overview: 'State-of-the-art premier tertiary multi-specialty healthcare research centre. Equipped with modern cardiac catheterization labs, organ transplant units, oncology, and 24/7 trauma emergency care.',
        departments: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Gastroenterology', 'Pediatrics'],
        doctors: [
          {
            name: 'Dr. Vikram Malhotra',
            specialization: 'Chief Cardiac Surgeon',
            department: 'Cardiology',
            qualification: 'MBBS, MS, MCh (CTVS)',
            experienceYears: 20,
            consultationFee: 1500,
            availableDays: ['Mon', 'Wed', 'Fri'],
            availableSlots: ['10:00 AM', '12:00 PM', '03:00 PM'],
            rating: 4.9,
          },
          {
            name: 'Dr. Radhika Iyer',
            specialization: 'Senior Neurosurgeon',
            department: 'Neurology',
            qualification: 'MBBS, DNB (Neurosurgery)',
            experienceYears: 16,
            consultationFee: 1400,
            availableDays: ['Tue', 'Thu', 'Sat'],
            availableSlots: ['11:00 AM', '02:00 PM', '05:00 PM'],
            rating: 4.8,
          },
        ],
      },
      {
        name: 'Kokilaben Dhirubhai Ambani Hospital',
        registrationNumber: 'HOSP-MH-2044',
        locality: 'Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: 'Rao Saheb, Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai',
        phone: '+91 22 4269 6969',
        emergencyHelpline: '+91 22 4269 9999',
        email: 'contact@kdah.com',
        rating: 4.9,
        totalBeds: 750,
        icuBedsAvailable: 38,
        imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
        overview: 'JCI and NABH accredited quaternary care hospital recognized globally for advanced robotics surgery, cancer institute, and emergency neuro-interventions.',
        departments: ['Robotic Surgery', 'Cardiology', 'Cancer Care', 'Nephrology', 'Critical Care'],
        doctors: [
          {
            name: 'Dr. Sameer Kulkarni',
            specialization: 'Consultant Medical Oncologist',
            department: 'Cancer Care',
            qualification: 'MD, DM (Medical Oncology)',
            experienceYears: 14,
            consultationFee: 1200,
            availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
            availableSlots: ['09:30 AM', '11:30 AM', '02:30 PM'],
            rating: 4.9,
          },
          {
            name: 'Dr. Neha Kapoor',
            specialization: 'Joint Replacement & Orthopedic Surgeon',
            department: 'Orthopedics',
            qualification: 'MBBS, MS (Ortho), Fellow Arthroplasty (UK)',
            experienceYears: 13,
            consultationFee: 1100,
            availableDays: ['Wed', 'Fri', 'Sat'],
            availableSlots: ['10:00 AM', '01:00 PM', '04:00 PM'],
            rating: 4.8,
          },
        ],
      },
      {
        name: 'Manipal Hospital',
        registrationNumber: 'HOSP-KA-3011',
        locality: 'Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        address: '98, HAL Old Airport Road, Kodihalli, Bangalore, Karnataka',
        phone: '+91 80 2502 4444',
        emergencyHelpline: '105222',
        email: 'info@manipalhospitals.com',
        rating: 4.8,
        totalBeds: 600,
        icuBedsAvailable: 29,
        imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1200',
        overview: 'Leading super-specialty hospital in South India offering organ transplantations, advanced maternal fetal medicine, and trauma center.',
        departments: ['Cardiology', 'Pediatrics', 'Transplant Centre', 'Gastroenterology'],
        doctors: [
          {
            name: 'Dr. Arjun Varma',
            specialization: 'Senior Gastroenterologist & Hepatologist',
            department: 'Gastroenterology',
            qualification: 'MBBS, MD, DM (Gastro)',
            experienceYears: 17,
            consultationFee: 1100,
            availableDays: ['Mon', 'Wed', 'Fri'],
            availableSlots: ['10:00 AM', '12:00 PM', '03:30 PM'],
            rating: 4.9,
          },
        ],
      },
    ]);
  }
  } catch (err) {
    console.warn('[Seed Institutions Error]', err.message);
  }
};

/**
 * @desc Get all clinics with locality filtering
 * @route GET /api/v1/clinics
 */
export const getClinics = asyncHandler(async (req, res) => {
  await seedInstitutionsIfEmpty();
  const { locality, city } = req.query;
  const filter = {};
  if (locality && locality !== 'all') {
    filter.locality = { $regex: new RegExp(locality, 'i') };
  }
  if (city && city !== 'all') {
    filter.city = { $regex: new RegExp(city, 'i') };
  }

  const clinics = await Clinic.find(filter).sort({ rating: -1 });
  const allLocalities = await Clinic.distinct('locality');

  res.status(200).json({
    success: true,
    count: clinics.length,
    localities: allLocalities,
    clinics,
  });
});

/**
 * @desc Get single clinic details
 * @route GET /api/v1/clinics/:id
 */
export const getClinicById = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.id);
  if (!clinic) {
    throw new ApiError(404, 'Clinic not found');
  }

  // Also fetch user's past appointments at this clinic if authenticated
  let userHistory = [];
  if (req.user) {
    userHistory = await Appointment.find({
      patientId: req.user._id,
      institutionId: clinic._id,
    }).sort({ createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    clinic,
    userHistory,
  });
});

/**
 * @desc Get all hospitals with locality filtering
 * @route GET /api/v1/hospitals
 */
export const getHospitals = asyncHandler(async (req, res) => {
  await seedInstitutionsIfEmpty();
  const { locality, city } = req.query;
  const filter = {};
  if (locality && locality !== 'all') {
    filter.locality = { $regex: new RegExp(locality, 'i') };
  }
  if (city && city !== 'all') {
    filter.city = { $regex: new RegExp(city, 'i') };
  }

  const hospitals = await Hospital.find(filter).sort({ rating: -1 });
  const allLocalities = await Hospital.distinct('locality');

  res.status(200).json({
    success: true,
    count: hospitals.length,
    localities: allLocalities,
    hospitals,
  });
});

/**
 * @desc Get single hospital details with user history & common reports
 * @route GET /api/v1/hospitals/:id
 */
export const getHospitalById = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) {
    throw new ApiError(404, 'Hospital not found');
  }

  let userAppointments = [];
  let userReports = [];

  if (req.user) {
    userAppointments = await Appointment.find({
      patientId: req.user._id,
      institutionId: hospital._id,
    }).sort({ createdAt: -1 });

    userReports = await Report.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    hospital,
    userAppointments,
    userReports,
    totalVisits: userAppointments.length,
  });
});

/**
 * @desc Book Appointment (Online or Offline)
 * @route POST /api/v1/appointments
 */
export const bookAppointment = asyncHandler(async (req, res) => {
  const {
    institutionType,
    institutionId,
    institutionName,
    doctorName,
    doctorSpecialization,
    consultationType,
    appointmentDate,
    timeSlot,
    reasonForVisit,
    notes,
  } = req.body;

  if (!institutionId || !doctorName || !appointmentDate || !timeSlot) {
    throw new ApiError(400, 'Please provide doctor name, date, and appointment slot');
  }

  const patientId = req.user?._id || req.user?.id || 'usr_anonymous';
  const patientName = req.user?.name || 'Patient';
  const patientPhone = req.user?.phone || '+91 9876543210';

  const appointmentData = {
    patientId: String(patientId),
    patientName,
    patientPhone,
    institutionType: institutionType || 'clinic',
    institutionId: String(institutionId),
    clinicId: institutionType === 'clinic' ? String(institutionId) : '',
    hospitalId: institutionType === 'hospital' ? String(institutionId) : '',
    institutionName: institutionName || 'Medical Center',
    doctorName,
    doctorSpecialization: doctorSpecialization || 'Specialist',
    consultationType: consultationType || 'offline',
    consultationMode: consultationType === 'online' ? 'video' : 'in-person',
    appointmentDate,
    preferredDate: appointmentDate,
    timeSlot,
    preferredTimeRange: timeSlot,
    reasonForVisit: reasonForVisit || 'Health checkup',
    notes: notes || '',
    status: 'Confirmed',
  };

  let appointment = null;
  if (mongoose.connection.readyState === 1) {
    appointment = await Appointment.create(appointmentData);
  } else {
    appointment = {
      ...appointmentData,
      _id: `apt_${Date.now()}`,
      id: `apt_${Date.now()}`,
      appointmentId: `APT-${Date.now().toString().slice(-6)}`,
      createdAt: new Date(),
    };
    inMemoryAppointments.unshift(appointment);
  }

  res.status(201).json({
    success: true,
    message: 'Appointment successfully confirmed and scheduled.',
    appointment,
  });
});

/**
 * @desc Get user appointments
 * @route GET /api/v1/appointments/my
 */
export const getMyAppointments = asyncHandler(async (req, res) => {
  const patientId = req.user?._id || req.user?.id;
  let appointments = [];

  if (mongoose.connection.readyState === 1 && patientId) {
    appointments = await Appointment.find({ patientId: String(patientId) }).sort({ createdAt: -1 });
  } else {
    appointments = inMemoryAppointments.filter(
      (a) => String(a.patientId) === String(patientId) || true
    );
  }

  res.status(200).json({
    success: true,
    count: appointments.length,
    appointments,
  });
});
