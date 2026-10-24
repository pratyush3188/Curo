import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Hospital } from '../models/Hospital.js';
import { Clinic } from '../models/Clinic.js';
import { User } from '../models/User.js';
import { Application } from '../models/Application.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * Helper to find facility across Hospital or Clinic collections safely
 */
const findFacility = async (id, facilityType) => {
  if (!id) return { facility: null, model: null, type: null };

  const query = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { regId: id }, { clinicId: id }] }
    : { $or: [{ regId: id }, { clinicId: id }] };

  if (facilityType === 'hospital') {
    const hosp = await Hospital.findOne(query);
    return { facility: hosp, model: Hospital, type: 'hospital' };
  }
  if (facilityType === 'clinic') {
    const cln = await Clinic.findOne(query);
    return { facility: cln, model: Clinic, type: 'clinic' };
  }

  // If type not specified, check Hospital first then Clinic
  const hosp = await Hospital.findOne(query);
  if (hosp) return { facility: hosp, model: Hospital, type: 'hospital' };

  const cln = await Clinic.findOne(query);
  if (cln) return { facility: cln, model: Clinic, type: 'clinic' };

  // Also check if id is an Application record _id
  if (mongoose.isValidObjectId(id)) {
    try {
      const app = await Application.findById(id);
      if (app && app.facilityId) {
        return await findFacility(app.facilityId.toString(), app.facilityType);
      }
    } catch {
      // ignore
    }
  }

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
  const { reviewNotes = '', assignEmail, assignPassword } = req.body;
  const { facility, type } = await findFacility(req.params.id, req.body.facilityType);
  if (!facility) {
    throw new ApiError(404, `Facility application not found with ID ${req.params.id}`);
  }

  facility.verificationStatus = 'approved';
  facility.accountStatus = 'active';
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
    event: `Application approved by Super Admin (${req.user?.name || 'Super Admin'}). Facility and administrative accounts activated.`,
    actor: req.user?.name || 'Super Admin',
  });

  await facility.save();

  // Also update Application collection record
  try {
    await Application.updateMany(
      { facilityId: facility._id },
      { status: 'approved', reviewedAt: new Date(), reviewerId: req.user?._id }
    );
  } catch (err) {
    console.warn('[Application Sync Warning]', err.message);
  }

  // Determine credentials to assign
  const targetEmail = (assignEmail || facility.authorizedRepresentative?.email || facility.email || '').toLowerCase().trim();
  const assignedRole = type === 'hospital' ? 'hospital_owner' : 'clinic';
  let userAccount = null;

  try {
    // 1. Check if a user with targetEmail already exists in MongoDB
    const existingEmailUser = await User.findOne({ email: targetEmail });
    // 2. Check if a user is currently associated with this facility
    const existingFacilityUser = await User.findOne({
      $or: [
        { associatedFacilityId: facility._id.toString() },
        ...(facility.regId ? [{ associatedFacilityId: facility.regId }] : []),
        ...(facility.clinicId ? [{ associatedFacilityId: facility.clinicId }] : []),
      ],
    });

    if (existingEmailUser) {
      // If the email already exists (even if previously registered as patient or old account), upgrade to facility account!
      existingEmailUser.accountStatus = 'active';
      existingEmailUser.isActive = true;
      existingEmailUser.role = assignedRole;
      existingEmailUser.associatedFacilityType = type;
      existingEmailUser.associatedFacilityId = facility._id.toString();
      existingEmailUser.facilityName = facility.name;
      if (assignPassword && assignPassword.trim()) {
        existingEmailUser.password = assignPassword.trim();
      }
      await existingEmailUser.save();
      userAccount = existingEmailUser;

      // If there was an old different user tied to this facility, unlink its association
      if (existingFacilityUser && existingFacilityUser._id.toString() !== existingEmailUser._id.toString()) {
        existingFacilityUser.associatedFacilityId = null;
        existingFacilityUser.associatedFacilityType = null;
        await existingFacilityUser.save();
      }
    } else if (existingFacilityUser) {
      // Update existing facility user with the newly assigned email & password
      existingFacilityUser.email = targetEmail;
      existingFacilityUser.accountStatus = 'active';
      existingFacilityUser.isActive = true;
      existingFacilityUser.role = assignedRole;
      existingFacilityUser.associatedFacilityType = type;
      existingFacilityUser.associatedFacilityId = facility._id.toString();
      existingFacilityUser.facilityName = facility.name;
      if (assignPassword && assignPassword.trim()) {
        existingFacilityUser.password = assignPassword.trim();
      }
      await existingFacilityUser.save();
      userAccount = existingFacilityUser;
    } else {
      // Create new user account with assigned credentials
      const initialPass = assignPassword && assignPassword.trim() ? assignPassword.trim() : 'Curo@2026!';
      userAccount = await User.create({
        name: facility.authorizedRepresentative?.name || facility.name,
        email: targetEmail,
        password: initialPass,
        role: assignedRole,
        associatedFacilityType: type,
        associatedFacilityId: facility._id.toString(),
        facilityName: facility.name,
        accountStatus: 'active',
        isActive: true,
        phone: facility.authorizedRepresentative?.phone || facility.phone || '',
      });
    }

    // Also update authorizedRepresentative email on facility
    if (facility.authorizedRepresentative) {
      facility.authorizedRepresentative.email = targetEmail;
      await facility.save();
    }
  } catch (err) {
    console.error('[User Account Provisioning Error]', err);
    throw new ApiError(500, `Failed to provision user credentials for ${targetEmail}: ${err.message}`);
  }

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'APPLICATION_APPROVED',
    targetType: type === 'hospital' ? 'Hospital Application' : 'Clinic Application',
    targetId: facility._id,
    targetName: facility.name,
    outcome: 'success',
    details: `Approved verification credentials for ${facility.name} (Reg: ${facility.regId}). Admin assigned account: ${targetEmail}.`,
  });

  res.status(200).json({
    success: true,
    message: `Application for ${facility.name} approved successfully! Login account activated for ${targetEmail}.`,
    data: {
      ...facility.toObject(),
      id: facility._id.toString(),
      facilityType: type,
    },
    credentials: {
      email: targetEmail,
      assignedPassword: assignPassword ? assignPassword.trim() : '(Registered password retained or Curo@123)',
      role: assignedRole,
      loginUrl: '/login',
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
