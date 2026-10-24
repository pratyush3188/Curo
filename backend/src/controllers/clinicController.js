import mongoose from 'mongoose';
import { Clinic } from '../models/Clinic.js';
import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { Consultation } from '../models/Consultation.js';
import { Communication } from '../models/Communication.js';
import { Application } from '../models/Application.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';
import {
  INITIAL_CLINICS,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENT_REQUESTS,
  INITIAL_CONSULTATIONS,
  INITIAL_COMMUNICATIONS,
} from '../config/seedData.js';

/* =====================================================================
   SECTION 0: PUBLIC CLINIC REGISTRATION (User/Clinic Onboarding)
===================================================================== */

/**
 * @desc    Public registration for Clinics (creates clinic + optional manager account)
 * @route   POST /api/clinics/register
 * @access  Public
 */
export const registerClinicPublic = asyncHandler(async (req, res) => {
  const {
    name,
    category = 'Multi-Specialty Polyclinic',
    registrationNumber = '',
    email,
    phone,
    city = 'Mumbai',
    state = 'Maharashtra',
    address = 'Healthcare Street',
    consultationRooms = 3,
    specialties = ['General Medicine', 'Pediatrics'],
    consultationFee = 500,
    representativeName,
    representativeEmail,
    representativePhone,
    representativeDesignation = 'Managing Director',
    password,
  } = req.body;

  if (!name || !email || !phone) {
    throw new ApiError(400, 'Clinic name, email, and phone number are required.');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const regId = `CLN-${Math.floor(100000 + Math.random() * 900000)}`;
  const clinicId = `cln-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15)}-${Date.now().toString().slice(-4)}`;

  const defaultServices = [
    {
      id: 'srv-gen',
      name: 'General OPD Consultation',
      durationMinutes: 30,
      consultationFee: Number(consultationFee) || 500,
      currency: 'INR',
      supportedModes: ['in-person', 'video'],
      description: 'Comprehensive general health outpatient consultation with physician.',
    },
    {
      id: 'srv-diag',
      name: 'Diagnostic Health Check & Vitals Review',
      durationMinutes: 20,
      consultationFee: 300,
      currency: 'INR',
      supportedModes: ['in-person'],
      description: 'Blood pressure, glucose screen, and basic biomarker screening.',
    },
  ];

  const defaultWeeklyHours = [
    { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
    { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '15:00' },
    { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '13:00' },
  ];

  let clinic = null;
  if (mongoose.connection.readyState === 1) {
    clinic = await Clinic.create({
      regId,
      clinicId,
      name,
      category,
      registrationNumber,
      email: normalizedEmail,
      phone,
      city,
      state,
      address,
      consultationRooms: Number(consultationRooms) || 3,
      specialties: Array.isArray(specialties) && specialties.length > 0 ? specialties : ['General Medicine'],
      specialtiesCount: Array.isArray(specialties) ? specialties.length : 1,
      services: defaultServices,
      weeklyHours: defaultWeeklyHours,
      authorizedRepresentative: {
        name: representativeName || 'Clinic Superintendent',
        designation: representativeDesignation,
        email: representativeEmail || normalizedEmail,
        phone: representativePhone || phone,
      },
      verificationStatus: 'pending',
      accountStatus: 'pending_activation',
      timeline: [
        {
          date: new Date(),
          event: `Clinic application submitted for ${name}. Queued for Super Admin verification.`,
          actor: representativeName || 'Applicant',
        },
      ],
    });

    // Create Application queue entry for Super Admin
    await Application.create({
      facilityType: 'clinic',
      facilityId: clinic._id,
      facilityModel: 'Clinic',
      facilityName: clinic.name,
      regId: clinic.regId,
      city: clinic.city,
      state: clinic.state,
      status: 'pending',
      submittedInformation: {
        category: clinic.category,
        registrationNumber,
        email: clinic.email,
        phone: clinic.phone,
        consultationRooms: clinic.consultationRooms,
        representativeName: representativeName || 'Clinic Representative',
        representativeEmail: representativeEmail || normalizedEmail,
        representativePhone: representativePhone || phone,
        specialties: clinic.specialties,
      },
      timeline: [
        {
          date: new Date(),
          event: `Clinic application submitted for ${clinic.name}. Awaiting Super Admin review.`,
          actor: representativeName || 'Applicant',
        },
      ],
    });

    if (password) {
      await User.create({
        name: representativeName || name,
        email: normalizedEmail,
        password,
        role: 'clinic',
        associatedFacilityType: 'clinic',
        associatedFacilityId: clinic._id.toString(),
        facilityName: clinic.name,
        accountStatus: 'pending_activation',
        phone: phone || '',
      });
    }
  } else {
    clinic = {
      _id: `cln_${Date.now()}`,
      regId,
      clinicId,
      name,
      category,
      email: normalizedEmail,
      phone,
      city,
      state,
      address,
      services: defaultServices,
      weeklyHours: defaultWeeklyHours,
      verificationStatus: 'pending',
      accountStatus: 'pending_activation',
    };
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for registering your clinic! Your application has been submitted to the CURO Central Health Administration. We will review your credentials and reply shortly on your registered email.',
    clinic,
    status: 'pending',
  });
});

/* =====================================================================
   SECTION 1: SUPER ADMIN CLINIC GOVERNANCE CONTROLLERS (from shikshit)
   Mounted at: /api/v1/admin/clinics
===================================================================== */

/**
 * @desc    Get all clinics with filtering, search, sorting, and pagination
 * @route   GET /api/v1/admin/clinics
 * @access  Private (Super Admin)
 */
export const getClinics = asyncHandler(async (req, res) => {
  const {
    search,
    verificationStatus,
    accountStatus,
    state,
    sortBy = 'newest',
    page = 1,
    limit = 50,
  } = req.query;

  const query = {};

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { regId: { $regex: s, $options: 'i' } },
      { category: { $regex: s, $options: 'i' } },
      { city: { $regex: s, $options: 'i' } },
      { state: { $regex: s, $options: 'i' } },
    ];
  }

  if (verificationStatus && verificationStatus !== 'all') {
    query.verificationStatus = verificationStatus;
  }

  if (accountStatus && accountStatus !== 'all') {
    query.accountStatus = accountStatus;
  }

  if (state && state !== 'all') {
    query.state = state;
  }

  let sortOptions = { createdAt: -1 };
  if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
  if (sortBy === 'name') sortOptions = { name: 1 };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [clinics, total] = await Promise.all([
    Clinic.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    Clinic.countDocuments(query),
  ]);

  const formatted = clinics.map((c) => ({
    ...c,
    id: c._id.toString(),
  }));

  res.status(200).json({
    success: true,
    count: formatted.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: formatted,
  });
});

