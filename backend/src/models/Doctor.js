import mongoose from 'mongoose';

const doctorShiftSchema = new mongoose.Schema(
  {
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const doctorBreakSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const doctorWorkingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    isWorking: { type: Boolean, default: true },
    shifts: [doctorShiftSchema],
    breaks: [doctorBreakSchema],
  },
  { _id: false }
);

const doctorLeaveSchema = new mongoose.Schema(
  {
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    doctorId: {
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
    fullName: {
      type: String,
      required: [true, 'Doctor full name is required'],
      trim: true,
    },
    title: { type: String, default: '' },
    specialties: [{ type: String }],
    qualifications: [{ type: String }],
    bio: { type: String, default: '' },
    consultationFee: { type: Number, default: 0 },
    supportedModes: [{ type: String, enum: ['in-person', 'voice', 'video'] }],
    avatarUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    weeklySchedule: [doctorWorkingHoursSchema],
    leaves: [doctorLeaveSchema],
  },
  {
    timestamps: true,
  }
);

doctorSchema.virtual('id').get(function () {
  return this.doctorId;
});

doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

export const Doctor = mongoose.model('Doctor', doctorSchema);
