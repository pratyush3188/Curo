import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicService } from '../services/clinicService';
import { Doctor, ConsultationMode, DoctorWorkingHours } from '../types';
import {
  UserCheck,
  Plus,
  Edit2,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  IndianRupee,
  Save,
  Check
} from 'lucide-react';

export const DoctorsSection: React.FC = () => {
  const { currentClinic, userRole, isDoctor, activeDoctor, isReceptionist, reloadClinicData } = useClinic();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Doctor editing own working hours directly
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  // Edit doctor profile form
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    title: '',
    specialties: 'Cardiology, Hypertension',
    qualifications: 'MBBS, MD',
    bio: '',
    consultationFee: 1500,
    supportedModes: ['in-person', 'video'] as ConsultationMode[],
    avatarUrl: ''
  });

  // Working hours editing state
  const [tempSchedule, setTempSchedule] = useState<DoctorWorkingHours[]>([]);

  // Leave form
  const [leaveStartDate, setLeaveStartDate] = useState('2026-11-10');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-11-14');
  const [leaveReason, setLeaveReason] = useState('Medical Conference / CME');

  if (!currentClinic) return null;

  const doctors = ClinicService.getDoctors(currentClinic.id);

  // If active user is doctor (e.g. Dr. Rajesh Sharma), restrict roster list strictly to them
  // so there is no exposure of other doctors' schedules. Receptionist sees all.
  const visibleDoctors = isDoctor && activeDoctor
    ? doctors.filter((d) => d.id === activeDoctor.id || d.fullName.toLowerCase().includes(activeDoctor.fullName.toLowerCase()))
    : doctors;

  // If active user is doctor, default selection to them
  const defaultDoc = isDoctor && activeDoctor ? activeDoctor : visibleDoctors[0] || doctors[0];
  const selectedDoctor = visibleDoctors.find((d) => d.id === selectedDoctorId) || defaultDoc;

  const canEditDoctor = isReceptionist || (isDoctor && selectedDoctor?.id === activeDoctor?.id);

  const handleOpenAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm({
      fullName: '',
      title: 'Consultant Physician',
      specialties: 'General Medicine',
      qualifications: 'MBBS, MD',
      bio: '',
      consultationFee: 1000,
      supportedModes: ['in-person', 'video'],
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
    });
    setIsDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc);
    setDoctorForm({
      fullName: doc.fullName,
      title: doc.title,
      specialties: doc.specialties.join(', '),
      qualifications: doc.qualifications.join(', '),
      bio: doc.bio,
      consultationFee: doc.consultationFee,
      supportedModes: [...doc.supportedModes],
      avatarUrl: doc.avatarUrl
    });
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultSchedule: DoctorWorkingHours[] = [
      { day: 'Monday', isWorking: true, shifts: [{ start: '09:30', end: '17:00' }], breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }] },
      { day: 'Tuesday', isWorking: true, shifts: [{ start: '09:30', end: '17:00' }], breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }] },
      { day: 'Wednesday', isWorking: true, shifts: [{ start: '09:30', end: '17:00' }], breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }] },
      { day: 'Thursday', isWorking: true, shifts: [{ start: '09:30', end: '17:00' }], breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }] },
      { day: 'Friday', isWorking: true, shifts: [{ start: '09:30', end: '16:00' }], breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }] },
      { day: 'Saturday', isWorking: true, shifts: [{ start: '10:00', end: '13:30' }], breaks: [] },
      { day: 'Sunday', isWorking: false, shifts: [], breaks: [] }
    ];

    const toSave: Doctor = {
      id: editingDoctor ? editingDoctor.id : `doc-in-${Date.now().toString().slice(-4)}`,
      clinicId: currentClinic.id,
      fullName: doctorForm.fullName,
      title: doctorForm.title,
      specialties: doctorForm.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      qualifications: doctorForm.qualifications.split(',').map((s) => s.trim()).filter(Boolean),
      bio: doctorForm.bio,
      consultationFee: Number(doctorForm.consultationFee),
      supportedModes: doctorForm.supportedModes,
      avatarUrl: doctorForm.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      isActive: editingDoctor ? editingDoctor.isActive : true,
      weeklySchedule: editingDoctor ? editingDoctor.weeklySchedule : defaultSchedule,
      leaves: editingDoctor ? editingDoctor.leaves : []
    };

    ClinicService.saveDoctor(currentClinic.id, toSave);
    reloadClinicData();
    setIsDoctorModalOpen(false);
  };

  const handleToggleActive = (docId: string) => {
    ClinicService.toggleDoctorActive(currentClinic.id, docId);
    reloadClinicData();
  };

  const handleStartEditingSchedule = () => {
    if (!selectedDoctor) return;
    setTempSchedule(JSON.parse(JSON.stringify(selectedDoctor.weeklySchedule)));
    setIsEditingSchedule(true);
    setScheduleSuccessMsg(null);
  };

  const handleSaveSchedule = () => {
    if (!selectedDoctor) return;
    const updated = { ...selectedDoctor, weeklySchedule: tempSchedule };
    ClinicService.saveDoctor(currentClinic.id, updated);
    reloadClinicData();
    setIsEditingSchedule(false);
    setScheduleSuccessMsg('Doctor consultation & shift hours updated successfully.');
    setTimeout(() => setScheduleSuccessMsg(null), 4000);
  };

  const handleUpdateDayShift = (dayIdx: number, field: 'start' | 'end', val: string) => {
    setTempSchedule((prev) => {
      const copy = [...prev];
      if (!copy[dayIdx].shifts[0]) {
        copy[dayIdx].shifts[0] = { start: '09:00', end: '17:00' };
      }
      copy[dayIdx].shifts[0][field] = val;
      return copy;
    });
  };

  const handleToggleDayWorking = (dayIdx: number) => {
    setTempSchedule((prev) => {
      const copy = [...prev];
      copy[dayIdx].isWorking = !copy[dayIdx].isWorking;
      if (copy[dayIdx].isWorking && copy[dayIdx].shifts.length === 0) {
        copy[dayIdx].shifts = [{ start: '09:30', end: '17:00' }];
      }
      return copy;
    });
  };

  const handleAddLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    const updatedLeaves = [
      ...selectedDoctor.leaves,
      { startDate: leaveStartDate, endDate: leaveEndDate, reason: leaveReason }
    ];
    ClinicService.saveDoctor(currentClinic.id, { ...selectedDoctor, leaves: updatedLeaves });
    reloadClinicData();
    setIsLeaveModalOpen(false);
  };

  const toggleMode = (mode: ConsultationMode) => {
    setDoctorForm((prev) => {
      const exists = prev.supportedModes.includes(mode);
      if (exists) {
        if (prev.supportedModes.length === 1) return prev;
        return { ...prev, supportedModes: prev.supportedModes.filter((m) => m !== mode) };
      }
      return { ...prev, supportedModes: [...prev.supportedModes, mode] };
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top action bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '14px'
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
            Doctors & Clinical Availability
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {isDoctor
              ? 'As a doctor, you can review and update your own shift timings and consultation hours below.'
              : 'Receptionists have full authorization to manage doctor rosters, update working hours, and manage profiles.'}
          </p>
        </div>
        {isReceptionist && (
          <button onClick={handleOpenAddDoctor} className="btn-primary" style={{ fontSize: '12px' }}>
            <Plus size={15} /> Add New Physician
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Doctors left sidebar list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleDoctors.map((doc) => {
            const isSelected = selectedDoctor?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoctorId(doc.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  background: isSelected ? 'rgba(0, 131, 143, 0.08)' : 'var(--bg-card)',
                  border: isSelected ? '2px solid #00838f' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <img
                  src={doc.avatarUrl}
                  alt={doc.fullName}
                  style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {doc.fullName}
                    </h4>
                  </div>
                  <div style={{ fontSize: '11px', color: '#00838f', fontWeight: 600 }}>{doc.specialties[0]}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    {doc.isActive ? (
                      <span className="badge badge-emerald" style={{ padding: '1px 6px', fontSize: '10px' }}>
                        Active
                      </span>
                    ) : (
                      <span className="badge badge-rose" style={{ padding: '1px 6px', fontSize: '10px' }}>
                        Deactivated
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>
                      ₹{doc.consultationFee}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: isSelected ? '#00838f' : 'var(--text-subtle)' }} />
              </div>
            );
          })}
        </div>

        {/* Doctor detail panel */}
        {selectedDoctor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', gap: '16px' }}>
                  <img
                    src={selectedDoctor.avatarUrl}
                    alt={selectedDoctor.fullName}
                    style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedDoctor.fullName}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{selectedDoctor.title}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {selectedDoctor.specialties.map((spec) => (
                        <span key={spec} className="badge badge-blue">
                          {spec}
                        </span>
                      ))}
                      {selectedDoctor.qualifications.map((q) => (
                        <span key={q} className="tag-pill" style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {canEditDoctor && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleOpenEditDoctor(selectedDoctor)} className="btn-secondary" style={{ fontSize: '12px' }}>
                      <Edit2 size={13} /> Edit Profile
                    </button>
                    {isReceptionist && (
                      <button
                        onClick={() => handleToggleActive(selectedDoctor.id)}
                        className={selectedDoctor.isActive ? 'btn-danger' : 'btn-primary'}
                        style={{ fontSize: '12px' }}
                      >
                        {selectedDoctor.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                {selectedDoctor.bio}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  fontSize: '12px'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-subtle)' }}>Standard Fee:</span>{' '}
                  <strong style={{ color: '#059669', fontSize: '14px' }}>₹{selectedDoctor.consultationFee}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-subtle)' }}>Consultation Modes:</span>{' '}
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                    {selectedDoctor.supportedModes.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Weekly Schedule View & Editing (Doctor self-update + Receptionist update) */}
            <div className="card" style={{ padding: '20px' }}>
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div>
                  <h4 className="card-title">
                    <Clock size={16} style={{ color: '#00838f' }} /> Weekly Shift & Consultation Hours
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
                    Doctors and receptionists can directly customize operational shifts
                  </span>
                </div>

                {canEditDoctor && (
                  <div>
                    {isEditingSchedule ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setIsEditingSchedule(false)}
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSchedule}
                          className="btn-primary"
                          style={{ fontSize: '12px', padding: '5px 12px' }}
                        >
                          <Save size={13} /> Save Hours
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartEditingSchedule}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px', borderColor: '#00838f', color: '#00838f' }}
                      >
                        <Edit2 size={13} /> Update Working Hours
                      </button>
                    )}
                  </div>
                )}
              </div>

              {scheduleSuccessMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    color: '#065f46',
                    fontSize: '12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} /> {scheduleSuccessMsg}
                </div>
              )}

              {/* Read-only or Editable schedule */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(isEditingSchedule ? tempSchedule : selectedDoctor.weeklySchedule).map((sched, idx) => (
                  <div
                    key={sched.day}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ width: '120px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {sched.day}
                    </div>

                    {isEditingSchedule ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={sched.isWorking}
                            onChange={() => handleToggleDayWorking(idx)}
                          />
                          Available
                        </label>
                        {sched.isWorking ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="time"
                              className="form-input"
                              style={{ padding: '4px 6px', fontSize: '12px', width: '100px' }}
                              value={sched.shifts[0]?.start || '09:00'}
                              onChange={(e) => handleUpdateDayShift(idx, 'start', e.target.value)}
                            />
                            <span>to</span>
                            <input
                              type="time"
                              className="form-input"
                              style={{ padding: '4px 6px', fontSize: '12px', width: '100px' }}
                              value={sched.shifts[0]?.end || '17:00'}
                              onChange={(e) => handleUpdateDayShift(idx, 'end', e.target.value)}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Off Duty</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        {sched.isWorking ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {sched.shifts.map((s, sIdx) => (
                              <span key={sIdx} className="badge badge-emerald">
                                {s.start} – {s.end}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="badge badge-rose">Off Duty</span>
                        )}
                      </div>
                    )}

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {sched.breaks.length > 0 ? (
                        <span>
                          Break: {sched.breaks.map((b) => `${b.label} (${b.start}-${b.end})`).join(', ')}
                        </span>
                      ) : (
                        <span>No break scheduled</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled Leave & Blackouts */}
            <div className="card" style={{ padding: '20px' }}>
              <div className="card-header">
                <h4 className="card-title">
                  <Calendar size={16} style={{ color: 'var(--amber)' }} /> Scheduled Leave & Unavailable Dates
                </h4>
                {canEditDoctor && (
                  <button onClick={() => setIsLeaveModalOpen(true)} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>
                    <Plus size={13} /> Add Leave Period
                  </button>
                )}
              </div>

              {selectedDoctor.leaves.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  No active blackout leave periods recorded for this doctor.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {selectedDoctor.leaves.map((l, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#d97706' }}>
                        {l.startDate} → {l.endDate}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {l.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Doctor Profile */}
      {isDoctorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                {editingDoctor ? 'Edit Doctor Profile' : 'Add New Physician to Clinic'}
              </h3>
              <button onClick={() => setIsDoctorModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Physician Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="form-input"
                    value={doctorForm.fullName}
                    onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Clinical Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Cardiologist"
                    className="form-input"
                    value={doctorForm.title}
                    onChange={(e) => setDoctorForm({ ...doctorForm, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Specialties (comma separated)</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={doctorForm.specialties}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialties: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Qualifications (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={doctorForm.qualifications}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Consultation Fee (INR ₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    className="form-input"
                    value={doctorForm.consultationFee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Supported Modes</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    {(['in-person', 'video', 'voice'] as ConsultationMode[]).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => toggleMode(mode)}
                        className={doctorForm.supportedModes.includes(mode) ? 'badge badge-blue' : 'btn-secondary'}
                        style={{ padding: '6px 10px', cursor: 'pointer' }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Doctor Bio & Experience</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  value={doctorForm.bio}
                  onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsDoctorModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Physician Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Leave */}
      {isLeaveModalOpen && selectedDoctor && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Record Doctor Leave</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Blocks booking slots for {selectedDoctor.fullName} during this leave window.
              </p>
            </div>
            <form onSubmit={handleAddLeave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Absence</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CME Conference, Personal Leave"
                  className="form-input"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
