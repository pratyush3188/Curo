import mongoose from 'mongoose';
import crypto from 'crypto';

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Invitee email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    inviteeName: {
      type: String,
      required: [true, 'Invitee name is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['hospital_manager', 'clinic_manager', 'department_manager', 'hospital_admin', 'manager'],
      required: true,
    },
    facilityId: {
      type: String,
      required: true,
      index: true,
    },
    facilityName: {
      type: String,
      required: true,
    },
    facilityType: {
      type: String,
      enum: ['hospital', 'clinic'],
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    // Raw token stored only if needed for simulated dev activation or preview link
    token: {
      type: String,
      default: null,
    },
    simulatedLink: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.tokenHash;
        return ret;
      },
    },
  }
);

// Helper to hash token using SHA-256
invitationSchema.statics.hashToken = function (token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const Invitation = mongoose.model('Invitation', invitationSchema);
