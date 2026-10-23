import { Clinic } from '../models/Clinic.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * @desc    Get all clinics with filtering, search, sorting, and pagination
 * @route   GET /api/v1/admin/clinics
 * @access  Private (Super Admin)
 */
export const getClinics = asyncHandler(async (req, res) => {
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
      { category: { $regex: s, $options: 'i' } },
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
  if (sortBy === 'name') sortOptions = { name: 1 };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [clinics, total] = await Promise.all([
    Clinic.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
    Clinic.countDocuments(query),
  ]);

  const formatted = clinics.map((c) => ({
    ...c,
    id: c._id.toString(),
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
 * @desc    Get a single clinic by ID
 * @route   GET /api/v1/admin/clinics/:id
 * @access  Private (Super Admin)
 */
export const getClinicById = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.id);
  if (!clinic) {
    throw new ApiError(404, `Clinic not found with ID ${req.params.id}`);
  }

  res.status(200).json({
    success: true,
    data: clinic,
  });
});

/**
 * @desc    Create a new clinic registration application
 * @route   POST /api/v1/admin/clinics
 * @access  Private (Super Admin / Public Registration)
 */
export const createClinic = asyncHandler(async (req, res) => {
  const existing = await Clinic.findOne({ regId: req.body.regId.toUpperCase().trim() });
  if (existing) {
    throw new ApiError(409, `A clinic is already registered with reference ID "${req.body.regId}".`);
  }

  const clinic = await Clinic.create({
    ...req.body,
    regId: req.body.regId.toUpperCase().trim(),
    timeline: [
      {
        date: new Date(),
        event: 'Clinic application created and submitted for clinical compliance review.',
        actor: req.user?.name || 'Applicant',
      },
    ],
  });

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'CLINIC_APPLICATION_SUBMITTED',
    targetType: 'Private Clinic',
    targetId: clinic._id,
    targetName: clinic.name,
    outcome: 'info',
    details: `Application created for ${clinic.name} with ID ${clinic.regId}.`,
  });

  res.status(201).json({
    success: true,
    data: clinic,
  });
});

/**
 * @desc    Update permitted clinic details
 * @route   PATCH /api/v1/admin/clinics/:id
 * @access  Private (Super Admin)
 */
export const updateClinic = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findById(req.params.id);
  if (!clinic) {
    throw new ApiError(404, `Clinic not found with ID ${req.params.id}`);
  }

  const permittedFields = [
    'name',
    'category',
    'city',
    'state',
    'address',
    'email',
    'phone',
    'specialtiesCount',
    'specialties',
    'consultationRooms',
    'authorizedRepresentative',
    'reviewNotes',
  ];

  permittedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      clinic[field] = req.body[field];
    }
  });

  clinic.timeline.unshift({
    date: new Date(),
    event: `Clinic details updated by ${req.user.name}.`,
    actor: req.user.name,
  });

  await clinic.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'CLINIC_UPDATED',
    targetType: 'Private Clinic',
    targetId: clinic._id,
    targetName: clinic.name,
    outcome: 'info',
    details: `Updated registry details for clinic: ${clinic.name}.`,
  });

  res.status(200).json({
    success: true,
    data: clinic,
  });
});

/**
 * @desc    Suspend or reactivate clinic account access
 * @route   PATCH /api/v1/admin/clinics/:id/status
 * @access  Private (Super Admin)
 */
export const updateClinicAccountStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const clinic = await Clinic.findById(req.params.id);
  if (!clinic) {
    throw new ApiError(404, `Clinic not found with ID ${req.params.id}`);
  }

  const oldStatus = clinic.accountStatus;
  clinic.accountStatus = status;

  const eventText =
    status === 'suspended'
      ? `Clinic account suspended by Super Admin (${req.user.name}). ${reason ? `Reason: ${reason}` : ''}`
      : `Clinic account access reactivated by Super Admin (${req.user.name}).`;

  clinic.timeline.unshift({
    date: new Date(),
    event: eventText,
    actor: req.user.name,
  });

  await clinic.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: status === 'suspended' ? 'FACILITY_SUSPENDED' : 'FACILITY_REACTIVATED',
    targetType: 'Private Clinic',
    targetId: clinic._id,
    targetName: clinic.name,
    outcome: status === 'suspended' ? 'warning' : 'success',
    details: `Account state transitioned from '${oldStatus}' to '${status}'. ${reason ? `Reason: ${reason}` : ''}`,
  });

  res.status(200).json({
    success: true,
    data: clinic,
  });
});
