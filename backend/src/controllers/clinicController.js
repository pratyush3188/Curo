import { Clinic } from '../models/Clinic.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { Appointment } from '../models/Appointment.js';
import { Consultation } from '../models/Consultation.js';
import { Communication } from '../models/Communication.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  INITIAL_CLINICS,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENT_REQUESTS,
  INITIAL_CONSULTATIONS,
  INITIAL_COMMUNICATIONS,
} from '../config/seedData.js';

// --- Clinic Profile & Services ---
export const getAllClinics = asyncHandler(async (req, res) => {
  const clinics = await Clinic.find();
  res.status(200).json(clinics.map((c) => c.toJSON()));
});

export const getClinicById = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const clinic = await Clinic.findOne({ clinicId });
  if (!clinic) {
    throw new ApiError(404, `Clinic ${clinicId} not found`);
  }
  res.status(200).json(clinic.toJSON());
});

export const updateClinicProfile = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const updates = req.body;

  let clinic = await Clinic.findOne({ clinicId });
  if (!clinic) {
    throw new ApiError(404, `Clinic ${clinicId} not found`);
  }

  // Update allowed fields
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
  res.status(200).json(clinic.toJSON());
});

export const addOrUpdateService = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const service = req.body;

  if (!service.id || !service.name) {
    throw new ApiError(400, 'Service id and name are required');
  }

  const clinic = await Clinic.findOne({ clinicId });
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
  res.status(200).json(clinic.toJSON());
});

export const removeService = asyncHandler(async (req, res) => {
  const { clinicId, serviceId } = req.params;
  const clinic = await Clinic.findOne({ clinicId });
  if (!clinic) {
    throw new ApiError(404, `Clinic ${clinicId} not found`);
  }

  clinic.services = clinic.services.filter((s) => s.id !== serviceId);
  await clinic.save();
  res.status(200).json(clinic.toJSON());
});

// --- Doctors ---
export const getDoctors = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const doctors = await Doctor.find({ clinicId });
  res.status(200).json(doctors.map((d) => d.toJSON()));
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

  // Check special closures
  const isClosure = clinic.specialClosures?.some((sc) => sc.date === targetDate);
  if (isClosure) return res.status(200).json([]);

  // Check doctor leave
  const onLeave = doctor.leaves?.some((l) => targetDate >= l.startDate && targetDate <= l.endDate);
  if (onLeave) return res.status(200).json([]);

  const clinicDay = clinic.weeklyHours?.find((d) => d.day === dayName);
  if (!clinicDay || !clinicDay.isOpen) return res.status(200).json([]);

  const docDay = doctor.weeklySchedule?.find((d) => d.day === dayName);
  if (!docDay || !docDay.isWorking) return res.status(200).json([]);

  // Confirmed appointments for overlap checks
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
  const appointments = await Appointment.find({ clinicId }).sort({ createdAt: -1 });
  res.status(200).json(appointments.map((a) => a.toJSON()));
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

  // Double booking prevention check if confirming slot
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

  // Check double-booking
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

  // Send communication notice
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

  // If finalized and recommendation present, send notification
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

  const appointments = await Appointment.find({ clinicId });
  const patients = await Patient.find({ clinicId });
  const doctors = await Doctor.find({ clinicId });

  const todayStr = '2026-10-24';
  const todayAppointments = appointments.filter(
    (a) => a.confirmedSlot?.date === todayStr || a.preferredDate === todayStr
  );

  const completedToday = appointments.filter(
    (a) => a.status === 'Completed' && (a.confirmedSlot?.date === todayStr || a.preferredDate === todayStr)
  );

  const pendingEnquiries = appointments.filter(
    (a) => a.status === 'New' || a.status === 'Pending Review'
  );

  const cancelledTotal = appointments.filter(
    (a) => a.status === 'Cancelled' || a.status === 'Rejected'
  );

  const collectedRevenue = appointments
    .filter((a) => a.paymentStatus === 'Paid')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const estimatedTotalRevenue = appointments
    .filter((a) => a.status === 'Confirmed' || a.status === 'Completed')
    .reduce((sum, a) => sum + (a.fee || 0), 0);

  const todayEstimatedRevenue = todayAppointments
    .filter((a) => a.status === 'Confirmed' || a.status === 'Completed')
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
