import mongoose from 'mongoose';
import { Consent } from '../models/Consent.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const inMemoryConsents = [];

/**
 * @desc    Grant digital consent to doctor, hospital or clinic
 * @route   POST /api/consent/grant
 * @access  Private (Patient)
 */
export const grantConsent = asyncHandler(async (req, res) => {
  const {
    granteeId,
    granteeType,
    granteeName,
    purpose,
    permissions = ['view_reports', 'view_prescriptions'],
    validDays = 30,
  } = req.body;

  if (!granteeId || !granteeType || !granteeName) {
    throw new ApiError(400, 'Grantee ID, type, and name are required');
  }

  const patientId = req.user?._id || req.user?.id;
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

  const consentData = {
    patientId,
    granteeId,
    granteeType,
    granteeName,
    purpose: purpose || 'Clinical Consultation and Medical History Evaluation',
    permissions,
    status: 'active',
    grantedAt: new Date(),
    expiresAt,
  };

  let consent = null;
  if (mongoose.connection.readyState === 1 && patientId) {
    // Revoke any previous active consent to same grantee
    await Consent.updateMany(
      { patientId, granteeId, status: 'active' },
      { status: 'revoked', revokedAt: new Date() }
    );
    consent = await Consent.create(consentData);
  } else {
    consent = {
      ...consentData,
      _id: `cns_${Date.now()}`,
      id: `cns_${Date.now()}`,
      createdAt: new Date(),
    };
    inMemoryConsents.unshift(consent);
  }

  res.status(201).json({
    success: true,
    message: `Consent successfully granted to ${granteeName} for ${validDays} days.`,
    consent,
  });
});

/**
 * @desc    Revoke consent
 * @route   PATCH /api/consent/:id/revoke
 * @access  Private (Patient)
 */
export const revokeConsent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let consent = null;
  if (mongoose.connection.readyState === 1) {
    consent = await Consent.findById(id);
    if (consent) {
      consent.status = 'revoked';
      consent.revokedAt = new Date();
      await consent.save();
    }
  }

  if (!consent) {
    consent = inMemoryConsents.find((c) => c.id === id || c._id === id);
    if (consent) {
      consent.status = 'revoked';
      consent.revokedAt = new Date();
    }
  }

  if (!consent) {
    throw new ApiError(404, 'Consent record not found');
  }

  res.status(200).json({
    success: true,
    message: `Consent for ${consent.granteeName} has been revoked.`,
    consent,
  });
});

/**
 * @desc    Get patient's active and historical consents
 * @route   GET /api/consent/my
 * @access  Private (Patient)
 */
export const getMyConsents = asyncHandler(async (req, res) => {
  const patientId = req.user?._id || req.user?.id;
  let consents = [];

  if (mongoose.connection.readyState === 1 && patientId) {
    consents = await Consent.find({ patientId }).sort({ createdAt: -1 });
  } else {
    consents = inMemoryConsents.filter((c) => String(c.patientId) === String(patientId) || true);
  }

  res.status(200).json({
    success: true,
    count: consents.length,
    consents,
  });
});

/**
 * @desc    Verify if active consent exists for provider
 * @route   GET /api/consent/verify
 * @access  Private
 */
export const checkConsentStatus = asyncHandler(async (req, res) => {
  const { patientId, granteeId } = req.query;

  if (!patientId || !granteeId) {
    throw new ApiError(400, 'patientId and granteeId query parameters are required');
  }

  let consent = null;
  if (mongoose.connection.readyState === 1) {
    consent = await Consent.findOne({
      patientId,
      granteeId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });
  } else {
    consent = inMemoryConsents.find(
      (c) =>
        String(c.patientId) === String(patientId) &&
        String(c.granteeId) === String(granteeId) &&
        c.status === 'active' &&
        new Date(c.expiresAt) > new Date()
    );
  }

  res.status(200).json({
    success: true,
    hasActiveConsent: Boolean(consent),
    consent,
  });
});
