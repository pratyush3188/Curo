import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Hospital } from '../models/Hospital.js';
import { Patient } from '../models/Patient.js';
import { Department } from '../models/Department.js';
import { AuditLog } from '../models/AuditLog.js';
import { Application } from '../models/Application.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { fallbackStore } from '../utils/fallbackStore.js';
import { predictTriageLevel } from '../services/triageService.js';

const isDbConnected = () => mongoose.connection.readyState === 1;

// ================= PUBLIC HOSPITAL REGISTRATION =================

/**
 * @desc    Public registration for Hospitals (creates hospital + owner account queued for admin review)
 * @route   POST /api/hospital/register
 * @access  Public
 */
export const registerHospitalPublic = asyncHandler(async (req, res) => {
  const {
    name,
    type = 'Multi-Specialty Hospital',
    registrationNumber = '',
    totalBeds = 200,
    icuBeds = 20,
    locality = 'Central',
    city = 'Mumbai',
    state = 'Maharashtra',
    address = 'Healthcare Avenue',
    emergencyHelpline = '108',
    email,
    phone,
    departments = ['Emergency & Trauma', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics'],
    ownerName,
    ownerEmail,
    ownerPassword,
    password,
    representativeName,
    representativeEmail,
    representativePhone,
    representativeDesignation = 'Medical Superintendent',
  } = req.body;

  const resolvedHospitalEmail = email || ownerEmail || representativeEmail;
  const resolvedPassword = ownerPassword || password;

  if (!name || !resolvedHospitalEmail || !resolvedPassword) {
    throw new ApiError(400, 'Hospital name, email address, and owner password are required.');
  }

  const normalizedHospitalEmail = resolvedHospitalEmail.toLowerCase().trim();
  const normalizedOwnerEmail = (ownerEmail || email || representativeEmail).toLowerCase().trim();
  const regId = `HOSP-${Math.floor(100000 + Math.random() * 900000)}`;

  // 1. Create Hospital record in pending verification status
  let hospital = null;
  if (isDbConnected()) {
    hospital = await Hospital.create({
      regId,
      name,
      type,
      registrationNumber,
      totalBeds: Number(totalBeds) || 200,
      bedCapacity: Number(totalBeds) || 200,
      icuBeds: Number(icuBeds) || 20,
      icuBedsAvailable: Number(icuBeds) || 20,
      locality,
      city,
      state,
      address,
      emergencyHelpline,
      email: normalizedHospitalEmail,
      phone: phone || '+91 22 2675 1000',
      departments: Array.isArray(departments) && departments.length > 0 ? departments : ['Emergency & Trauma', 'Cardiology', 'Neurology', 'Pediatrics'],
      departmentsCount: Array.isArray(departments) ? departments.length : 4,
      verificationStatus: 'pending',
      accountStatus: 'pending_activation',
      authorizedRepresentative: {
        name: representativeName || ownerName || 'Hospital Director',
        designation: representativeDesignation,
        email: representativeEmail || normalizedOwnerEmail,
        phone: representativePhone || phone || '',
      },
      timeline: [
        {
          date: new Date(),
          event: `Hospital registration application submitted by ${ownerName || 'Hospital Administrator'}. Queued for Super Admin verification.`,
          actor: ownerName || 'Hospital Owner',
        },
      ],
    });

    // 2. Create Application queue entry for Super Admin
    await Application.create({
      facilityType: 'hospital',
      facilityId: hospital._id,
      facilityModel: 'Hospital',
      facilityName: hospital.name,
      regId: hospital.regId,
      city: hospital.city,
      state: hospital.state,
      status: 'pending',
      submittedInformation: {
        type: hospital.type,
        registrationNumber,
        totalBeds: hospital.totalBeds,
        icuBeds: hospital.icuBeds,
        email: hospital.email,
        phone: hospital.phone,
        ownerName: ownerName || representativeName,
        ownerEmail: normalizedOwnerEmail,
        representativeName: representativeName || ownerName,
        representativeDesignation,
        representativePhone,
        departments: hospital.departments,
      },
      timeline: [
        {
          date: new Date(),
          event: `Hospital application submitted for ${hospital.name}. Awaiting Super Admin compliance review.`,
          actor: ownerName || 'Hospital Owner',
        },
      ],
    });
  } else {
    hospital = {
      _id: `hosp_${Date.now()}`,
      regId,
      name,
      type,
      totalBeds: Number(totalBeds) || 200,
      icuBeds: Number(icuBeds) || 20,
      locality,
      city,
      state,
      address,
      emergencyHelpline,
      email: normalizedHospitalEmail,
      phone,
      departments,
      verificationStatus: 'pending',
      accountStatus: 'pending_activation',
    };
  }

  // 3. Create User account with role 'hospital_owner' in pending_activation status
  let ownerUser = null;
  if (isDbConnected()) {
    let existingUser = await User.findOne({ email: normalizedOwnerEmail });
    if (existingUser) {
      existingUser.role = 'hospital_owner';
      existingUser.associatedFacilityType = 'hospital';
      existingUser.associatedFacilityId = hospital._id.toString();
      existingUser.facilityName = hospital.name;
      existingUser.password = resolvedPassword;
      existingUser.accountStatus = 'pending_activation';
      await existingUser.save();
      ownerUser = existingUser;
    } else {
      ownerUser = await User.create({
        name: ownerName || representativeName || 'Hospital Owner',
        email: normalizedOwnerEmail,
        password: resolvedPassword,
        role: 'hospital_owner',
        associatedFacilityType: 'hospital',
        associatedFacilityId: hospital._id.toString(),
        facilityName: hospital.name,
        accountStatus: 'pending_activation',
        phone: phone || '',
      });
    }
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(resolvedPassword, salt);
    ownerUser = {
      _id: `usr_own_${Date.now()}`,
      name: ownerName || 'Hospital Owner',
      email: normalizedOwnerEmail,
      password: hashedPassword,
      role: 'hospital_owner',
      associatedFacilityType: 'hospital',
      associatedFacilityId: hospital._id,
      facilityName: hospital.name,
      accountStatus: 'pending_activation',
    };
    fallbackStore.addUser(ownerUser);
  }

  const userData = ownerUser.toObject ? ownerUser.toObject() : { ...ownerUser };
  delete userData.password;

  res.status(201).json({
    success: true,
    message: 'Thank you for registering! Your application has been submitted to the CURO Central Health Administration. We will review your credentials and reply shortly on your registered email.',
    user: userData,
    hospital,
    status: 'pending',
  });
});

// ================= ADMIN CONTROLLERS =================

export const createManager = asyncHandler(async (req, res) => {
  const { name, email, password, department, phone } = req.body;

  if (!name || !email || !password || !department) {
    throw new ApiError(400, 'Name, email, password, and department are required');
  }

  if (isDbConnected()) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const manager = await User.create({
      name,
      email,
      password,
      role: 'manager',
      department,
      phone: phone || '',
      createdBy: req.user._id,
      isActive: true,
    });

    let deptDoc = await Department.findOne({ name: department });
    if (!deptDoc) {
      deptDoc = await Department.create({
        name: department,
        managerId: manager._id,
        description: `${department} Department`,
      });
    } else {
      deptDoc.managerId = manager._id;
      await deptDoc.save();
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_MANAGER',
      targetId: manager._id,
      targetModel: 'User',
      details: { email, department },
    });

    return res.status(201).json({
      success: true,
      message: 'Department manager created successfully',
      manager: {
        _id: manager._id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        department: manager.department,
        phone: manager.phone,
        createdAt: manager.createdAt,
      },
    });
  }

  // Fallback in-memory handler
  if (fallbackStore.findUserByEmail(email)) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newManager = {
    _id: `usr_mgr_${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    role: 'manager',
    department,
    phone: phone || '',
    createdBy: req.user._id,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  fallbackStore.addUser(newManager);

  res.status(201).json({
    success: true,
    message: 'Department manager created successfully',
    manager: {
      _id: newManager._id,
      name: newManager.name,
      email: newManager.email,
      role: newManager.role,
      department: newManager.department,
      phone: newManager.phone,
      createdAt: newManager.createdAt,
    },
  });
});

export const getAdminStats = asyncHandler(async (req, res) => {
  if (isDbConnected()) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalPatientsToday,
      allPatients,
      activeDoctorsCount,
      totalManagersCount,
      departments,
      criticalCount,
    ] = await Promise.all([
      Patient.countDocuments({ admittedAt: { $gte: startOfDay } }),
      Patient.find({}).populate('assignedDoctor', 'name department'),
      User.countDocuments({ role: 'doctor', isActive: true }),
      User.countDocuments({ role: 'manager', isActive: true }),
      Department.find({ isActive: true }),
      Patient.countDocuments({ triageLevel: 'critical', status: { $ne: 'resolved' } }),
    ]);

    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d.name] = 0;
    });

    const triageStats = { critical: 0, urgent: 0, 'semi-urgent': 0, 'non-urgent': 0 };
    const outcomes = { waiting: 0, 'in-treatment': 0, resolved: 0, discharged: 0 };
    let totalWaitTimeMinutes = 0;
    let activeWaitingCount = 0;

    allPatients.forEach((p) => {
      deptMap[p.department] = (deptMap[p.department] || 0) + 1;
      if (triageStats[p.triageLevel] !== undefined) triageStats[p.triageLevel]++;
      if (outcomes[p.status] !== undefined) outcomes[p.status]++;

      const wait = p.calculatedWaitTime || p.waitTime || 0;
      if (p.status !== 'resolved' && p.status !== 'discharged') {
        totalWaitTimeMinutes += wait;
        activeWaitingCount++;
      }
    });

    const avgWaitTime = activeWaitingCount > 0 ? Math.round(totalWaitTimeMinutes / activeWaitingCount) : 0;
    const doctors = await User.find({ role: 'doctor' }).select('name department email phone');
    const doctorWorkload = await Promise.all(
      doctors.map(async (doc) => {
        const assigned = await Patient.countDocuments({ assignedDoctor: doc._id });
        const resolved = await Patient.countDocuments({
          assignedDoctor: doc._id,
          status: { $in: ['resolved', 'discharged'] },
        });
        return {
          _id: doc._id,
          name: doc.name,
          department: doc.department,
          email: doc.email,
          assignedPatients: assigned,
          resolvedPatients: resolved,
          activePatients: assigned - resolved,
        };
      })
    );

    const departmentComparison = Object.keys(deptMap).map((name) => ({
      department: name,
      patientCount: deptMap[name],
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalPatientsToday,
        totalPatientsAllTime: allPatients.length,
        criticalCases: criticalCount,
        activeDepartments: departments.length,
        totalDoctors: activeDoctorsCount,
        totalManagers: totalManagersCount,
        avgWaitTimeMinutes: avgWaitTime,
        triageDistribution: triageStats,
        outcomes,
        departmentComparison,
        doctorWorkload,
      },
    });
  }

  // Fallback in-memory calculations
  const patients = fallbackStore.getPatients();
  const users = fallbackStore.getUsers();
  const departments = fallbackStore.getDepartments();

  const doctors = users.filter((u) => u.role === 'doctor');
  const managers = users.filter((u) => u.role === 'manager');

  const deptMap = {};
  departments.forEach((d) => {
    deptMap[d.name] = 0;
  });

  const triageStats = { critical: 0, urgent: 0, 'semi-urgent': 0, 'non-urgent': 0 };
  const outcomes = { waiting: 0, 'in-treatment': 0, resolved: 0, discharged: 0 };
  let totalWaitTimeMinutes = 0;
  let activeWaitingCount = 0;
  let criticalCount = 0;

  patients.forEach((p) => {
    deptMap[p.department] = (deptMap[p.department] || 0) + 1;
    if (triageStats[p.triageLevel] !== undefined) triageStats[p.triageLevel]++;
    if (outcomes[p.status] !== undefined) outcomes[p.status]++;
    if (p.triageLevel === 'critical' && p.status !== 'resolved') criticalCount++;

    if (p.status !== 'resolved') {
      totalWaitTimeMinutes += p.waitTime || 30;
      activeWaitingCount++;
    }
  });

  const avgWaitTime = activeWaitingCount > 0 ? Math.round(totalWaitTimeMinutes / activeWaitingCount) : 0;

  const doctorWorkload = doctors.map((doc) => {
    const assigned = patients.filter((p) => p.assignedDoctor?._id === doc._id || p.assignedDoctor === doc._id).length;
    const resolved = patients.filter(
      (p) => (p.assignedDoctor?._id === doc._id || p.assignedDoctor === doc._id) && p.status === 'resolved'
    ).length;
    return {
      _id: doc._id,
      name: doc.name,
      department: doc.department,
      email: doc.email,
      assignedPatients: assigned,
      resolvedPatients: resolved,
      activePatients: assigned - resolved,
    };
  });

  const departmentComparison = Object.keys(deptMap).map((name) => ({
    department: name,
    patientCount: deptMap[name],
  }));

  res.status(200).json({
    success: true,
    stats: {
      totalPatientsToday: patients.length,
      totalPatientsAllTime: patients.length,
      criticalCases: criticalCount,
      activeDepartments: departments.length,
      totalDoctors: doctors.length,
      totalManagers: managers.length,
      avgWaitTimeMinutes: avgWaitTime,
      triageDistribution: triageStats,
      outcomes,
      departmentComparison,
      doctorWorkload,
    },
  });
});

export const getOwnerStats = getAdminStats;

export const getManagers = asyncHandler(async (req, res) => {
  if (isDbConnected()) {
    const managers = await User.find({ role: 'manager' })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      managers,
    });
  }

  const managers = fallbackStore
    .getUsers()
    .filter((u) => u.role === 'manager')
    .map(({ password, ...m }) => m);

  res.status(200).json({
    success: true,
    managers,
  });
});

// ================= MANAGER CONTROLLERS =================

export const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const managerDept = req.user.department;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  if (!managerDept) {
    throw new ApiError(400, 'Manager is not assigned to any department');
  }

  if (isDbConnected()) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(400, 'User with this email already exists');
    }

    const doctor = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      department: managerDept,
      phone: phone || '',
      createdBy: req.user._id,
      isActive: true,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_DOCTOR',
      targetId: doctor._id,
      targetModel: 'User',
      details: { email, department: managerDept },
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        department: doctor.department,
        phone: doctor.phone,
        createdAt: doctor.createdAt,
      },
    });
  }

  if (fallbackStore.findUserByEmail(email)) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newDoctor = {
    _id: `usr_doc_${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    role: 'doctor',
    department: managerDept,
    phone: phone || '',
    createdBy: req.user._id,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  fallbackStore.addUser(newDoctor);

  res.status(201).json({
    success: true,
    message: 'Doctor created successfully',
    doctor: {
      _id: newDoctor._id,
      name: newDoctor.name,
      email: newDoctor.email,
      role: newDoctor.role,
      department: newDoctor.department,
      phone: newDoctor.phone,
      createdAt: newDoctor.createdAt,
    },
  });
});

export const getDepartmentStats = asyncHandler(async (req, res) => {
  const dept = req.user.department;
  if (!dept) {
    throw new ApiError(400, 'User has no assigned department');
  }

  if (isDbConnected()) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      deptPatients,
      patientsToday,
      resolvedToday,
      activeDoctors,
    ] = await Promise.all([
      Patient.find({ department: dept }).populate('assignedDoctor', 'name email'),
      Patient.countDocuments({ department: dept, admittedAt: { $gte: startOfDay } }),
      Patient.countDocuments({
        department: dept,
        status: { $in: ['resolved', 'discharged'] },
        resolvedAt: { $gte: startOfDay },
      }),
      User.find({ role: 'doctor', department: dept, isActive: true }).select('name email phone'),
    ]);

    const pendingCases = deptPatients.filter(
      (p) => p.status === 'waiting' || p.status === 'in-treatment'
    ).length;

    const criticalCount = deptPatients.filter(
      (p) => p.triageLevel === 'critical' && p.status !== 'resolved'
    ).length;

    const doctorPerformance = await Promise.all(
      activeDoctors.map(async (doc) => {
        const assigned = await Patient.countDocuments({ assignedDoctor: doc._id });
        const resolvedList = await Patient.find({
          assignedDoctor: doc._id,
          status: { $in: ['resolved', 'discharged'] },
        });

        let totalResolveMinutes = 0;
        resolvedList.forEach((p) => {
          if (p.admittedAt && p.resolvedAt) {
            totalResolveMinutes += Math.max(
              1,
              Math.floor((p.resolvedAt.getTime() - p.admittedAt.getTime()) / (1000 * 60))
            );
          } else {
            totalResolveMinutes += 30;
          }
        });

        const avgResolveTime =
          resolvedList.length > 0 ? Math.round(totalResolveMinutes / resolvedList.length) : 0;

        return {
          _id: doc._id,
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          assignedPatients: assigned,
          resolvedPatients: resolvedList.length,
          avgResolveTimeMinutes: avgResolveTime,
        };
      })
    );

    return res.status(200).json({
      success: true,
      stats: {
        department: dept,
        patientsToday,
        resolvedToday,
        activeDoctorsCount: activeDoctors.length,
        pendingCases,
        criticalCases: criticalCount,
        totalDepartmentPatients: deptPatients.length,
        doctorPerformance,
      },
    });
  }

  // Fallback in-memory
  const deptPatients = fallbackStore.getPatients().filter((p) => p.department === dept);
  const deptDoctors = fallbackStore.getUsers().filter((u) => u.role === 'doctor' && u.department === dept);

  const pendingCases = deptPatients.filter((p) => p.status === 'waiting' || p.status === 'in-treatment').length;
  const criticalCount = deptPatients.filter((p) => p.triageLevel === 'critical' && p.status !== 'resolved').length;
  const resolvedCount = deptPatients.filter((p) => p.status === 'resolved').length;

  const doctorPerformance = deptDoctors.map((doc) => {
    const assigned = deptPatients.filter((p) => p.assignedDoctor?._id === doc._id || p.assignedDoctor === doc._id).length;
    const resolvedList = deptPatients.filter(
      (p) => (p.assignedDoctor?._id === doc._id || p.assignedDoctor === doc._id) && p.status === 'resolved'
    );
    return {
      _id: doc._id,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      assignedPatients: assigned,
      resolvedPatients: resolvedList.length,
      avgResolveTimeMinutes: 35,
    };
  });

  res.status(200).json({
    success: true,
    stats: {
      department: dept,
      patientsToday: deptPatients.length,
      resolvedToday: resolvedCount,
      activeDoctorsCount: deptDoctors.length,
      pendingCases,
      criticalCases: criticalCount,
      totalDepartmentPatients: deptPatients.length,
      doctorPerformance,
    },
  });
});

