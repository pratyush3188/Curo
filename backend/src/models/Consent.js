import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    granteeId: {
      type: String,
      required: true,
      index: true,
    },
    granteeType: {
      type: String,
      enum: ['doctor', 'hospital', 'clinic'],
      required: true,
    },
    granteeName: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      default: 'Clinical Consultation and Medical History Evaluation',
    },
    permissions: {
      type: [String],
      enum: ['view_reports', 'view_prescriptions', 'edit_records', 'emergency_access'],
      default: ['view_reports', 'view_prescriptions'],
    },
    status: {
      type: String,
      enum: ['active', 'revoked', 'expired'],
      default: 'active',
      index: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    },
    revokedAt: {
      type: Date,
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

export const Consent = mongoose.model('Consent', consentSchema);
