import mongoose from 'mongoose';

const serviceItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    durationMinutes: { type: Number, default: 30 },
    consultationFee: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    supportedModes: [{ type: String, enum: ['in-person', 'voice', 'video'] }],
    description: { type: String, default: '' },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '18:00' },
    breaks: [
      {
        label: { type: String, default: '' },
        start: { type: String, default: '' },
        end: { type: String, default: '' },
        _id: false,
      },
    ],
  },
  { _id: false }
);

const specialClosureSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const cancellationPolicySchema = new mongoose.Schema(
  {
    freeCancellationHoursNotice: { type: Number, default: 24 },
    feePercentageAfterNotice: { type: Number, default: 50 },
    policyTerms: { type: String, default: '' },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  { _id: false }
);

const clinicSchema = new mongoose.Schema(
  {
    clinicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
    },
    tagline: { type: String, default: '' },
    logo: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: addressSchema, default: () => ({}) },
    description: { type: String, default: '' },
    registrationNumber: { type: String, default: '' },
    services: [serviceItemSchema],
    weeklyHours: [dayScheduleSchema],
    specialClosures: [specialClosureSchema],
    cancellationPolicy: { type: cancellationPolicySchema, default: () => ({}) },
    defaultAppointmentDurationMinutes: { type: Number, default: 30 },
  },
  {
    timestamps: true,
  }
);

// Map virtual id to clinicId
clinicSchema.virtual('id').get(function () {
  return this.clinicId;
});

clinicSchema.set('toJSON', { virtuals: true });
clinicSchema.set('toObject', { virtuals: true });

export const Clinic = mongoose.model('Clinic', clinicSchema);
