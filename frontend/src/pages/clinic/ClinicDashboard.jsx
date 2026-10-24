import { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  LogOut,
  Activity,
  DollarSign,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  X,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

export default function ClinicDashboard() {
  const { user, logout } = useAuth();

  const clinicId = user?.associatedFacilityId || 'careplus';

  const [clinic, setClinic] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'doctors' | 'services' | 'profile'

  // Modals
  const [isWalkinOpen, setIsWalkinOpen] = useState(false);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    doctorId: '',
    serviceName: 'General OPD Consultation',
    fee: 500,
    notes: '',
  });

  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    specialization: 'General Medicine',
    qualifications: 'MBBS',
    consultationFee: 500,
    experienceYears: 5,
    email: '',
    phone: '',
  });

  const [feedback, setFeedback] = useState('');

  const fetchClinicData = async () => {
    try {
      setLoading(true);
      const [clinicRes, metricsRes, docsRes, apptsRes] = await Promise.all([
        apiClient.get(`/clinic/${clinicId}`).catch(() => ({ data: null })),
        apiClient.get(`/clinic/${clinicId}/metrics`).catch(() => ({ data: null })),
        apiClient.get(`/clinic/${clinicId}/doctors`).catch(() => ({ data: [] })),
        apiClient.get(`/clinic/${clinicId}/appointments`).catch(() => ({ data: [] })),
      ]);

      if (clinicRes.data) setClinic(clinicRes.data);
      if (metricsRes.data) setMetrics(metricsRes.data);
      if (docsRes.data) setDoctors(Array.isArray(docsRes.data) ? docsRes.data : []);
      if (apptsRes.data) setAppointments(Array.isArray(apptsRes.data) ? apptsRes.data : []);
    } catch (err) {
      console.error('Failed to load clinic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicData();
    const interval = setInterval(fetchClinicData, 30000);
    return () => clearInterval(interval);
  }, [clinicId]);

  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedDoc = doctors.find((d) => d.doctorId === walkinForm.doctorId || d.id === walkinForm.doctorId);
      const payload = {
        patientId: `PAT-${Date.now().toString().slice(-4)}`,
        patientName: walkinForm.patientName.trim(),
        patientPhone: walkinForm.patientPhone.trim(),
        patientEmail: walkinForm.patientEmail.trim() || undefined,
        doctorId: walkinForm.doctorId || doctors[0]?.doctorId || 'DOC-001',
        doctorName: selectedDoc?.fullName || doctors[0]?.fullName || 'Attending Physician',
        doctorSpecialization: selectedDoc?.specialization || 'General OPD',
        serviceName: walkinForm.serviceName,
        status: 'In-Consultation',
        preferredDate: new Date().toISOString().split('T')[0],
        fee: Number(walkinForm.fee) || 500,
        paymentStatus: 'Paid',
        notes: walkinForm.notes || 'Walk-in consultation checked in at clinic desk',
        confirmedSlot: {
          date: new Date().toISOString().split('T')[0],
          startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime: 'Next',
        },
      };

      await apiClient.post(`/clinic/${clinicId}/appointments`, payload);
      setFeedback(`Walk-in patient ${walkinForm.patientName} successfully checked in!`);
      setIsWalkinOpen(false);
      setWalkinForm({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        doctorId: '',
        serviceName: 'General OPD Consultation',
        fee: 500,
        notes: '',
      });
      fetchClinicData();
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to check-in patient');
    }
  };

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: doctorForm.fullName.trim(),
        specialization: doctorForm.specialization.trim(),
        qualifications: doctorForm.qualifications.trim(),
        consultationFee: Number(doctorForm.consultationFee) || 500,
        experienceYears: Number(doctorForm.experienceYears) || 1,
        email: doctorForm.email.trim() || `dr.${doctorForm.fullName.toLowerCase().replace(/\s+/g, '')}@curo.care`,
        phone: doctorForm.phone.trim() || clinic?.phone || '+91 98000 00000',
        isActive: true,
        weeklySchedule: [
          { day: 'Monday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Tuesday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Wednesday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Thursday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Friday', isWorking: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] },
          { day: 'Saturday', isWorking: true, shifts: [{ start: '09:00', end: '14:00' }] },
        ],
      };

      await apiClient.post(`/clinic/${clinicId}/doctors`, payload);
      setFeedback(`Doctor ${doctorForm.fullName} added to OPD roster!`);
      setIsAddDoctorOpen(false);
      setDoctorForm({
        fullName: '',
        specialization: 'General Medicine',
        qualifications: 'MBBS',
        consultationFee: 500,
        experienceYears: 5,
        email: '',
        phone: '',
      });
      fetchClinicData();
      setTimeout(() => setFeedback(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add doctor');
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await apiClient.put(`/clinic/${clinicId}/appointments/${appointmentId}`, {
        status: newStatus,
      });
      fetchClinicData();
    } catch (err) {
      console.error('Failed to update appointment:', err);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const clinicName = clinic?.name || user?.facilityName || 'CarePlus Polyclinic';
  const clinicRegId = clinic?.regId || 'CLN-VERIFIED';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-teal-500/20">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                {clinicName}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Active OPD
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registration ID: <span className="font-semibold text-slate-700">{clinicRegId}</span> • {clinic?.city || 'Mumbai'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{todayStr}</span>
          </div>

          <button
            onClick={() => setIsWalkinOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Check-in Walk-in</span>
          </button>

          <button
            onClick={fetchClinicData}
            title="Refresh Data"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          {/* User profile & Logout */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Clinic Manager'}</p>
              <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">Clinic Administrator</p>
            </div>
            <button
              onClick={logout}
              title="Logout of Clinic Dashboard"
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast Feedback */}
        {feedback && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today&apos;s OPD Queue</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {metrics?.todayAppointmentsCount || appointments.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-teal-600 font-semibold">{appointments.filter((a) => a.status === 'In-Consultation').length} in room</span> • {appointments.filter((a) => a.status === 'Confirmed').length} waiting
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctors On Duty</span>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {doctors.filter((d) => d.isActive).length || 2}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {clinic?.specialtiesCount || clinic?.specialties?.length || 2} specialties covered today
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OPD Collections</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              ₹{(metrics?.todayCollectedRevenue || 1300).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Direct OPD receipts</span>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultation Rooms</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {clinic?.consultationRooms || 3}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Operational rooms at facility
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'queue', label: `Today's OPD Queue (${appointments.length})` },
            { id: 'doctors', label: `Doctors & Specialists (${doctors.length})` },
            { id: 'services', label: `Services & OPD Tariff (${clinic?.services?.length || 2})` },
            { id: 'profile', label: 'Clinic Information & Timings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: OPD Queue */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today&apos;s Patient Consultations</h3>
                <p className="text-xs text-slate-500">Real-time check-in, physician assignment, and consultation updates</p>
              </div>
              <button
                onClick={() => setIsWalkinOpen(true)}
                className="px-3.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold border border-teal-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Walk-in</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Token / ID</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Attending Doctor</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Time Slot</th>
                    <th className="py-3 px-4">Fee / Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No appointments currently scheduled. Click &quot;New Walk-in&quot; to check in patients.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appt) => (
                      <tr key={appt.appointmentId || appt._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {appt.appointmentId}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{appt.patientName}</p>
                          <p className="text-[11px] text-slate-400">{appt.patientPhone || 'Walk-in'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{appt.doctorName || 'General OPD'}</p>
                          <p className="text-[11px] text-slate-400">{appt.doctorSpecialization}</p>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {appt.serviceName || 'Consultation'}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {appt.confirmedSlot ? `${appt.confirmedSlot.startTime} - ${appt.confirmedSlot.endTime}` : 'Walk-in'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">₹{appt.fee || 500}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            appt.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {appt.paymentStatus || 'Paid'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            appt.status === 'In-Consultation'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200 animate-pulse'
                              : appt.status === 'Completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {appt.status !== 'Completed' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.appointmentId, 'Completed')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold transition cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                          {appt.status === 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(appt.appointmentId, 'In-Consultation')}
                              className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded text-[11px] font-bold transition cursor-pointer"
                            >
                              Call In
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Doctors & Specialists */}
        {activeTab === 'doctors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Clinic Physician Roster</h3>
                <p className="text-xs text-slate-500">Doctors associated with this polyclinic and their OPD consultation shifts</p>
              </div>
              <button
                onClick={() => setIsAddDoctorOpen(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Doctor to Roster</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((doc) => (
                <div key={doc.doctorId || doc.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{doc.fullName}</h4>
                        <p className="text-xs text-teal-700 font-semibold">{doc.specialization}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {doc.isActive ? 'Active' : 'On Leave'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2">
                      Qualifications: <span className="font-medium text-slate-700">{doc.qualifications || 'MBBS'}</span> • Experience: <span className="font-medium text-slate-700">{doc.experienceYears || 5} yrs</span>
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>Fee: ₹{doc.consultationFee || 500} per session</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.phone || clinic?.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{doc.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                    Roster: Mon - Sat (Morning & Evening OPD)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Services & Rates */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clinic Outpatient Services & Fee Tariff</h3>
              <p className="text-xs text-slate-500">Clinical consultation categories, rates, and duration per patient session</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(clinic?.services || [
                { id: 'srv-gen', name: 'General OPD Consultation', durationMinutes: 30, consultationFee: 500, description: 'Comprehensive general health outpatient consultation with physician.' },
                { id: 'srv-diag', name: 'Diagnostic Health Check & Vitals Review', durationMinutes: 20, consultationFee: 300, description: 'Blood pressure, glucose screen, and basic biomarker screening.' },
              ]).map((srv) => (
                <div key={srv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{srv.name}</h4>
                      <span className="text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        ₹{srv.consultationFee}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{srv.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span>Duration: {srv.durationMinutes || 30} mins</span>
                    <span className="text-emerald-700 font-semibold">Standard Walk-in / Bookable</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Clinic Info & Statutory */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Accreditation & Statutory Details</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Clinic Name</span>
                  <p className="font-bold text-slate-900 text-sm">{clinic?.name || clinicName}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Registration ID</span>
                  <p className="font-mono font-bold text-slate-900">{clinic?.regId || clinicRegId}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Facility Category</span>
                  <p className="font-medium text-slate-800">{clinic?.category || 'Multi-Specialty Polyclinic'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Address</span>
                  <p className="font-medium text-slate-800">{clinic?.address || 'Healthcare Street'}, {clinic?.city || 'Mumbai'}, {clinic?.state || 'Maharashtra'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Helpline / Desk</span>
                  <p className="font-medium text-slate-800">{clinic?.phone || '+91 83026 11592'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Official Email</span>
                  <p className="font-medium text-slate-800">{clinic?.email || user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>OPD Operating Hours</span>
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {(clinic?.weeklyHours || [
                  { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
                  { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
                  { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
                  { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
                  { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
                  { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '15:00' },
                  { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '13:00' },
                ]).map((wh) => (
                  <div key={wh.day} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-slate-700">{wh.day}</span>
                    <span className={`font-semibold ${wh.isOpen ? 'text-slate-900' : 'text-slate-400'}`}>
                      {wh.isOpen ? `${wh.openTime} - ${wh.closeTime}` : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal 1: Walk-in Check-in */}
      {isWalkinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-sm font-bold">Check-in Walk-in Patient</h3>
              </div>
              <button onClick={() => setIsWalkinOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkinSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={walkinForm.patientName}
                  onChange={(e) => setWalkinForm({ ...walkinForm, patientName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98000 00000"
                  value={walkinForm.patientPhone}
                  onChange={(e) => setWalkinForm({ ...walkinForm, patientPhone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign Doctor *</label>
                <select
                  value={walkinForm.doctorId}
                  onChange={(e) => setWalkinForm({ ...walkinForm, doctorId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select On-duty Physician</option>
                  {doctors.map((d) => (
                    <option key={d.doctorId || d.id} value={d.doctorId || d.id}>
                      {d.fullName} ({d.specialization}) - ₹{d.consultationFee || 500}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">OPD Service</label>
                  <select
                    value={walkinForm.serviceName}
                    onChange={(e) => setWalkinForm({ ...walkinForm, serviceName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="General OPD Consultation">General Consultation</option>
                    <option value="Diagnostic Health Check">Diagnostic Check</option>
                    <option value="Pediatric Checkup">Pediatric Checkup</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={walkinForm.fee}
                    onChange={(e) => setWalkinForm({ ...walkinForm, fee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Presenting Symptoms / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fever, persistent cough, or blood pressure check"
                  value={walkinForm.notes}
                  onChange={(e) => setWalkinForm({ ...walkinForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkinOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Confirm & Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Doctor */}
      {isAddDoctorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold">Add Doctor to Clinic Roster</h3>
              </div>
              <button onClick={() => setIsAddDoctorOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Full Name"
                  value={doctorForm.fullName}
                  onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pediatrics"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Qualifications</label>
                  <input
                    type="text"
                    placeholder="MBBS, MD, DNB"
                    value={doctorForm.qualifications}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={doctorForm.consultationFee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={doctorForm.experienceYears}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experienceYears: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98000 00000"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDoctorOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
