// Domain models for Private Clinic Management Portal

export type ConsultationMode = 'in-person' | 'voice' | 'video';

export type AppointmentRequestStatus =
  | 'New'
  | 'Pending Review'
  | 'Confirmed'
  | 'Alternative Proposed'
  | 'Rejected'
  | 'Cancelled'
  | 'Completed';

export interface ServiceItem {
  id: string;
  name: string;
  durationMinutes: number;
  consultationFee: number;
  currency: string;
  supportedModes: ConsultationMode[];
  description: string;
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "18:00"
  breaks: { label: string; start: string; end: string }[];
}

export interface ClinicSpecialClosure {
  date: string; // "2026-11-15"
  reason: string;
}

export interface ClinicProfile {
  id: string; // clinicId
  name: string;
  tagline: string;
  logo: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  description: string;
  registrationNumber: string;
  services: ServiceItem[];
  weeklyHours: DaySchedule[];
  specialClosures: ClinicSpecialClosure[];
  cancellationPolicy: {
    freeCancellationHoursNotice: number;
    feePercentageAfterNotice: number;
    policyTerms: string;
  };
  defaultAppointmentDurationMinutes: number;
}

export interface DoctorWorkingHours {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isWorking: boolean;
  shifts: { start: string; end: string }[];
  breaks: { label: string; start: string; end: string }[];
}

export interface Doctor {
  id: string;
  clinicId: string;
  fullName: string;
  title: string; // "Dr. Sarah Jenkins, MD"
  specialties: string[];
  qualifications: string[];
  bio: string;
  consultationFee: number;
  supportedModes: ConsultationMode[];
  avatarUrl: string;
  isActive: boolean;
  weeklySchedule: DoctorWorkingHours[];
  leaves: { startDate: string; endDate: string; reason: string }[];
}

export interface PatientDocument {
  id: string;
  title: string;
  fileType: 'pdf' | 'lab_result' | 'imaging_scan' | 'summary';
  fileSize: string;
  uploadedAt: string;
  isRestricted: boolean;
  fileUrlPreview?: string;
}

export interface PatientRecord {
  id: string; // PAT-xxx
  clinicId: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Female' | 'Male' | 'Non-binary' | 'Other';
  phone: string;
  email: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  registeredDate: string;
  documents: PatientDocument[];
}

export interface PrescriptionMedication {
  id: string;
  medicationName: string;
  dosage: string; // e.g. "500 mg"
  frequency: string; // e.g. "Twice daily after meals"
  duration: string; // e.g. "5 days"
  instructions: string;
}

export interface ConsultationRecord {
  id: string; // CON-xxx
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  consultationDate: string; // ISO date string
  consultationMode: ConsultationMode;
  status: 'Draft' | 'Finalized';
  patientReportedSymptoms: string;
  doctorObservations: string;
  clinicalAssessment: string;
  prescriptions: PrescriptionMedication[];
  followUpRecommendation?: {
    recommendedDate: string;
    notes: string;
    isScheduled: boolean;
  };
  finalizedAt?: string;
  doctorSignatureStamp?: string;
}

export interface AppointmentRequest {
  id: string; // ENQ-xxx
  clinicId: string;
  patientId: string;
  patientName: string;
  patientContact: {
    phone: string;
    email: string;
  };
  doctorId: string;
  doctorName: string;
  specialty: string;
  serviceId: string;
  serviceName: string;
  consultationMode: ConsultationMode;
  preferredDate: string; // "2026-10-24"
  preferredTimeRange: string; // "10:00 - 12:00"
  reasonForVisit: string;
  createdAt: string;
  status: AppointmentRequestStatus;
  confirmedSlot?: {
    date: string; // "2026-10-24"
    startTime: string; // "10:30"
    endTime: string; // "11:00"
  };
  alternativeProposal?: {
    proposedDate: string;
    proposedStartTime: string;
    proposedEndTime: string;
    note: string;
    proposedAt: string;
  };
  rejectionReason?: string;
  fee: number;
  paymentStatus: 'Pending' | 'Paid' | 'Refunded';
}

export interface ClinicCommunicationMessage {
  id: string;
  clinicId: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  channel: 'Email' | 'SMS' | 'Portal Notice';
  type:
    | 'Appointment Confirmation'
    | 'Alternative Slot Proposal'
    | 'Rescheduling Notice'
    | 'Cancellation Notice'
    | 'Follow-up Reminder'
    | 'Consultation Instructions';
  subject: string;
  body: string;
  sentAt: string;
  sentBy: string;
  mockDeliveryStatus: 'Mock Dispatched (Demo Only)' | 'Queued in Mock Pipeline';
}

export interface ClinicUser {
  id: string;
  fullName: string;
  email: string;
  role: 'Clinic Manager' | 'Authorized Doctor' | 'Reception Staff';
  clinicId: string; // strictly pinned to this clinic
  avatarUrl: string;
}
