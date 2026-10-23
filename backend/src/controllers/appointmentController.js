import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc Get appointments filtered by user, doctor, or institution
 * @route GET /api/appointments
 */
export const listAppointments = asyncHandler(async (req, res) => {
  const { status, patientId, doctorId, clinicId, hospitalId, institutionId } = req.query;
  const filter = {};

  if (status) filter.status = new RegExp(status, 'i');
  if (patientId) filter.patientId = patientId;
  if (doctorId) filter.doctorId = doctorId;
  if (clinicId) filter.clinicId = clinicId;
  if (hospitalId) filter.hospitalId = hospitalId;
  if (institutionId) filter.institutionId = institutionId;

  // If user is a patient and no explicit patientId passed, scope to their own appointments
  if (req.user && req.user.role === 'patient') {
    filter.patientId = String(req.user._id || req.user.id);
  }

  let appointments = [];
  if (mongoose.connection.readyState === 1) {
    appointments = await Appointment.find(filter).sort({ createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    count: appointments.length,
    appointments,
  });
});

/**
 * @desc Get single appointment by ID
 * @route GET /api/appointments/:id
 */
export const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let appointment = null;

  if (mongoose.connection.readyState === 1) {
    appointment = await Appointment.findOne({
      $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { appointmentId: id }],
    });
  }

  if (!appointment) {
    throw new ApiError(404, 'Appointment record not found');
  }

  res.status(200).json({
    success: true,
    appointment,
  });
});

/**
 * @desc Update appointment status (Confirmed, Completed, Cancelled, etc.)
 * @route PATCH /api/appointments/:id/status
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, cancellationReason, rejectionReason } = req.body;

  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  let appointment = null;
  if (mongoose.connection.readyState === 1) {
    const updatePayload = { status };
    if (cancellationReason) updatePayload.rejectionReason = cancellationReason;
    if (rejectionReason) updatePayload.rejectionReason = rejectionReason;

    appointment = await Appointment.findOneAndUpdate(
      { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { appointmentId: id }] },
      updatePayload,
      { new: true }
    );
  }

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  res.status(200).json({
    success: true,
    message: `Appointment status updated to ${status}`,
    appointment,
  });
});

/**
 * @desc Cancel appointment
 * @route POST /api/appointments/:id/cancel
 */
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelled by user' } = req.body;

  let appointment = null;
  if (mongoose.connection.readyState === 1) {
    appointment = await Appointment.findOneAndUpdate(
      { $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { appointmentId: id }] },
      { status: 'Cancelled', rejectionReason: reason },
      { new: true }
    );
  }

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  res.status(200).json({
    success: true,
    message: 'Appointment cancelled successfully',
    appointment,
  });
});