/**
 * @desc    Get a single clinic by ID for Super Admin inspection
 * @route   GET /api/v1/admin/clinics/:id
 * @access  Private (Super Admin)
 */
export const getAdminClinicById = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.id);
  if (!clinic) {
    throw new ApiError(404, `Clinic not found with ID ${req.params.id}`);
  }

  res.status(200).json({
    success: true,
    data: clinic,
  });
});

/**
 * @desc    Create a new clinic registration application
 * @route   POST /api/v1/admin/clinics
 * @access  Private (Super Admin / Public Registration)
 */
export const createClinic = asyncHandler(async (req, res) => {
  const regId = (req.body.regId || req.body.clinicId || `CLN-${Date.now()}`).toUpperCase().trim();
  const existing = await Clinic.findOne({ $or: [{ regId }, { clinicId: req.body.clinicId }] });
  if (existing) {
    throw new ApiError(409, `A clinic is already registered with reference ID "${regId}".`);
  }

  const clinic = await Clinic.create({
    ...req.body,
    regId,
    clinicId: req.body.clinicId || regId.toLowerCase(),
    timeline: [
      {
        date: new Date(),
        event: 'Clinic application created and submitted for clinical compliance review.',
        actor: req.user?.name || 'Applicant',
      },
    ],
  });

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'CLINIC_APPLICATION_SUBMITTED',
    targetType: 'Private Clinic',
    targetId: clinic._id,
    targetName: clinic.name,
    outcome: 'info',
    details: `Application created for ${clinic.name} with ID ${clinic.regId}.`,
  });

  res.status(201).json({
    success: true,
    data: clinic,
  });
});

/**
 * @desc    Update permitted clinic details
 * @route   PATCH /api/v1/admin/clinics/:id
 * @access  Private (Super Admin)
 */
export const updateClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.id);
  if (!clinic) {
    throw new ApiError(404, `Clinic not found with ID ${req.params.id}`);
  }

  const permittedFields = [
    'name',
    'category',
    'city',
    'state',
    'address',
    'email',
    'phone',
    'specialtiesCount',
    'specialties',
    'consultationRooms',
    'authorizedRepresentative',
    'reviewNotes',
  ];

  permittedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      clinic[field] = req.body[field];
    }
  });

  clinic.timeline.unshift({
    date: new Date(),
    event: `Clinic details updated by ${req.user.name}.`,
    actor: req.user.name,
  });

  await clinic.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'CLINIC_UPDATED',
    targetType: 'Private Clinic',
    targetId: clinic._id,
    targetName: clinic.name,
    outcome: 'info',
    details: `Updated registry details for clinic: ${clinic.name}.`,
  });

  res.status(200).json({
    success: true,
    data: clinic,
  });
});

