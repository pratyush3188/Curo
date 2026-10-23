import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Stethoscope,
  ArrowRight,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import authHero from '../../assets/auth_light_hero.jpg';

export default function Register() {
  const navigate = useNavigate();
  const { register, setUser } = useAuth();

  // 'none' initially shows the 3 big role selection cards/buttons
  // 'patient' | 'hospital' | 'clinic'
  const [selectedRole, setSelectedRole] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successModal, setSuccessModal] = useState(null);

  // 1. User / Patient Form State
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'prefer_not_to_say',
    dateOfBirth: '',
    city: 'Mumbai',
    bloodGroup: 'Unknown',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  // 2. Hospital Form State
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    type: 'Multi-Specialty Hospital',
    registrationNumber: '',
    totalBeds: 250,
    icuBeds: 24,
    locality: 'Central',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: '',
    emergencyHelpline: '108',
    email: '',
    phone: '',
    departments: ['Emergency & Trauma', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics'],
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    representativeName: '',
    representativeDesignation: 'Medical Superintendent',
    representativeEmail: '',
    representativePhone: '',
  });

  // 3. Clinic Form State
  const [clinicForm, setClinicForm] = useState({
    name: '',
    category: 'Multi-Specialty Polyclinic',
    registrationNumber: '',
    email: '',
    phone: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: '',
    consultationRooms: 3,
    consultationFee: 500,
    specialties: ['General Medicine', 'Pediatrics'],
    representativeName: '',
    representativeDesignation: 'Managing Director',
    representativeEmail: '',
    representativePhone: '',
    password: '',
  });

  const availableDepartments = [
    'Emergency & Trauma',
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'Oncology',
    'General Medicine',
  ];

  const availableSpecialties = [
    'General Medicine',
    'Pediatrics',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'ENT & Dental',
  ];

  const toggleDepartment = (dept) => {
    setHospitalForm((prev) => {
      const exists = prev.departments.includes(dept);
      const next = exists
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept];
      return { ...prev, departments: next.length > 0 ? next : [dept] };
    });
  };

  const toggleSpecialty = (spec) => {
    setClinicForm((prev) => {
      const exists = prev.specialties.includes(spec);
      const next = exists
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec];
      return { ...prev, specialties: next.length > 0 ? next : [spec] };
    });
  };

  // Submit Handler for User
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register({
        ...userForm,
        role: 'patient',
      });
      navigate('/portal');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'User registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler for Hospital
  const handleHospitalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/hospital/register', {
        ...hospitalForm,
        email: hospitalForm.email || hospitalForm.ownerEmail,
        ownerEmail: hospitalForm.ownerEmail || hospitalForm.email,
      });

      const { hospital } = res.data;

      setSuccessModal({
        type: 'hospital',
        title: 'Hospital Application Submitted!',
        message:
          'Thank you for registering your hospital. Your facility application has been queued for Super Admin compliance verification. Once approved by the administrator, you can log in with your credentials to launch your executive dashboard.',
        details: {
          name: hospital?.name || hospitalForm.name,
          regId: hospital?.regId || 'HOSP-QUEUED',
          beds: hospital?.totalBeds || hospitalForm.totalBeds,
          ownerEmail: hospitalForm.ownerEmail || hospitalForm.email,
        },
        action: () => navigate('/login'),
        actionLabel: 'Go to Sign In',
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Hospital registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler for Clinic
  const handleClinicSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/clinics/register', {
        ...clinicForm,
        email: clinicForm.email || clinicForm.representativeEmail,
      });
      const { clinic } = res.data;

      setSuccessModal({
        type: 'clinic',
        title: 'Clinic Application Submitted!',
        message:
          'Thank you for registering your clinic! Your application has been submitted to the CURO Central Health Administration. Once verified and approved by the Super Admin, you will be able to log in to your Clinic Dashboard.',
        details: {
          name: clinic?.name || clinicForm.name,
          regId: clinic?.regId || 'CLN-QUEUED',
          category: clinicForm.category,
          email: clinicForm.email,
        },
        action: () => navigate('/login'),
        actionLabel: 'Go to Sign In',
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Clinic registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-slate-900 font-sans selection:bg-sky-600 selection:text-white">
      {/* ========================================================
          LEFT PANE (60% WIDTH): Visual Healthcare Hero & Branding
      ======================================================== */}
      <div className="lg:w-[60%] w-full relative flex flex-col justify-between p-8 sm:p-12 xl:p-16 overflow-hidden min-h-[460px] lg:min-h-screen bg-slate-950">
        {/* Background Image with Deep Gradient Overlay */}
        <img
          src={authHero}
          alt="Modern Clinic Reception and Care Team"
          className="absolute inset-0 w-full h-full object-cover object-center filter saturate-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/40 backdrop-blur-[1px]" />

        {/* Top Header Branding on Left */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-sky-500/40">
              C
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">CURO</span>
              <span className="ml-2.5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/15 text-sky-200 border border-white/20 backdrop-blur-md">
                Health Ecosystem
              </span>
            </div>
          </Link>

          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition border border-white/10"
          >
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span>Admin Portal</span>
          </Link>
        </div>

        {/* Value Proposition & Live Metrics on Left */}
        <div className="relative z-10 max-w-xl space-y-5 my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/20 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-sky-200">
              Multi-Institutional Digital Health Infrastructure
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Unified Care, Intelligent Triage & Health Governance.
          </h1>

          <p className="text-sm sm:text-base text-slate-200/90 font-light leading-relaxed">
            Connecting Patients with Groq AI diagnostic analysis, Hospitals with real-time ICU telemetry, and Clinics with automated OPD scheduling in one stateless ecosystem.
          </p>

          <div className="grid grid-cols-3 gap-3.5 pt-4">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <p className="text-2xl font-black text-sky-400">500+</p>
              <p className="text-[11px] font-medium text-slate-300 mt-0.5">Verified Facilities</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <p className="text-2xl font-black text-emerald-400">Stateless</p>
              <p className="text-[11px] font-medium text-slate-300 mt-0.5">JWT & Mongo Sync</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
              <p className="text-2xl font-black text-indigo-400">AI Triage</p>
              <p className="text-[11px] font-medium text-slate-300 mt-0.5">Groq Lab Diagnostics</p>
            </div>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} CURO Platform Architecture</span>
          <span className="text-slate-300 font-medium">NABH & Digital Consent Compliant</span>
        </div>
      </div>

      {/* ========================================================
          RIGHT PANE (40% WIDTH): Form or 3-Role Selection
      ======================================================== */}
      <div className="lg:w-[40%] w-full flex flex-col justify-between px-6 sm:px-10 lg:px-12 py-8 bg-white overflow-y-auto max-h-screen">
        {/* Top Header on Right */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Already registered?</span>
            <Link
              to="/login"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Sign In &rarr;
            </Link>
          </div>

          {selectedRole && (
            <button
              onClick={() => {
                setSelectedRole(null);
                setError('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Role</span>
            </button>
          )}
        </div>

        {/* Center Dynamic Area */}
        <div className="my-auto py-6">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="text-base font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================
              INITIAL STATE: 3 PROMINENT ROLE BUTTONS
          ======================================================== */}
          {!selectedRole && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
                  Get Started with CURO
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Choose Registration Type
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Select your profile category to configure the right portal access:
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {/* Button 1: Sign up as a User / Patient */}
                <button
                  onClick={() => setSelectedRole('patient')}
                  className="w-full text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-sky-600 hover:bg-sky-50/40 transition-all cursor-pointer group shadow-xs hover:shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 group-hover:bg-sky-600 text-sky-700 group-hover:text-white transition-colors flex items-center justify-center font-bold text-xl">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-900">
                          Sign Up as a User
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Instant Access
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Patient portal, Groq AI report simplifier & OPD appointment bookings.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Button 2: Sign up as a Hospital */}
                <button
                  onClick={() => setSelectedRole('hospital')}
                  className="w-full text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 transition-all cursor-pointer group shadow-xs hover:shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-blue-600 text-blue-700 group-hover:text-white transition-colors flex items-center justify-center font-bold text-xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900">
                          Sign Up as a Hospital
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Admin Review
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tertiary care institute, ICU bed telemetry, owner dashboard & triage.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Button 3: Sign up as a Clinic */}
                <button
                  onClick={() => setSelectedRole('clinic')}
                  className="w-full text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-teal-600 hover:bg-teal-50/40 transition-all cursor-pointer group shadow-xs hover:shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 group-hover:bg-teal-600 text-teal-700 group-hover:text-white transition-colors flex items-center justify-center font-bold text-xl">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900">
                          Sign Up as a Clinic
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          Admin Review
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Private polyclinic, OPD schedules, doctor roster & patient records.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              FORM 1: USER / PATIENT REGISTRATION FORM
          ======================================================== */}
          {selectedRole === 'patient' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">
                  Patient Health Account
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Create User Account
                </h3>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-sky-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="rahul@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-sky-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-sky-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={userForm.city}
                      onChange={(e) => setUserForm({ ...userForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={userForm.bloodGroup}
                      onChange={(e) => setUserForm({ ...userForm, bloodGroup: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-sky-600 bg-white"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={userForm.dateOfBirth}
                      onChange={(e) => setUserForm({ ...userForm, dateOfBirth: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-sky-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? 'Creating Account...' : 'Sign Up & Launch User Portal'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              FORM 2: HOSPITAL REGISTRATION FORM
          ======================================================== */}
          {selectedRole === 'hospital' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Healthcare Institution
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Register Hospital
                </h3>
              </div>

              <form onSubmit={handleHospitalSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hospital Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={hospitalForm.name}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                    placeholder="e.g. Apollo Multi-Specialty Hospital"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={hospitalForm.email}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                      placeholder="info@apollohospital.org"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={hospitalForm.phone}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                      placeholder="+91 22 2675 1000"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={hospitalForm.city}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Beds</label>
                    <input
                      type="number"
                      value={hospitalForm.totalBeds}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, totalBeds: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">ICU Beds</label>
                    <input
                      type="number"
                      value={hospitalForm.icuBeds}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, icuBeds: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={hospitalForm.address}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                    placeholder="Sector 4, Healthcare Boulevard"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departments</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableDepartments.map((dept) => (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => toggleDepartment(dept)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          hospitalForm.departments.includes(dept)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Owner Credentials (For Login Once Approved)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Owner Name"
                      value={hospitalForm.ownerName}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, ownerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Owner Password"
                      value={hospitalForm.ownerPassword}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, ownerPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting Application...' : 'Submit Hospital Application for Verification'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
              FORM 3: CLINIC REGISTRATION FORM
          ======================================================== */}
          {selectedRole === 'clinic' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
                  Private Clinic / OPD
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Register Clinic
                </h3>
              </div>

              <form onSubmit={handleClinicSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Clinic Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clinicForm.name}
                    onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                    placeholder="e.g. CarePlus Family Health Clinic"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Official Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={clinicForm.email}
                      onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                      placeholder="care@careplusclinic.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={clinicForm.phone}
                      onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                      placeholder="+91 22 2640 4455"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={clinicForm.city}
                      onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={clinicForm.consultationFee}
                      onChange={(e) => setClinicForm({ ...clinicForm, consultationFee: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={clinicForm.address}
                    onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                    placeholder="Shop 4, Greenfield Plaza, Bandra"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specialties</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSpecialties.map((spec) => (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => toggleSpecialty(spec)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          clinicForm.specialties.includes(spec)
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    Manager Credentials (For Login Once Approved)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Director Name"
                      value={clinicForm.representativeName}
                      onChange={(e) => setClinicForm({ ...clinicForm, representativeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Manager Password"
                      value={clinicForm.password}
                      onChange={(e) => setClinicForm({ ...clinicForm, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-sky-600"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-teal-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting Application...' : 'Submit Clinic Application for Verification'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Helper Bar on Right */}
        <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          <span>Protected by CURO 256-bit encryption &bull; </span>
          <Link to="/login" className="text-sky-600 hover:underline font-semibold">
            Sign In with Existing Account
          </Link>
        </div>
      </div>

      {/* ========================================================
          CONFIRMATION MODAL FOR HOSPITAL & CLINIC REGISTRATION
      ======================================================== */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {successModal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
                {successModal.message}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Facility:</span>
                <span className="font-bold text-slate-900">{successModal.details?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registry Reference:</span>
                <span className="font-mono font-bold text-sky-600">{successModal.details?.regId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compliance Queue:</span>
                <span className="font-bold text-amber-600">Pending Super Admin Review</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setSuccessModal(null);
                  navigate('/login');
                }}
                className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-sky-600/20 transition cursor-pointer"
              >
                Go to Sign In &rarr;
              </button>
              <button
                onClick={() => {
                  setSuccessModal(null);
                  navigate('/portal');
                }}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Browse Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
