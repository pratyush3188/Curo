import { Hospital } from '../models/Hospital.js';
import { Clinic } from '../models/Clinic.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * Helper to find facility across Hospital or Clinic collections
 */
const findFacility = async (id, facilityType) => {
  if (facilityType === 'hospital') {
    const hosp = await Hospital.findById(id);
    return { facility: hosp, model: Hospital, type: 'hospital' };
  }
  if (facilityType === 'clinic') {
    const cln = await Clinic.findById(id);
    return { facility: cln, model: Clinic, type: 'clinic' };
  }

  // If type not specified, check Hospital first then Clinic
  const hosp = await Hospital.findById(id);
  if (hosp) return { facility: hosp, model: Hospital, type: 'hospital' };

  const cln = await Clinic.findById(id);
  if (cln) return { facility: cln, model: Clinic, type: 'clinic' };

  return { facility: null, model: null, type: null };
};

/**
 * @desc    Get all applications (hospitals & clinics combined or filtered)
 * @route   GET /api/v1/admin/applications
 * @access  Private (Super Admin)
 */
export const getApplications = asyncHandler(async (req, res) => {
  const { facilityType, status, search, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status && status !== 'all') {
    query.verificationStatus = status;
  }
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { regId: { $regex: s, $options: 'i' } },
      { city: { $regex: s, $options: 'i' } },
      { state: { $regex: s, $options: 'i' } },
    ];
  }

  let results = [];

  if (!facilityType || facilityType === 'all' || facilityType === 'hospital') {
    const hosps = await Hospital.find(query).sort({ registeredAt: -1, createdAt: -1 }).lean();
    results.push(...hosps.map((h) => ({ ...h, id: h._id.toString(), facilityType: 'hospital' })));
  }

  if (!facilityType || facilityType === 'all' || facilityType === 'clinic') {
    const clinics = await Clinic.find(query).sort({ registeredAt: -1, createdAt: -1 }).lean();
    results.push(...clinics.map((c) => ({ ...c, id: c._id.toString(), facilityType: 'clinic' })));
  }

  // Sort unified list
  results.sort((a, b) => new Date(b.registeredAt || b.createdAt) - new Date(a.registeredAt || a.createdAt));

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = results.slice(startIndex, startIndex + limitNum);

  res.status(200).json({
    success: true,
    total: results.length,
    count: paginated.length,
    page: pageNum,
    pages: Math.ceil(results.length / limitNum) || 1,
    data: paginated,
  });
});

/**
 * @desc    Get application details by facility ID
 * @route   GET /api/v1/admin/applications/:id
 * @access  Private (Super Admin)
 */
export const getApplicationById = asyncHandler(async (req, res) => {
  const { facility, type } = await findFacility(req.params.id, req.query.facilityType);
  if (!facility) {
    throw new ApiError(404, `Facility application not found with ID ${req.params.id}`);
  }

  res.status(200).json({
    success: true,
    data: {
      ...facility.toObject(),
      id: facility._id.toString(),
      facilityType: type,
    },
  });
});

/**
 * @desc    Mark an application as Under Review
 * @route   PATCH /api/v1/admin/applications/:id/review
 * @access  Private (Super Admin)
 */
export const markUnderReview = asyncHandler(async (req, res) => {
  const { facility, type } = await findFacility(req.params.id, req.body.facilityType);
  if (!facility) {
    throw new ApiError(404, `Facility application not found with ID ${req.params.id}`);
  }

  facility.verificationStatus = 'under_review';
  facility.timeline.unshift({
    date: new Date(),
    event: `Application marked Under Review by Super Admin (${req.user.name}).`,
    actor: req.user.name,
  });

  await facility.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'APPLICATION_UNDER_REVIEW',
    targetType: type === 'hospital' ? 'Hospital Application' : 'Clinic Application',
    targetId: facility._id,
    targetName: facility.name,
    outcome: 'info',
    details: `Application for ${facility.name} placed under formal compliance review.`,
  });

  res.status(200).json({
    success: true,
    data: {
      ...facility.toObject(),
      id: facility._id.toString(),
      facilityType: type,
    },
  });
});

