import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    event: { type: String, required: true },
    actor: { type: String, default: 'System' },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    facilityType: {
      type: String,
      enum: ['hospital', 'clinic'],
      required: true,
      index: true,
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'facilityModel',
      index: true,
    },
    facilityModel: {
      type: String,
      required: true,
      enum: ['Hospital', 'Clinic'],
    },
    facilityName: {
      type: String,
      required: true,
    },
    regId: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'needs_more_information', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    submittedInformation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    internalReviewNotes: {
      type: String,
      default: '',
    },
    requestInfoMessage: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
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

export const Application = mongoose.model('Application', applicationSchema);
