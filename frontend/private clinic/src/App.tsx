import React, { useState } from 'react';
import { useClinic } from './context/ClinicContext';
import { ClinicLogin } from './components/ClinicLogin';
import { ClinicProfileSection } from './components/ClinicProfileSection';
import { AppointmentRequestsSection } from './components/AppointmentRequestsSection';
import { DoctorsSection } from './components/DoctorsSection';
import { PatientsSection } from './components/PatientsSection';
import { ConsultationsSection } from './components/ConsultationsSection';
import { OperationsDashboardSection } from './components/OperationsDashboardSection';
import { CommunicationSection } from './components/CommunicationSection';
import { ClinicService } from './services/clinicService';
import {
  Building2,
  CalendarCheck,
  UserCheck,
  Users,
  Stethoscope,
  BarChart3,
  MessageSquare,
  ShieldAlert,
  Hospital,
  LogOut,
  UserCog,
  CheckCircle2,
  Lock,
  ChevronDown,
  FolderHeart,
  FileText,
  CalendarPlus
} from 'lucide-react';

type NavSection =
  | 'operations'
  | 'requests'
  | 'doctors'
  | 'patients'
  | 'consultations'
  | 'profile'
  | 'communication';

export const AppContent: React.FC = () => {
  const {
    currentClinic,
    currentUser,
    availableUsers,
    selectActiveUser,
    isAuthenticated,
    logoutClinic,
    userRole,
    isDoctor,
    isReceptionist,
    tenantAccessError,
    clearTenantError,
    reloadClinicData
  } = useClinic();

  const [activeNav, setActiveNav] = useState<NavSection>('operations');
  const [patientMenuOpen, setPatientMenuOpen] = useState(true);
  const [patientSubTab, setPatientSubTab] = useState<'directory' | 'reports' | 'next-visit'>('directory');

  const isPatientSubActive = activeNav === 'patients' || activeNav === 'communication';

  // If not authenticated, render clinic ID + Password login screen
  if (!isAuthenticated) {
    return <ClinicLogin />;
  }

  if (!currentClinic) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5' }}>
        Loading Private Clinic Portal...
      </div>
    );
  }

  const handleResetData = () => {
    if (confirm('Reset demo state to initial clinic records?')) {
      ClinicService.resetAllData();
      reloadClinicData();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Sidebar Navigation - Styled with requested #E0F7FA */}
      <aside
        style={{
          width: '260px',
          background: '#E0F7FA',
          borderRight: '1px solid #b2ebf2',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div>
          {/* Clinic Brand */}
          <div
            style={{
              padding: '18px 16px',
              borderBottom: '1px solid #b2ebf2',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00838f, #00acc1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 4px rgba(0, 131, 143, 0.25)',
                flexShrink: 0
              }}
            >
              <Hospital size={22} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#006064', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentClinic.name}
              </div>
              <div style={{ fontSize: '10px', color: '#00838f', letterSpacing: '0.04em', fontWeight: 700 }}>
                CLINIC PORTAL • {currentClinic.address.city}
              </div>
            </div>
          </div>

          {/* Active Staff Member Selector (Doctors vs Receptionist) — MOVED TO TOP OF NAVIGATION BAR */}
          <div
            style={{
              padding: '14px 12px',
              borderBottom: '1px solid #b2ebf2',
              background: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <label
              style={{
                fontSize: '11px',
                color: '#006064',
                textTransform: 'uppercase',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <UserCog size={13} style={{ color: '#00838f' }} /> Active Staff Member
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: isReceptionist ? '#00838f' : '#059669',
                  background: isReceptionist ? 'rgba(0, 131, 143, 0.1)' : 'rgba(5, 150, 105, 0.1)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}
              >
                {isReceptionist ? 'Reception Desk' : 'Physician'}
              </span>
            </label>
            <select
              value={currentUser.id}
              onChange={(e) => selectActiveUser(e.target.value)}
              className="form-select"
              style={{
                fontSize: '12px',
                padding: '7px 8px',
                width: '100%',
                borderColor: '#80deea',
                fontWeight: 700,
                color: '#006064',
                background: '#F0FDFA'
              }}
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.role === 'Reception Staff' ? `Receptionist: ${u.fullName}` : `Doctor: ${u.fullName}`}
                </option>
              ))}
            </select>

            <div
              style={{
                marginTop: '8px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: isReceptionist ? 'rgba(0, 131, 143, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                border: isReceptionist ? '1px solid #b2ebf2' : '1px solid #a7f3d0',
                fontSize: '10.5px',
                lineHeight: 1.35
              }}
            >
              {isReceptionist ? (
                <span style={{ color: '#006064' }}>
                  <strong>Receptionist Mode:</strong> Full clearance to manage clinic appointments, patient files, lab reports & doctors.
                </span>
              ) : (
                <span style={{ color: '#065f46' }}>
                  <strong>Doctor Mode ({currentUser.fullName}):</strong> Scoped to your visiting patients only.
                </span>
              )}
            </div>
          </div>

          {/* Clean Navigation Items */}
          <nav style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <button
              onClick={() => setActiveNav('operations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeNav === 'operations' ? '#00838f' : 'transparent',
                color: activeNav === 'operations' ? '#ffffff' : '#006064',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 size={17} /> Daily Dashboard
            </button>

            <button
              onClick={() => setActiveNav('requests')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeNav === 'requests' ? '#00838f' : 'transparent',
                color: activeNav === 'requests' ? '#ffffff' : '#006064',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <CalendarCheck size={17} /> Appointment Requests
            </button>

            <button
              onClick={() => setActiveNav('consultations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeNav === 'consultations' ? '#00838f' : 'transparent',
                color: activeNav === 'consultations' ? '#ffffff' : '#006064',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Stethoscope size={17} /> Prescriptions & Visits
            </button>

            {/* NEAT & CLEAN PATIENT DROPDOWN ACCORDION (Holds Communication, Reports & Next Visit) */}
            <div style={{ marginTop: '2px', marginBottom: '2px' }}>
              <button
                onClick={() => setPatientMenuOpen((prev) => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: isPatientSubActive ? 'rgba(0, 131, 143, 0.15)' : 'transparent',
                  color: isPatientSubActive ? '#00838f' : '#006064',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={17} /> Patients
                </span>
                <ChevronDown
                  size={15}
                  style={{
                    transform: patientMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: '#00838f'
                  }}
                />
              </button>

              {patientMenuOpen && (
                <div
                  style={{
                    paddingLeft: '14px',
                    paddingRight: '6px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    borderLeft: '2px solid #80deea',
                    marginLeft: '18px',
                    marginTop: '2px'
                  }}
                >
                  <button
                    onClick={() => {
                      setPatientSubTab('directory');
                      setActiveNav('patients');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeNav === 'patients' && patientSubTab === 'directory' ? '#00838f' : 'transparent',
                      color: activeNav === 'patients' && patientSubTab === 'directory' ? '#ffffff' : '#006064',
                      textAlign: 'left'
                    }}
                  >
                    <FolderHeart size={14} /> Directory & Overview
                  </button>

                  <button
                    onClick={() => {
                      setPatientSubTab('reports');
                      setActiveNav('patients');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeNav === 'patients' && patientSubTab === 'reports' ? '#00838f' : 'transparent',
                      color: activeNav === 'patients' && patientSubTab === 'reports' ? '#ffffff' : '#006064',
                      textAlign: 'left'
                    }}
                  >
                    <FileText size={14} /> Patient Reports
                  </button>

                  <button
                    onClick={() => {
                      setPatientSubTab('next-visit');
                      setActiveNav('patients');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeNav === 'patients' && patientSubTab === 'next-visit' ? '#00838f' : 'transparent',
                      color: activeNav === 'patients' && patientSubTab === 'next-visit' ? '#ffffff' : '#006064',
                      textAlign: 'left'
                    }}
                  >
                    <CalendarPlus size={14} /> Next Visit & Rebooking
                  </button>

                  <button
                    onClick={() => setActiveNav('communication')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeNav === 'communication' ? '#00838f' : 'transparent',
                      color: activeNav === 'communication' ? '#ffffff' : '#006064',
                      textAlign: 'left'
                    }}
                  >
                    <MessageSquare size={14} /> Patient Communication
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveNav('doctors')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeNav === 'doctors' ? '#00838f' : 'transparent',
                color: activeNav === 'doctors' ? '#ffffff' : '#006064',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={17} /> Doctors & Hours
            </button>

            <button
              onClick={() => setActiveNav('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeNav === 'profile' ? '#00838f' : 'transparent',
                color: activeNav === 'profile' ? '#ffffff' : '#006064',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <Building2 size={17} /> Clinic Profile
            </button>
          </nav>
        </div>

        {/* Sidebar Footer with Reset Data & Logout */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #b2ebf2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.6)' }}>
          <button
            onClick={handleResetData}
            style={{ background: 'none', border: 'none', color: '#00838f', fontSize: '11px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
          >
            Reset Data
          </button>
          <button
            onClick={logoutClinic}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: '#e11d48',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area - Styled with requested #F5F5F5 */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#F5F5F5' }}>
        {/* Top bar */}
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--border-color)',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
              {activeNav === 'operations' && 'Daily Operations, Schedule & Financial Summary'}
              {activeNav === 'requests' && 'Incoming Appointment Enquiries & Slot Confirmation'}
              {activeNav === 'doctors' && 'Physicians, Working Hours & Availability'}
              {activeNav === 'patients' && 'Patient Directory, Diagnostic Reports & Next Visit Scheduling'}
              {activeNav === 'consultations' && 'Consultations, Prescriptions & Revisiting Schedule'}
              {activeNav === 'profile' && 'Clinic Profile, Services, Hours & Policies'}
              {activeNav === 'communication' && 'Patient Communications & Notifications'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="badge badge-blue">Clinic ID: {currentClinic.id}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }}
              />
              <div style={{ fontSize: '12px' }}>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{currentUser.fullName}</div>
                <div style={{ color: '#00838f', fontSize: '11px', fontWeight: 600 }}>{userRole}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content body */}
        <div style={{ padding: '24px', flex: 1, background: '#F5F5F5' }}>
          {tenantAccessError && (
            <div
              style={{
                padding: '14px',
                background: '#ffe4e6',
                border: '1px solid #fecdd3',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#be123c'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={20} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{tenantAccessError}</span>
              </div>
              <button onClick={clearTenantError} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
                Dismiss
              </button>
            </div>
          )}

          {activeNav === 'operations' && <OperationsDashboardSection />}
          {activeNav === 'requests' && <AppointmentRequestsSection />}
          {activeNav === 'doctors' && <DoctorsSection />}
          {activeNav === 'patients' && <PatientsSection initialTab={patientSubTab} />}
          {activeNav === 'consultations' && <ConsultationsSection />}
          {activeNav === 'profile' && <ClinicProfileSection />}
          {activeNav === 'communication' && <CommunicationSection />}
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#F5F5F5' }}>
      <AppContent />
    </div>
  );
};

export default App;
