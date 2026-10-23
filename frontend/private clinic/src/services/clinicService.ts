import {
  ClinicProfile,
  Doctor,
  PatientRecord,
  AppointmentRequest,
  ConsultationRecord,
  ClinicCommunicationMessage,
  ServiceItem,
  DaySchedule
} from '../types';
import {
  INITIAL_CLINICS,
  INITIAL_DOCTORS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENT_REQUESTS,
  INITIAL_CONSULTATIONS,
  INITIAL_COMMUNICATIONS
} from '../mock/mockData';

const STORAGE_KEYS = {
  CLINICS: 'curo_pc_clinics_v1',
  DOCTORS: 'curo_pc_doctors_v1',
  PATIENTS: 'curo_pc_patients_v1',
  APPOINTMENTS: 'curo_pc_appointments_v1',
  CONSULTATIONS: 'curo_pc_consultations_v1',
  COMMUNICATIONS: 'curo_pc_communications_v1'
};

function loadStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading key ${key} from storage:`, e);
    return fallback;
  }
}

function saveStore<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving key ${key} to storage:`, e);
  }
}

export class ClinicService {
  // Reset demo data
  static resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.CLINICS);
    localStorage.removeItem(STORAGE_KEYS.DOCTORS);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.CONSULTATIONS);
    localStorage.removeItem(STORAGE_KEYS.COMMUNICATIONS);
  }

  // --- Clinic Profile & Services ---
  static getClinicById(clinicId: string): ClinicProfile | null {
    const clinics = loadStore<ClinicProfile[]>(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    return clinics.find((c) => c.id === clinicId) || null;
  }

  static getAllClinics(): ClinicProfile[] {
    return loadStore<ClinicProfile[]>(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
  }

  static updateClinicProfile(clinicId: string, updates: Partial<ClinicProfile>): ClinicProfile {
    const clinics = loadStore<ClinicProfile[]>(STORAGE_KEYS.CLINICS, INITIAL_CLINICS);
    const index = clinics.findIndex((c) => c.id === clinicId);
    if (index === -1) throw new Error(`Clinic ${clinicId} not found`);

    const updated = { ...clinics[index], ...updates, id: clinicId };
    clinics[index] = updated;
    saveStore(STORAGE_KEYS.CLINICS, clinics);
    return updated;
  }

  static addOrUpdateService(clinicId: string, service: ServiceItem): ClinicProfile {
    const clinic = this.getClinicById(clinicId);
    if (!clinic) throw new Error(`Clinic ${clinicId} not found`);

    const sIndex = clinic.services.findIndex((s) => s.id === service.id);
    let updatedServices: ServiceItem[];
    if (sIndex >= 0) {
      updatedServices = clinic.services.map((s) => (s.id === service.id ? service : s));
    } else {
      updatedServices = [...clinic.services, service];
    }
    return this.updateClinicProfile(clinicId, { services: updatedServices });
  }

  static removeService(clinicId: string, serviceId: string): ClinicProfile {
    const clinic = this.getClinicById(clinicId);
    if (!clinic) throw new Error(`Clinic ${clinicId} not found`);
    return this.updateClinicProfile(clinicId, {
      services: clinic.services.filter((s) => s.id !== serviceId)
    });
  }

  // --- Doctors ---
  static getDoctors(clinicId: string): Doctor[] {
    const doctors = loadStore<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    return doctors.filter((doc) => doc.clinicId === clinicId);
  }

  static getDoctorById(clinicId: string, doctorId: string): Doctor | null {
    const doctors = this.getDoctors(clinicId);
    return doctors.find((d) => d.id === doctorId) || null;
  }

  static saveDoctor(clinicId: string, doctor: Doctor): Doctor {
    // strictly enforce tenant isolation
    const allDoctors = loadStore<Doctor[]>(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const doctorToSave = { ...doctor, clinicId };
    const index = allDoctors.findIndex((d) => d.id === doctor.id && d.clinicId === clinicId);

    if (index >= 0) {
      allDoctors[index] = doctorToSave;
    } else {
      allDoctors.push(doctorToSave);
    }
    saveStore(STORAGE_KEYS.DOCTORS, allDoctors);
    return doctorToSave;
  }

  static toggleDoctorActive(clinicId: string, doctorId: string): Doctor | null {
    const doc = this.getDoctorById(clinicId, doctorId);
    if (!doc) return null;
    return this.saveDoctor(clinicId, { ...doc, isActive: !doc.isActive });
  }

  // --- Appointment Slots & Overlap Prevention ---
  static getAvailableSlots(
    clinicId: string,
    doctorId: string,
    targetDate: string,
    durationMinutes: number = 30
  ): { time: string; available: boolean; conflictReason?: string }[] {
    const clinic = this.getClinicById(clinicId);
    const doctor = this.getDoctorById(clinicId, doctorId);
    if (!clinic || !doctor) return [];

    const target = new Date(targetDate);
    const dayNames: DaySchedule['day'][] = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    const dayName = dayNames[target.getDay()];

    // 1. Check clinic special closure
    const isClosure = clinic.specialClosures.some((c) => c.date === targetDate);
    if (isClosure) return [];

    // 2. Check clinic hours for day
    const clinicDay = clinic.weeklyHours.find((h) => h.day === dayName);
    if (!clinicDay || !clinicDay.isOpen) return [];

    // 3. Check doctor schedule for day
    const doctorDay = doctor.weeklySchedule.find((h) => h.day === dayName);
    if (!doctorDay || !doctorDay.isWorking || !doctor.isActive) return [];

    // 4. Check doctor leaves
    const onLeave = doctor.leaves.some(
      (l) => targetDate >= l.startDate && targetDate <= l.endDate
    );
    if (onLeave) return [];

    // 5. Existing confirmed appointments for this doctor on targetDate (strictly within this clinic)
    const existingAppointments = this.getAppointments(clinicId).filter(
      (a) =>
        a.doctorId === doctorId &&
        a.status === 'Confirmed' &&
        a.confirmedSlot?.date === targetDate
    );

    const parseMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const formatMinutes = (total: number) => {
      const h = Math.floor(total / 60)
        .toString()
        .padStart(2, '0');
      const m = (total % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    const clinicOpen = parseMinutes(clinicDay.openTime);
    const clinicClose = parseMinutes(clinicDay.closeTime);

    const slots: { time: string; available: boolean; conflictReason?: string }[] = [];

    // Generate intervals for all doctor shifts on this day
    for (const shift of doctorDay.shifts) {
      const shiftStart = Math.max(clinicOpen, parseMinutes(shift.start));
      const shiftEnd = Math.min(clinicClose, parseMinutes(shift.end));

      for (let time = shiftStart; time + durationMinutes <= shiftEnd; time += durationMinutes) {
        const slotEnd = time + durationMinutes;
        const timeStr = formatMinutes(time);
        const slotEndStr = formatMinutes(slotEnd);

        // Check if overlaps doctor break
        const inDoctorBreak = doctorDay.breaks.some((brk) => {
          const bStart = parseMinutes(brk.start);
          const bEnd = parseMinutes(brk.end);
          return time < bEnd && slotEnd > bStart;
        });

        // Check if overlaps clinic break
        const inClinicBreak = clinicDay.breaks.some((brk) => {
          const bStart = parseMinutes(brk.start);
          const bEnd = parseMinutes(brk.end);
          return time < bEnd && slotEnd > bStart;
        });

        // Check if overlaps existing confirmed booking
        const conflictBooking = existingAppointments.find((a) => {
          if (!a.confirmedSlot) return false;
          const aStart = parseMinutes(a.confirmedSlot.startTime);
          const aEnd = parseMinutes(a.confirmedSlot.endTime);
          return time < aEnd && slotEnd > aStart;
        });

        if (inDoctorBreak || inClinicBreak) {
          slots.push({
            time: `${timeStr} - ${slotEndStr}`,
            available: false,
            conflictReason: 'Doctor/Clinic Break Time'
          });
        } else if (conflictBooking) {
          slots.push({
            time: `${timeStr} - ${slotEndStr}`,
            available: false,
            conflictReason: `Already booked (${conflictBooking.patientName})`
          });
        } else {
          slots.push({
            time: `${timeStr} - ${slotEndStr}`,
            available: true
          });
        }
      }
    }

    return slots;
  }

  // --- Appointment Requests & Bookings ---
  static getAppointments(clinicId: string): AppointmentRequest[] {
    const all = loadStore<AppointmentRequest[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENT_REQUESTS);
    return all.filter((apt) => apt.clinicId === clinicId);
  }

  static getAppointmentById(clinicId: string, appointmentId: string): AppointmentRequest | null {
    const appointments = this.getAppointments(clinicId);
    return appointments.find((a) => a.id === appointmentId) || null;
  }

  static createAppointmentRequest(clinicId: string, req: Omit<AppointmentRequest, 'id' | 'clinicId' | 'createdAt'>): AppointmentRequest {
    const all = loadStore<AppointmentRequest[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENT_REQUESTS);
    const newRequest: AppointmentRequest = {
      ...req,
      id: `ENQ-${Date.now().toString().slice(-6)}`,
      clinicId,
      createdAt: new Date().toISOString()
    };
    all.unshift(newRequest);
    saveStore(STORAGE_KEYS.APPOINTMENTS, all);
    return newRequest;
  }

  static updateAppointment(clinicId: string, appointmentId: string, updates: Partial<AppointmentRequest>): AppointmentRequest {
    const all = loadStore<AppointmentRequest[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENT_REQUESTS);
    const index = all.findIndex((a) => a.id === appointmentId && a.clinicId === clinicId);
    if (index === -1) throw new Error(`Appointment ${appointmentId} not found in this clinic`);

    // Verify slot collision if changing to Confirmed
    if (updates.status === 'Confirmed' && updates.confirmedSlot) {
      const doctorId = updates.doctorId || all[index].doctorId;
      const targetDate = updates.confirmedSlot.date;
      const targetStart = updates.confirmedSlot.startTime;
      const targetEnd = updates.confirmedSlot.endTime;

      const hasConflict = all.some(
        (other) =>
          other.id !== appointmentId &&
          other.clinicId === clinicId &&
          other.doctorId === doctorId &&
          other.status === 'Confirmed' &&
          other.confirmedSlot?.date === targetDate &&
          other.confirmedSlot.startTime < targetEnd &&
          other.confirmedSlot.endTime > targetStart
      );

      if (hasConflict) {
        throw new Error(`Double-booking prevented: Doctor is already booked during ${targetStart} - ${targetEnd} on ${targetDate}.`);
      }
    }

    const updated = { ...all[index], ...updates };
    all[index] = updated;
    saveStore(STORAGE_KEYS.APPOINTMENTS, all);
    return updated;
  }

  static confirmSlot(
    clinicId: string,
    appointmentId: string,
    date: string,
    startTime: string,
    endTime: string,
    assignedDoctorId?: string
  ): AppointmentRequest {
    const current = this.getAppointmentById(clinicId, appointmentId);
    if (!current) throw new Error('Appointment not found');

    let doctorName = current.doctorName;
    let doctorId = current.doctorId;
    if (assignedDoctorId) {
      const doc = this.getDoctorById(clinicId, assignedDoctorId);
      if (doc) {
        doctorId = doc.id;
        doctorName = doc.fullName;
      }
    }

    const updated = this.updateAppointment(clinicId, appointmentId, {
      status: 'Confirmed',
      doctorId,
      doctorName,
      confirmedSlot: { date, startTime, endTime }
    });

    // Record mock communication
    this.sendMockMessage(clinicId, {
      patientId: current.patientId,
      patientName: current.patientName,
      appointmentId: current.id,
      channel: 'Email',
      type: 'Appointment Confirmation',
      subject: `Confirmed: Consultation with ${doctorName}`,
      body: `Hello ${current.patientName}, your appointment on ${date} from ${startTime} to ${endTime} with ${doctorName} has been confirmed.`,
      sentBy: 'Clinic Care Coordinator'
    });

    return updated;
  }

  static proposeAlternative(
    clinicId: string,
    appointmentId: string,
    proposedDate: string,
    proposedStartTime: string,
    proposedEndTime: string,
    note: string
  ): AppointmentRequest {
    const current = this.getAppointmentById(clinicId, appointmentId);
    if (!current) throw new Error('Appointment not found');

    const updated = this.updateAppointment(clinicId, appointmentId, {
      status: 'Alternative Proposed',
      alternativeProposal: {
        proposedDate,
        proposedStartTime,
        proposedEndTime,
        note,
        proposedAt: new Date().toISOString()
      }
    });

    // Record mock communication
    this.sendMockMessage(clinicId, {
      patientId: current.patientId,
      patientName: current.patientName,
      appointmentId: current.id,
      channel: 'SMS',
      type: 'Alternative Slot Proposal',
      subject: `Reschedule Option for Appointment #${current.id}`,
      body: `Hi ${current.patientName}, your requested slot was occupied. We propose an alternative slot on ${proposedDate} from ${proposedStartTime} to ${proposedEndTime}. Note: ${note}`,
      sentBy: 'Clinic Front Desk'
    });

    return updated;
  }

  static rejectAppointment(clinicId: string, appointmentId: string, rejectionReason: string): AppointmentRequest {
    const current = this.getAppointmentById(clinicId, appointmentId);
    if (!current) throw new Error('Appointment not found');

    const updated = this.updateAppointment(clinicId, appointmentId, {
      status: 'Rejected',
      rejectionReason
    });

    this.sendMockMessage(clinicId, {
      patientId: current.patientId,
      patientName: current.patientName,
      appointmentId: current.id,
      channel: 'Email',
      type: 'Cancellation Notice',
      subject: `Update regarding your consultation request #${current.id}`,
      body: `Dear ${current.patientName}, we are unable to fulfill your appointment request at this time. Reason: ${rejectionReason}`,
      sentBy: 'Clinic Care Coordinator'
    });

    return updated;
  }

  // --- Patients & Medical Records ---
  static getPatients(clinicId: string): PatientRecord[] {
    const all = loadStore<PatientRecord[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    return all.filter((p) => p.clinicId === clinicId);
  }

  static getPatientById(clinicId: string, patientId: string): PatientRecord | null {
    const patients = this.getPatients(clinicId);
    return patients.find((p) => p.id === patientId) || null;
  }

  static savePatient(clinicId: string, patient: PatientRecord): PatientRecord {
    const all = loadStore<PatientRecord[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const toSave = { ...patient, clinicId };
    const idx = all.findIndex((p) => p.id === patient.id && p.clinicId === clinicId);

    if (idx >= 0) {
      all[idx] = toSave;
    } else {
      all.push(toSave);
    }
    saveStore(STORAGE_KEYS.PATIENTS, all);
    return toSave;
  }

  // --- Consultations & Prescriptions ---
  static getConsultations(clinicId: string): ConsultationRecord[] {
    const all = loadStore<ConsultationRecord[]>(STORAGE_KEYS.CONSULTATIONS, INITIAL_CONSULTATIONS);
    return all.filter((c) => c.clinicId === clinicId);
  }

  static getConsultationsForPatient(clinicId: string, patientId: string): ConsultationRecord[] {
    return this.getConsultations(clinicId).filter((c) => c.patientId === patientId);
  }

  static getConsultationById(clinicId: string, consultationId: string): ConsultationRecord | null {
    const all = this.getConsultations(clinicId);
    return all.find((c) => c.id === consultationId) || null;
  }

  static saveConsultation(clinicId: string, consultation: ConsultationRecord): ConsultationRecord {
    const all = loadStore<ConsultationRecord[]>(STORAGE_KEYS.CONSULTATIONS, INITIAL_CONSULTATIONS);
    const toSave = { ...consultation, clinicId };
    const idx = all.findIndex((c) => c.id === consultation.id && c.clinicId === clinicId);

    if (idx >= 0) {
      all[idx] = toSave;
    } else {
      all.unshift(toSave);
    }
    saveStore(STORAGE_KEYS.CONSULTATIONS, all);

    // If finalized and has follow-up, send notification
    if (toSave.status === 'Finalized' && toSave.followUpRecommendation) {
      this.sendMockMessage(clinicId, {
        patientId: toSave.patientId,
        patientName: toSave.patientName,
        channel: 'Portal Notice',
        type: 'Follow-up Reminder',
        subject: `Care Summary & Follow-up Recommendation from ${toSave.doctorName}`,
        body: `Your consultation with ${toSave.doctorName} has been finalized. Recommended follow-up date: ${toSave.followUpRecommendation.recommendedDate}. Notes: ${toSave.followUpRecommendation.notes}`,
        sentBy: toSave.doctorName
      });
    }

    return toSave;
  }

  // --- Communications ---
  static getCommunications(clinicId: string): ClinicCommunicationMessage[] {
    const all = loadStore<ClinicCommunicationMessage[]>(STORAGE_KEYS.COMMUNICATIONS, INITIAL_COMMUNICATIONS);
    return all.filter((m) => m.clinicId === clinicId);
  }

  static sendMockMessage(
    clinicId: string,
    msg: Omit<ClinicCommunicationMessage, 'id' | 'clinicId' | 'sentAt' | 'mockDeliveryStatus'>
  ): ClinicCommunicationMessage {
    const all = loadStore<ClinicCommunicationMessage[]>(STORAGE_KEYS.COMMUNICATIONS, INITIAL_COMMUNICATIONS);
    const newMsg: ClinicCommunicationMessage = {
      ...msg,
      id: `MSG-${Date.now().toString().slice(-6)}`,
      clinicId,
      sentAt: new Date().toISOString(),
      mockDeliveryStatus: 'Mock Dispatched (Demo Only)'
    };
    all.unshift(newMsg);
    saveStore(STORAGE_KEYS.COMMUNICATIONS, all);
    return newMsg;
  }

  // --- Operations & Revenue Metrics ---
  static getDashboardMetrics(clinicId: string) {
    const appointments = this.getAppointments(clinicId);
    const patients = this.getPatients(clinicId);
    const doctors = this.getDoctors(clinicId);

    const todayStr = '2026-10-24'; // Current demo reference date
    const todayAppointments = appointments.filter(
      (a) => a.confirmedSlot?.date === todayStr || a.preferredDate === todayStr
    );

    const completedToday = appointments.filter(
      (a) => a.status === 'Completed' && (a.confirmedSlot?.date === todayStr || a.preferredDate === todayStr)
    );

    const pendingEnquiries = appointments.filter(
      (a) => a.status === 'New' || a.status === 'Pending Review'
    );

    const cancelledTotal = appointments.filter((a) => a.status === 'Cancelled' || a.status === 'Rejected');

    // Revenue calculations (clearly distinguishing estimated vs collected)
    // Collected: only appointments marked as Paid
    const collectedRevenue = appointments
      .filter((a) => a.paymentStatus === 'Paid')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    // Estimated revenue: confirmed or completed appointments
    const estimatedTotalRevenue = appointments
      .filter((a) => a.status === 'Confirmed' || a.status === 'Completed')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    const todayEstimatedRevenue = todayAppointments
      .filter((a) => a.status === 'Confirmed' || a.status === 'Completed')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    const todayCollectedRevenue = todayAppointments
      .filter((a) => a.paymentStatus === 'Paid')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    // Returning vs new patients: calculate based on appointment frequency
    const patientCounts: Record<string, number> = {};
    appointments.forEach((a) => {
      patientCounts[a.patientId] = (patientCounts[a.patientId] || 0) + 1;
    });

    const returningPatientsCount = Object.values(patientCounts).filter((c) => c > 1).length;
    const newPatientsCount = Math.max(0, patients.length - returningPatientsCount);

    // Doctor availability
    const activeDoctors = doctors.filter((d) => d.isActive).length;

    // 7-day trend
    const recent7Days = [
      { date: 'Oct 18', count: 3, revenue: 480 },
      { date: 'Oct 19', count: 5, revenue: 760 },
      { date: 'Oct 20', count: 4, revenue: 620 },
      { date: 'Oct 21', count: 6, revenue: 940 },
      { date: 'Oct 22', count: 7, revenue: 1100 },
      { date: 'Oct 23', count: 5, revenue: 780 },
      { date: 'Oct 24 (Today)', count: todayAppointments.length, revenue: todayEstimatedRevenue }
    ];

    return {
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
      recent7Days
    };
  }
}
