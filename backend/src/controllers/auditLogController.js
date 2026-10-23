import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get paginated and filterable system audit logs
 * @route   GET /api/v1/admin/audit-logs
 * @access  Private (Super Admin)
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, targetType, outcome, search, page = 1, limit = 50 } = req.query;

  const query = {};

  if (action && action !== 'all') {
    query.action = action;
  }

  if (targetType && targetType !== 'all') {
    query.targetType = targetType;
  }

  if (outcome && outcome !== 'all') {
    query.outcome = outcome;
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { details: { $regex: s, $options: 'i' } },
      { targetName: { $regex: s, $options: 'i' } },
      { actorName: { $regex: s, $options: 'i' } },
      { action: { $regex: s, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ timestamp: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    AuditLog.countDocuments(query),
  ]);

  const formatted = logs.map((l) => ({
    ...l,
    id: l._id.toString(),
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
