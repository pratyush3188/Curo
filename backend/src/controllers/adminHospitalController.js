import mongoose from 'mongoose';
import { Hospital } from '../models/Hospital.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * @desc    Get all hospitals with filtering, search, sorting, and pagination for Super Admin
 * @route   GET /api/v1/admin/hospitals
 * @access  Private (Super Admin)
 */
export const getAdminHospitals = asyncHandler(async (req, res) => {
  const {
    search,
    verificationStatus,
    accountStatus,
    state,
    sortBy = 'newest',
    page = 1,
    limit = 50,
  } = req.query;

  const query = {};

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { regId: { $regex: s, $options: 'i' } },
      { city: { $regex: s, $options: 'i' } },
      { state: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }

  if (verificationStatus && verificationStatus !== 'all') {
    query.verificationStatus = verificationStatus;
  }

  if (accountStatus && accountStatus !== 'all') {
    query.accountStatus = accountStatus;
  }

  if (state && state !== 'all') {
    query.state = state;
  }

  let sortOption = { registeredAt: -1, createdAt: -1 };
  if (sortBy === 'name') {
    sortOption = { name: 1 };
  } else if (sortBy === 'departments') {
    sortOption = { departmentsCount: -1 };
  } else if (sortBy === 'oldest') {
    sortOption = { registeredAt: 1, createdAt: 1 };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [total, hospitals] = await Promise.all([
    Hospital.countDocuments(query),
    Hospital.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  const data = hospitals.map((h) => ({
    ...h,
    id: h._id.toString(),
  }));

  res.status(200).json({
    success: true,
    total,
    count: data.length,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data,
  });
});

/**
 * @desc    Get detailed hospital profile by ID for Super Admin
 * @route   GET /api/v1/admin/hospitals/:id
 * @access  Private (Super Admin)
 */
export const getAdminHospitalById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let hospital = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    hospital = await Hospital.findById(id).lean();
  }
  if (!hospital) {
    hospital = await Hospital.findOne({ $or: [{ regId: id }, { id }] }).lean();
  }

  if (!hospital) {
    throw new ApiError(404, `Hospital not found with identifier ${id}`);
  }

  res.status(200).json({
    success: true,
    data: {
      ...hospital,
      id: hospital._id.toString(),
    },
  });
});

/**
 * @desc    Create a new hospital facility from Super Admin dashboard
 * @route   POST /api/v1/admin/hospitals
 * @access  Private (Super Admin)
 */
export const createAdminHospital = asyncHandler(async (req, res) => {
  const {
    name,
    type = 'Multi-Specialty Hospital',
    registrationNumber,
    email,
    phone,
    address,
    city = 'Mumbai',
    state = 'Maharashtra',
    bedCapacity = 200,
    totalBeds = 200,
    icuBeds = 20,
    departments = ['Emergency & Trauma', 'Cardiology', 'Neurology', 'Pediatrics'],
    authorizedRepresentative,
    verificationStatus = 'approved',
    accountStatus = 'active',
  } = req.body;

  if (!name || !email) {
    throw new ApiError(400, 'Hospital name and email are mandatory.');
  }

  const regId = `HOSP-${Math.floor(100000 + Math.random() * 900000)}`;

  const hospital = await Hospital.create({
    regId,
    name,
    type,
    registrationNumber: registrationNumber || `REG-${Date.now().toString().slice(-6)}`,
    email: email.toLowerCase().trim(),
    phone: phone || '+91 22 2675 1000',
    address: address || 'Healthcare Boulevard',
    city,
    state,
    bedCapacity: Number(bedCapacity || totalBeds) || 200,
    totalBeds: Number(totalBeds || bedCapacity) || 200,
    icuBeds: Number(icuBeds) || 20,
    icuBedsAvailable: Number(icuBeds) || 20,
    departments: Array.isArray(departments) ? departments : ['Emergency & Trauma'],
    departmentsCount: Array.isArray(departments) ? departments.length : 1,
    verificationStatus,
    accountStatus,
    authorizedRepresentative: authorizedRepresentative || {
      name: 'Medical Superintendent',
      designation: 'Director',
      email: email.toLowerCase().trim(),
      phone: phone || '',
    },
    timeline: [
      {
        date: new Date(),
        event: `Hospital registered via Super Admin Operational Portal (${req.user?.name || 'Super Admin'}).`,
        actor: req.user?.name || 'Super Admin',
      },
    ],
  });

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'HOSPITAL_CREATED',
    targetType: 'Hospital',
    targetId: hospital._id,
    targetName: hospital.name,
    outcome: 'success',
    details: `Hospital ${hospital.name} registered directly with Reg ID ${hospital.regId}.`,
  });

  res.status(201).json({
    success: true,
    message: `Hospital ${hospital.name} registered successfully.`,
    data: {
      ...hospital.toObject(),
      id: hospital._id.toString(),
    },
  });
});

