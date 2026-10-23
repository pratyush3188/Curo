import mongoose from 'mongoose';
import { Report } from '../models/Report.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractTextFromFileBuffer,
  simplifyMedicalReportWithGroq,
  queryGroq,
} from '../services/groqService.js';

// In-memory fallback if Mongo is offline
const inMemoryReports = [];

/**
 * @desc    Upload & analyze medical report with Groq AI
 * @route   POST /api/reports/analyze
 */
export const analyzeReport = asyncHandler(async (req, res) => {
  let extractedText = req.body.rawText || req.body.text || '';
  let fileName = 'Direct Input';
  let fileType = 'text/plain';

  if (req.file) {
    fileName = req.file.originalname;
    fileType = req.file.mimetype;
    extractedText = await extractTextFromFileBuffer(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );
  }

  if (!extractedText || extractedText.trim().length === 0) {
    throw new ApiError(400, 'Could not extract text from uploaded document. Please enter or paste the report text.');
  }

  const {
    patientName = req.user?.name || 'Patient',
    age = 30,
    gender = req.user?.gender || 'Not specified',
    language = 'English',
    symptoms = '',
    reportType = 'Clinical Diagnostic Panel',
  } = req.body;

  const analysisResult = await simplifyMedicalReportWithGroq({
    text: extractedText,
    patientName,
    age,
    gender,
    language,
    symptoms,
    reportType,
  });

  const reportData = {
    userId: req.user?._id || req.user?.id || 'demo-user-id',
    title: req.body.title || `${reportType} - ${new Date().toLocaleDateString()}`,
    fileName,
    fileType,
    reportDate: new Date(),
    patientName,
    labName: analysisResult.data?.hospital_name || 'Curo Verified Diagnostic Laboratory',
    reportCategory: reportType,
    isPinned: false,
    healthScore: analysisResult.data?.health_score ?? 85,
    executiveSummary: analysisResult.data?.disease_prediction || '',
    laymanExplanation: analysisResult.markdown || '',
    biomarkers: (analysisResult.data?.lab_values || []).map((v) => ({
      name: v.name,
      value: String(v.value),
      unit: v.unit || '',
      referenceRange: v.range || '',
      status: v.severity === 'Critical' ? 'critical' : v.severity === 'Attention Required' ? 'elevated' : 'normal',
      interpretation: v.severity || 'Normal',
    })),
    keyObservations: [analysisResult.data?.disease_prediction].filter(Boolean),
    rawExtractedText: extractedText,
  };

  let savedReport = null;
  if (mongoose.connection.readyState === 1 && req.user?._id) {
    try {
      savedReport = await Report.create(reportData);
    } catch (dbErr) {
      console.warn('[DB Report Save Warning]', dbErr.message);
    }
  }

  if (!savedReport) {
    savedReport = {
      ...reportData,
      id: `rep_${Date.now()}`,
      _id: `rep_${Date.now()}`,
      createdAt: new Date(),
    };
    inMemoryReports.unshift(savedReport);
  }

  res.status(200).json({
    success: true,
    data: analysisResult.data,
    markdown: analysisResult.markdown,
    report: savedReport,
    modelUsed: analysisResult.modelUsed,
  });
});

/**
 * @desc    Get user's reports history
 * @route   GET /api/reports
 */
export const getUserReports = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;
  let reports = [];

  if (mongoose.connection.readyState === 1 && userId) {
    try {
      reports = await Report.find({ userId }).sort({ isPinned: -1, createdAt: -1 });
    } catch (e) {
      console.warn('[DB Error]', e.message);
    }
  }

  if (!reports || reports.length === 0) {
    reports = inMemoryReports.filter((r) => String(r.userId) === String(userId) || true);
  }

  res.status(200).json({
    success: true,
    count: reports.length,
    reports,
  });
});

/**
 * @desc    Get report by id
 * @route   GET /api/reports/:id
 */
export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let report = null;

  if (mongoose.connection.readyState === 1) {
    try {
      report = await Report.findById(id);
    } catch {
      // not a mongo id
    }
  }

  if (!report) {
    report = inMemoryReports.find((r) => r.id === id || r._id === id);
  }

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  res.status(200).json({
    success: true,
    report,
  });
});

/**
 * @desc    Toggle pin status of a report
 * @route   PATCH /api/reports/:id/pin
 */
export const togglePinReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let report = null;

  if (mongoose.connection.readyState === 1) {
    try {
      report = await Report.findById(id);
      if (report) {
        report.isPinned = !report.isPinned;
        await report.save();
      }
    } catch {
      // fallback
    }
  }

  if (!report) {
    report = inMemoryReports.find((r) => r.id === id || r._id === id);
    if (report) {
      report.isPinned = !report.isPinned;
    }
  }

  if (!report) {
    throw new ApiError(404, 'Report not found');
  }

  res.status(200).json({
    success: true,
    isPinned: report.isPinned,
    report,
  });
});

/**
 * @desc    Delete report
 * @route   DELETE /api/reports/:id
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState === 1) {
    try {
      await Report.findByIdAndDelete(id);
    } catch {
      // fallback
    }
  }

  const idx = inMemoryReports.findIndex((r) => r.id === id || r._id === id);
  if (idx !== -1) {
    inMemoryReports.splice(idx, 1);
  }

  res.status(200).json({
    success: true,
    message: 'Report deleted successfully',
  });
});

/**
 * @desc    Generate personalized diet plan based on lab report biomarkers
 * @route   POST /api/reports/diet
 */
export const getDietPlan = asyncHandler(async (req, res) => {
  const { biomarkers = [], healthGoals = 'General Vitality', dietaryPreference = 'Balanced' } = req.body;

  const prompt = `Based on these biomarkers: ${JSON.stringify(biomarkers)}, health goals: ${healthGoals}, and preference: ${dietaryPreference}, create a comprehensive clinical meal plan with foods to focus on, foods to avoid, and hydration/supplementation guidance. Format with beautiful Markdown headings, tables, and bullet points.`;

  const { content } = await queryGroq([
    { role: 'system', content: 'You are an elite clinical nutritionist and dietitian.' },
    { role: 'user', content: prompt },
  ]);

  res.status(200).json({
    success: true,
    dietPlan: content,
  });
});