/**
 * @desc    Suspend or reactivate clinic account access
 * @route   PATCH /api/v1/admin/clinics/:id/status
 * @access  Private (Super Admin)
 */
export const updateClinicAccountStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const clinic = await Clinic.findById(req.params.id);
  if (!clinic) {
    throw new ApiError(404, `Clinic not found with ID ${req.params.id}`);
  }

  const oldStatus = clinic.accountStatus;
  clinic.accountStatus = status;

  const eventText =
    status === 'suspended'
      ? `Clinic account suspended by Super Admin (${req.user.name}). ${reason ? `Reason: ${reason}` : ''}`
      : `Clinic account access reactivated by Super Admin (${req.user.name}).`;

  clinic.timeline.unshift({
    date: new Date(),
    event: eventText,
    actor: req.user.name,
  });

  await clinic.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: status === 'suspended' ? 'FACILITY_SUSPENDED' : 'FACILITY_REACTIVATED',
    targetType: 'Private Clinic',
    targetId: clinic._id,
    targetName: clinic.name,
    outcome: status === 'suspended' ? 'warning' : 'success',
    details: `Account state transitioned from '${oldStatus}' to '${status}'. ${reason ? `Reason: ${reason}` : ''}`,
  });

  res.status(200).json({
    success: true,
    data: clinic,
  });
});

/* =====================================================================
   SECTION 2: PRIVATE CLINIC OPERATIONAL CONTROLLERS (from main)
   Mounted at: /api/v1/clinics
===================================================================== */

// --- Flexible Clinic Lookup Helper (Resolves by MongoDB _id, clinicId slug, or regId) ---
export const findClinicFlexible = async (idOrKey) => {
  if (!idOrKey) return null;
  let clinic = null;
  if (mongoose.Types.ObjectId.isValid(idOrKey)) {
    try {
      clinic = await Clinic.findById(idOrKey);
    } catch {
      // ignore
    }
  }
  if (!clinic) {
    clinic = await Clinic.findOne({
      $or: [
        { clinicId: idOrKey },
        { clinicId: String(idOrKey).toLowerCase() },
        { regId: String(idOrKey).toUpperCase() },
        { regId: idOrKey },
        { name: new RegExp(`^${idOrKey}$`, 'i') },
      ],
    });
  }
  return clinic;
};

// --- Clinic Profile & Services ---
export const getAllClinics = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find();
  res.status(200).json(clinics.map((c) => (c.toJSON ? c.toJSON() : c)));
});

export const getClinicById = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const clinic = await findClinicFlexible(clinicId);
  if (!clinic) {
    throw new ApiError(404, `Clinic ${clinicId} not found`);
  }
  res.status(200).json(clinic.toJSON ? clinic.toJSON() : clinic);
});

export const updateClinicProfile = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const updates = req.body;

  let clinic = await findClinicFlexible(clinicId);
  if (!clinic) {
    throw new ApiError(404, `Clinic ${clinicId} not found`);
  }

  const allowedFields = [
    'name',
    'tagline',
    'logo',
    'email',
    'phone',
    'address',
    'description',
    'registrationNumber',
    'services',
    'weeklyHours',
    'specialClosures',
    'cancellationPolicy',
    'defaultAppointmentDurationMinutes',
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      clinic[field] = updates[field];
    }
  });

  await clinic.save();
  res.status(200).json(clinic.toJSON ? clinic.toJSON() : clinic);
});

export const addOrUpdateService = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const service = req.body;

  if (!service.id || !service.name) {
    throw new ApiError(400, 'Service id and name are required');
  }

  const clinic = await findClinicFlexible(clinicId);
  if (!clinic) {
    throw new ApiError(404, `Clinic ${clinicId} not found`);
  }

  const sIndex = clinic.services.findIndex((s) => s.id === service.id);
  if (sIndex >= 0) {
    clinic.services[sIndex] = service;
  } else {
    clinic.services.push(service);
  }

  await clinic.save();
  res.status(200).json(clinic.toJSON ? clinic.toJSON() : clinic);
});

export const removeService = asyncHandler(async (req, res) => {
  const { clinicId, serviceId } = req.params;
  const clinic = await findClinicFlexible(clinicId);
  if (!clinic) {
    throw new ApiError(404, `Clinic ${clinicId} not found`);
  }

  clinic.services = clinic.services.filter((s) => s.id !== serviceId);
  await clinic.save();
  res.status(200).json(clinic.toJSON ? clinic.toJSON() : clinic);
});