export const getDepartmentPatients = asyncHandler(async (req, res) => {
  const dept = req.user.department;
  const { triageLevel, search, status } = req.query;

  if (isDbConnected()) {
    const query = { department: dept };
    if (triageLevel && triageLevel !== 'all') {
      query.triageLevel = triageLevel.toLowerCase();
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { chiefComplaint: { $regex: search, $options: 'i' } },
        { bedNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const patients = await Patient.find(query)
      .populate('assignedDoctor', 'name email')
      .sort({ admittedAt: -1 });

    const enriched = patients.map((p) => ({
      ...p.toObject(),
      waitTime: p.calculatedWaitTime,
    }));

    return res.status(200).json({
      success: true,
      patients: enriched,
    });
  }

  let patients = fallbackStore.getPatients().filter((p) => p.department === dept);

  if (triageLevel && triageLevel !== 'all') {
    patients = patients.filter((p) => p.triageLevel.toLowerCase() === triageLevel.toLowerCase());
  }

  if (status && status !== 'all') {
    patients = patients.filter((p) => p.status === status);
  }

  if (search) {
    const term = search.toLowerCase();
    patients = patients.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.chiefComplaint.toLowerCase().includes(term) ||
        p.bedNumber.toLowerCase().includes(term)
    );
  }

  res.status(200).json({
    success: true,
    patients,
  });
});

export const getDepartmentDoctors = asyncHandler(async (req, res) => {
  const dept = req.user.department;

  if (isDbConnected()) {
    const doctors = await User.find({ role: 'doctor', department: dept })
      .select('-password')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      doctors,
    });
  }

  const doctors = fallbackStore
    .getUsers()
    .filter((u) => u.role === 'doctor' && u.department === dept)
    .map(({ password, ...d }) => d);

  res.status(200).json({
    success: true,
    doctors,
  });
});

