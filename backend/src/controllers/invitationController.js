import crypto from 'crypto';
import { Invitation } from '../models/Invitation.js';
import { User } from '../models/User.js';
import { Hospital } from '../models/Hospital.js';
import { Clinic } from '../models/Clinic.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * Generate secure cryptographically random token & its SHA-256 hash
 */
const generateSecureToken = () => {
  const token = `inv_tok_${crypto.randomBytes(24).toString('hex')}`;
  const tokenHash = Invitation.hashToken(token);
  return { token, tokenHash };
};

/**
 * @desc    Get all invitations with filters
 * @route   GET /api/v1/admin/invitations
 * @access  Private (Super Admin)
 */
export const getInvitations = asyncHandler(async (req, res) => {
  const { search, status, role, facilityType, facilityId } = req.query;

  const query = {};

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { inviteeName: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { facilityName: { $regex: s, $options: 'i' } },
    ];
  }

  if (status && status !== 'all') {
    query.status = status;
  }

  if (role && role !== 'all') {
    query.role = role;
  }

  if (facilityType && facilityType !== 'all') {
    query.facilityType = facilityType;
  }

  if (facilityId) {
    query.facilityId = facilityId;
  }

  const invitations = await Invitation.find(query)
    .sort({ createdAt: -1 })
    .lean();

  const formatted = invitations.map((inv) => ({
    ...inv,
    id: inv._id.toString(),
  }));

  res.status(200).json({
    success: true,
    count: formatted.length,
    data: formatted,
  });
});

/**
 * @desc    Create a new manager onboarding invitation
 * @route   POST /api/v1/admin/invitations
 * @access  Private (Super Admin)
 */
export const createInvitation = asyncHandler(async (req, res) => {
  const {
    facilityId,
    facilityType,
    facilityName,
    inviteeName,
    email,
    phone = '',
    role,
  } = req.body;

  const cleanEmail = email.toLowerCase().trim();

  // 1. Check if user already exists
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    throw new ApiError(
      400,
      `An account already exists with email "${cleanEmail}" (Role: ${existingUser.role}).`
    );
  }

  // 2. Check if active pending invitation already exists for this email
  const existingPending = await Invitation.findOne({
    email: cleanEmail,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });

  if (existingPending) {
    throw new ApiError(
      400,
      `An active invitation is already pending for email "${cleanEmail}".`
    );
  }

  // 3. Generate token & 30-day expiration
  const { token, tokenHash } = generateSecureToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
  const simulatedLink = `${clientOrigin}/activate?token=${token}`;

  const assignedRole =
    role || (facilityType === 'hospital' ? 'hospital_manager' : 'clinic_manager');

  const invitation = await Invitation.create({
    facilityId,
    facilityType,
    facilityName,
    inviteeName: inviteeName.trim(),
    email: cleanEmail,
    phone: phone ? phone.trim() : '',
    role: assignedRole,
    tokenHash,
    token, // Stored to construct simulation link in development mode
    simulatedLink,
    expiresAt,
    status: 'pending',
    createdBy: req.user?._id,
  });

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'MANAGER_INVITATION_CREATED',
    targetType: 'Manager Invitation',
    targetId: invitation._id,
    targetName: `${invitation.inviteeName} (${invitation.facilityName})`,
    outcome: 'success',
    details: `Generated pending invitation link for ${invitation.email} as ${invitation.role}. Token expires in 30 days.`,
  });

  res.status(201).json({
    success: true,
    message: `Invitation created for ${invitation.inviteeName}.`,
    data: {
      ...invitation.toObject(),
      id: invitation._id.toString(),
    },
  });
});

/**
 * @desc    Resend an invitation with a renewed 30-day token
 * @route   POST /api/v1/admin/invitations/:id/resend
 * @access  Private (Super Admin)
 */
export const resendInvitation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findById(req.params.id);
  if (!invitation) {
    throw new ApiError(404, `Invitation not found with ID ${req.params.id}`);
  }

  const { token, tokenHash } = generateSecureToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  invitation.token = token;
  invitation.tokenHash = tokenHash;
  invitation.simulatedLink = `${clientOrigin}/activate?token=${token}`;
  invitation.expiresAt = expiresAt;
  invitation.status = 'pending';

  await invitation.save();

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'MANAGER_INVITATION_RESENT',
    targetType: 'Manager Invitation',
    targetId: invitation._id,
    targetName: `${invitation.inviteeName} (${invitation.email})`,
    outcome: 'info',
    details: `Renewed invitation token with fresh 30-day expiration dispatched to ${invitation.email}.`,
  });

  res.status(200).json({
    success: true,
    message: `Invitation resent to ${invitation.email}.`,
    data: {
      ...invitation.toObject(),
      id: invitation._id.toString(),
    },
  });
});

/**
 * @desc    Revoke an active invitation
 * @route   POST /api/v1/admin/invitations/:id/revoke
 * @access  Private (Super Admin)
 */
