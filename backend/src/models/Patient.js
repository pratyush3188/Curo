import mongoose from 'mongoose';

const patientDocumentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['pdf', 'lab_result', 'imaging_scan', 'summary'],
      default: 'pdf',
    },
    fileSize: { type: String, default: '' },
    uploadedAt: { type: String, default: () => new Date().toISOString() },
    isRestricted: { type: Boolean, default: false },
    fileUrlPreview: { type: String, default: '' },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    patientId: {
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
      required: [true, 'Patient full name is required'],
      trim: true,
    },
    dateOfBirth: { type: String, default: '' },
    gender: {
      type: String,
      enum: ['Female', 'Male', 'Non-binary', 'Other'],
      default: 'Other',
    },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    emergencyContact: {
      name: { type: String, default: '' },
      relation: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    bloodGroup: { type: String, default: '' },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    registeredDate: { type: String, default: () => new Date().toISOString() },
    documents: [patientDocumentSchema],
  },
  {
    timestamps: true,
  }
);

patientSchema.virtual('id').get(function () {
  return this.patientId;
});

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

export const Patient = mongoose.model('Patient', patientSchema);