// ================= DOCTOR CONTROLLERS =================

export const getDoctorPatients = asyncHandler(async (req, res) => {
  const doctorId = req.user._id.toString();

  if (isDbConnected()) {
    const patients = await Patient.find({ assignedDoctor: doctorId })
      .populate('assignedDoctor', 'name department email')
      .sort({ admittedAt: -1 });

    const enriched = patients.map((p) => ({
      ...p.toObject(),
      waitTime: p.calculatedWaitTime,
    }));

    return res.status(200).json({
      success: true,
      patients: enriched,
    });
  }

  const patients = fallbackStore.getPatients().filter((p) => {
    const docId = p.assignedDoctor?._id || p.assignedDoctor;
    return docId === doctorId;
  });

  res.status(200).json({
    success: true,
    patients,
  });
});

export const resolvePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, outcome } = req.body;

  if (isDbConnected()) {
    const patient = await Patient.findById(id);
    if (!patient) {
      throw new ApiError(404, 'Patient not found');
    }

    patient.status = 'resolved';
    patient.resolutionNotes = notes || 'Consultation complete. Patient stabilized/treated.';
    patient.outcome = outcome || 'Resolved';
    patient.resolvedAt = new Date();
    await patient.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'RESOLVE_PATIENT',
      targetId: patient._id,
      targetModel: 'Patient',
      details: { notes, outcome },
    });

    return res.status(200).json({
      success: true,
      message: 'Patient marked as resolved successfully',
      patient: {
        ...patient.toObject(),
        waitTime: patient.calculatedWaitTime,
      },
    });
  }

  const updated = fallbackStore.updatePatient(id, {
    status: 'resolved',
    resolutionNotes: notes || 'Consultation complete. Patient stabilized/treated.',
    outcome: outcome || 'Resolved',
    resolvedAt: new Date().toISOString(),
  });

  if (!updated) {
    throw new ApiError(404, 'Patient not found');
  }

  res.status(200).json({
    success: true,
    message: 'Patient marked as resolved successfully',
    patient: updated,
  });
});

