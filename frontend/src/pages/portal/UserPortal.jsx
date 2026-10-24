import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  Stethoscope,
  Calendar,
  FileText,
  Utensils,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  Activity,
  ChevronRight,
  Shield,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

// Portal Views
import { DashboardView } from './DashboardView';
import { AnalyzerView } from './AnalyzerView';
import { HospitalsView } from './HospitalsView';
import { ClinicsView } from './ClinicsView';
import { ReportsView } from './ReportsView';
import { DietView } from './DietView';

export default function UserPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedReportForAnalyzer, setSelectedReportForAnalyzer] = useState(null);

  // Fetch dynamic user data from backend
  const fetchData = async () => {
    setLoadingData(true);
    try {
      const reportsRes = await api.get('/reports').catch(() => ({ data: { reports: [] } }));
      if (reportsRes.data?.reports) {
        setReports(reportsRes.data.reports);
      }

      const apptRes = await api.get('/appointments/my').catch(() => ({ data: { appointments: [] } }));
      if (apptRes.data?.appointments) {
        setAppointments(apptRes.data.appointments);
      }
    } catch (e) {
      console.warn('Failed to fetch user portal data:', e.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      const role = (user.role || '').toLowerCase();
      const facilityType = (user.associatedFacilityType || user.facilityType || '').toLowerCase();
      if (role === 'super_admin') {
        navigate('/admin/overview', { replace: true });
      } else if (role.includes('clinic') || facilityType === 'clinic') {
        navigate('/clinic', { replace: true });
      } else if (role.includes('hospital') || role.includes('owner') || facilityType === 'hospital') {
        navigate('/hospital/owner', { replace: true });
      } else if (role === 'doctor') {
        navigate('/hospital/doctor', { replace: true });
      } else if (role === 'manager' || role === 'department_manager') {
        navigate('/hospital/manager', { replace: true });
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this consultation?')) return;
    try {
      await api.post(`/appointments/${apptId}/cancel`, { reason: 'Cancelled by patient' });
      await fetchData();
    } catch {
      alert('Failed to cancel appointment.');
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard & Metrics', icon: LayoutDashboard },
    { id: 'analyzer', label: 'AI Report Analyzer', icon: Sparkles },
    { id: 'hospitals', label: 'Hospitals Directory', icon: Building2 },
    { id: 'clinics', label: 'Clinics & OPD', icon: Stethoscope },
    {
      id: 'appointments',
      label: 'My Appointments',
      icon: Calendar,
      badge: appointments.length > 0 ? String(appointments.length) : null,
    },
    {
      id: 'reports',
      label: 'Diagnostic Reports',
      icon: FileText,
      badge: reports.length > 0 ? String(reports.length) : null,
    },
    { id: 'diet', label: 'Diet & Wellness', icon: Utensils },
  ];

  return (
    <div className="h-screen w-full flex overflow-hidden bg-slate-50 text-slate-900 font-sans antialiased selection:bg-sky-600 selection:text-white">
      {/* ========================================================
          LEFT SIDEBAR (Restored to original vertical sidebar)
      ======================================================== */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between h-full z-30 shadow-xs">
        {/* Brand & Logo Header */}
        <div>
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/portal" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-600/30">
                C
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">CURO</span>
                <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Patient
                </span>
              </div>
            </Link>
          </div>

          {/* Vertical Navigation Items */}
          <nav className="p-3.5 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Healthcare Navigation
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/25 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-lg bg-sky-100 border border-sky-200 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="truncate text-left">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================
          MAIN CONTENT CANVAS (Right side)
      ======================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">User Portal</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold capitalize">
              {navItems.find((n) => n.id === activeTab)?.label || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Synced</span>
            </div>

            <button
              onClick={() => setActiveTab('analyzer')}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Report</span>
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* TAB 1: OVERVIEW & DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <DashboardView
                user={user}
                reports={reports}
                onNavigate={(tab) => setActiveTab(tab)}
              />

              {/* Profile & Clinical Metrics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-sky-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-sky-600/30">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
                      <p className="text-xs text-sky-600 font-semibold uppercase">{user?.role} Account</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3.5 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-bold text-slate-800">{user?.phone || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gender:</span>
                      <span className="font-bold text-slate-800 capitalize">{user?.gender || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">City:</span>
                      <span className="font-bold text-slate-800">{user?.address?.city || 'Mumbai'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live Account in Health Registry</span>
                  </div>
                </div>

                {/* Emergency & Biomarker Profile */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Emergency & Clinical Profile</h3>
                      <p className="text-xs text-slate-400">Critical health markers for doctors and triage units.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700"
                    >
                      View Appointments ({appointments.length}) &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold uppercase text-slate-400">Blood Group</span>
                      <p className="text-xl font-black text-rose-600 mt-1">{user?.bloodGroup || 'O+'}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold uppercase text-slate-400">Emergency Contact</span>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {user?.emergencyContact?.name || 'Primary Contact'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.emergencyContact?.phone || '+91 98765 43210'}
                      </p>
                    </div>

                    <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[11px] font-bold uppercase text-slate-400">Medical History</span>
                      <p className="text-xs text-slate-700 mt-1">
                        {user?.medicalHistorySummary || 'No chronic complications or past drug adverse reactions recorded.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setActiveTab('hospitals')}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      🏥 Find Hospitals & Beds
                    </button>
                    <button
                      onClick={() => setActiveTab('clinics')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      🩺 Book Clinic OPD
                    </button>
                    <button
                      onClick={() => setActiveTab('diet')}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      🥗 Diet & Wellness
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI LAB REPORT ANALYZER */}
          {activeTab === 'analyzer' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <AnalyzerView
                user={user}
                initialReport={selectedReportForAnalyzer}
                onReportSaved={() => {
                  fetchData();
                  setActiveTab('reports');
                }}
              />
            </div>
          )}

          {/* TAB 3: HOSPITALS DIRECTORY */}
          {activeTab === 'hospitals' && (
            <div className="space-y-6">
              <HospitalsView
                user={user}
                onBookSuccess={() => {
                  fetchData();
                  setActiveTab('appointments');
                }}
              />
            </div>
          )}

          {/* TAB 5: CLINICS DIRECTORY */}
          {activeTab === 'clinics' && (
            <div className="space-y-6">
              <ClinicsView
                user={user}
                onBookSuccess={() => {
                  fetchData();
                  setActiveTab('appointments');
                }}
              />
            </div>
          )}

          {/* TAB 6: MY APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">My Consultation Appointments</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Track your upcoming appointments across verified hospitals and clinics.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('hospitals')}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    + Book Hospital OPD
                  </button>
                  <button
                    onClick={() => setActiveTab('clinics')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    + Book Clinic OPD
                  </button>
                </div>
              </div>

              {loadingData ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto text-xl">
                    📅
                  </div>
                  <h4 className="text-base font-bold text-slate-800">No scheduled consultations yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Browse verified specialists in our Hospital or Clinic directory to book your consultation slot.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.map((appt) => (
                    <div
                      key={appt._id || appt.id || appt.appointmentId}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xs transition bg-slate-50/50 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                            {appt.appointmentId || 'APT'}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-1">{appt.doctorName}</h4>
                          <p className="text-xs text-sky-600 font-medium">
                            {appt.doctorSpecialization || appt.specialty || 'Specialist'} &bull; {appt.institutionName || 'Medical Facility'}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            appt.status === 'Confirmed' || appt.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : appt.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-3">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date</span>
                          <span className="font-bold text-slate-800">{appt.appointmentDate || appt.preferredDate || 'Scheduled'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Slot</span>
                          <span className="font-bold text-slate-800">{appt.timeSlot || appt.preferredTimeRange || 'Day Session'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mode</span>
                          <span className="font-medium text-slate-700 capitalize">{appt.consultationType || appt.consultationMode || 'In-Person'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reason</span>
                          <span className="font-medium text-slate-700 truncate block">{appt.reasonForVisit || 'Checkup'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Booked: {new Date(appt.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                        {appt.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancelAppointment(appt._id || appt.id || appt.appointmentId)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                          >
                            Cancel Appointment
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: REPORTS & DIAGNOSTICS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <ReportsView
                reports={reports}
                onRefresh={fetchData}
                onNavigate={(tab, report) => {
                  if (report) setSelectedReportForAnalyzer(report);
                  setActiveTab(tab);
                }}
              />
            </div>
          )}

          {/* TAB 8: DIET & WELLNESS */}
          {activeTab === 'diet' && (
            <div className="space-y-6">
              <DietView
                reports={reports}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