export const revokeInvitation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findById(req.params.id);
  if (!invitation) {
    throw new ApiError(404, `Invitation not found with ID ${req.params.id}`);
  }

  invitation.status = 'revoked';
  await invitation.save();

  await recordAuditLog({
    actorId: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'MANAGER_INVITATION_REVOKED',
    targetType: 'Manager Invitation',
    targetId: invitation._id,
    targetName: `${invitation.inviteeName} (${invitation.email})`,
    outcome: 'warning',
    details: `Invitation revoked by ${req.user.name}. Activation token invalidated.`,
  });

  res.status(200).json({
    success: true,
    message: `Invitation for ${invitation.inviteeName} has been revoked.`,
    data: {
      ...invitation.toObject(),
      id: invitation._id.toString(),
    },
  });
});

/**
 * Helper to process invitation acceptance & manager creation
 */
const executeInvitationActivation = async (invitation, password, actorName) => {
  // 1. Mark invitation accepted
  invitation.status = 'accepted';
  await invitation.save();

  // 2. Create or activate User record
  let user = await User.findOne({ email: invitation.email });
  if (!user) {
    user = await User.create({
      name: invitation.inviteeName,
      email: invitation.email,
      password: password || 'TempPass@Curo2026!',
      role: invitation.role,
      phone: invitation.phone || '',
      associatedFacilityType: invitation.facilityType,
      associatedFacilityId: invitation.facilityId,
      facilityName: invitation.facilityName,
      department:
        invitation.facilityType === 'hospital'
          ? 'Hospital Administration'
          : 'Clinic Operations',
      accountStatus: 'active',
      lastLogin: new Date(),
    });
  } else {
    user.accountStatus = 'active';
    user.associatedFacilityType = invitation.facilityType;
    user.associatedFacilityId = invitation.facilityId;
    user.facilityName = invitation.facilityName;
    if (password) user.password = password;
    await user.save();
  }

  // 3. Mark Facility account as active and bind manager
  const managerAccountData = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    status: 'active',
  };

  if (invitation.facilityType === 'hospital') {
    const hosp = await Hospital.findById(invitation.facilityId);
    if (hosp) {
      hosp.accountStatus = 'active';
      hosp.managerAccount = managerAccountData;
      hosp.timeline.unshift({
        date: new Date(),
        event: `Hospital Manager ${user.name} accepted onboarding invitation and activated facility account.`,
        actor: actorName || 'System',
      });
      await hosp.save();
    }
  } else {
    const cln = await Clinic.findById(invitation.facilityId);
    if (cln) {
      cln.accountStatus = 'active';
      cln.managerAccount = managerAccountData;
      cln.timeline.unshift({
        date: new Date(),
        event: `Clinic Manager ${user.name} accepted onboarding invitation and activated clinic account.`,
        actor: actorName || 'System',
      });
      await cln.save();
    }
  }

  await recordAuditLog({
    actorId: user._id,
    actorName: user.name,
    action: 'ACCOUNT_ACTIVATED',
    targetType: 'User Account',
    targetId: user._id,
    targetName: `${user.name} (${user.email})`,
    outcome: 'success',
    details: `Manager invitation activation completed. Role: ${user.role}. Associated Facility: ${invitation.facilityName}. Facility account activated.`,
  });

  return { invitation, user };
};

/**
 * @desc    Accept invitation and set password (Public/Manager Route)
 * @route   POST /api/v1/auth/invitations/accept
 * @access  Public (Token verification)
 */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token) {
    throw new ApiError(400, 'Activation token is required.');
  }

  const tokenHash = Invitation.hashToken(token);
  const invitation = await Invitation.findOne({
    $or: [{ tokenHash }, { token }],
  });

  if (!invitation) {
    throw new ApiError(404, 'Invalid or unrecognized invitation token.');
  }

  if (invitation.status !== 'pending') {
    throw new ApiError(400, `This invitation has already been ${invitation.status}.`);
  }

  if (new Date() > new Date(invitation.expiresAt)) {
    invitation.status = 'expired';
    await invitation.save();
    throw new ApiError(410, 'This invitation link has expired. Please contact the administrator.');
  }

  const { user } = await executeInvitationActivation(invitation, password, invitation.inviteeName);

  res.status(200).json({
    success: true,
    message: 'Your account has been activated successfully! You may now sign in.',
    data: {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      facilityName: user.facilityName,
    },
  });
});

/**
 * @desc    Simulate manager activation directly from Super Admin console
 * @route   POST /api/v1/admin/invitations/:id/activate
 * @access  Private (Super Admin)
 */
export const simulateActivation = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findById(req.params.id);
  if (!invitation) {
    throw new ApiError(404, `Invitation not found with ID ${req.params.id}`);
  }

  if (invitation.status !== 'pending') {
    throw new ApiError(400, `Cannot activate an invitation with status "${invitation.status}".`);
  }

  const { user } = await executeInvitationActivation(invitation, 'Manager@Demo2026!', req.user.name);

  res.status(200).json({
    success: true,
    message: `Simulated activation complete. Account activated for ${user.name}.`,
    data: {
      invitation: {
        ...invitation.toObject(),
        id: invitation._id.toString(),
      },
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        facilityName: user.facilityName,
      },
    },
  });
});
