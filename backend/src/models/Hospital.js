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
    name: { type: String, default: 'Hospital Administration', trim: true },
    designation: { type: String, default: 'Medical Superintendent' },
    email: { type: String, default: 'admin@curo.hospital', lowercase: true, trim: true },
    phone: { type: String, default: '+91 22 2675 1000' },
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

const hospitalDoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  department: { type: String, default: 'General Medicine' },
  qualification: { type: String, default: 'MBBS, MS, DNB' },
  experienceYears: { type: Number, default: 10 },
  consultationFee: { type: Number, default: 800 },
  availableDays: [{ type: String }],
  availableSlots: [{ type: String }],
  rating: { type: Number, default: 4.9 },
  imageUrl: { type: String, default: '' },
});

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      index: true,
    },
    regId: {
      type: String,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
      default: () => 'HOSP-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    },
    registrationNumber: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'Tertiary Care Hospital',
    },
    locality: {
      type: String,
      default: 'Bandra',
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      default: 'Mumbai',
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      default: 'Maharashtra',
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Physical address is required'],
      trim: true,
      default: 'Healthcare Boulevard',
    },
    email: {
      type: String,
      default: 'contact@hospital.org',
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '+91 22 2675 1000',
      trim: true,
    },
    emergencyHelpline: {
      type: String,
      default: '108',
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    totalBeds: {
      type: Number,
      default: 350,
    },
    bedCapacity: {
      type: Number,
      default: 350,
    },
    icuBeds: {
      type: Number,
      default: 18,
    },
    icuBedsAvailable: {
      type: Number,
      default: 18,
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1200',
    },
    overview: {
      type: String,
      default: 'Multi-specialty tertiary care healthcare institute with 24/7 emergency, advanced surgery, and critical care units.',
    },
    departmentsCount: {
      type: Number,
      default: 6,
    },
    departments: {
      type: [String],
      default: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Emergency & Trauma', 'Pediatrics'],
    },
    doctors: [hospitalDoctorSchema],
    authorizedRepresentative: {
      type: authorizedRepSchema,
      default: () => ({}),
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

export const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
