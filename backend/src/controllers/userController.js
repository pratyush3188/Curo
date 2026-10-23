import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc Get current authenticated user profile
 * @route GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  let user = null;
  if (mongoose.connection.readyState === 1) {
    user = await User.findById(userId).select('-password');
  } else {
    user = req.user;
  }

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * @desc Update current authenticated user profile
 * @route PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  const {
    name,
    phone,
    gender,
    dateOfBirth,
    address,
    bloodGroup,
    emergencyContact,
    medicalHistorySummary,
    professionalInfo,
  } = req.body;

  const allowedUpdates = {};
  if (name) allowedUpdates.name = name;
  if (phone !== undefined) allowedUpdates.phone = phone;
  if (gender !== undefined) allowedUpdates.gender = gender;
  if (dateOfBirth) allowedUpdates.dateOfBirth = dateOfBirth;
  if (address) allowedUpdates.address = address;
  if (bloodGroup !== undefined) allowedUpdates.bloodGroup = bloodGroup;
  if (emergencyContact) allowedUpdates.emergencyContact = emergencyContact;
  if (medicalHistorySummary !== undefined) allowedUpdates.medicalHistorySummary = medicalHistorySummary;
  if (professionalInfo) allowedUpdates.professionalInfo = professionalInfo;

  let updatedUser = null;
  if (mongoose.connection.readyState === 1) {
    updatedUser = await User.findByIdAndUpdate(userId, allowedUpdates, {
      new: true,
      runValidators: true,
    }).select('-password');
  } else {
    updatedUser = { ...req.user, ...allowedUpdates };
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser,
  });
});

/**
 * @desc List active doctors
 * @route GET /api/users/doctors
 */
export const getDoctors = asyncHandler(async (req, res) => {
  const { department, facilityId, search } = req.query;
  const filter = { role: 'doctor', isActive: true };

  if (department) filter.department = department;
  if (facilityId) filter.associatedFacilityId = facilityId;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { 'professionalInfo.specialization': { $regex: search, $options: 'i' } },
    ];
  }

  let doctors = [];
  if (mongoose.connection.readyState === 1) {
    doctors = await User.find(filter).select('-password');
  }

  res.status(200).json({
    success: true,
    count: doctors.length,
    doctors,
  });
});
