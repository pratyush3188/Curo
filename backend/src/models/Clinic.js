import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: String, default: '' },
    uploadDate: { type: String, default: '' },
    status: { type: String, enum: ['verified', 'under_review', 'rejected', 'pending'], default: 'under_review' },
    verified: { type: Boolean, default: false },
    fileUrl: { type: String, default: '' },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    event: { type: String, required: true },
    actor: { type: String, default: 'System' },
  },
  { _id: false }
);

const authorizedRepSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
  },
  { _id: false }
);

const managerAccountSchema = new mongoose.Schema(
  {
    id: { type: String, default: null },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    status: { type: String, enum: ['active', 'pending_activation', 'suspended', 'inactive'], default: 'pending_activation' },
  },
  { _id: false }
);

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
      index: true,
    },
    regId: {
      type: String,
      required: [true, 'Registration reference ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      default: 'Multi-Specialty Polyclinic',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Physical address is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Official registry email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Official phone number is required'],
      trim: true,
    },
    specialtiesCount: {
      type: Number,
      default: 1,
    },
    specialties: {
      type: [String],
      default: [],
    },
    consultationRooms: {
      type: Number,
      default: 2,
    },
    authorizedRepresentative: {
      type: authorizedRepSchema,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'needs_more_information', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'pending_activation', 'suspended', 'inactive'],
      default: 'pending_activation',
      index: true,
    },
    managerAccount: {
      type: managerAccountSchema,
      default: null,
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    requestInfoMessage: {
      type: String,
      default: '',
    },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
    registeredAt: {
      type: Date,
      default: Date.now,
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

export const Clinic = mongoose.model('Clinic', clinicSchema);
