import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_LIST, ROLES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    // Basic Account Details
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ROLE_LIST,
      default: ROLES.PATIENT,
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Account Governance & Facility Associations
    accountStatus: {
      type: String,
      enum: ['active', 'pending_activation', 'suspended', 'inactive'],
      default: 'active',
      index: true,
    },
    associatedFacilityType: {
      type: String,
      enum: ['hospital', 'clinic', null],
      default: null,
    },
    associatedFacilityId: {
      type: String,
      default: null,
      index: true,
    },
    facilityName: {
      type: String,
      default: '',
    },
    assignedDepartmentId: {
      type: String,
      default: null,
    },
    department: {
      type: String,
      default: '',
    },

    // Detailed Profile / Demographics
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },

    // Patient Specific Details
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', ''],
      default: 'Unknown',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    medicalHistorySummary: {
      type: String,
      default: '',
    },

    // Doctor / Clinic / Hospital Staff Specific Details
    professionalInfo: {
      specialization: { type: String, default: '' },
      licenseNumber: { type: String, default: '' },
      experienceYears: { type: Number, default: 0 },
      hospitalAffiliation: { type: String, default: '' },
      qualification: { type: String, default: '' },
    },

    // Status & Audit
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
