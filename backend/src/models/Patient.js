import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: 0,
      max: 130,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    chiefComplaint: {
      type: String,
      required: [true, 'Chief complaint is required'],
      trim: true,
    },
    triageLevel: {
      type: String,
      enum: ['critical', 'urgent', 'semi-urgent', 'non-urgent'],
      default: 'non-urgent',
      lowercase: true,
    },
    triageConfidence: {
      type: Number,
      default: 0.95,
    },
    triageReasoning: {
      type: String,
      default: '',
    },
    vitals: {
      bloodPressure: {
        systolic: { type: Number, default: 120 },
        diastolic: { type: Number, default: 80 },
      },
      heartRate: { type: Number, default: 72 }, // bpm
      spo2: { type: Number, default: 98 }, // %
      temperature: { type: Number, default: 98.6 }, // F
      respiratoryRate: { type: Number, default: 16 }, // breaths/min
      painScale: { type: Number, min: 1, max: 10, default: 1 },
      consciousness: {
        type: String,
        enum: ['Alert', 'Verbal', 'Pain', 'Unresponsive'],
        default: 'Alert',
      },
    },
    symptoms: {
      type: [String],
      default: [],
    },
    medicalHistory: {
      type: [String],
      default: [],
    },
    doctorReferral: {
      type: [String],
      default: [],
    },
    bedNumber: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
      index: true,
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-treatment', 'resolved', 'discharged'],
      default: 'waiting',
    },
    outcome: {
      type: String,
      default: '',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    waitTime: {
      type: Number, // Calculated or stored wait time in minutes
      default: 0,
    },
    isAlertAcknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    admittedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to dynamically compute current wait time in minutes
patientSchema.virtual('calculatedWaitTime').get(function () {
  const endTime = this.resolvedAt || new Date();
  const startTime = this.admittedAt || this.createdAt || new Date();
  const diffMs = endTime.getTime() - startTime.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
});

export const Patient = mongoose.model('Patient', patientSchema);
