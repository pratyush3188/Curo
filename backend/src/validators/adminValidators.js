import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Activation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().optional(),
});

export const createHospitalSchema = z.object({
  name: z.string().min(2, 'Hospital name is required').trim(),
  regId: z.string().min(3, 'Registration ID is required').trim(),
  type: z.string().optional(),
  city: z.string().min(2, 'City is required').trim(),
  state: z.string().min(2, 'State is required').trim(),
  address: z.string().min(5, 'Physical address is required').trim(),
  email: z.string().email('Valid registry email is required').trim().toLowerCase(),
  phone: z.string().min(7, 'Valid phone number is required').trim(),
  departmentsCount: z.number().int().nonnegative().optional(),
  departments: z.array(z.string()).optional(),
  bedCapacity: z.number().int().nonnegative().optional(),
  icuBeds: z.number().int().nonnegative().optional(),
  authorizedRepresentative: z.object({
    name: z.string().min(2, 'Representative name is required').trim(),
    designation: z.string().optional(),
    email: z.string().email('Representative email must be valid').trim().toLowerCase(),
    phone: z.string().optional(),
  }),
});

export const updateHospitalSchema = createHospitalSchema.partial();

export const createClinicSchema = z.object({
  name: z.string().min(2, 'Clinic name is required').trim(),
  regId: z.string().min(3, 'Registration ID is required').trim(),
  category: z.string().optional(),
  city: z.string().min(2, 'City is required').trim(),
  state: z.string().min(2, 'State is required').trim(),
  address: z.string().min(5, 'Physical address is required').trim(),
  email: z.string().email('Valid registry email is required').trim().toLowerCase(),
  phone: z.string().min(7, 'Valid phone number is required').trim(),
  specialtiesCount: z.number().int().nonnegative().optional(),
  specialties: z.array(z.string()).optional(),
  consultationRooms: z.number().int().nonnegative().optional(),
  authorizedRepresentative: z.object({
    name: z.string().min(2, 'Representative name is required').trim(),
    designation: z.string().optional(),
    email: z.string().email('Representative email must be valid').trim().toLowerCase(),
    phone: z.string().optional(),
  }),
});

export const updateClinicSchema = createClinicSchema.partial();

export const facilityStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'inactive']),
  reason: z.string().optional(),
});

export const approveApplicationSchema = z.object({
  reviewNotes: z.string().optional(),
  facilityType: z.enum(['hospital', 'clinic']).optional(),
});

export const rejectApplicationSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters').trim(),
  facilityType: z.enum(['hospital', 'clinic']).optional(),
});

export const requestInfoSchema = z.object({
  message: z.string().min(5, 'Clarification message must be at least 5 characters').trim(),
  facilityType: z.enum(['hospital', 'clinic']).optional(),
});

export const createInvitationSchema = z.object({
  facilityId: z.string().min(1, 'Facility ID is required'),
  facilityType: z.enum(['hospital', 'clinic']),
  facilityName: z.string().min(1, 'Facility name is required').trim(),
  inviteeName: z.string().min(2, 'Invitee name is required').trim(),
  email: z.string().email('Valid email address is required').trim().toLowerCase(),
  phone: z.string().optional(),
  role: z.enum(['hospital_manager', 'clinic_manager', 'department_manager', 'hospital_admin', 'manager']).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'inactive']),
  reason: z.string().optional(),
});

export const updateSettingsSchema = z.object({
  platformName: z.string().optional(),
  tagline: z.string().optional(),
  supportEmail: z.string().email().optional(),
  emergencyHotline: z.string().optional(),
  adminProfile: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    department: z.string().optional(),
    timezone: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  reviewPreferences: z.object({
    autoAssignReviewer: z.boolean().optional(),
    requireAllDocuments: z.boolean().optional(),
    emailAlertsOnSubmission: z.boolean().optional(),
    verificationSlaDays: z.number().optional(),
  }).optional(),
  securityPreferences: z.object({
    sessionTimeoutMinutes: z.number().optional(),
    enforce2FAForFacilityManagers: z.boolean().optional(),
    restrictAdminIp: z.boolean().optional(),
    auditLogRetentionDays: z.number().optional(),
  }).optional(),
  themePreference: z.string().optional(),
});