// --- Doctors ---
export const getDoctors = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const clinic = await findClinicFlexible(clinicId);
  const ids = clinic ? [clinic.clinicId, clinic.regId, clinic._id?.toString()].filter(Boolean) : [clinicId];
  let doctors = await Doctor.find({ clinicId: { $in: ids } });

  // Auto-seed default doctors if clinic has none yet
  if (doctors.length === 0 && clinic) {
    const canonicalId = clinic.clinicId || clinic._id.toString();
    const defaultDoctors = [
      {
        clinicId: canonicalId,
        doctorId: `doc-${Date.now().toString().slice(-4)}-1`,
        fullName: 'Dr. Aarav Mehta',
        specialization: clinic.specialties?.[0] || 'General Medicine & Family Health',
        qualifications: 'MBBS, MD (Internal Medicine)',
        consultationFee: clinic.services?.[0]?.consultationFee || 500,
        experienceYears: 12,
        email: `aarav.${(clinic.name || 'clinic').replace(/\s+/g, '').toLowerCase()}@curo.care`,
        phone: clinic.phone || '+91 98200 12345',
        isActive: true,
        weeklySchedule: [
          { day: 'Monday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Tuesday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Wednesday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Thursday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Friday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Saturday', isWorking: true, shifts: [{ start: '09:00', end: '14:00' }] },
        ],
      },
      {
        clinicId: canonicalId,
        doctorId: `doc-${Date.now().toString().slice(-4)}-2`,
        fullName: 'Dr. Sunita Rao',
        specialization: clinic.specialties?.[1] || 'Pediatrics & Child Wellness',
        qualifications: 'MBBS, DNB (Pediatrics)',
        consultationFee: (clinic.services?.[0]?.consultationFee || 500) + 150,
        experienceYears: 9,
        email: `sunita.${(clinic.name || 'clinic').replace(/\s+/g, '').toLowerCase()}@curo.care`,
        phone: clinic.phone || '+91 98200 54321',
        isActive: true,
        weeklySchedule: [
          { day: 'Monday', isWorking: true, shifts: [{ start: '10:00', end: '14:00' }] },
          { day: 'Tuesday', isWorking: true, shifts: [{ start: '10:00', end: '14:00' }] },
          { day: 'Thursday', isWorking: true, shifts: [{ start: '10:00', end: '14:00' }] },
          { day: 'Saturday', isWorking: true, shifts: [{ start: '10:00', end: '15:00' }] },
        ],
      },
    ];
    try {
      await Doctor.insertMany(defaultDoctors);
      doctors = await Doctor.find({ clinicId: { $in: ids } });
    } catch {
      // ignore
    }
  }

  res.status(200).json(doctors.map((d) => (d.toJSON ? d.toJSON() : d)));
});

export const getDoctorById = asyncHandler(async (req, res) => {
  const { clinicId, doctorId } = req.params;
  const doctor = await Doctor.findOne({ clinicId, doctorId });
  if (!doctor) {
    throw new ApiError(404, `Doctor ${doctorId} not found in this clinic`);
  }
  res.status(200).json(doctor.toJSON());
});

export const saveDoctor = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const doctorData = req.body;

  if (!doctorData.fullName) {
    throw new ApiError(400, 'Doctor full name is required');
  }

  const doctorId = doctorData.id || doctorData.doctorId || `doc-${Date.now().toString().slice(-6)}`;

  let doctor = await Doctor.findOne({ clinicId, doctorId });
  if (doctor) {
    Object.assign(doctor, doctorData, { clinicId, doctorId });
    await doctor.save();
  } else {
    doctor = await Doctor.create({
      ...doctorData,
      doctorId,
      clinicId,
    });
  }

  res.status(200).json(doctor.toJSON());
});

export const toggleDoctorActive = asyncHandler(async (req, res) => {
  const { clinicId, doctorId } = req.params;
  const doctor = await Doctor.findOne({ clinicId, doctorId });
  if (!doctor) {
    throw new ApiError(404, `Doctor ${doctorId} not found in this clinic`);
  }

  doctor.isActive = !doctor.isActive;
  await doctor.save();
  res.status(200).json(doctor.toJSON());
});

