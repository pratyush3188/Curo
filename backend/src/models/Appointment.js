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
      required: true,
      unique: true,
      index: true,
    },
    clinicId: {
      type: String,
      required: true,
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
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    specialty: { type: String, default: '' },
    serviceId: { type: String, default: '' },
    serviceName: { type: String, default: '' },
    consultationMode: {
      type: String,
      enum: ['in-person', 'voice', 'video'],
      default: 'in-person',
    },
    preferredDate: { type: String, required: true },
    preferredTimeRange: { type: String, default: '' },
    reasonForVisit: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'New',
        'Pending Review',
        'Confirmed',
        'Alternative Proposed',
        'Rejected',
        'Cancelled',
        'Completed',
      ],
      default: 'New',
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
