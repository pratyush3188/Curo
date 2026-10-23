import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicService } from '../services/clinicService';
import { AppointmentRequest, ConsultationMode } from '../types';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  UserPlus,
  AlertTriangle,
  History,
  FileCheck,
  Check,
  X,
  MessageSquare
} from 'lucide-react';

export const AppointmentRequestsSection: React.FC = () => {
  const { currentClinic, isDoctor, activeDoctor, reloadClinicData } = useClinic();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('All');
  const [selectedRequest, setSelectedRequest] = useState<AppointmentRequest | null>(null);

  // Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

  // Form states
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [confirmDate, setConfirmDate] = useState<string>('2026-10-24');
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [proposalDate, setProposalDate] = useState<string>('2026-10-25');
  const [proposalStart, setProposalStart] = useState<string>('14:00');
  const [proposalEnd, setProposalEnd] = useState<string>('14:30');
  const [proposalNote, setProposalNote] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // New simulated patient booking form
  const [newReqPatientName, setNewReqPatientName] = useState('');
  const [newReqServiceId, setNewReqServiceId] = useState('');
  const [newReqDoctorId, setNewReqDoctorId] = useState('');
  const [newReqMode, setNewReqMode] = useState<ConsultationMode>('in-person');
  const [newReqPreferredDate, setNewReqPreferredDate] = useState('2026-10-25');
  const [newReqReason, setNewReqReason] = useState('');

  if (!currentClinic) return null;

  const doctors = ClinicService.getDoctors(currentClinic.id);
  const allRequests = ClinicService.getAppointments(currentClinic.id);

  // Doctor scope: if user logged in as a specific doctor, strictly filter to that doctor.
  // Otherwise, allow receptionists to filter by doctor or view all.
  const targetDoctorId = isDoctor && activeDoctor ? activeDoctor.id : (selectedDoctorFilter !== 'All' ? selectedDoctorFilter : null);

  const filteredRequests = allRequests.filter((req) => {
    // Doctor filter check
    if (targetDoctorId) {
      const matchId = req.doctorId === targetDoctorId;
      const targetDoc = doctors.find((d) => d.id === targetDoctorId);
      const matchName = targetDoc ? req.doctorName.toLowerCase().includes(targetDoc.fullName.toLowerCase()) : false;
      if (!matchId && !matchName) return false;
    }
    // Status filter check
    if (filterStatus === 'All') return true;
    return req.status === filterStatus;
  });

  // Calculate available slots dynamically when modal is open
  const availableSlots =
    selectedDoctorId && confirmDate
      ? ClinicService.getAvailableSlots(
          currentClinic.id,
          selectedDoctorId,
          confirmDate,
          currentClinic.defaultAppointmentDurationMinutes || 30
        )
      : [];

  const handleOpenConfirmModal = (req: AppointmentRequest) => {
    setSelectedRequest(req);
    setSelectedDoctorId(req.doctorId);
    setConfirmDate(req.preferredDate);
    setSelectedSlotTime('');
    setErrorBanner(null);
    setIsConfirmModalOpen(true);
  };

  const handleExecuteConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedSlotTime) {
      setErrorBanner('Please select a verified non-overlapping time slot.');
      return;
    }
    const [start, end] = selectedSlotTime.split(' - ');
    try {
      ClinicService.confirmSlot(
        currentClinic.id,
        selectedRequest.id,
        confirmDate,
        start,
        end,
        selectedDoctorId
      );
      reloadClinicData();
      setIsConfirmModalOpen(false);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to confirm appointment slot.');
    }
  };

  const handleOpenRejectModal = (req: AppointmentRequest) => {
    setSelectedRequest(req);
    setRejectionReason('Doctor schedule fully booked for this requested interval.');
    setIsRejectModalOpen(true);
  };

  const handleExecuteReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    ClinicService.rejectAppointment(currentClinic.id, selectedRequest.id, rejectionReason);
    reloadClinicData();
    setIsRejectModalOpen(false);
  };

  const handleOpenProposeModal = (req: AppointmentRequest) => {
    setSelectedRequest(req);
    setProposalDate(req.preferredDate);
    setProposalStart('14:00');
    setProposalEnd('14:30');
    setProposalNote('We have an opening with Dr. Eleanor Vance at 2:00 PM.');
    setIsProposeModalOpen(true);
  };

  const handleExecutePropose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    ClinicService.proposeAlternative(
      currentClinic.id,
      selectedRequest.id,
      proposalDate,
      proposalStart,
      proposalEnd,
      proposalNote
    );
    reloadClinicData();
    setIsProposeModalOpen(false);
  };

  const handleOpenReassignModal = (req: AppointmentRequest) => {
    setSelectedRequest(req);
    setSelectedDoctorId(req.doctorId);
    setIsReassignModalOpen(true);
  };

  const handleExecuteReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedDoctorId) return;
    const doc = ClinicService.getDoctorById(currentClinic.id, selectedDoctorId);
    if (!doc) return;

    ClinicService.updateAppointment(currentClinic.id, selectedRequest.id, {
      doctorId: doc.id,
      doctorName: doc.fullName,
      status: 'Pending Review'
    });
    reloadClinicData();
    setIsReassignModalOpen(false);
  };

  // Submit simulated incoming booking
  const handleCreateMockIncomingRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const service = currentClinic.services.find((s) => s.id === newReqServiceId) || currentClinic.services[0];
    const doctor = doctors.find((d) => d.id === newReqDoctorId) || doctors[0];

    ClinicService.createAppointmentRequest(currentClinic.id, {
      patientId: `PAT-${Date.now().toString().slice(-4)}`,
      patientName: newReqPatientName || 'Incoming Patient',
      patientContact: {
        phone: '+1 (555) 890-1234',
        email: 'patient.inbound@example.com'
      },
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      specialty: doctor.specialties[0] || 'General Consultation',
      serviceId: service.id,
      serviceName: service.name,
      consultationMode: newReqMode,
      preferredDate: newReqPreferredDate,
      preferredTimeRange: '10:00 - 12:00',
      reasonForVisit: newReqReason || 'Self-scheduled consultation via booking widget.',
      status: 'New',
      fee: service.consultationFee,
      paymentStatus: 'Pending'
    });

    reloadClinicData();
    setIsNewBookingModalOpen(false);
  };

  const getStatusBadge = (status: AppointmentRequest['status']) => {
    switch (status) {
      case 'New':
        return <span className="badge badge-blue">New Inbound</span>;
      case 'Pending Review':
        return <span className="badge badge-amber">Pending Review</span>;
      case 'Confirmed':
        return <span className="badge badge-emerald">Confirmed</span>;
      case 'Alternative Proposed':
        return <span className="badge badge-indigo">Alt Proposed</span>;
      case 'Rejected':
        return <span className="badge badge-rose">Rejected</span>;
      case 'Cancelled':
        return <span className="badge badge-rose">Cancelled</span>;
      case 'Completed':
        return <span className="badge badge-emerald">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header filter controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Doctor scope selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#006064' }}>
              Doctor Scope:
            </span>
            {isDoctor && activeDoctor ? (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'rgba(0, 131, 143, 0.12)',
                  color: '#00838f',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #80deea'
                }}
              >
                Showing Patient Waiting List For: {activeDoctor.fullName}
              </span>
            ) : (
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: '12px', padding: '5px 10px', minWidth: '220px', borderColor: '#80deea', fontWeight: 600 }}
              >
                <option value="All">All Doctors (Reception Overview)</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Waiting List: {d.fullName} ({d.specialties[0]})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status filters */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['All', 'New', 'Pending Review', 'Confirmed', 'Alternative Proposed', 'Rejected', 'Completed'].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setNewReqPatientName('');
            setNewReqServiceId(currentClinic.services[0]?.id || '');
            setNewReqDoctorId(doctors[0]?.id || '');
            setNewReqReason('');
            setIsNewBookingModalOpen(true);
          }}
          className="btn-primary"
          style={{ fontSize: '12px' }}
        >
          <UserPlus size={14} /> Simulate Incoming Patient Request
        </button>
      </div>

      {/* Appointment requests list table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Enquiry & Patient</th>
                <th style={{ padding: '12px 16px' }}>Requested Doctor / Service</th>
                <th style={{ padding: '12px 16px' }}>Preferred Time & Mode</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Consultation Reason</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No appointment requests found in this clinic under "{filterStatus}".
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: selectedRequest?.id === req.id ? 'var(--bg-card-hover)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{req.patientName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                        {req.id} • {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 500, color: '#38bdf8' }}>{req.doctorName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{req.serviceName}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{req.preferredDate}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                        {req.preferredTimeRange} • <span className="badge badge-indigo" style={{ padding: '1px 5px' }}>{req.consultationMode}</span>
                      </div>
                      {req.confirmedSlot && (
                        <div style={{ fontSize: '12px', color: '#34d399', fontWeight: 600, marginTop: '4px' }}>
                          ✓ Confirmed: {req.confirmedSlot.startTime} – {req.confirmedSlot.endTime}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      {getStatusBadge(req.status)}
                      {req.paymentStatus && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: req.paymentStatus === 'Paid' ? '#34d399' : 'var(--text-subtle)' }}>
                          Fee: ${req.fee} ({req.paymentStatus})
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', maxWidth: '240px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={req.reasonForVisit}
                      >
                        {req.reasonForVisit}
                      </div>
                      {req.alternativeProposal && (
                        <div style={{ fontSize: '11px', color: '#818cf8', marginTop: '2px' }}>
                          Alt: {req.alternativeProposal.proposedDate} ({req.alternativeProposal.proposedStartTime}-{req.alternativeProposal.proposedEndTime})
                        </div>
                      )}
                      {req.rejectionReason && (
                        <div style={{ fontSize: '11px', color: '#fb7185', marginTop: '2px' }}>
                          Rejected: {req.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {req.status !== 'Confirmed' && req.status !== 'Completed' && req.status !== 'Rejected' && (
                          <button
                            onClick={() => handleOpenConfirmModal(req)}
                            className="btn-primary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Accept & Confirm Specific Available Slot"
                          >
                            <Check size={12} /> Confirm Slot
                          </button>
                        )}

                        {req.status !== 'Rejected' && req.status !== 'Completed' && (
                          <button
                            onClick={() => handleOpenProposeModal(req)}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Propose Alternative Slot"
                          >
                            <RotateCcw size={12} /> Propose Alt
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenReassignModal(req)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="Assign or Change Doctor"
                        >
                          <UserCheck size={12} /> Reassign
                        </button>

                        {req.status !== 'Rejected' && req.status !== 'Completed' && (
                          <button
                            onClick={() => handleOpenRejectModal(req)}
                            className="btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            title="Reject Request"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Confirm & Select Verified Slot */}
      {isConfirmModalOpen && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Confirm Appointment Slot</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Enquiry #{selectedRequest.id} for {selectedRequest.patientName}
                </p>
              </div>
              <button onClick={() => setIsConfirmModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteConfirm} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {errorBanner && (
                <div style={{ padding: '10px', background: 'var(--rose-light)', border: '1px solid #f43f5e', borderRadius: 'var(--radius-md)', color: '#fb7185', fontSize: '13px' }}>
                  {errorBanner}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Attending Doctor</label>
                  <select
                    className="form-select"
                    value={selectedDoctorId}
                    onChange={(e) => {
                      setSelectedDoctorId(e.target.value);
                      setSelectedSlotTime('');
                    }}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.specialties.join(', ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Consultation Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={confirmDate}
                    onChange={(e) => {
                      setConfirmDate(e.target.value);
                      setSelectedSlotTime('');
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Verified Non-Conflicting Slots for this Doctor</span>
                  <span style={{ color: 'var(--text-subtle)' }}>Duration: {currentClinic.defaultAppointmentDurationMinutes} min</span>
                </label>

                {availableSlots.length === 0 ? (
                  <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    No available working slots for Dr. on {confirmDate} (Clinic closed, doctor off-duty or on leave).
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                    {availableSlots.map((slot, idx) => (
                      <button
                        type="button"
                        key={idx}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlotTime(slot.time)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px',
                          fontWeight: 500,
                          textAlign: 'center',
                          border: selectedSlotTime === slot.time ? '2px solid #38bdf8' : '1px solid var(--border-color)',
                          background: selectedSlotTime === slot.time
                            ? 'var(--primary-light)'
                            : slot.available
                            ? 'var(--bg-tertiary)'
                            : 'rgba(255,255,255,0.02)',
                          color: slot.available ? 'var(--text-main)' : 'var(--text-subtle)',
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          opacity: slot.available ? 1 : 0.45
                        }}
                        title={slot.conflictReason || 'Slot Available'}
                      >
                        {slot.time}
                        {!slot.available && <div style={{ fontSize: '10px', color: '#fb7185' }}>Booked/Break</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={!selectedSlotTime} className="btn-primary">
                  Lock & Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reject Modal */}
      {isRejectModalOpen && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Reject Appointment Request</h3>
            </div>
            <form onSubmit={handleExecuteReject} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Please provide a clear clinical or operational reason to inform {selectedRequest.patientName}.
              </p>
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsRejectModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-danger">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Propose Alternative */}
      {isProposeModalOpen && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Propose Alternative Slot</h3>
            </div>
            <form onSubmit={handleExecutePropose} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Proposed Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={proposalDate}
                    onChange={(e) => setProposalDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={proposalStart}
                      onChange={(e) => setProposalStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={proposalEnd}
                      onChange={(e) => setProposalEnd(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Message Note for Patient</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={proposalNote}
                  onChange={(e) => setProposalNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsProposeModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Send Alternative Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Reassign Doctor */}
      {isReassignModalOpen && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Reassign Attending Physician</h3>
            </div>
            <form onSubmit={handleExecuteReassign} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Select Physician</label>
                <select
                  className="form-select"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} — {d.specialties.join(', ')}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsReassignModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Reassign Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Simulate Patient Web Booking */}
      {isNewBookingModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Simulate Patient Platform Inbound Request</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Demonstrates how a patient enquiry enters this clinic's queue without auto-confirming.
              </p>
            </div>
            <form onSubmit={handleCreateMockIncomingRequest} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    className="form-input"
                    value={newReqPatientName}
                    onChange={(e) => setNewReqPatientName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Consultation Mode</label>
                  <select
                    className="form-select"
                    value={newReqMode}
                    onChange={(e) => setNewReqMode(e.target.value as ConsultationMode)}
                  >
                    <option value="in-person">In-Person Consultation</option>
                    <option value="video">Telehealth Video Call</option>
                    <option value="voice">Audio Voice Call</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Requested Service</label>
                  <select
                    className="form-select"
                    value={newReqServiceId}
                    onChange={(e) => setNewReqServiceId(e.target.value)}
                  >
                    {currentClinic.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.consultationFee})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Doctor</label>
                  <select
                    className="form-select"
                    value={newReqDoctorId}
                    onChange={(e) => setNewReqDoctorId(e.target.value)}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preferred Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newReqPreferredDate}
                    onChange={(e) => setNewReqPreferredDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Symptoms / Reason For Consultation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Recurring migraine & fatigue"
                    className="form-input"
                    value={newReqReason}
                    onChange={(e) => setNewReqReason(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsNewBookingModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Mock Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