export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { clinicId, doctorId } = req.params;
  const { targetDate, durationMinutes } = req.query;

  if (!targetDate) {
    throw new ApiError(400, 'targetDate query parameter is required');
  }

  const clinic = await Clinic.findOne({ clinicId });
  const doctor = await Doctor.findOne({ clinicId, doctorId });
  if (!clinic || !doctor) {
    return res.status(200).json([]);
  }

  const target = new Date(targetDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[target.getUTCDay()];

  const isClosure = clinic.specialClosures?.some((sc) => sc.date === targetDate);
  if (isClosure) return res.status(200).json([]);

  const onLeave = doctor.leaves?.some((l) => targetDate >= l.startDate && targetDate <= l.endDate);
  if (onLeave) return res.status(200).json([]);

  const clinicDay = clinic.weeklyHours?.find((d) => d.day === dayName);
  if (!clinicDay || !clinicDay.isOpen) return res.status(200).json([]);

  const docDay = doctor.weeklySchedule?.find((d) => d.day === dayName);
  if (!docDay || !docDay.isWorking) return res.status(200).json([]);

  const existingAppts = await Appointment.find({
    clinicId,
    doctorId,
    status: 'Confirmed',
    'confirmedSlot.date': targetDate,
  });

  const slotDuration = parseInt(durationMinutes || '30', 10);
  const slots = [];

  const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  for (const shift of docDay.shifts || []) {
    let currentMin = timeToMinutes(shift.start);
    const endMin = timeToMinutes(shift.end);

    while (currentMin + slotDuration <= endMin) {
      const slotStart = minutesToTime(currentMin);
      const slotEnd = minutesToTime(currentMin + slotDuration);

      const inDocBreak = (docDay.breaks || []).some(
        (b) => slotStart < b.end && slotEnd > b.start
      );
      const inClinicBreak = (clinicDay.breaks || []).some(
        (b) => slotStart < b.end && slotEnd > b.start
      );

      const isConflict = existingAppts.some(
        (a) =>
          a.confirmedSlot &&
          a.confirmedSlot.startTime < slotEnd &&
          a.confirmedSlot.endTime > slotStart
      );

      let conflictReason;
      if (inDocBreak) conflictReason = 'Doctor break time';
      else if (inClinicBreak) conflictReason = 'Clinic facility break';
      else if (isConflict) conflictReason = 'Booked by existing confirmed patient';

      slots.push({
        time: slotStart,
        available: !inDocBreak && !inClinicBreak && !isConflict,
        conflictReason,
      });

      currentMin += slotDuration;
    }
  }

  res.status(200).json(slots);
});

// --- Appointments & Scheduling ---
export const getAppointments = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const clinic = await findClinicFlexible(clinicId);
  const ids = clinic ? [clinic.clinicId, clinic.regId, clinic._id?.toString()].filter(Boolean) : [clinicId];
  let appointments = await Appointment.find({ clinicId: { $in: ids } }).sort({ createdAt: -1 });

  // Auto-seed default appointments for today if none exist
  if (appointments.length === 0 && clinic) {
    const canonicalId = clinic.clinicId || clinic._id.toString();
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultAppts = [
      {
        appointmentId: `ENQ-${Date.now().toString().slice(-6)}-1`,
        clinicId: canonicalId,
        patientId: 'PAT-001',
        patientName: 'Rohan Sharma',
        patientPhone: '+91 98111 22334',
        patientEmail: 'rohan.sharma@example.com',
        doctorId: 'DOC-001',
        doctorName: 'Dr. Aarav Mehta',
        doctorSpecialization: clinic.specialties?.[0] || 'General Medicine',
        serviceName: clinic.services?.[0]?.name || 'General OPD Consultation',
        status: 'In-Consultation',
        preferredDate: todayStr,
        fee: clinic.services?.[0]?.consultationFee || 500,
        paymentStatus: 'Paid',
        notes: 'Seasonal cough & throat irritation for 3 days',
        confirmedSlot: { date: todayStr, startTime: '10:00', endTime: '10:30' },
      },
      {
        appointmentId: `ENQ-${Date.now().toString().slice(-6)}-2`,
        clinicId: canonicalId,
        patientId: 'PAT-002',
        patientName: 'Pooja Verma',
        patientPhone: '+91 98222 33445',
        patientEmail: 'pooja.verma@example.com',
        doctorId: 'DOC-001',
        doctorName: 'Dr. Aarav Mehta',
        doctorSpecialization: clinic.specialties?.[0] || 'General Medicine',
        serviceName: clinic.services?.[0]?.name || 'General OPD Consultation',
        status: 'Confirmed',
        preferredDate: todayStr,
        fee: clinic.services?.[0]?.consultationFee || 500,
        paymentStatus: 'Pending',
        notes: 'Follow-up blood sugar check & vitals monitoring',
        confirmedSlot: { date: todayStr, startTime: '11:00', endTime: '11:30' },
      },
      {
        appointmentId: `ENQ-${Date.now().toString().slice(-6)}-3`,
        clinicId: canonicalId,
        patientId: 'PAT-003',
        patientName: 'Karan Malhotra',
        patientPhone: '+91 98333 44556',
        patientEmail: 'karan.m@example.com',
        doctorId: 'DOC-002',
        doctorName: 'Dr. Sunita Rao',
        doctorSpecialization: clinic.specialties?.[1] || 'Pediatrics',
        serviceName: 'Diagnostic Health Check',
        status: 'Completed',
        preferredDate: todayStr,
        fee: 300,
        paymentStatus: 'Paid',
        notes: 'Routine health screening & BP check',
        confirmedSlot: { date: todayStr, startTime: '09:30', endTime: '10:00' },
      },
    ];
    try {
      await Appointment.insertMany(defaultAppts);
      appointments = await Appointment.find({ clinicId: { $in: ids } }).sort({ createdAt: -1 });
    } catch (e) {
      console.warn('[Seeding Error]', e.message);
    }
  }

  res.status(200).json(appointments.map((a) => (a.toJSON ? a.toJSON() : a)));
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  const { clinicId, appointmentId } = req.params;
  const appointment = await Appointment.findOne({ clinicId, appointmentId });
  if (!appointment) {
    throw new ApiError(404, `Appointment ${appointmentId} not found`);
  }
  res.status(200).json(appointment.toJSON());
});