/**
 * @desc    Approve a facility application
 * @route   PATCH /api/v1/admin/applications/:id/approve
 * @access  Private (Super Admin)
 */
export const approveApplication = asyncHandler(async (req, res) => {
  const { reviewNotes = '' } = req.body;
  const { facility, type } = await findFacility(req.params.id, req.body.facilityType);
  if (!facility) {
    throw new ApiError(404, `Facility application not found with ID ${req.params.id}`);
  }

  facility.verificationStatus = 'approved';
  if (reviewNotes) facility.reviewNotes = reviewNotes;

  // Mark uploaded documents as verified
  if (Array.isArray(facility.documents)) {
    facility.documents = facility.documents.map((doc) => ({
      ...doc,
      status: 'verified',
      verified: true,
    }));
  }

  facility.timeline.unshift({
    date: new Date(),
    event: `Application approved by Super Admin (${req.user.name}). Statutory verification cleared. Ready for manager account onboarding.`,
    actor: req.user.name,
  });

  await facility.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'APPLICATION_APPROVED',
    targetType: type === 'hospital' ? 'Hospital Application' : 'Clinic Application',
    targetId: facility._id,
    targetName: facility.name,
    outcome: 'success',
    details: `Approved verification credentials for ${facility.name} (Reg: ${facility.regId}). ${reviewNotes ? `Notes: ${reviewNotes}` : ''}`,
  });

  res.status(200).json({
    success: true,
    message: `Application for ${facility.name} approved successfully. Manager invitation is now available.`,
    data: {
      ...facility.toObject(),
      id: facility._id.toString(),
      facilityType: type,
    },
  });
});

/**
 * @desc    Reject a facility application with a mandatory reason
 * @route   PATCH /api/v1/admin/applications/:id/reject
 * @access  Private (Super Admin)
 */
export const rejectApplication = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    throw new ApiError(400, 'A formal rejection reason is mandatory.');
  }

  const { facility, type } = await findFacility(req.params.id, req.body.facilityType);
  if (!facility) {
    throw new ApiError(404, `Facility application not found with ID ${req.params.id}`);
  }

  facility.verificationStatus = 'rejected';
  facility.rejectionReason = reason.trim();
  facility.accountStatus = 'inactive';

  facility.timeline.unshift({
    date: new Date(),
    event: `Application rejected by Super Admin (${req.user.name}). Reason: ${reason.trim()}`,
    actor: req.user.name,
  });

  await facility.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'APPLICATION_REJECTED',
    targetType: type === 'hospital' ? 'Hospital Application' : 'Clinic Application',
    targetId: facility._id,
    targetName: facility.name,
    outcome: 'danger',
    details: `Application rejected for ${facility.name}. Reason: ${reason.trim()}`,
  });

  res.status(200).json({
    success: true,
    message: `Application for ${facility.name} has been rejected.`,
    data: {
      ...facility.toObject(),
      id: facility._id.toString(),
      facilityType: type,
    },
  });
});

/**
 * @desc    Request additional information/documents from applicant
 * @route   PATCH /api/v1/admin/applications/:id/request-info
 * @access  Private (Super Admin)
 */
export const requestMoreInformation = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    throw new ApiError(400, 'A clarification message describing missing documents is required.');
  }

  const { facility, type } = await findFacility(req.params.id, req.body.facilityType);
  if (!facility) {
    throw new ApiError(404, `Facility application not found with ID ${req.params.id}`);
  }

  facility.verificationStatus = 'needs_more_information';
  facility.requestInfoMessage = message.trim();

  facility.timeline.unshift({
    date: new Date(),
    event: `Information request sent by Super Admin (${req.user.name}): "${message.trim()}"`,
    actor: req.user.name,
  });

  await facility.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'APPLICATION_MORE_INFO_REQUESTED',
    targetType: type === 'hospital' ? 'Hospital Application' : 'Clinic Application',
    targetId: facility._id,
    targetName: facility.name,
    outcome: 'warning',
    details: `Clarification requested for ${facility.name}: "${message.trim()}"`,
  });

  res.status(200).json({
    success: true,
    message: `Information request dispatched to ${facility.name}.`,
    data: {
      ...facility.toObject(),
      id: facility._id.toString(),
      facilityType: type,
    },
  });
});
