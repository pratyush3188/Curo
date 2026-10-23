import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicService } from '../services/clinicService';
import { PatientRecord, PatientDocument, ConsultationMode } from '../types';
import {
  Users,
  Search,
  FileText,
  Calendar,
  AlertTriangle,
  Eye,
  ChevronRight,
  Clock,
  Phone,
  Mail,
  HeartPulse,
  Edit2,
  CalendarPlus,
  Plus,
  Upload,
  Check,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

export interface PatientsSectionProps {
  initialTab?: 'directory' | 'reports' | 'next-visit';
}

export const PatientsSection: React.FC<PatientsSectionProps> = ({ initialTab = 'directory' }) => {
  const { currentClinic, isDoctor, activeDoctor, reloadClinicData } = useClinic();
  const [activeTab, setActiveTab] = useState<'directory' | 'reports' | 'next-visit'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [viewingDoc, setViewingDoc] = useState<PatientDocument | null>(null);

  // Sync tab if prop changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Edit patient modal
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);

  // Add report modal
  const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<PatientDocument['fileType']>('lab_result');
  const [reportFileSize, setReportFileSize] = useState('1.1 MB');

  // Book Appointment / Next Visit modal
  const [isNextVisitModalOpen, setIsNextVisitModalOpen] = useState(false);
  const [nextVisitDate, setNextVisitDate] = useState('2026-10-25');
  const [nextVisitTime, setNextVisitTime] = useState('11:00');
  const [nextVisitDoctorId, setNextVisitDoctorId] = useState('');
  const [nextVisitMode, setNextVisitMode] = useState<ConsultationMode>('in-person');
  const [nextVisitReason, setNextVisitReason] = useState('Follow-up review and test evaluation');
  const [modalError, setModalError] = useState<string | null>(null);

  // Success alert
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  if (!currentClinic) return null;

  const allPatients = ClinicService.getPatients(currentClinic.id);
  const appointments = ClinicService.getAppointments(currentClinic.id);
  const consultations = ClinicService.getConsultations(currentClinic.id);
  const doctors = ClinicService.getDoctors(currentClinic.id);

  // Doctor scope: if user logged in as a doctor (e.g. Dr. Rajesh Sharma),
  // they only see records of patients who have visited them or will visit them.
  const doctorPatientIds = React.useMemo(() => {
    if (!isDoctor || !activeDoctor) return null;
    const ids = new Set<string>();
    appointments.forEach((a) => {
      if (a.doctorId === activeDoctor.id || a.doctorName.toLowerCase().includes(activeDoctor.fullName.toLowerCase())) {
        ids.add(a.patientId);
      }
    });
    consultations.forEach((c) => {
      if (c.doctorId === activeDoctor.id || c.doctorName.toLowerCase().includes(activeDoctor.fullName.toLowerCase())) {
        ids.add(c.patientId);
      }
    });
    return ids;
  }, [isDoctor, activeDoctor, appointments, consultations]);

  const scopedPatients = doctorPatientIds
    ? allPatients.filter((p) => doctorPatientIds.has(p.id))
    : allPatients;

  const filteredPatients = scopedPatients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  const selectedPatient = scopedPatients.find((p) => p.id === selectedPatientId) || filteredPatients[0];

  const rawAppointments = selectedPatient
    ? appointments.filter((a) => a.patientId === selectedPatient.id)
    : [];

  // If active doctor, only show appointments related to this doctor
  const patientAppointments = isDoctor && activeDoctor
    ? rawAppointments.filter(
        (a) => a.doctorId === activeDoctor.id || a.doctorName.toLowerCase().includes(activeDoctor.fullName.toLowerCase())
      )
    : rawAppointments;

  const handleOpenBookAppointment = () => {
    const defaultDocId = (isDoctor && activeDoctor ? activeDoctor.id : doctors[0]?.id) || '';
    setNextVisitDoctorId(defaultDocId);
    setNextVisitDate('2026-10-25');
    setNextVisitTime('11:00');
    setNextVisitMode('in-person');
    setNextVisitReason('Follow-up review and consultation');
    setModalError(null);
    setIsNextVisitModalOpen(true);
  };

  const handleOpenEditPatient = (pat: PatientRecord) => {
    setEditingPatient(JSON.parse(JSON.stringify(pat)));
    setIsEditPatientModalOpen(true);
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    ClinicService.savePatient(currentClinic.id, editingPatient);
    reloadClinicData();
    setIsEditPatientModalOpen(false);
    setSuccessBanner('Patient information updated successfully.');
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !reportTitle) return;

    const newDoc: PatientDocument = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      title: reportTitle,
      fileType: reportType,
      fileSize: reportFileSize || '1.2 MB',
      uploadedAt: new Date().toISOString().split('T')[0],
      isRestricted: false
    };

    const updated = {
      ...selectedPatient,
      documents: [newDoc, ...selectedPatient.documents]
    };

    ClinicService.savePatient(currentClinic.id, updated);
    reloadClinicData();
    setIsAddReportModalOpen(false);
    setReportTitle('');
    setSuccessBanner('Diagnostic report uploaded and linked to patient file.');
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  const handleScheduleNextVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setModalError('Please select a valid patient.');
      return;
    }

    const doc = doctors.find((d) => d.id === nextVisitDoctorId) || doctors[0];
    if (!doc) {
      setModalError('No doctor available to schedule.');
      return;
    }

    try {
      // Calculate endTime (30 mins default duration)
      const [hStr, mStr] = nextVisitTime.split(':');
      let h = parseInt(hStr || '11', 10);
      let m = parseInt(mStr || '00', 10) + 30;
      if (m >= 60) {
        h += 1;
        m -= 60;
      }
      const endTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      ClinicService.createAppointmentRequest(currentClinic.id, {
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        patientContact: {
          phone: selectedPatient.phone,
          email: selectedPatient.email
        },
        doctorId: doc.id,
        doctorName: doc.fullName,
        specialty: doc.specialties[0] || 'Cardiology',
        serviceId: currentClinic.services[0]?.id || 'srv-c1-1',
        serviceName: currentClinic.services[0]?.name || 'Patient Consultation',
        consultationMode: nextVisitMode,
        preferredDate: nextVisitDate,
        preferredTimeRange: `${nextVisitTime} - ${endTime}`,
        reasonForVisit: nextVisitReason || 'Patient Consultation & Follow-up',
        status: 'Confirmed',
        confirmedSlot: {
          date: nextVisitDate,
          startTime: nextVisitTime,
          endTime
        },
        fee: doc.consultationFee,
        paymentStatus: 'Pending'
      });

      reloadClinicData();
      setIsNextVisitModalOpen(false);
      setSuccessBanner(`Appointment confirmed with ${doc.fullName} for ${nextVisitDate} at ${nextVisitTime}.`);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Failed to book appointment.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Action Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px 20px',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                {activeTab === 'directory' && 'Patient Directory & Demographics'}
                {activeTab === 'reports' && 'Patient Diagnostic Reports & Lab Files'}
                {activeTab === 'next-visit' && 'Next Visit & Appointment Scheduling'}
              </h3>
              {isDoctor && activeDoctor && (
                <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                  Restricted to {activeDoctor.fullName}'s Patients
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {isDoctor && activeDoctor
                ? `You are viewing records only for patients who are scheduled or have previously visited ${activeDoctor.fullName}.`
                : 'Manage patient profiles, diagnostic laboratory files, and book next revisitations.'}
            </p>
          </div>

          {selectedPatient && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleOpenEditPatient(selectedPatient)}
                className="btn-secondary"
                style={{ fontSize: '12px' }}
              >
                <Edit2 size={13} /> Edit Details
              </button>
              <button
                onClick={() => setIsAddReportModalOpen(true)}
                className="btn-secondary"
                style={{ fontSize: '12px', borderColor: '#00838f', color: '#00838f' }}
              >
                <Upload size={13} /> Upload Report
              </button>
              <button
                onClick={handleOpenBookAppointment}
                className="btn-primary"
                style={{ fontSize: '12px' }}
              >
                <CalendarPlus size={14} /> Book a New Appointment
              </button>
            </div>
          )}
        </div>

        {/* Tab switcher buttons inside patient section */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
          <button
            onClick={() => setActiveTab('directory')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'directory' ? '#00838f' : '#f1f5f9',
              color: activeTab === 'directory' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
            Patient Directory & Overview
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'reports' ? '#00838f' : '#f1f5f9',
              color: activeTab === 'reports' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
            Diagnostic Reports ({selectedPatient?.documents.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('next-visit')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'next-visit' ? '#00838f' : '#f1f5f9',
              color: activeTab === 'next-visit' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease'
            }}
          >
            <CalendarPlus size={13} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
            Next Visit & Appointments ({patientAppointments.length})
          </button>
        </div>
      </div>

      {successBanner && (
        <div
          style={{
            padding: '10px 14px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            color: '#065f46',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Check size={16} /> {successBanner}
        </div>
      )}

      {/* Main Grid: Directory vs Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Search & List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-subtle)'
              }}
            >
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              className="form-input"
              style={{ paddingLeft: '34px', fontSize: '12px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredPatients.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No patients match search.</p>
          ) : (
            filteredPatients.map((patient) => {
              const isSelected = selectedPatient?.id === patient.id;
              return (
                <div
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(0, 131, 143, 0.08)' : 'var(--bg-card)',
                    border: isSelected ? '2px solid #00838f' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {patient.fullName}
                    </h4>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>
                      {patient.id} • {patient.gender}, DOB: {patient.dateOfBirth}
                    </div>
                    <div style={{ fontSize: '11px', color: '#00838f', marginTop: '2px', fontWeight: 600 }}>
                      {patient.phone}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: isSelected ? '#00838f' : 'var(--text-subtle)' }} />
                </div>
              );
            })
          )}
        </div>

        {/* Patient Details & Clinical Record Viewer */}
        {selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Demographic Card - shown in directory or full view */}
            {(activeTab === 'directory' || activeTab === 'reports') && (
              <div className="card" style={{ padding: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '14px'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedPatient.fullName}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                      <span className="badge badge-blue">{selectedPatient.id}</span>
                      <span className="tag-pill" style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        DOB: {selectedPatient.dateOfBirth}
                      </span>
                      <span className="tag-pill" style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        Blood: {selectedPatient.bloodGroup}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEditPatient(selectedPatient)}
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    <Edit2 size={12} /> Edit Demographics
                  </button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-subtle)' }}>Phone:</span> <div style={{ fontWeight: 600 }}>{selectedPatient.phone}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)' }}>Email:</span> <div>{selectedPatient.email}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)' }}>Emergency Contact:</span>
                    <div>
                      {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relation}) -{' '}
                      {selectedPatient.emergencyContact.phone}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-subtle)' }}>Registered Date:</span>
                    <div>{selectedPatient.registeredDate}</div>
                  </div>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedPatient.allergies.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#e11d48', fontWeight: 700 }}>Allergies:</span>
                      {selectedPatient.allergies.map((a) => (
                        <span key={a} className="badge badge-rose">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedPatient.chronicConditions.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>Chronic:</span>
                      {selectedPatient.chronicConditions.map((c) => (
                        <span key={c} className="badge badge-amber">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Reports & Documents Preview - shown in reports and directory */}
            {(activeTab === 'reports' || activeTab === 'directory') && (
              <div className="card" style={{ padding: '20px' }}>
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <h4 className="card-title">
                    <FileText size={16} style={{ color: '#00838f' }} /> Diagnostic Reports & Uploaded Files
                  </h4>
                  <button onClick={() => setIsAddReportModalOpen(true)} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px', borderColor: '#00838f', color: '#00838f' }}>
                    <Plus size={13} /> Add Report
                  </button>
                </div>

                {selectedPatient.documents.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    No reports attached yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedPatient.documents.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={18} style={{ color: '#00838f' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{doc.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {doc.fileType.toUpperCase()} • {doc.fileSize} • Uploaded: {doc.uploadedAt}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                        >
                          <Eye size={13} /> View Report
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scheduled Appointments & Revisitation History - shown in next-visit and directory */}
            {(activeTab === 'next-visit' || activeTab === 'directory') && (
              <div className="card" style={{ padding: '20px' }}>
                <div className="card-header" style={{ marginBottom: '12px' }}>
                  <h4 className="card-title">
                    <Calendar size={16} style={{ color: '#00838f' }} /> Appointments & Revisitation History
                    {isDoctor && activeDoctor && (
                      <span style={{ fontSize: '11px', color: '#00838f', fontWeight: 500, marginLeft: '6px' }}>
                        (Filtered to {activeDoctor.fullName})
                      </span>
                    )}
                  </h4>
                  <button
                    onClick={handleOpenBookAppointment}
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '5px 12px' }}
                  >
                    <CalendarPlus size={13} /> Book a New Appointment
                  </button>
                </div>

                {patientAppointments.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      {isDoctor && activeDoctor
                        ? `No recorded appointments with ${activeDoctor.fullName} for this patient yet.`
                        : 'No recorded appointments for this patient yet.'}
                    </p>
                    <button
                      onClick={handleOpenBookAppointment}
                      className="btn-primary"
                      style={{ fontSize: '12px', padding: '6px 14px' }}
                    >
                      <CalendarPlus size={14} /> Schedule Next Appointment
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {patientAppointments.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '13px' }}>
                            {a.serviceName} with <span style={{ color: '#00838f' }}>{a.doctorName}</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                            Slot: <strong>{a.confirmedSlot ? `${a.confirmedSlot.date} (${a.confirmedSlot.startTime} - ${a.confirmedSlot.endTime})` : a.preferredDate}</strong> • Mode: <span style={{ textTransform: 'capitalize' }}>{a.consultationMode}</span>
                          </div>
                          {a.reasonForVisit && (
                            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                              Purpose: <em>{a.reasonForVisit}</em>
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={a.status === 'Confirmed' ? 'badge badge-emerald' : 'badge badge-blue'}>
                            {a.status}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
                            ₹{a.fee} • {a.paymentStatus}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* MODAL: EDIT PATIENT DEMOGRAPHICS (Receptionist) */}
      {isEditPatientModalOpen && editingPatient && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Edit2 size={16} style={{ color: '#00838f' }} /> Edit Patient Information
              </h3>
              <button onClick={() => setIsEditPatientModalOpen(false)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePatient} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editingPatient.fullName}
                  onChange={(e) => setEditingPatient({ ...editingPatient, fullName: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingPatient.phone}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editingPatient.email}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingPatient.dateOfBirth}
                    onChange={(e) => setEditingPatient({ ...editingPatient, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingPatient.bloodGroup}
                    onChange={(e) => setEditingPatient({ ...editingPatient, bloodGroup: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Allergies (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingPatient.allergies.join(', ')}
                  onChange={(e) =>
                    setEditingPatient({
                      ...editingPatient,
                      allergies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chronic Conditions (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingPatient.chronicConditions.join(', ')}
                  onChange={(e) =>
                    setEditingPatient({
                      ...editingPatient,
                      chronicConditions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsEditPatientModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD LAB REPORT */}
      {isAddReportModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Upload size={16} style={{ color: '#00838f' }} /> Attach Patient Diagnostic Report
              </h3>
              <button onClick={() => setIsAddReportModalOpen(false)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lipid Profile & Liver Function Panel"
                  className="form-input"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Report Category</label>
                  <select
                    className="form-select"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                  >
                    <option value="lab_result">Lab Result (Blood/Biomarker)</option>
                    <option value="imaging_scan">Imaging / Scan (ECG / Ultrasound)</option>
                    <option value="pdf">General Medical PDF Document</option>
                    <option value="summary">Clinical Summary / Discharge</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">File Size</label>
                  <input
                    type="text"
                    className="form-input"
                    value={reportFileSize}
                    onChange={(e) => setReportFileSize(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsAddReportModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Attach Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BOOK NEW APPOINTMENT / NEXT VISIT */}
      {isNextVisitModalOpen && selectedPatient && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <CalendarPlus size={18} style={{ color: '#00838f' }} /> Book a New Appointment for Patient
              </h3>
              <button onClick={() => setIsNextVisitModalOpen(false)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            {modalError && (
              <div
                style={{
                  margin: '14px 20px 0 20px',
                  padding: '10px 12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  color: '#b91c1c',
                  fontSize: '12px'
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleScheduleNextVisit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Patient</label>
                <input
                  type="text"
                  disabled
                  className="form-input"
                  style={{ background: '#f8fafc', color: '#334155', fontWeight: 600 }}
                  value={`${selectedPatient.fullName} (${selectedPatient.phone})`}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Consulting Doctor</label>
                  <select
                    className="form-select"
                    value={nextVisitDoctorId}
                    onChange={(e) => setNextVisitDoctorId(e.target.value)}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.specialties[0]})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mode</label>
                  <select
                    className="form-select"
                    value={nextVisitMode}
                    onChange={(e) => setNextVisitMode(e.target.value as ConsultationMode)}
                  >
                    <option value="in-person">In-Person Consultation</option>
                    <option value="video">Tele-Video Consultation</option>
                    <option value="voice">Tele-Voice Consultation</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Appointment Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={nextVisitDate}
                    onChange={(e) => setNextVisitDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={nextVisitTime}
                    onChange={(e) => setNextVisitTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Purpose / Reason</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={nextVisitReason}
                  onChange={(e) => setNextVisitReason(e.target.value)}
                  placeholder="e.g. Routine blood pressure check, post-medication follow-up"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsNextVisitModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>
                  <CalendarCheck size={14} /> Confirm & Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document preview modal */}
      {viewingDoc && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{viewingDoc.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  File ID: {viewingDoc.id} • {viewingDoc.fileSize} • Uploaded {viewingDoc.uploadedAt}
                </p>
              </div>
              <button onClick={() => setViewingDoc(null)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  height: '220px',
                  background: 'var(--bg-primary)',
                  borderRadius: '10px',
                  border: '1px dashed var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <FileText size={42} style={{ color: '#00838f' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Clinical Document Viewer</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '360px' }}>
                  Simulated diagnostic report preview. Encrypted clinical record verified.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setViewingDoc(null)} className="btn-primary">
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
