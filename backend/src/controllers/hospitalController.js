import { Hospital } from '../models/Hospital.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * @desc    Get all hospitals with filtering, search, sorting, and pagination
 * @route   GET /api/v1/admin/hospitals
 * @access  Private (Super Admin)
 */
export const getHospitals = asyncHandler(async (req, res) => {
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

  let sortOptions = { createdAt: -1 };
  if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
  if (sortBy === 'beds') sortOptions = { bedCapacity: -1 };
  if (sortBy === 'name') sortOptions = { name: 1 };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [hospitals, total] = await Promise.all([
    Hospital.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    Hospital.countDocuments(query),
  ]);

  const formatted = hospitals.map((h) => ({
    ...h,
    id: h._id.toString(),
  }));

  res.status(200).json({
    success: true,
    count: formatted.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    data: formatted,
  });
});

/**
 * @desc    Get a single hospital by ID
 * @route   GET /api/v1/admin/hospitals/:id
 * @access  Private (Super Admin)
 */
export const getHospitalById = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) {
    throw new ApiError(404, `Hospital not found with ID ${req.params.id}`);
  }

  res.status(200).json({
    success: true,
    data: hospital,
  });
});

/**
 * @desc    Create a new hospital registration application
 * @route   POST /api/v1/admin/hospitals
 * @access  Private (Super Admin / Public Registration)
 */
export const createHospital = asyncHandler(async (req, res) => {
  const existing = await Hospital.findOne({ regId: req.body.regId.toUpperCase().trim() });
  if (existing) {
    throw new ApiError(409, `A hospital is already registered with reference ID "${req.body.regId}".`);
  }

  const hospital = await Hospital.create({
    ...req.body,
    regId: req.body.regId.toUpperCase().trim(),
    timeline: [
      {
        date: new Date(),
        event: 'Hospital application created and submitted for statutory verification.',
        actor: req.user?.name || 'Applicant',
      },
    ],
  });

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'HOSPITAL_APPLICATION_SUBMITTED',
    targetType: 'Hospital Facility',
    targetId: hospital._id,
    targetName: hospital.name,
    outcome: 'info',
    details: `Application created for ${hospital.name} with ID ${hospital.regId}.`,
  });

  res.status(201).json({
    success: true,
    data: hospital,
  });
});

/**
 * @desc    Update permitted hospital details
 * @route   PATCH /api/v1/admin/hospitals/:id
 * @access  Private (Super Admin)
 */
export const updateHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) {
    throw new ApiError(404, `Hospital not found with ID ${req.params.id}`);
  }

  const permittedFields = [
    'name',
    'type',
    'city',
    'state',
    'address',
    'email',
    'phone',
    'departmentsCount',
    'departments',
    'bedCapacity',
    'icuBeds',
    'authorizedRepresentative',
    'reviewNotes',
  ];

  permittedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      hospital[field] = req.body[field];
    }
  });

  hospital.timeline.unshift({
    date: new Date(),
    event: `Hospital records updated by ${req.user.name}.`,
    actor: req.user.name,
  });

  await hospital.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'HOSPITAL_UPDATED',
    targetType: 'Hospital Facility',
    targetId: hospital._id,
    targetName: hospital.name,
    outcome: 'info',
    details: `Updated registry details for hospital: ${hospital.name}.`,
  });

  res.status(200).json({
    success: true,
    data: hospital,
  });
});

/**
 * @desc    Suspend or reactivate hospital account access
 * @route   PATCH /api/v1/admin/hospitals/:id/status
 * @access  Private (Super Admin)
 */
export const updateHospitalAccountStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) {
    throw new ApiError(404, `Hospital not found with ID ${req.params.id}`);
  }

  const oldStatus = hospital.accountStatus;
  hospital.accountStatus = status;

  const eventText =
    status === 'suspended'
      ? `Facility account suspended by Super Admin (${req.user.name}). ${reason ? `Reason: ${reason}` : ''}`
      : `Facility account access reactivated by Super Admin (${req.user.name}).`;

  hospital.timeline.unshift({
    date: new Date(),
    event: eventText,
    actor: req.user.name,
  });

  await hospital.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: status === 'suspended' ? 'FACILITY_SUSPENDED' : 'FACILITY_REACTIVATED',
    targetType: 'Hospital Facility',
    targetId: hospital._id,
    targetName: hospital.name,
    outcome: status === 'suspended' ? 'warning' : 'success',
    details: `Account state transitioned from '${oldStatus}' to '${status}'. ${reason ? `Reason: ${reason}` : ''}`,
  });

  res.status(200).json({
    success: true,
    data: hospital,
  });
});