export const getDoctorStats = asyncHandler(async (req, res) => {
  const doctorId = req.user._id.toString();

  if (isDbConnected()) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      myPatientsToday,
      myResolvedCount,
      myActivePatients,
      myCriticalCount,
    ] = await Promise.all([
      Patient.countDocuments({ assignedDoctor: doctorId, admittedAt: { $gte: startOfDay } }),
      Patient.countDocuments({
        assignedDoctor: doctorId,
        status: { $in: ['resolved', 'discharged'] },
      }),
      Patient.countDocuments({
        assignedDoctor: doctorId,
        status: { $in: ['waiting', 'in-treatment'] },
      }),
      Patient.countDocuments({
        assignedDoctor: doctorId,
        triageLevel: 'critical',
        status: { $nin: ['resolved', 'discharged'] },
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        myPatientsToday,
        resolvedCount: myResolvedCount,
        activeCount: myActivePatients,
        criticalCount: myCriticalCount,
      },
    });
  }

  const patients = fallbackStore.getPatients().filter((p) => {
    const docId = p.assignedDoctor?._id || p.assignedDoctor;
    return docId === doctorId;
  });

  const resolved = patients.filter((p) => p.status === 'resolved').length;
  const active = patients.filter((p) => p.status === 'waiting' || p.status === 'in-treatment').length;
  const critical = patients.filter((p) => p.triageLevel === 'critical' && p.status !== 'resolved').length;

  res.status(200).json({
    success: true,
    stats: {
      myPatientsToday: patients.length,
      resolvedCount: resolved,
      activeCount: active,
      criticalCount: critical,
    },
  });
});

