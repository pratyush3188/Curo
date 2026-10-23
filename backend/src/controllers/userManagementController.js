import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';
import { GOVERNANCE_ROLES } from '../constants/roles.js';

/**
 * @desc    Get all governance accounts (Super Admin, Hospital Managers, Clinic Managers, Dept Managers)
 * @route   GET /api/v1/admin/users
 * @access  Private (Super Admin)
 * @note    Enforces strict privacy separation: Patient and Doctor profiles are partitioned and cannot be queried.
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { search, role, accountStatus, page = 1, limit = 50 } = req.query;

  // Strict Server-Side Privacy Restriction: only allow governance accounts
  const query = {
    role: { $in: GOVERNANCE_ROLES },
  };

  if (role && role !== 'all') {
    // If the requester asks for doctor or patient, return empty or reject
    if (role === 'doctor' || role === 'patient') {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page: 1,
        pages: 1,
        data: [],
      });
    }
    query.role = role;
  }

  if (accountStatus && accountStatus !== 'all') {
    query.accountStatus = accountStatus;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { facilityName: { $regex: s, $options: 'i' } },
      { department: { $regex: s, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-medicalHistorySummary -bloodGroup -emergencyContact -professionalInfo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(query),
  ]);

  const formatted = users.map((u) => ({
    ...u,
    id: u._id.toString(),
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
 * @desc    Get user account details by ID
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (Super Admin)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    '-medicalHistorySummary -bloodGroup -emergencyContact -professionalInfo'
  );

  if (!user) {
    throw new ApiError(404, `User account not found with ID ${req.params.id}`);
  }

  // Enforce server-side restriction: Super Admin must NOT view doctor or patient personal identities
  if (user.role === 'patient' || user.role === 'doctor') {
    throw new ApiError(
      403,
      'Access restricted: Individual patient and clinician personal health records are partitioned and shielded from platform Super Admin access under healthcare data privacy regulations.'
    );
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update user account status (active, suspended, inactive)
 * @route   PATCH /api/v1/admin/users/:id/status
 * @access  Private (Super Admin)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, `User account not found with ID ${req.params.id}`);
  }

  // Protect the platform Super Admin account
  if (user.role === 'super_admin') {
    throw new ApiError(
      403,
      'Platform Super Admin account holds platform-level governance authority and cannot be suspended or deactivated.'
    );
  }

  const oldStatus = user.accountStatus;
  user.accountStatus = status;
  user.isActive = status === 'active';

  await user.save();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: status === 'suspended' ? 'USER_SUSPENDED' : 'USER_STATUS_UPDATED',
    targetType: 'User Account',
    targetId: user._id,
    targetName: `${user.name} (${user.email})`,
    outcome: status === 'suspended' ? 'warning' : 'success',
    details: `Account state transitioned from '${oldStatus}' to '${status}'. ${reason ? `Reason: ${reason}` : ''}`,
  });

  res.status(200).json({
    success: true,
    message: `Account status updated to ${status}.`,
    data: user,
  });
});
