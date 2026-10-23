import mongoose from 'mongoose';

const biomarkerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: String, default: '' },
    unit: { type: String, default: '' },
    referenceRange: { type: String, default: '' },
    status: { type: String, enum: ['normal', 'elevated', 'low', 'critical', 'borderline'], default: 'normal' },
    interpretation: { type: String, default: '' },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: '',
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    patientName: {
      type: String,
      default: '',
    },
    labName: {
      type: String,
      default: '',
    },
    reportCategory: {
      type: String,
      default: 'General Lab Report',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    healthScore: {
      type: Number,
      default: 85,
    },
    executiveSummary: {
      type: String,
      default: '',
    },
    laymanExplanation: {
      type: String,
      default: '',
    },
    biomarkers: [biomarkerSchema],
    keyObservations: [{ type: String }],
    recommendations: [{ type: String }],
    questionsForDoctor: [{ type: String }],
    dietaryGuidelines: {
      foodsToEat: [{ type: String }],
      foodsToAvoid: [{ type: String }],
      lifestyleAdvice: [{ type: String }],
    },
    rawExtractedText: {
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

export const Report = mongoose.model('Report', reportSchema);