// ================= ALERTS CONTROLLERS =================

export const getAlerts = asyncHandler(async (req, res) => {
  if (isDbConnected()) {
    const query = {
      triageLevel: 'critical',
      isAlertAcknowledged: false,
      status: { $nin: ['resolved', 'discharged'] },
    };

    if (req.user.role === 'manager' && req.user.department) {
      query.department = req.user.department;
    } else if (req.user.role === 'doctor') {
      query.assignedDoctor = req.user._id;
    }

    const alerts = await Patient.find(query)
      .populate('assignedDoctor', 'name department')
      .sort({ admittedAt: -1 });

    const enriched = alerts.map((p) => ({
      ...p.toObject(),
      waitTime: p.calculatedWaitTime,
    }));

    return res.status(200).json({
      success: true,
      alerts: enriched,
    });
  }

  let alerts = fallbackStore.getPatients().filter((p) => {
    return p.triageLevel === 'critical' && !p.isAlertAcknowledged && p.status !== 'resolved';
  });

  if (req.user.role === 'manager' && req.user.department) {
    alerts = alerts.filter((p) => p.department === req.user.department);
  } else if (req.user.role === 'doctor') {
    alerts = alerts.filter((p) => {
      const docId = p.assignedDoctor?._id || p.assignedDoctor;
      return docId === req.user._id.toString();
    });
  }

  res.status(200).json({
    success: true,
    alerts,
  });
});