export const createAppointmentRequest = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const body = req.body;

  const appointmentId = `ENQ-${Date.now().toString().slice(-6)}`;
  const newAppointment = await Appointment.create({
    ...body,
    appointmentId,
    clinicId,
  });

  res.status(201).json(newAppointment.toJSON());
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const { clinicId, appointmentId } = req.params;
  const updates = req.body;

  const appointment = await Appointment.findOne({ clinicId, appointmentId });
  if (!appointment) {
    throw new ApiError(404, `Appointment ${appointmentId} not found`);
  }

  if (updates.status === 'Confirmed' && updates.confirmedSlot) {
    const doctorId = updates.doctorId || appointment.doctorId;
    const { date, startTime, endTime } = updates.confirmedSlot;

    const conflict = await Appointment.findOne({
      clinicId,
      doctorId,
      appointmentId: { $ne: appointmentId },
      status: 'Confirmed',
      'confirmedSlot.date': date,
      'confirmedSlot.startTime': { $lt: endTime },
      'confirmedSlot.endTime': { $gt: startTime },
    });

    if (conflict) {
      throw new ApiError(
        400,
        `Double-booking prevented: Doctor is already booked during ${startTime} - ${endTime} on ${date}.`
      );
    }
  }

  Object.assign(appointment, updates);
  await appointment.save();

  res.status(200).json(appointment.toJSON());
});

export const confirmSlot = asyncHandler(async (req, res) => {
  const { clinicId, appointmentId } = req.params;
  const { date, startTime, endTime, assignedDoctorId } = req.body;

  const appointment = await Appointment.findOne({ clinicId, appointmentId });
  if (!appointment) {
    throw new ApiError(404, `Appointment ${appointmentId} not found`);
  }

  let doctorName = appointment.doctorName;
  let doctorId = appointment.doctorId;

  if (assignedDoctorId) {
    const doc = await Doctor.findOne({ clinicId, doctorId: assignedDoctorId });
    if (doc) {
      doctorId = doc.doctorId;
      doctorName = doc.fullName;
    }
  }

  const conflict = await Appointment.findOne({
    clinicId,
    doctorId,
    appointmentId: { $ne: appointmentId },
    status: 'Confirmed',
    'confirmedSlot.date': date,
    'confirmedSlot.startTime': { $lt: endTime },
    'confirmedSlot.endTime': { $gt: startTime },
  });

  if (conflict) {
    throw new ApiError(
      400,
      `Double-booking prevented: Doctor is already booked during ${startTime} - ${endTime} on ${date}.`
    );
  }

  appointment.status = 'Confirmed';
  appointment.doctorId = doctorId;
  appointment.doctorName = doctorName;
  appointment.confirmedSlot = { date, startTime, endTime };
  await appointment.save();

  await Communication.create({
    messageId: `MSG-${Date.now().toString().slice(-6)}`,
    clinicId,
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    channel: 'Email',
    type: 'Appointment Confirmation',
    subject: `Confirmed: Consultation with ${doctorName}`,
    body: `Hello ${appointment.patientName}, your appointment on ${date} from ${startTime} to ${endTime} with ${doctorName} has been confirmed.`,
    sentAt: new Date().toISOString(),
    sentBy: 'Clinic Care Coordinator',
    mockDeliveryStatus: 'Mock Dispatched (Demo Only)',
  });

  res.status(200).json(appointment.toJSON());
});

