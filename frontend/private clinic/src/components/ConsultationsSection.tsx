import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicService } from '../services/clinicService';
import { ConsultationRecord, PrescriptionMedication, ConsultationMode, AppointmentRequest } from '../types';
import {
  FileSignature,
  Plus,
  Trash2,
  CheckCircle,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Pill,
  Clock,
  Printer,
  CalendarPlus,
  ArrowRight
} from 'lucide-react';

export const ConsultationsSection: React.FC = () => {
  const { currentClinic, userRole, isDoctor, activeDoctor, reloadClinicData } = useClinic();
  const [selectedConsultationId, setSelectedConsultationId] = useState<string>('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'consultations' | 'upcoming-visits'>('consultations');

  // Form states for creating / drafting a consultation
  const [formAppointmentId, setFormAppointmentId] = useState('');
  const [formPatientId, setFormPatientId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formMode, setFormMode] = useState<ConsultationMode>('in-person');
  const [formSymptoms, setFormSymptoms] = useState('');
  const [formObservations, setFormObservations] = useState('');
  const [formAssessment, setFormAssessment] = useState('');
  const [formPrescriptions, setFormPrescriptions] = useState<PrescriptionMedication[]>([]);
  const [formFollowUpDate, setFormFollowUpDate] = useState('2026-11-20');
  const [formFollowUpTime, setFormFollowUpTime] = useState('11:00');
  const [formFollowUpNotes, setFormFollowUpNotes] = useState('');
  const [createFollowUpAppointment, setCreateFollowUpAppointment] = useState(true);

  // Quick next appointment modal
  const [isQuickNextApptModalOpen, setIsQuickNextApptModalOpen] = useState(false);
  const [quickPatientId, setQuickPatientId] = useState('');
  const [quickDate, setQuickDate] = useState('2026-11-15');
  const [quickTime, setQuickTime] = useState('10:30');
  const [quickReason, setQuickReason] = useState('Follow-up review and medication assessment');

  // Drug input line
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('');
  const [medDuration, setMedDuration] = useState('');
  const [medInstructions, setMedInstructions] = useState('');

  if (!currentClinic) return null;

  const consultations = ClinicService.getConsultations(currentClinic.id);
  const appointments = ClinicService.getAppointments(currentClinic.id);
  const doctors = ClinicService.getDoctors(currentClinic.id);
  const patients = ClinicService.getPatients(currentClinic.id);

  // Filter consultations: if doctor, prioritize current doctor
  const filteredConsultations = isDoctor && activeDoctor
    ? consultations.filter((c) => c.doctorId === activeDoctor.id || c.doctorName.includes(activeDoctor.fullName))
    : consultations;

  const selectedConsultation =
    filteredConsultations.find((c) => c.id === selectedConsultationId) || filteredConsultations[0];

  // Upcoming appointments for the visiting doctor
  const doctorAppointments = isDoctor && activeDoctor
    ? appointments.filter((a) => a.doctorId === activeDoctor.id || a.doctorName.includes(activeDoctor.fullName))
    : appointments;

  const upcomingAppointments = doctorAppointments.filter((a) => a.status === 'Confirmed' || a.status === 'New');

  const handleOpenNewConsultation = (specificAppt?: AppointmentRequest) => {
    const apt = specificAppt || appointments.find((a) => a.status === 'Confirmed' || a.status === 'Completed') || appointments[0];
    const doc = activeDoctor || doctors.find((d) => d.id === apt?.doctorId) || doctors[0];
    const pat = patients.find((p) => p.id === apt?.patientId) || patients[0];

    setFormAppointmentId(apt?.id || '');
    setFormPatientId(pat?.id || '');
    setFormDoctorId(doc?.id || '');
    setFormMode(apt?.consultationMode || 'in-person');
    setFormSymptoms(apt?.reasonForVisit || 'Patient reports for follow-up review.');
    setFormObservations('Vitals: BP 128/82 mmHg, Pulse 72 bpm. Systemic review normal.');
    setFormAssessment('Routine clinical follow-up. Advised continuation of therapy.');
    setFormPrescriptions([
      {
        id: `rx-${Date.now().toString().slice(-4)}`,
        medicationName: 'Telmisartan Tablets IP',
        dosage: '40 mg',
        frequency: 'Once daily after breakfast',
        duration: '30 days',
        instructions: 'Monitor BP weekly in the morning.'
      }
    ]);
    setFormFollowUpDate('2026-11-25');
    setFormFollowUpTime('10:30');
    setFormFollowUpNotes('Review blood pressure log and kidney function panel.');
    setCreateFollowUpAppointment(true);
    setIsEditorOpen(true);
  };

  const handleAddMedication = () => {
    if (!medName) return;
    const newMed: PrescriptionMedication = {
      id: `rx-${Date.now().toString().slice(-5)}`,
      medicationName: medName,
      dosage: medDosage || '500 mg',
      frequency: medFrequency || 'Twice daily after meals',
      duration: medDuration || '7 days',
      instructions: medInstructions || 'Take with water after meals.'
    };
    setFormPrescriptions([...formPrescriptions, newMed]);
    setMedName('');
    setMedDosage('');
    setMedFrequency('');
    setMedDuration('');
    setMedInstructions('');
  };

  const handleRemoveMedication = (id: string) => {
    setFormPrescriptions(formPrescriptions.filter((m) => m.id !== id));
  };

  const handleSaveConsultation = (status: 'Draft' | 'Finalized') => {
    const doc = doctors.find((d) => d.id === formDoctorId) || activeDoctor || doctors[0];
    const pat = patients.find((p) => p.id === formPatientId) || patients[0];

    const record: ConsultationRecord = {
      id: `CON-${Date.now().toString().slice(-5)}`,
      clinicId: currentClinic.id,
      appointmentId: formAppointmentId,
      patientId: pat.id,
      patientName: pat.fullName,
      doctorId: doc.id,
      doctorName: doc.fullName,
      consultationDate: '2026-10-24',
      consultationMode: formMode,
      status,
      patientReportedSymptoms: formSymptoms,
      doctorObservations: formObservations,
      clinicalAssessment: formAssessment,
      prescriptions: formPrescriptions,
      followUpRecommendation: formFollowUpDate
        ? {
            recommendedDate: formFollowUpDate,
            notes: formFollowUpNotes,
            isScheduled: createFollowUpAppointment
          }
        : undefined,
      finalizedAt: status === 'Finalized' ? new Date().toISOString() : undefined,
      doctorSignatureStamp:
        status === 'Finalized' ? `${doc.fullName} (Registered Practitioner, Curo Healthcare)` : undefined
    };

    ClinicService.saveConsultation(currentClinic.id, record);

    // If an appointment was linked, mark it completed
    if (formAppointmentId) {
      try {
        ClinicService.updateAppointment(currentClinic.id, formAppointmentId, { status: 'Completed' });
      } catch (e) {
        console.log('Linked appointment update skipped', e);
      }
    }

    // Auto-schedule next revisiting appointment if enabled
    if (createFollowUpAppointment && formFollowUpDate) {
      try {
        ClinicService.createAppointmentRequest(currentClinic.id, {
          patientId: pat.id,
          patientName: pat.fullName,
          patientContact: {
            phone: pat.phone,
            email: pat.email
          },
          doctorId: doc.id,
          doctorName: doc.fullName,
          specialty: doc.specialties[0] || 'General Medicine',
          serviceId: currentClinic.services[0]?.id || 'srv-followup',
          serviceName: `Revisiting Follow-up: ${doc.fullName}`,
          consultationMode: formMode,
          preferredDate: formFollowUpDate,
          preferredTimeRange: `${formFollowUpTime} - ${formFollowUpTime}:30`,
          reasonForVisit: formFollowUpNotes || 'Doctor prescribed revisiting follow-up',
          status: 'Confirmed',
          confirmedSlot: {
            date: formFollowUpDate,
            startTime: formFollowUpTime,
            endTime: `${parseInt(formFollowUpTime.split(':')[0], 10)}:${parseInt(formFollowUpTime.split(':')[1] || '0', 10) + 30}`
          },
          fee: doc.consultationFee,
          paymentStatus: 'Pending'
        });
      } catch (e) {
        console.log('Could not automatically create follow-up appointment', e);
      }
    }

    reloadClinicData();
    setIsEditorOpen(false);
  };

  const handleCreateQuickNextAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = activeDoctor || doctors[0];
    const pat = patients.find((p) => p.id === quickPatientId) || patients[0];

    if (!pat) return;

    ClinicService.createAppointmentRequest(currentClinic.id, {
      patientId: pat.id,
      patientName: pat.fullName,
      patientContact: {
        phone: pat.phone,
        email: pat.email
      },
      doctorId: doc.id,
      doctorName: doc.fullName,
      specialty: doc.specialties[0] || 'Cardiology',
      serviceId: currentClinic.services[0]?.id || 'srv-c1-1',
      serviceName: 'Patient Revisiting Consultation',
      consultationMode: 'in-person',
      preferredDate: quickDate,
      preferredTimeRange: `${quickTime} - ${quickTime}:30`,
      reasonForVisit: quickReason,
      status: 'Confirmed',
      confirmedSlot: {
        date: quickDate,
        startTime: quickTime,
        endTime: `${quickTime.slice(0, 2)}:50`
      },
      fee: doc.consultationFee,
      paymentStatus: 'Pending'
    });

    reloadClinicData();
    setIsQuickNextApptModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Action Header */}
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
            Patient Consultations, Prescriptions & Revisiting Schedule
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Add patient prescriptions during visitation, review upcoming visits, and schedule next revisiting appointments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setQuickPatientId(patients[0]?.id || '');
              setIsQuickNextApptModalOpen(true);
            }}
            className="btn-secondary"
            style={{ fontSize: '12px', borderColor: '#00838f', color: '#00838f' }}
          >
            <CalendarPlus size={15} /> Book Next Appointment
          </button>
          <button onClick={() => handleOpenNewConsultation()} className="btn-primary" style={{ fontSize: '12px' }}>
            <Plus size={15} /> Add Prescription / Consult Visit
          </button>
        </div>
      </div>

      {/* Tabs: Past Consultations vs Upcoming Patient Queue */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('consultations')}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'consultations' ? '#00838f' : 'transparent',
            color: activeTab === 'consultations' ? '#ffffff' : '#475569'
          }}
        >
          Consultation Records & Prescriptions ({filteredConsultations.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming-visits')}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'upcoming-visits' ? '#00838f' : 'transparent',
            color: activeTab === 'upcoming-visits' ? '#ffffff' : '#475569'
          }}
        >
          Upcoming Patient Queue ({upcomingAppointments.length})
        </button>
      </div>

      {/* UPCOMING VISITING QUEUE TAB */}
      {activeTab === 'upcoming-visits' && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">
              <Calendar size={16} style={{ color: '#00838f' }} /> Upcoming Patient Visits (Visiting Doctor View)
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
              Patients scheduled to visit
            </span>
          </div>

          {upcomingAppointments.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              No upcoming appointments found.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{apt.patientName}</strong>
                      <span className="badge badge-indigo">{apt.consultationMode}</span>
                      <span className={apt.status === 'Confirmed' ? 'badge badge-emerald' : 'badge badge-amber'}>
                        {apt.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Reason: <em>"{apt.reasonForVisit}"</em>
                    </div>
                    <div style={{ fontSize: '12px', color: '#00838f', marginTop: '2px', fontWeight: 600 }}>
                      Doctor: {apt.doctorName} • Service: {apt.serviceName}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {apt.confirmedSlot?.date || apt.preferredDate}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {apt.confirmedSlot?.startTime || 'Morning'} – {apt.confirmedSlot?.endTime || 'Slot'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenNewConsultation(apt)}
                      className="btn-primary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <Pill size={14} /> Add Prescription Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONSULTATIONS LIST & PRESCRIPTION VIEW TAB */}
      {activeTab === 'consultations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* List of Consultations */}
          <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-main)' }}>
              Recorded Patient Consultations
            </h4>
            {filteredConsultations.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                No clinical consultations recorded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredConsultations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConsultationId(c.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedConsultation?.id === c.id ? '2px solid #00838f' : '1px solid var(--border-color)',
                      background: selectedConsultation?.id === c.id ? 'rgba(0, 131, 143, 0.05)' : 'var(--bg-tertiary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                        {c.patientName}
                      </span>
                      <span className={c.status === 'Finalized' ? 'badge badge-emerald' : 'badge badge-amber'}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      By: {c.doctorName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      Date: {c.consultationDate} • Rx items: {c.prescriptions.length}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Prescription & Consultation Details */}
          {selectedConsultation ? (
            <div className="card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '16px'
                }}
              >
                <div>
                  <span className="badge badge-blue">Case: {selectedConsultation.id}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, marginTop: '6px', color: 'var(--text-main)' }}>
                    Patient: {selectedConsultation.patientName}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Attending Physician: <strong>{selectedConsultation.doctorName}</strong> • Date: {selectedConsultation.consultationDate}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => window.print()}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  >
                    <Printer size={14} /> Print Rx
                  </button>
                  <button
                    onClick={() => {
                      setQuickPatientId(selectedConsultation.patientId);
                      setIsQuickNextApptModalOpen(true);
                    }}
                    className="btn-primary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <CalendarPlus size={14} /> Schedule Next Visit
                  </button>
                </div>
              </div>

              {/* Symptoms & Assessment */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 700 }}>
                    Patient Reported Symptoms
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px' }}>
                    {selectedConsultation.patientReportedSymptoms}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 700 }}>
                    Clinical Observations & Vitals
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px' }}>
                    {selectedConsultation.doctorObservations}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-subtle)', fontWeight: 700 }}>
                    Diagnosis & Clinical Assessment
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px' }}>
                    {selectedConsultation.clinicalAssessment}
                  </p>
                </div>

                {/* Prescription Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #ccfbf1',
                    borderRadius: '10px',
                    padding: '16px',
                    marginTop: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Pill size={18} style={{ color: '#00838f' }} />
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#006064', margin: 0 }}>
                      Digital Medical Prescription (Rx)
                    </h4>
                  </div>

                  {selectedConsultation.prescriptions.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      No medications prescribed for this session.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedConsultation.prescriptions.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          style={{
                            background: '#ffffff',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                              {idx + 1}. {p.medicationName} — <span style={{ color: '#00838f' }}>{p.dosage}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              Instructions: {p.instructions}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="badge badge-blue">{p.frequency}</span>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Duration: {p.duration}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Follow up & stamp */}
                {selectedConsultation.followUpRecommendation && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: 'rgba(5, 150, 105, 0.08)',
                      border: '1px solid rgba(5, 150, 105, 0.2)',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
                        Revisiting Follow-up Date: {selectedConsultation.followUpRecommendation.recommendedDate}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {selectedConsultation.followUpRecommendation.notes}
                      </div>
                    </div>
                    <span className="badge badge-emerald">
                      {selectedConsultation.followUpRecommendation.isScheduled ? 'Appointment Booked' : 'Recommended'}
                    </span>
                  </div>
                )}

                {selectedConsultation.doctorSignatureStamp && (
                  <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
                    Digitally signed by: <strong>{selectedConsultation.doctorSignatureStamp}</strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a consultation from the list or click "Add Prescription / Consult Visit".
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD PRESCRIPTION & CONSULTATION AT VISITATION */}
      {isEditorOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Stethoscope size={18} style={{ color: '#00838f' }} /> Record Patient Consultation & Prescription
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Visiting Patient</label>
                  <select
                    className="form-select"
                    value={formPatientId}
                    onChange={(e) => setFormPatientId(e.target.value)}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Consulting Doctor</label>
                  <select
                    className="form-select"
                    value={formDoctorId}
                    onChange={(e) => setFormDoctorId(e.target.value)}
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.specialties[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Symptoms & Patient History</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={formSymptoms}
                  onChange={(e) => setFormSymptoms(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Objective Examination & Vitals</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={formObservations}
                  onChange={(e) => setFormObservations(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Diagnostic Assessment</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={formAssessment}
                  onChange={(e) => setFormAssessment(e.target.value)}
                />
              </div>

              {/* Medication prescribing tool */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #ccfbf1' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#00838f', marginBottom: '8px' }}>
                  + Add Prescription Line Item
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Medication name (e.g. Telmisartan)"
                    className="form-input"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Dosage (40 mg)"
                    className="form-input"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Frequency (OD / BD)"
                    className="form-input"
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duration (30 days)"
                    className="form-input"
                    value={medDuration}
                    onChange={(e) => setMedDuration(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Special dosage instructions (e.g. After meals with water)..."
                    className="form-input"
                    style={{ flex: 1 }}
                    value={medInstructions}
                    onChange={(e) => setMedInstructions(e.target.value)}
                  />
                  <button type="button" onClick={handleAddMedication} className="btn-secondary" style={{ borderColor: '#00838f', color: '#00838f' }}>
                    + Add Medication
                  </button>
                </div>

                {formPrescriptions.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {formPrescriptions.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#ffffff',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      >
                        <span>
                          <strong>{m.medicationName}</strong> — {m.dosage}, {m.frequency} for {m.duration}
                          {m.instructions && <span style={{ color: '#64748b' }}> ({m.instructions})</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(m.id)}
                          style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontWeight: 700 }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Next revisiting appointment config */}
              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: '14px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    id="auto-followup-chk"
                    checked={createFollowUpAppointment}
                    onChange={(e) => setCreateFollowUpAppointment(e.target.checked)}
                  />
                  <label htmlFor="auto-followup-chk" style={{ fontSize: '13px', fontWeight: 700, color: '#0f766e', cursor: 'pointer' }}>
                    Schedule Next Revisiting Appointment for Patient
                  </label>
                </div>

                {createFollowUpAppointment && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '8px', marginTop: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Revisiting Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formFollowUpDate}
                        onChange={(e) => setFormFollowUpDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Time Slot</label>
                      <input
                        type="time"
                        className="form-input"
                        value={formFollowUpTime}
                        onChange={(e) => setFormFollowUpTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>Follow-up Goal / Tests</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formFollowUpNotes}
                        onChange={(e) => setFormFollowUpNotes(e.target.value)}
                        placeholder="e.g. Check fasting blood glucose and lipid panel"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsEditorOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveConsultation('Draft')}
                  className="btn-secondary"
                  style={{ border: '1px solid #00838f', color: '#00838f' }}
                >
                  Save Draft
                </button>
                <button type="button" onClick={() => handleSaveConsultation('Finalized')} className="btn-primary">
                  Finalize, Prescribe & Sign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QUICK REVISITING APPOINTMENT SCHEDULER */}
      {isQuickNextApptModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <CalendarPlus size={18} style={{ color: '#00838f' }} /> Book Next Patient Appointment
              </h3>
              <button onClick={() => setIsQuickNextApptModalOpen(false)} className="btn-secondary" style={{ padding: '4px 8px' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickNextAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label">Patient</label>
                <select
                  className="form-select"
                  value={quickPatientId}
                  onChange={(e) => setQuickPatientId(e.target.value)}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Next Visit Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={quickDate}
                    onChange={(e) => setQuickDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Time</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={quickTime}
                    onChange={(e) => setQuickTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Next Visit / Instructions</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value)}
                  placeholder="e.g. 3-week BP review and ECG verification"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsQuickNextApptModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Next Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