export const acknowledgeAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (isDbConnected()) {
    const patient = await Patient.findById(id);
    if (!patient) {
      throw new ApiError(404, 'Patient alert not found');
    }

    patient.isAlertAcknowledged = true;
    patient.acknowledgedAt = new Date();
    patient.acknowledgedBy = req.user._id;
    await patient.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'ACKNOWLEDGE_ALERT',
      targetId: patient._id,
      targetModel: 'Patient',
    });

    return res.status(200).json({
      success: true,
      message: 'Alert acknowledged successfully',
      patient: {
        ...patient.toObject(),
        waitTime: patient.calculatedWaitTime,
      },
    });
  }

  const updated = fallbackStore.updatePatient(id, {
    isAlertAcknowledged: true,
    acknowledgedAt: new Date().toISOString(),
    acknowledgedBy: req.user._id,
  });

  if (!updated) {
    throw new ApiError(404, 'Patient alert not found');
  }

  res.status(200).json({
    success: true,
    message: 'Alert acknowledged successfully',
    patient: updated,
  });
});

// ================= PATIENT ADMISSION & ML TRIAGE =================

export const admitPatient = asyncHandler(async (req, res) => {
  const {
    name,
    age,
    gender,
    chiefComplaint,
    vitals = {},
    bpSystolic,
    bpDiastolic,
    heartRate,
    spo2,
    temperature,
    respiratoryRate,
    painScale,
    consciousness = 'Alert',
    symptoms = [],
    medicalHistory = [],
    doctorReferral = [],
    bedNumber = 'Unassigned',
    department,
    assignedDoctor,
  } = req.body;

  if (!name || !age || !gender || !chiefComplaint) {
    throw new ApiError(400, 'Name, age, gender, and chief complaint are required');
  }

  // Determine target department
  let targetDept = department;
  if (!targetDept) {
    if (req.user.role === 'manager' && req.user.department) {
      targetDept = req.user.department;
    } else if (req.user.role === 'doctor' && req.user.department) {
      targetDept = req.user.department;
    } else {
      targetDept = 'Emergency';
    }
  }

  // Determine doctor allocation
  let targetDoctor = assignedDoctor;
  if (!targetDoctor && req.user.role === 'doctor') {
    targetDoctor = req.user._id;
  }

  // Normalize all 13 clinical vitals
  const bp = vitals.bloodPressure || {};
  const normalizedVitals = {
    bloodPressure: {
      systolic: Number(bp.systolic || bpSystolic || vitals.bpSystolic || 120),
      diastolic: Number(bp.diastolic || bpDiastolic || vitals.bpDiastolic || 80),
    },
    heartRate: Number(vitals.heartRate || heartRate || 72),
    spo2: Number(vitals.spo2 || spo2 || 98),
    temperature: Number(vitals.temperature || temperature || 98.6),
    respiratoryRate: Number(vitals.respiratoryRate || respiratoryRate || 16),
    painScale: Number(vitals.painScale || painScale || 1),
    consciousness: consciousness || vitals.consciousness || 'Alert',
  };

  // 1. Call ML prediction via triageService (Flask 5001 or fallback)
  const triageResult = await predictTriageLevel({
    name,
    age,
    gender,
    chiefComplaint,
    vitals: normalizedVitals,
    symptoms,
    medicalHistory,
    consciousness: normalizedVitals.consciousness,
  });

  const triageLevel = triageResult.triageLevel || 'non-urgent';
  const confidence = triageResult.confidence || 0.95;
  const reasoning = triageResult.reasoning || '';
  const isCritical = triageLevel.toLowerCase() === 'critical';

  // 2. Persist to MongoDB or Fallback Store
  let savedPatient = null;
  if (isDbConnected()) {
    savedPatient = await Patient.create({
      name,
      age: Number(age),
      gender,
      chiefComplaint,
      triageLevel,
      triageConfidence: confidence,
      triageReasoning: reasoning,
      vitals: normalizedVitals,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : [],
      doctorReferral: Array.isArray(doctorReferral) ? doctorReferral : [],
      bedNumber: bedNumber || 'Unassigned',
      department: targetDept,
      assignedDoctor: targetDoctor || null,
      admittedBy: req.user._id,
      status: 'waiting',
      isAlertAcknowledged: !isCritical,
      admittedAt: new Date(),
    });

    if (targetDoctor) {
      savedPatient = await Patient.findById(savedPatient._id).populate('assignedDoctor', 'name department email');
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'ADMIT_PATIENT',
      targetId: savedPatient._id,
      targetModel: 'Patient',
      details: {
        triageLevel,
        confidence,
        department: targetDept,
        bedNumber,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Patient admitted successfully with AI Triage Level: ${triageLevel.toUpperCase()}`,
      triage: {
        triageLevel,
        confidence,
        reasoning,
        model: triageResult.model,
      },
      patient: {
        ...savedPatient.toObject(),
        waitTime: savedPatient.calculatedWaitTime || 0,
      },
    });
  }

  // Fallback in-memory persistence
  const docObj = targetDoctor
    ? fallbackStore.findUserById(targetDoctor.toString()) || {
        _id: targetDoctor,
        name: req.user.role === 'doctor' ? req.user.name : 'Attending Doctor',
        department: targetDept,
      }
    : null;

  const inMemoryPatient = {
    _id: `pat_${Date.now()}`,
    name,
    age: Number(age),
    gender,
    chiefComplaint,
    triageLevel,
    triageConfidence: confidence,
    triageReasoning: reasoning,
    vitals: normalizedVitals,
    symptoms: Array.isArray(symptoms) ? symptoms : [],
    medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : [],
    doctorReferral: Array.isArray(doctorReferral) ? doctorReferral : [],
    bedNumber: bedNumber || 'Unassigned',
    department: targetDept,
    assignedDoctor: docObj,
    admittedBy: req.user._id,
    status: 'waiting',
    isAlertAcknowledged: !isCritical,
    admittedAt: new Date().toISOString(),
    waitTime: 0,
  };

  fallbackStore.addPatient(inMemoryPatient);

  res.status(201).json({
    success: true,
    message: `Patient admitted successfully with AI Triage Level: ${triageLevel.toUpperCase()}`,
    triage: {
      triageLevel,
      confidence,
      reasoning,
      model: triageResult.model,
    },
    patient: inMemoryPatient,
  });
});

