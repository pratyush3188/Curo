import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: 'CURO Admin',
    },
    tagline: {
      type: String,
      default: 'AI-Powered Healthcare Ecosystem Administration',
    },
    supportEmail: {
      type: String,
      default: 'admin-support@curo.health',
    },
    emergencyHotline: {
      type: String,
      default: '+91 11 4988 7000',
    },
    adminProfile: {
      name: { type: String, default: 'Dr. Alok Verma' },
      title: { type: String, default: 'Super Administrator & Chief Medical Systems Officer' },
      email: { type: String, default: 'admin@curo.health' },
      department: { type: String, default: 'Central Clinical Informatics Directorate' },
      timezone: { type: String, default: 'Asia/Kolkata (IST +05:30)' },
      phone: { type: String, default: '+91 98110 92341' },
    },
    reviewPreferences: {
      autoAssignReviewer: { type: Boolean, default: false },
      requireAllDocuments: { type: Boolean, default: true },
      emailAlertsOnSubmission: { type: Boolean, default: true },
      verificationSlaDays: { type: Number, default: 3 },
    },
    securityPreferences: {
      sessionTimeoutMinutes: { type: Number, default: 60 },
      enforce2FAForFacilityManagers: { type: Boolean, default: true },
      restrictAdminIp: { type: Boolean, default: false },
      auditLogRetentionDays: { type: Number, default: 365 },
    },
    themePreference: {
      type: String,
      default: 'light',
    },
  },
  {
    timestamps: true,
  }
);

export const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);
