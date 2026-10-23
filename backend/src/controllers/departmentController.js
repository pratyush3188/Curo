import mongoose from 'mongoose';
import { Department } from '../models/Department.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const inMemoryDepartments = [
  { _id: 'dept_1', name: 'Emergency & Trauma', totalBeds: 50, occupiedBeds: 32, isActive: true },
  { _id: 'dept_2', name: 'Cardiology', totalBeds: 40, occupiedBeds: 28, isActive: true },
  { _id: 'dept_3', name: 'Neurology', totalBeds: 30, occupiedBeds: 18, isActive: true },
  { _id: 'dept_4', name: 'Orthopedics', totalBeds: 35, occupiedBeds: 20, isActive: true },
  { _id: 'dept_5', name: 'Oncology', totalBeds: 25, occupiedBeds: 15, isActive: true },
  { _id: 'dept_6', name: 'Pediatrics', totalBeds: 30, occupiedBeds: 12, isActive: true },
];

/**
 * @desc Get all departments (optionally filtered by hospitalId)
 * @route GET /api/departments
 */
export const listDepartments = asyncHandler(async (req, res) => {
  const { hospitalId, isActive } = req.query;
  const filter = {};

  if (hospitalId) filter.hospitalId = hospitalId;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  let departments = [];
  if (mongoose.connection.readyState === 1) {
    departments = await Department.find(filter)
      .populate('managerId', 'name email phone')
      .sort({ name: 1 });
  } else {
    departments = inMemoryDepartments;
  }

  res.status(200).json({
    success: true,
    count: departments.length,
    departments,
  });
});

/**
 * @desc Get single department by ID
 * @route GET /api/departments/:id
 */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let department = null;

  if (mongoose.connection.readyState === 1) {
    department = await Department.findById(id).populate('managerId', 'name email phone');
  } else {
    department = inMemoryDepartments.find((d) => d._id === id || d.name === id);
  }

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  res.status(200).json({
    success: true,
    department,
  });
});

/**
 * @desc Create new department
 * @route POST /api/departments
 */
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, hospitalId, managerId, totalBeds, headDoctorName, description } = req.body;

  if (!name) {
    throw new ApiError(400, 'Department name is required');
  }

  let department = null;
  if (mongoose.connection.readyState === 1) {
    department = await Department.create({
      name,
      hospitalId: hospitalId || req.user?.associatedFacilityId || null,
      managerId: managerId || null,
      totalBeds: Number(totalBeds) || 30,
      occupiedBeds: 0,
      headDoctorName: headDoctorName || '',
      description: description || '',
      isActive: true,
    });
  } else {
    department = {
      _id: `dept_${Date.now()}`,
      name,
      hospitalId,
      managerId,
      totalBeds: Number(totalBeds) || 30,
      occupiedBeds: 0,
      headDoctorName: headDoctorName || '',
      description: description || '',
      isActive: true,
      createdAt: new Date(),
    };
    inMemoryDepartments.push(department);
  }

  res.status(201).json({
    success: true,
    message: `Department ${name} created successfully`,
    department,
  });
});

/**
 * @desc Update department details or bed count
 * @route PUT /api/departments/:id
 */
export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  let department = null;
  if (mongoose.connection.readyState === 1) {
    department = await Department.findByIdAndUpdate(id, updates, { new: true });
  } else {
    const idx = inMemoryDepartments.findIndex((d) => d._id === id);
    if (idx !== -1) {
      inMemoryDepartments[idx] = { ...inMemoryDepartments[idx], ...updates };
      department = inMemoryDepartments[idx];
    }
  }

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  res.status(200).json({
    success: true,
    department,
  });
});
