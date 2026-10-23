import mongoose from 'mongoose';

/* =====================================================================
   SUB-SCHEMAS: SUPER ADMIN GOVERNANCE (from shikshit)
===================================================================== */
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

/* =====================================================================
   SUB-SCHEMAS: PRIVATE CLINIC OPERATIONS (from main)
===================================================================== */
const serviceItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    durationMinutes: { type: Number, default: 30 },
    consultationFee: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    supportedModes: [{ type: String, enum: ['in-person', 'voice', 'video'] }],
    description: { type: String, default: '' },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    isOpen: { type: Boolean, default: true },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '18:00' },
    breaks: [
      {
        label: { type: String, default: '' },
        start: { type: String, default: '' },
        end: { type: String, default: '' },
        _id: false,
      },
    ],
  },
  { _id: false }
);

const specialClosureSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const cancellationPolicySchema = new mongoose.Schema(
  {
    freeCancellationHoursNotice: { type: Number, default: 24 },
    feePercentageAfterNotice: { type: Number, default: 50 },
    policyTerms: { type: String, default: '' },
  },
  { _id: false }
);

/* =====================================================================
   MAIN UNIFIED CLINIC SCHEMA
===================================================================== */
const clinicSchema = new mongoose.Schema(
  {
    // Operational and Statutory Identifiers
    clinicId: {
      type: String,
      default: function () {
        return this.regId ? this.regId.toLowerCase() : `cln-${this._id}`;
      },
      index: true,
      sparse: true,
    },
    regId: {
      type: String,
      default: function () {
        return this.clinicId ? this.clinicId.toUpperCase() : `CLN-${this._id}`;
      },
      uppercase: true,
      trim: true,
      index: true,
      sparse: true,
    },

    // General Profile
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
      index: true,
    },
    tagline: { type: String, default: '' },
    logo: { type: String, default: '' },
    description: { type: String, default: '' },
    category: {
      type: String,
      default: 'Multi-Specialty Polyclinic',
    },
    registrationNumber: { type: String, default: '' },

    // Contact & Location
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
    city: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },

    // Capacity & Specialties
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

    // Super Admin Verification & Account Status
    authorizedRepresentative: {
      type: authorizedRepSchema,
      default: () => ({
        name: 'Authorized Administrator',
        designation: 'Medical Superintendent',
        email: 'admin@clinic.health',
        phone: '+91 98000 00000',
      }),
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'under_review', 'needs_more_information', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'pending_activation', 'suspended', 'inactive'],
      default: 'active',
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

    // Operational Clinical Services & Timings
    services: [serviceItemSchema],
    weeklyHours: [dayScheduleSchema],
    specialClosures: [specialClosureSchema],
    cancellationPolicy: { type: cancellationPolicySchema, default: () => ({}) },
    defaultAppointmentDurationMinutes: { type: Number, default: 30 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret.clinicId || (ret._id ? ret._id.toString() : ret.id);
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual mapping for id
clinicSchema.virtual('id').get(function () {
  return this.clinicId || (this._id ? this._id.toString() : '');
});

export const Clinic = mongoose.model('Clinic', clinicSchema);