export const proposeAlternative = asyncHandler(async (req, res) => {
  const { clinicId, appointmentId } = req.params;
  const { proposedDate, proposedStartTime, proposedEndTime, note } = req.body;

  const appointment = await Appointment.findOne({ clinicId, appointmentId });
  if (!appointment) {
    throw new ApiError(404, `Appointment ${appointmentId} not found`);
  }

  appointment.status = 'Alternative Proposed';
  appointment.alternativeProposal = {
    proposedDate,
    proposedStartTime,
    proposedEndTime,
    note,
    proposedAt: new Date().toISOString(),
  };
  await appointment.save();

  await Communication.create({
    messageId: `MSG-${Date.now().toString().slice(-6)}`,
    clinicId,
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    channel: 'SMS',
    type: 'Alternative Slot Proposal',
    subject: `Reschedule Option for Appointment #${appointment.appointmentId}`,
    body: `Hi ${appointment.patientName}, your requested slot was occupied. We propose an alternative slot on ${proposedDate} from ${proposedStartTime} to ${proposedEndTime}. Note: ${note}`,
    sentAt: new Date().toISOString(),
    sentBy: 'Clinic Front Desk',
    mockDeliveryStatus: 'Mock Dispatched (Demo Only)',
  });

  res.status(200).json(appointment.toJSON());
});

export const rejectAppointment = asyncHandler(async (req, res) => {
  const { clinicId, appointmentId } = req.params;
  const { rejectionReason } = req.body;

  const appointment = await Appointment.findOne({ clinicId, appointmentId });
  if (!appointment) {
    throw new ApiError(404, `Appointment ${appointmentId} not found`);
  }

  appointment.status = 'Rejected';
  appointment.rejectionReason = rejectionReason;
  await appointment.save();

  await Communication.create({
    messageId: `MSG-${Date.now().toString().slice(-6)}`,
    clinicId,
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    channel: 'Email',
    type: 'Cancellation Notice',
    subject: `Update regarding your consultation request #${appointment.appointmentId}`,
    body: `Dear ${appointment.patientName}, we are unable to fulfill your appointment request at this time. Reason: ${rejectionReason}`,
    sentAt: new Date().toISOString(),
    sentBy: 'Clinic Care Coordinator',
    mockDeliveryStatus: 'Mock Dispatched (Demo Only)',
  });

  res.status(200).json(appointment.toJSON());
});

// --- Patients & Medical Records ---
export const getPatients = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const patients = await Patient.find({ clinicId }).sort({ registeredDate: -1 });
  res.status(200).json(patients.map((p) => p.toJSON()));
});

export const getPatientById = asyncHandler(async (req, res) => {
  const { clinicId, patientId } = req.params;
  const patient = await Patient.findOne({ clinicId, patientId });
  if (!patient) {
    throw new ApiError(404, `Patient ${patientId} not found in this clinic`);
  }
  res.status(200).json(patient.toJSON());
});

export const savePatient = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const patientData = req.body;

  const patientId = patientData.id || patientData.patientId || `PAT-${Date.now().toString().slice(-4)}`;

  let patient = await Patient.findOne({ clinicId, patientId });
  if (patient) {
    Object.assign(patient, patientData, { clinicId, patientId });
    await patient.save();
  } else {
    patient = await Patient.create({
      ...patientData,
      patientId,
      clinicId,
    });
  }

  res.status(200).json(patient.toJSON());
});

// --- Consultations & Prescriptions ---
export const getConsultations = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const { patientId } = req.query;

  const query = { clinicId };
  if (patientId) query.patientId = patientId;

  const consultations = await Consultation.find(query).sort({ consultationDate: -1 });
  res.status(200).json(consultations.map((c) => c.toJSON()));
});

export const getConsultationById = asyncHandler(async (req, res) => {
  const { clinicId, consultationId } = req.params;
  const consultation = await Consultation.findOne({ clinicId, consultationId });
  if (!consultation) {
    throw new ApiError(404, `Consultation ${consultationId} not found`);
  }
  res.status(200).json(consultation.toJSON());
});

export const saveConsultation = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const data = req.body;

  const consultationId = data.id || data.consultationId || `CON-${Date.now().toString().slice(-6)}`;

  let consultation = await Consultation.findOne({ clinicId, consultationId });
  if (consultation) {
    Object.assign(consultation, data, { clinicId, consultationId });
    await consultation.save();
  } else {
    consultation = await Consultation.create({
      ...data,
      consultationId,
      clinicId,
    });
  }

  if (consultation.status === 'Finalized' && consultation.followUpRecommendation) {
    await Communication.create({
      messageId: `MSG-${Date.now().toString().slice(-6)}`,
      clinicId,
      patientId: consultation.patientId,
      patientName: consultation.patientName,
      channel: 'Portal Notice',
      type: 'Follow-up Reminder',
      subject: `Care Summary & Follow-up Recommendation from ${consultation.doctorName}`,
      body: `Your consultation with ${consultation.doctorName} has been finalized. Recommended follow-up date: ${consultation.followUpRecommendation.recommendedDate}. Notes: ${consultation.followUpRecommendation.notes}`,
      sentAt: new Date().toISOString(),
      sentBy: consultation.doctorName,
      mockDeliveryStatus: 'Mock Dispatched (Demo Only)',
    });
  }

  res.status(200).json(consultation.toJSON());
});

