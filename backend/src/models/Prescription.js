import mongoose from 'mongoose';

const medicationItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    instructions: { type: String, default: '' },
    purpose: { type: String, default: '' },
  },
  { _id: false }
);

const contraindicationSchema = new mongoose.Schema(
  {
    severity: { type: String, enum: ['Critical', 'High', 'Moderate', 'Low'], default: 'Moderate' },
    drugPair: { type: String, required: true },
    description: { type: String, default: '' },
    recommendation: { type: String, default: '' },
  },
  { _id: false }
);

const dosageWarningSchema = new mongoose.Schema(
  {
    medication: { type: String, required: true },
    dosageObserved: { type: String, default: '' },
    standardRange: { type: String, default: '' },
    warning: { type: String, default: '' },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    doctorName: {
      type: String,
      default: 'Attending Physician',
    },
    institutionName: {
      type: String,
      default: 'Medical Facility',
    },
    fileName: {
      type: String,
      default: '',
    },
    safetyScore: {
      type: Number,
      default: 100,
    },
    contraindications: [contraindicationSchema],
    dosageWarnings: [dosageWarningSchema],
    medications: [medicationItemSchema],
    simplifiedSummary: {
      type: String,
      default: '',
    },
    rawText: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

export const Prescription = mongoose.model('Prescription', prescriptionSchema);
