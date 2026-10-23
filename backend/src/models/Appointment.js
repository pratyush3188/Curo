import mongoose from 'mongoose';

const confirmedSlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const alternativeProposalSchema = new mongoose.Schema(
  {
    proposedDate: { type: String, required: true },
    proposedStartTime: { type: String, required: true },
    proposedEndTime: { type: String, required: true },
    note: { type: String, default: '' },
    proposedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      default: () => 'APT-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      unique: true,
      index: true,
    },
    institutionType: {
      type: String,
      enum: ['clinic', 'hospital'],
      default: 'clinic',
      index: true,
    },
    institutionId: {
      type: String,
      default: '',
      index: true,
    },
    institutionName: {
      type: String,
      default: '',
    },
    clinicId: {
      type: String,
      default: '',
      index: true,
    },
    hospitalId: {
      type: String,
      default: '',
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientContact: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    patientPhone: {
      type: String,
      default: '',
    },
    doctorId: {
      type: String,
      default: () => 'DOC-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    doctorSpecialization: { type: String, default: '' },
    specialty: { type: String, default: '' },
    serviceId: { type: String, default: '' },
    serviceName: { type: String, default: '' },
    consultationMode: {
      type: String,
      default: 'in-person',
    },
    consultationType: {
      type: String,
      default: 'offline',
    },
    preferredDate: {
      type: String,
      default: '',
    },
    appointmentDate: {
      type: String,
      default: '',
    },
    preferredTimeRange: { type: String, default: '' },
    timeSlot: { type: String, default: '' },
    reasonForVisit: { type: String, default: 'Consultation' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      default: 'Confirmed',
      index: true,
    },
    confirmedSlot: { type: confirmedSlotSchema },
    alternativeProposal: { type: alternativeProposalSchema },
    rejectionReason: { type: String, default: '' },
    fee: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.virtual('id').get(function () {
  return this.appointmentId;
});

appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