/**
 * @desc    Update hospital details from Super Admin
 * @route   PATCH /api/v1/admin/hospitals/:id
 * @access  Private (Super Admin)
 */
export const updateAdminHospital = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let hospital = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    hospital = await Hospital.findById(id);
  }
  if (!hospital) {
    hospital = await Hospital.findOne({ $or: [{ regId: id }, { id }] });
  }

  if (!hospital) {
    throw new ApiError(404, `Hospital not found with ID ${id}`);
  }

  const allowedUpdates = [
    'name',
    'type',
    'address',
    'city',
    'state',
    'phone',
    'email',
    'bedCapacity',
    'totalBeds',
    'icuBeds',
    'departments',
    'authorizedRepresentative',
    'reviewNotes',
  ];

  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      hospital[field] = req.body[field];
    }
  }

  if (Array.isArray(req.body.departments)) {
    hospital.departmentsCount = req.body.departments.length;
  }

  hospital.timeline.unshift({
    date: new Date(),
    event: `Hospital profile updated by Super Admin (${req.user?.name || 'Super Admin'}).`,
    actor: req.user?.name || 'Super Admin',
  });

  await hospital.save();

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'HOSPITAL_UPDATED',
    targetType: 'Hospital',
    targetId: hospital._id,
    targetName: hospital.name,
    outcome: 'success',
    details: `Updated metadata configuration for ${hospital.name}.`,
  });

  res.status(200).json({
    success: true,
    message: `Hospital ${hospital.name} updated successfully.`,
    data: {
      ...hospital.toObject(),
      id: hospital._id.toString(),
    },
  });
});

/**
 * @desc    Update hospital account operational status (active / suspended / inactive)
 * @route   PATCH /api/v1/admin/hospitals/:id/status
 * @access  Private (Super Admin)
 */
export const updateHospitalAccountStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accountStatus, reason } = req.body;

  if (!accountStatus || !['active', 'suspended', 'inactive', 'pending_activation'].includes(accountStatus)) {
    throw new ApiError(400, 'Valid accountStatus (active, suspended, inactive) is required.');
  }

  let hospital = null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    hospital = await Hospital.findById(id);
  }
  if (!hospital) {
    hospital = await Hospital.findOne({ $or: [{ regId: id }, { id }] });
  }

  if (!hospital) {
    throw new ApiError(404, `Hospital not found with ID ${id}`);
  }

  const previousStatus = hospital.accountStatus;
  hospital.accountStatus = accountStatus;

  hospital.timeline.unshift({
    date: new Date(),
    event: `Account status transitioned from ${previousStatus} to ${accountStatus}. ${reason ? `Reason: ${reason}` : ''}`,
    actor: req.user?.name || 'Super Admin',
  });

  await hospital.save();

  // Also update associated users
  try {
    await User.updateMany(
      { associatedFacilityId: hospital._id.toString() },
      { accountStatus, isActive: accountStatus === 'active' }
    );
  } catch (err) {
    console.warn('[User Status Sync Warning]', err.message);
  }

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: `HOSPITAL_STATUS_${accountStatus.toUpperCase()}`,
    targetType: 'Hospital',
    targetId: hospital._id,
    targetName: hospital.name,
    outcome: accountStatus === 'suspended' ? 'warning' : 'success',
    details: `Transitioned ${hospital.name} to ${accountStatus}. Reason: ${reason || 'Governance action'}`,
  });

  res.status(200).json({
    success: true,
    message: `Hospital ${hospital.name} status updated to ${accountStatus}.`,
    data: {
      ...hospital.toObject(),
      id: hospital._id.toString(),
    },
  });
});