// --- Communications ---
export const getCommunications = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const messages = await Communication.find({ clinicId }).sort({ sentAt: -1 });
  res.status(200).json(messages.map((m) => m.toJSON()));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const msg = req.body;

  const messageId = `MSG-${Date.now().toString().slice(-6)}`;
  const newMsg = await Communication.create({
    ...msg,
    messageId,
    clinicId,
    sentAt: new Date().toISOString(),
    mockDeliveryStatus: 'Mock Dispatched (Demo Only)',
  });

  res.status(201).json(newMsg.toJSON());
});

// --- Dashboard Metrics ---
export const getDashboardMetrics = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const clinic = await findClinicFlexible(clinicId);
  const ids = clinic ? [clinic.clinicId, clinic.regId, clinic._id?.toString()].filter(Boolean) : [clinicId];

  const appointments = await Appointment.find({ clinicId: { $in: ids } });
  const patients = await Patient.find({ clinicId: { $in: ids } });
  const doctors = await Doctor.find({ clinicId: { $in: ids } });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(
    (a) => a.confirmedSlot?.date === todayStr || a.preferredDate === todayStr
  );

  const completedToday = appointments.filter(
    (a) => a.status === 'Completed' && (a.confirmedSlot?.date === todayStr || a.preferredDate === todayStr)
  );

  const pendingEnquiries = appointments.filter(
    (a) => a.status === 'New' || a.status === 'Pending Review' || a.status === 'Confirmed'
  );

  const cancelledTotal = appointments.filter(
    (a) => a.status === 'Cancelled' || a.status === 'Rejected'
  );

  const collectedRevenue = appointments
    .filter((a) => a.paymentStatus === 'Paid')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const estimatedTotalRevenue = appointments
    .filter((a) => a.status === 'Confirmed' || a.status === 'Completed' || a.status === 'In-Consultation')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const todayEstimatedRevenue = todayAppointments
    .filter((a) => a.status === 'Confirmed' || a.status === 'Completed' || a.status === 'In-Consultation')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const todayCollectedRevenue = todayAppointments
    .filter((a) => a.paymentStatus === 'Paid')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const patientCounts = {};
  appointments.forEach((a) => {
    patientCounts[a.patientId] = (patientCounts[a.patientId] || 0) + 1;
  });

  const returningPatientsCount = Object.values(patientCounts).filter((c) => c > 1).length;
  const newPatientsCount = Math.max(0, patients.length - returningPatientsCount);

  const activeDoctors = doctors.filter((d) => d.isActive).length;

  const recent7Days = [
    { date: 'Oct 18', count: 3, revenue: 480 },
    { date: 'Oct 19', count: 5, revenue: 760 },
    { date: 'Oct 20', count: 4, revenue: 620 },
    { date: 'Oct 21', count: 6, revenue: 940 },
    { date: 'Oct 22', count: 7, revenue: 1100 },
    { date: 'Oct 23', count: 5, revenue: 780 },
    { date: 'Oct 24 (Today)', count: todayAppointments.length, revenue: todayEstimatedRevenue },
  ];

  res.status(200).json({
    todayAppointmentsCount: todayAppointments.length,
    completedTodayCount: completedToday.length,
    pendingEnquiriesCount: pendingEnquiries.length,
    cancelledCount: cancelledTotal.length,
    totalPatientsCount: patients.length,
    newPatientsCount,
    returningPatientsCount,
    activeDoctorsCount: activeDoctors,
    totalDoctorsCount: doctors.length,
    todayEstimatedRevenue,
    todayCollectedRevenue,
    allTimeEstimatedRevenue: estimatedTotalRevenue,
    allTimeCollectedRevenue: collectedRevenue,
    recent7Days,
  });
});

// --- Reset Demo Data Endpoint ---
export const resetAllData = asyncHandler(async (req, res) => {
  await Promise.all([
    Clinic.deleteMany({}),
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    Consultation.deleteMany({}),
    Communication.deleteMany({}),
  ]);

  await Clinic.insertMany(INITIAL_CLINICS);
  await Doctor.insertMany(INITIAL_DOCTORS);
  await Patient.insertMany(INITIAL_PATIENTS);
  await Appointment.insertMany(INITIAL_APPOINTMENT_REQUESTS);
  await Consultation.insertMany(INITIAL_CONSULTATIONS);
  await Communication.insertMany(INITIAL_COMMUNICATIONS);

  res.status(200).json({ success: true, message: 'Private clinic demo data reset successfully' });
});
