import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema(
  {
    messageId: {
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
    appointmentId: { type: String, default: '' },
    patientId: { type: String, required: true },
    patientName: { type: String, required: true },
    channel: {
      type: String,
      enum: ['Email', 'SMS', 'Portal Notice'],
      required: true,
    },
    type: {
      type: String,
      enum: [
        'Appointment Confirmation',
        'Alternative Slot Proposal',
        'Rescheduling Notice',
        'Cancellation Notice',
        'Follow-up Reminder',
        'Consultation Instructions',
      ],
      required: true,
    },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    sentAt: { type: String, default: () => new Date().toISOString() },
    sentBy: { type: String, default: 'Clinic Care Coordinator' },
    mockDeliveryStatus: { type: String, default: 'Dispatched' },
  },
  {
    timestamps: true,
  }
);

communicationSchema.virtual('id').get(function () {
  return this.messageId;
});

communicationSchema.set('toJSON', { virtuals: true });
communicationSchema.set('toObject', { virtuals: true });

export const Communication = mongoose.model('Communication', communicationSchema);
