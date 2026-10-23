import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Department = mongoose.model('Department', departmentSchema);
