import mongoose from 'mongoose';

const prescriptionMedicationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    medicationName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, default: '' },
  },
  { _id: false }
);

const followUpRecommendationSchema = new mongoose.Schema(
  {
    recommendedDate: { type: String, default: '' },
    notes: { type: String, default: '' },
    isScheduled: { type: Boolean, default: false },
  },
  { _id: false }
);

const consultationSchema = new mongoose.Schema(
  {
    consultationId: {
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
    appointmentId: {
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
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    consultationDate: {
      type: String,
      required: true,
    },
    consultationMode: {
      type: String,
      enum: ['in-person', 'voice', 'video'],
      default: 'in-person',
    },
    status: {
      type: String,
      enum: ['Draft', 'Finalized'],
      default: 'Draft',
    },
    patientReportedSymptoms: { type: String, default: '' },
    doctorObservations: { type: String, default: '' },
    clinicalAssessment: { type: String, default: '' },
    prescriptions: [prescriptionMedicationSchema],
    followUpRecommendation: { type: followUpRecommendationSchema },
    finalizedAt: { type: String },
    doctorSignatureStamp: { type: String },
  },
  {
    timestamps: true,
  }
);

consultationSchema.virtual('id').get(function () {
  return this.consultationId;
});

consultationSchema.set('toJSON', { virtuals: true });
consultationSchema.set('toObject', { virtuals: true });

export const Consultation = mongoose.model('Consultation', consultationSchema);
