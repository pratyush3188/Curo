import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

import { User } from '../models/User.js';
import { Hospital } from '../models/Hospital.js';
import { Clinic } from '../models/Clinic.js';
import { Invitation } from '../models/Invitation.js';
import { AuditLog } from '../models/AuditLog.js';
import { AdminSettings } from '../models/AdminSettings.js';
import {
  INITIAL_SETTINGS,
  INITIAL_HOSPITALS,
  INITIAL_CLINICS,
  INITIAL_USERS,
  INITIAL_INVITATIONS,
  INITIAL_AUDIT_LOGS,
} from '../config/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const seedInitialData = async () => {
  const isDirectConnection = mongoose.connection.readyState === 0;
  if (isDirectConnection) {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb+srv://psvt2007_db_user:A5MYm0FFAL8sJz88@cluster0.dz9vidv.mongodb.net/curo?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding.');
  }

  // Clear existing collections and drop obsolete legacy indexes
  const collectionsToClean = ['users', 'hospitals', 'clinics', 'invitations', 'auditlogs', 'adminsettings'];
  for (const colName of collectionsToClean) {
    try {
      const col = mongoose.connection.collection(colName);
      await col.deleteMany({});
      await col.dropIndexes();
    } catch {
      // Ignore if index or collection doesn't exist yet
    }
  }
  console.log('[Seed] Cleared existing collections and obsolete indexes.');
  console.log('[Seed] Cleared existing collections.');

  // 1. Seed Super Admin & Governance Users
  const defaultPassword = process.env.SUPERADMIN_PASSWORD || 'Admin@Demo2026!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const usersToInsert = INITIAL_USERS.map((u) => ({
    name: u.name,
    email: u.email.toLowerCase().trim(),
    password: passwordHash,
    role: u.role,
    associatedFacilityType: u.facilityType,
    associatedFacilityId: u.facilityId,
    facilityName: u.facilityName || '',
    department: u.department || '',
    accountStatus: u.accountStatus || 'active',
    phone: u.phone || '',
    lastLogin: u.lastLogin ? new Date(u.lastLogin) : new Date(),
  }));

  // Ensure exactly one super admin exists
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || 'admin@curo.health').toLowerCase().trim();
  const superAdminExists = usersToInsert.some((u) => u.email === superAdminEmail && u.role === 'super_admin');
  if (!superAdminExists) {
    usersToInsert.unshift({
      name: 'Dr. Alok Verma',
      email: superAdminEmail,
      password: passwordHash,
      role: 'super_admin',
      associatedFacilityType: null,
      associatedFacilityId: null,
      facilityName: 'CURO Platform Central',
      department: 'Central Clinical Informatics Directorate',
      accountStatus: 'active',
      phone: '+91 98110 92341',
      lastLogin: new Date(),
    });
  }

  // Insert users
  await User.insertMany(usersToInsert);
  console.log(`[Seed] Seeded ${usersToInsert.length} governance user accounts.`);

  // 2. Seed Hospitals
  const hospitalsToInsert = INITIAL_HOSPITALS.map((h) => ({
    name: h.name,
    regId: h.regId,
    type: h.type,
    city: h.city,
    state: h.state,
    address: h.address,
    email: h.email,
    phone: h.phone,
    departmentsCount: h.departmentsCount || (h.departments ? h.departments.length : 1),
    departments: h.departments || [],
    bedCapacity: h.bedCapacity || 50,
    icuBeds: h.icuBeds || 5,
    authorizedRepresentative: h.authorizedRepresentative,
    verificationStatus: h.verificationStatus || 'pending',
    accountStatus: h.accountStatus || 'pending_activation',
    managerAccount: h.managerAccount || null,
    documents: h.documents || [],
    reviewNotes: h.reviewNotes || '',
    timeline: h.timeline || [],
    registeredAt: h.registeredAt ? new Date(h.registeredAt) : new Date(),
  }));
  await Hospital.insertMany(hospitalsToInsert);
  console.log(`[Seed] Seeded ${hospitalsToInsert.length} hospitals.`);

  // 3. Seed Clinics
  const clinicsToInsert = INITIAL_CLINICS.map((c) => ({
    name: c.name,
    regId: c.regId,
    category: c.category,
    city: c.city,
    state: c.state,
    address: c.address,
    email: c.email,
    phone: c.phone,
    specialtiesCount: c.specialtiesCount || (c.specialties ? c.specialties.length : 1),
    specialties: c.specialties || [],
    consultationRooms: c.consultationRooms || 2,
    authorizedRepresentative: c.authorizedRepresentative,
    verificationStatus: c.verificationStatus || 'pending',
    accountStatus: c.accountStatus || 'pending_activation',
    managerAccount: c.managerAccount || null,
    documents: c.documents || [],
    reviewNotes: c.reviewNotes || '',
    timeline: c.timeline || [],
    registeredAt: c.registeredAt ? new Date(c.registeredAt) : new Date(),
  }));
  await Clinic.insertMany(clinicsToInsert);
  console.log(`[Seed] Seeded ${clinicsToInsert.length} clinics.`);

  // 4. Seed Invitations
  const invitationsToInsert = INITIAL_INVITATIONS.map((inv) => ({
    email: inv.email.toLowerCase().trim(),
    inviteeName: inv.inviteeName,
    phone: inv.phone || '',
    role: inv.role,
    facilityId: inv.facilityId,
    facilityName: inv.facilityName,
    facilityType: inv.facilityType,
    token: inv.token,
    tokenHash: Invitation.hashToken(inv.token),
    simulatedLink: inv.simulatedLink,
    status: inv.status || 'pending',
    expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
  }));
  await Invitation.insertMany(invitationsToInsert);
  console.log(`[Seed] Seeded ${invitationsToInsert.length} invitations.`);

  // 5. Seed Audit Logs
  const logsToInsert = INITIAL_AUDIT_LOGS.map((log) => ({
    actorId: log.actorId || 'usr-sa-001',
    actorName: log.actorName || 'Dr. Alok Verma',
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId || 'all',
    targetName: log.targetName || '',
    outcome: log.outcome || 'info',
    details: log.details || '',
    timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
  }));
  await AuditLog.insertMany(logsToInsert);
  console.log(`[Seed] Seeded ${logsToInsert.length} audit logs.`);

  // 6. Seed Admin Settings
  await AdminSettings.create(INITIAL_SETTINGS);
  console.log('[Seed] Seeded platform admin settings.');

  console.log('[Seed] Database initialization complete!');
};

// If run directly via command line
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedInitialData()
    .then(() => {
      console.log('[Seed CLI] Seed script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed CLI Error]', err);
      process.exit(1);
    });
}
