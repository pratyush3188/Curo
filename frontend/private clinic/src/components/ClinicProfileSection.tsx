import React, { useState } from 'react';
import { useClinic } from '../context/ClinicContext';
import { ClinicService } from '../services/clinicService';
import { ServiceItem, ConsultationMode } from '../types';
import {
  Building2,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';

export const ClinicProfileSection: React.FC = () => {
  const { currentClinic, reloadClinicData } = useClinic();
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'hours' | 'preview'>('profile');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: currentClinic?.name || '',
    tagline: currentClinic?.tagline || '',
    email: currentClinic?.email || '',
    phone: currentClinic?.phone || '',
    description: currentClinic?.description || '',
    street: currentClinic?.address.street || '',
    city: currentClinic?.address.city || '',
    state: currentClinic?.address.state || '',
    postalCode: currentClinic?.address.postalCode || '',
    defaultDuration: currentClinic?.defaultAppointmentDurationMinutes || 30,
    freeNoticeHours: currentClinic?.cancellationPolicy.freeCancellationHoursNotice || 24,
    retentionFeePct: currentClinic?.cancellationPolicy.feePercentageAfterNotice || 50,
    cancellationTerms: currentClinic?.cancellationPolicy.policyTerms || ''
  });

  // Service modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    durationMinutes: 30,
    consultationFee: 150,
    supportedModes: ['in-person'] as ConsultationMode[],
    description: ''
  });

  if (!currentClinic) {
    return <div className="p-8 text-center text-gray-400">Loading clinic profile...</div>;
  }

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    ClinicService.updateClinicProfile(currentClinic.id, {
      name: profileForm.name,
      tagline: profileForm.tagline,
      email: profileForm.email,
      phone: profileForm.phone,
      description: profileForm.description,
      address: {
        street: profileForm.street,
        city: profileForm.city,
        state: profileForm.state,
        postalCode: profileForm.postalCode,
        country: currentClinic.address.country
      },
      defaultAppointmentDurationMinutes: Number(profileForm.defaultDuration),
      cancellationPolicy: {
        freeCancellationHoursNotice: Number(profileForm.freeNoticeHours),
        feePercentageAfterNotice: Number(profileForm.retentionFeePct),
        policyTerms: profileForm.cancellationTerms
      }
    });
    reloadClinicData();
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      durationMinutes: currentClinic.defaultAppointmentDurationMinutes || 30,
      consultationFee: 150,
      supportedModes: ['in-person'],
      description: ''
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (s: ServiceItem) => {
    setEditingService(s);
    setServiceForm({
      name: s.name,
      durationMinutes: s.durationMinutes,
      consultationFee: s.consultationFee,
      supportedModes: [...s.supportedModes],
      description: s.description
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const service: ServiceItem = {
      id: editingService ? editingService.id : `srv-${Date.now().toString().slice(-5)}`,
      name: serviceForm.name,
      durationMinutes: Number(serviceForm.durationMinutes),
      consultationFee: Number(serviceForm.consultationFee),
      currency: 'USD',
      supportedModes: serviceForm.supportedModes,
      description: serviceForm.description
    };
    ClinicService.addOrUpdateService(currentClinic.id, service);
    reloadClinicData();
    setIsServiceModalOpen(false);
  };

  const handleDeleteService = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      ClinicService.removeService(currentClinic.id, id);
      reloadClinicData();
    }
  };

  const toggleServiceMode = (mode: ConsultationMode) => {
    setServiceForm((prev) => {
      const exists = prev.supportedModes.includes(mode);
      if (exists) {
        if (prev.supportedModes.length === 1) return prev; // keep at least 1
        return { ...prev, supportedModes: prev.supportedModes.filter((m) => m !== mode) };
      }
      return { ...prev, supportedModes: [...prev.supportedModes, mode] };
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Sub-header navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}
          >
            <Building2 size={15} /> Clinic Info & Policy
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}
          >
            <DollarSign size={15} /> Services & Pricing ({currentClinic.services.length})
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={activeTab === 'hours' ? 'btn-primary' : 'btn-secondary'}
          >
            <Clock size={15} /> Operating Hours & Breaks
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}
          >
            <ExternalLink size={15} /> Public Patient Preview
          </button>
        </div>

        {isSavedNotice && (
          <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} /> Settings Saved
          </span>
        )}
      </div>

      {/* Tab 1: Profile & Policy */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Building2 size={18} style={{ color: 'var(--primary)' }} /> Clinic Identity & Location
              </h3>
              <span className="badge badge-blue">Tenant ID: {currentClinic.id}</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Clinic Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tagline / Practice Specialty</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.tagline}
                  onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Public Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.street}
                  onChange={(e) => setProfileForm({ ...profileForm, street: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">ZIP</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.postalCode}
                    onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Clinic Overview & Clinical Mission</label>
              <textarea
                rows={3}
                className="form-textarea"
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <ShieldCheck size={18} style={{ color: 'var(--amber)' }} /> Booking & Cancellation Rules
              </h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Default Consultation Duration (minutes)</label>
                <input
                  type="number"
                  min={10}
                  step={5}
                  className="form-input"
                  value={profileForm.defaultDuration}
                  onChange={(e) => setProfileForm({ ...profileForm, defaultDuration: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Free Cancellation Notice Window (Hours)</label>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  value={profileForm.freeNoticeHours}
                  onChange={(e) => setProfileForm({ ...profileForm, freeNoticeHours: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Late Cancellation Retention Fee (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="form-input"
                  value={profileForm.retentionFeePct}
                  onChange={(e) => setProfileForm({ ...profileForm, retentionFeePct: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cancellation Policy Terms for Patients</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.cancellationTerms}
                  onChange={(e) => setProfileForm({ ...profileForm, cancellationTerms: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary">
                Save Clinic Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Services */}
      {activeTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Clinical Consultation Catalog</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure pricing, durations and consultation modes available for patient booking requests.
              </p>
            </div>
            <button onClick={handleOpenAddService} className="btn-primary">
              <Plus size={15} /> Add Clinical Service
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {currentClinic.services.map((service) => (
              <div key={service.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{service.name}</h4>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>
                      ${service.consultationFee}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    {service.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    <span className="tag-pill">
                      <Clock size={11} style={{ marginRight: '4px' }} /> {service.durationMinutes} mins
                    </span>
                    {service.supportedModes.map((mode) => (
                      <span key={mode} className="badge badge-indigo">
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '10px'
                  }}
                >
                  <button onClick={() => handleOpenEditService(service)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => handleDeleteService(service.id)} className="btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Operating Hours */}
      {activeTab === 'hours' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={18} style={{ color: '#38bdf8' }} /> Weekly Practice Hours & Rest Breaks
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Slots cannot be booked during break periods or special closures.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentClinic.weeklyHours.map((schedule) => (
              <div
                key={schedule.day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ width: '130px', fontWeight: 600 }}>{schedule.day}</div>
                <div>
                  {schedule.isOpen ? (
                    <span className="badge badge-emerald">Open: {schedule.openTime} – {schedule.closeTime}</span>
                  ) : (
                    <span className="badge badge-rose">Closed</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {schedule.breaks.length > 0 ? (
                    <span>
                      Breaks: {schedule.breaks.map((b) => `${b.label} (${b.start}-${b.end})`).join(', ')}
                    </span>
                  ) : (
                    <span>No mid-day closure</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} style={{ color: 'var(--amber)' }} /> Special Clinic Closures & Holidays
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {currentClinic.specialClosures.map((closure, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px'
                  }}
                >
                  <strong style={{ color: '#fb7185' }}>{closure.date}</strong>: {closure.reason}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Public Patient Preview */}
      {activeTab === 'preview' && (
        <div className="card" style={{ maxWidth: '820px', margin: '0 auto', background: '#0f172a', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="badge badge-emerald">Live Patient Booking View Preview</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              This simulates the patient-facing card on the central Curo health network.
            </span>
          </div>

          <div
            style={{
              padding: '24px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              <img
                src={currentClinic.logo}
                alt={currentClinic.name}
                style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }}
              />
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>{currentClinic.name}</h2>
                <p style={{ fontSize: '14px', color: '#38bdf8' }}>{currentClinic.tagline}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {currentClinic.address.street}, {currentClinic.address.city}, {currentClinic.address.state} • {currentClinic.phone}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
              {currentClinic.description}
            </p>

            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '10px' }}>
              Offered Consultations
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {currentClinic.services.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{s.durationMinutes} mins</span>
                    <strong style={{ color: '#34d399' }}>${s.consultationFee}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                color: '#93c5fd'
              }}
            >
              <strong>Cancellation Policy:</strong> {currentClinic.cancellationPolicy.policyTerms}
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>
                {editingService ? 'Edit Clinical Service' : 'Add New Clinical Service'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Comprehensive Cardiovascular Evaluation"
                  className="form-input"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    step={5}
                    required
                    className="form-input"
                    value={serviceForm.durationMinutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Consultation Fee (USD $)</label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    required
                    className="form-input"
                    value={serviceForm.consultationFee}
                    onChange={(e) => setServiceForm({ ...serviceForm, consultationFee: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Supported Consultation Modes</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['in-person', 'video', 'voice'] as ConsultationMode[]).map((mode) => {
                    const isSelected = serviceForm.supportedModes.includes(mode);
                    return (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => toggleServiceMode(mode)}
                        className={isSelected ? 'badge badge-blue' : 'btn-secondary'}
                        style={{ padding: '6px 12px', cursor: 'pointer' }}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Scope & Description</label>
                <textarea
                  rows={3}
                  className="form-textarea"
                  placeholder="Explain what is included in this consultation for patients..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
