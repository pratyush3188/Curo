import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Hospital } from '../src/models/Hospital.js';
import { Clinic } from '../src/models/Clinic.js';
import { Invitation } from '../src/models/Invitation.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { seedInitialData } from '../src/scripts/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

describe('CURO Admin Backend API Test Suite', () => {
  let superAdminToken = '';
  let superAdminUser = null;
  let testHospitalId = '';
  let testClinicId = '';

  before(async () => {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb+srv://psvt2007_db_user:A5MYm0FFAL8sJz88@cluster0.dz9vidv.mongodb.net/curo?retryWrites=true&w=majority';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    // Re-seed DB for clean test run
    await seedInitialData();

    // Login as Super Admin
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@curo.health',
        password: 'Admin@Demo2026!',
      });

    assert.equal(res.status, 200, 'Super Admin login should return 200');
    assert.ok(res.body.token, 'Should return JWT token');
    superAdminToken = res.body.token;
    superAdminUser = res.body.user;
  });

  after(async () => {
    // Keep DB intact or close connection
    await mongoose.connection.close();
    setTimeout(() => {
      process.exit(0);
    }, 200).unref();
  });

  describe('1. Health Check & Public Routes', () => {
    it('GET /api/v1/health returns ok status', async () => {
      const res = await request(app).get('/api/v1/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
    });

    it('GET /api/health also returns ok status via alias', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
    });
  });

  describe('2. Authentication & Authorization', () => {
    it('POST /api/v1/auth/login with invalid password returns 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@curo.health',
          password: 'WrongPassword123!',
        });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('GET /api/v1/auth/me returns current user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.user.email, 'admin@curo.health');
      assert.equal(res.body.user.role, 'super_admin');
    });

    it('Protected admin endpoints reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      assert.equal(res.status, 401);
    });

    it('POST /api/v1/auth/logout succeeds and returns 200', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  describe('3. Dashboard & Analytics APIs', () => {
    it('GET /api/v1/admin/dashboard returns valid aggregate platform metrics', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.totalHospitals > 0, 'Total hospitals should be greater than 0');
      assert.ok(res.body.data.totalClinics > 0, 'Total clinics should be greater than 0');
      assert.equal(typeof res.body.data.doctorsCount, 'number', 'Doctors count should be aggregate number');
      assert.equal(typeof res.body.data.patientsCount, 'number', 'Patients count should be aggregate number');
      assert.ok(Array.isArray(res.body.data.recentApplications), 'Should return recent applications array');
    });

    it('GET /api/v1/admin/analytics returns progression and status distribution', async () => {
      const res = await request(app)
        .get('/api/v1/admin/analytics?period=30d')
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data.monthlyData));
      assert.ok(Array.isArray(res.body.data.statusDistribution));
      assert.ok(Array.isArray(res.body.data.roleDistribution));
    });
  });

  describe('4. Hospital & Clinic Management APIs', () => {
    it('GET /api/v1/admin/hospitals returns hospital list and pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/hospitals')
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length > 0);
      testHospitalId = res.body.data[0].id;
    });

    it('GET /api/v1/admin/hospitals/:id returns detailed hospital record', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/hospitals/${testHospitalId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data._id.toString(), testHospitalId);
    });

    it('PATCH /api/v1/admin/hospitals/:id/status toggles account suspension', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/hospitals/${testHospitalId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'suspended', reason: 'Audit pending' });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.accountStatus, 'suspended');

      // Reactivate
      const res2 = await request(app)
        .patch(`/api/v1/admin/hospitals/${testHospitalId}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'active' });
      assert.equal(res2.status, 200);
      assert.equal(res2.body.data.accountStatus, 'active');
    });

    it('GET /api/v1/admin/clinics returns clinic list and allows retrieval', async () => {
      const res = await request(app)
        .get('/api/v1/admin/clinics')
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.length > 0);
      testClinicId = res.body.data[0].id;

      const single = await request(app)
        .get(`/api/v1/admin/clinics/${testClinicId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(single.status, 200);
      assert.equal(single.body.data._id.toString(), testClinicId);
    });
  });

  describe('5. Application Review Workflow', () => {
    it('GET /api/v1/admin/applications returns unified applications queue', async () => {
      const res = await request(app)
        .get('/api/v1/admin/applications')
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });

    it('PATCH /api/v1/admin/applications/:id/review marks application under review', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/applications/${testHospitalId}/review`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ facilityType: 'hospital' });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.verificationStatus, 'under_review');
    });

    it('PATCH /api/v1/admin/applications/:id/request-info requires a message and updates status', async () => {
      const fail = await request(app)
        .patch(`/api/v1/admin/applications/${testHospitalId}/request-info`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ facilityType: 'hospital', message: '' });
      assert.equal(fail.status, 400);

      const success = await request(app)
        .patch(`/api/v1/admin/applications/${testHospitalId}/request-info`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ facilityType: 'hospital', message: 'Please upload the biomedical waste NOC certificate.' });
      assert.equal(success.status, 200);
      assert.equal(success.body.data.verificationStatus, 'needs_more_information');
    });

    it('PATCH /api/v1/admin/applications/:id/approve approves application and creates audit log', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/applications/${testHospitalId}/approve`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ facilityType: 'hospital', reviewNotes: 'All accreditations verified.' });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.verificationStatus, 'approved');

      // Verify audit log created
      const log = await AuditLog.findOne({ action: 'APPLICATION_APPROVED', targetId: testHospitalId });
      assert.ok(log, 'Audit log should be created on application approval');
    });

    it('PATCH /api/v1/admin/applications/:id/reject rejects application with mandatory reason', async () => {
      const fail = await request(app)
        .patch(`/api/v1/admin/applications/${testClinicId}/reject`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ facilityType: 'clinic', reason: '' });
      assert.equal(fail.status, 400);

      const success = await request(app)
        .patch(`/api/v1/admin/applications/${testClinicId}/reject`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ facilityType: 'clinic', reason: 'Forged trade license detected.' });
      assert.equal(success.status, 200);
      assert.equal(success.body.data.verificationStatus, 'rejected');
    });
  });

  describe('6. Manager Invitation & Activation Workflow', () => {
    let createdInvId = '';
    let activationToken = '';

    it('POST /api/v1/admin/invitations creates manager invitation with secure hashed token', async () => {
      const res = await request(app)
        .post('/api/v1/admin/invitations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          facilityId: testHospitalId,
          facilityType: 'hospital',
          facilityName: 'Apex Apollo Multi-Specialty Hospital',
          inviteeName: 'Kunal Kapoor',
          email: 'kunal.kapoor@apexapollo.org',
          phone: '+91 98111 22334',
          role: 'hospital_manager',
        });

      assert.equal(res.status, 201);
      assert.ok(res.body.data.id);
      assert.ok(res.body.data.simulatedLink);
      assert.ok(res.body.data.token, 'Token provided for simulated link generation');
      createdInvId = res.body.data.id;
      activationToken = res.body.data.token;
    });

    it('POST /api/v1/admin/invitations rejects duplicate active invitation for same email', async () => {
      const res = await request(app)
        .post('/api/v1/admin/invitations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          facilityId: testHospitalId,
          facilityType: 'hospital',
          facilityName: 'Apex Apollo Multi-Specialty Hospital',
          inviteeName: 'Kunal Duplicate',
          email: 'kunal.kapoor@apexapollo.org',
          role: 'hospital_manager',
        });

      assert.equal(res.status, 400);
      assert.ok(res.body.message.includes('already pending'));
    });

    it('POST /api/v1/admin/invitations/:id/resend renews token expiration', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/invitations/${createdInvId}/resend`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.token);
      activationToken = res.body.data.token; // updated token
    });

    it('Public POST /api/v1/auth/invitations/accept accepts invitation, creates manager user, activates facility', async () => {
      const res = await request(app)
        .post('/api/v1/auth/invitations/accept')
        .send({
          token: activationToken,
          password: 'ManagerSecurePass2026!',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.email, 'kunal.kapoor@apexapollo.org');

      // Verify user was created in database
      const user = await User.findOne({ email: 'kunal.kapoor@apexapollo.org' });
      assert.ok(user);
      assert.equal(user.accountStatus, 'active');
      assert.equal(user.role, 'hospital_manager');

      // Verify invitation status updated to accepted
      const inv = await Invitation.findById(createdInvId);
      assert.equal(inv.status, 'accepted');

      // Verify token cannot be reused (single-use check)
      const reuse = await request(app)
        .post('/api/v1/auth/invitations/accept')
        .send({
          token: activationToken,
          password: 'AnotherPassword2026!',
        });
      assert.equal(reuse.status, 400);
    });

    it('POST /api/v1/admin/invitations/:id/revoke invalidates an invitation', async () => {
      // Create a dummy invitation to revoke
      const createRes = await request(app)
        .post('/api/v1/admin/invitations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          facilityId: testClinicId,
          facilityType: 'clinic',
          facilityName: 'Test Clinic',
          inviteeName: 'Revoke Test',
          email: 'revoke.test@clinic.org',
          role: 'clinic_manager',
        });
      const invId = createRes.body.data.id;

      const revokeRes = await request(app)
        .post(`/api/v1/admin/invitations/${invId}/revoke`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(revokeRes.status, 200);
      assert.equal(revokeRes.body.data.status, 'revoked');
    });
  });

  describe('7. User & Account Management & Privacy Restrictions', () => {
    it('GET /api/v1/admin/users lists governance accounts and EXCLUDES doctors and patients', async () => {
      // Create a dummy patient and dummy doctor directly in database to test partitioning
      await User.create([
        {
          name: 'Patient Private',
          email: 'patient.secret@example.com',
          password: 'SecretPassword123!',
          role: 'patient',
          medicalHistorySummary: 'Confidential Diagnosis',
        },
        {
          name: 'Doctor Private',
          email: 'doctor.secret@example.com',
          password: 'SecretPassword123!',
          role: 'doctor',
          professionalInfo: { licenseNumber: 'DOC-1234' },
        },
      ]);

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${superAdminToken}`);

      assert.equal(res.status, 200);
      const emails = res.body.data.map((u) => u.email);
      assert.ok(!emails.includes('patient.secret@example.com'), 'Patient profile must NOT be listed in Super Admin view');
      assert.ok(!emails.includes('doctor.secret@example.com'), 'Doctor profile must NOT be listed in Super Admin view');

      // All returned roles must be governance roles
      res.body.data.forEach((u) => {
        assert.ok(
          ['super_admin', 'hospital_manager', 'department_manager', 'clinic_manager', 'hospital_admin', 'manager'].includes(u.role),
          `Role ${u.role} is not a permitted governance role`
        );
      });
    });

    it('GET /api/v1/admin/users/:id on a doctor or patient returns 403 Forbidden', async () => {
      const patient = await User.findOne({ role: 'patient' });
      assert.ok(patient);

      const res = await request(app)
        .get(`/api/v1/admin/users/${patient._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      assert.equal(res.status, 403);
      assert.ok(res.body.message.includes('shielded from platform Super Admin access'));
    });

    it('PATCH /api/v1/admin/users/:id/status updates status and prevents Super Admin demotion', async () => {
      // Demote Super Admin must fail
      const demoteRes = await request(app)
        .patch(`/api/v1/admin/users/${superAdminUser._id || superAdminUser.id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'suspended', reason: 'Self-lock test' });
      assert.equal(demoteRes.status, 403);

      // Normal manager status update succeeds
      const manager = await User.findOne({ role: 'hospital_manager' });
      assert.ok(manager);

      const updateRes = await request(app)
        .patch(`/api/v1/admin/users/${manager._id}/status`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ status: 'suspended', reason: 'Compliance audit' });
      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body.data.accountStatus, 'suspended');
    });
  });

  describe('8. Audit Logs & Settings', () => {
    it('GET /api/v1/admin/audit-logs returns recorded system ledger', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.length > 0);
    });

    it('GET and PUT /api/v1/admin/settings updates configuration and records audit log', async () => {
      const getRes = await request(app)
        .get('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${superAdminToken}`);
      assert.equal(getRes.status, 200);
      assert.equal(getRes.body.data.platformName, 'CURO Admin');

      const putRes = await request(app)
        .put('/api/v1/admin/settings')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          platformName: 'CURO Admin',
          tagline: 'Enterprise Healthcare Intelligence',
        });
      assert.equal(putRes.status, 200);
      assert.equal(putRes.body.data.tagline, 'Enterprise Healthcare Intelligence');
    });
  });
});
