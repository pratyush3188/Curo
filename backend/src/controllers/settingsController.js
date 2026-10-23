import { AdminSettings } from '../models/AdminSettings.js';
import { Hospital } from '../models/Hospital.js';
import { Clinic } from '../models/Clinic.js';
import { Invitation } from '../models/Invitation.js';
import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { recordAuditLog } from '../services/auditService.js';
import { seedInitialData } from '../scripts/seed.js';

/**
 * @desc    Get admin platform settings
 * @route   GET /api/v1/admin/settings
 * @access  Private (Super Admin)
 */
export const getSettings = asyncHandler(async (req, res) => {
  let settings = await AdminSettings.findOne();
  if (!settings) {
    settings = await AdminSettings.create({
      platformName: 'CURO Admin',
    });
  }

  res.status(200).json({
    success: true,
    data: settings,
  });
});

/**
 * @desc    Update admin platform settings
 * @route   PUT /api/v1/admin/settings
 * @access  Private (Super Admin)
 */
export const updateSettings = asyncHandler(async (req, res) => {
  let settings = await AdminSettings.findOne();
  if (!settings) {
    settings = await AdminSettings.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'ADMIN_SETTINGS_UPDATED',
    targetType: 'System Configuration',
    targetId: settings._id,
    targetName: 'Platform Settings',
    outcome: 'success',
    details: 'Super Admin updated global platform branding, review preferences, or security parameters.',
  });

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully.',
    data: settings,
  });
});

/**
 * @desc    Reset platform demo data to initial seed state
 * @route   POST /api/v1/admin/settings/reset
 * @access  Private (Super Admin)
 */
export const resetDemoData = asyncHandler(async (req, res) => {
  await seedInitialData();

  await recordAuditLog({
    actorId: req.user._id,
    actorName: req.user.name,
    action: 'DEMO_DATA_RESET',
    targetType: 'System',
    targetId: 'all',
    targetName: 'Platform Demo Database',
    outcome: 'info',
    details: 'Super Admin reset all platform mock entities, applications, and logs to initial seed state.',
  });

  res.status(200).json({
    success: true,
    message: 'Platform demo data has been reset to initial seed state.',
  });
});
