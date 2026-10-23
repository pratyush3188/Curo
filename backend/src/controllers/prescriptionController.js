import mongoose from 'mongoose';
import { Prescription } from '../models/Prescription.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractTextFromFileBuffer,
  analyzePrescriptionWithGroq,
} from '../services/groqService.js';

const inMemoryPrescriptions = [];

/**
 * @desc    Analyze prescription text or image for drug contraindications and dosage safety
 * @route   POST /api/prescriptions/analyze
 */
export const analyzePrescription = asyncHandler(async (req, res) => {
  let prescriptionText = req.body.prescriptionText || req.body.text || req.body.medications || '';
  let fileName = 'Direct Input';

  if (req.file) {
    fileName = req.file.originalname;
    prescriptionText = await extractTextFromFileBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
  }

  if (!prescriptionText || prescriptionText.trim().length === 0) {
    throw new ApiError(400, 'Could not extract prescription text from uploaded file. Please enter prescription text.');
  }

  const {
    doctorName = req.body.doctorName || 'Dr. Attending Physician',
    hospitalOrClinic = req.body.hospitalOrClinic || 'City Medical Center',
  } = req.body;

  const analysis = await analyzePrescriptionWithGroq({
    prescriptionText,
    doctorName,
    hospitalOrClinic,
  });

  const prescriptionData = {
    userId: req.user?._id || req.user?.id || 'demo-user-id',
    doctorName,
    institutionName: hospitalOrClinic,
    fileName,
    safetyScore: analysis.safetyScore ?? 92,
    contraindications: analysis.contraindications || [],
    dosageWarnings: analysis.dosageWarnings || [],
    medications: analysis.medications || [],
    simplifiedSummary: analysis.simplifiedSummary || '',
    rawText: prescriptionText,
  };

  let saved = null;
  if (mongoose.connection.readyState === 1 && req.user?._id) {
    try {
      saved = await Prescription.create(prescriptionData);
    } catch (dbErr) {
      console.warn('[DB Prescription Save Error]', dbErr.message);
    }
  }

  if (!saved) {
    saved = {
      ...prescriptionData,
      id: `rx_${Date.now()}`,
      _id: `rx_${Date.now()}`,
      createdAt: new Date(),
    };
    inMemoryPrescriptions.unshift(saved);
  }

  res.status(200).json({
    success: true,
    data: analysis,
    prescription: saved,
    modelUsed: analysis.modelUsed,
  });
});

/**
 * @desc    Get user's past analyzed prescriptions
 * @route   GET /api/prescriptions/my
 */
export const getMyPrescriptions = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  let list = [];

  if (mongoose.connection.readyState === 1 && userId) {
    try {
      list = await Prescription.find({ userId }).sort({ createdAt: -1 });
    } catch (e) {
      console.warn('[DB Error]', e.message);
    }
  }

  if (!list || list.length === 0) {
    list = inMemoryPrescriptions.filter((p) => String(p.userId) === String(userId) || true);
  }

  res.status(200).json({
    success: true,
    count: list.length,
    prescriptions: list,
  });
});
