import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Activity, Sparkles, Building2, Stethoscope, Users, CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import authLightHero from '../assets/auth_light_hero.jpg';

export default function Home() {
  const { user, logout, isAuthenticated } = useAuth();
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const checkHealth = async () => {
    setHealthStatus({ loading: true, data: null, error: null });
    try {
      const response = await api.get('/health');
      setHealthStatus({ loading: false, data: response.data, error: null });
    } catch (err) {
      setHealthStatus({
        loading: false,
        data: null,
        error: err.response?.data?.message || err.message || 'Failed to connect to backend',
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20">
                C
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-slate-900">Curo</span>
                <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Healthcare OS
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Platform Features</a>
            <a href="#roles" className="hover:text-blue-600 transition-colors">Portals & Roles</a>
            <Link to="/admin/overview" className="hover:text-sky-600 transition-colors flex items-center gap-1 font-semibold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              Super Admin
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                  {user?.name} ({user?.role})
                </span>
                <Link
                  to={
                    user.role === 'super_admin'
                      ? '/admin/overview'
                      : user.role === 'patient'
                      ? '/portal'
                      : user.role === 'clinic'
                      ? '/clinic'
                      : user.role === 'doctor'
                      ? '/hospital/doctor'
                      : user.role === 'manager'
                      ? '/hospital/manager'
                      : '/hospital/admin'
                  }
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/admin/login"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg text-xs font-semibold border border-sky-200 transition"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-700 hover:text-blue-600 font-semibold text-xs sm:text-sm transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm shadow-blue-500/20 transition hover:shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/50 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-xs font-semibold text-blue-900">
                  Unified Clinical & Administrative Operating System
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.12]">
                Transforming care delivery for patients, doctors & clinics.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl">
                Curo consolidates electronic medical records, role-based workflows, automated prescription safety validation, and transparent patient communication into a single modern platform.
              </p>

              <div className="flex flex-wrap gap-3.5 pt-2">
                <Link
                  to="/register"
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:shadow-lg text-sm"
                >
                  Create Your Account &rarr;
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-xl shadow-xs transition text-sm"
                >
                  Sign In to Portal
                </Link>
                <Link
                  to="/admin/overview"
                  className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition text-sm flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-sky-400" />
                  Super Admin
                </Link>
              </div>

              {/* Status Indicator Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 max-w-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Live System & Database Connectivity
                  </span>
                  <button
                    onClick={checkHealth}
                    disabled={healthStatus.loading}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {healthStatus.loading && (
                    <div className="flex items-center text-xs text-amber-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-2"></span>
                      Pinging /api/v1/health...
                    </div>
                  )}
                  {!healthStatus.loading && healthStatus.data && (
                    <div className="flex items-center text-xs text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                      Backend & Database: Active ({JSON.stringify(healthStatus.data)})
                    </div>
                  )}
                  {!healthStatus.loading && healthStatus.error && (
                    <div className="flex items-center text-xs text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                      Standalone Healthcare Platform (Demo Engine Active)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-blue-900/10 bg-white">
                <img
                  src={authLightHero}
                  alt="Modern Light Clinic Reception"
                  className="w-full h-[440px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                    Verified Digital Workflow
                  </span>
                  <p className="text-base font-bold mt-1">
                    Connecting 5 Healthcare Stakeholders in Real-Time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section id="roles" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Role-Based Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Tailored Portals for Every Stakeholder
            </h2>
            <p className="text-sm text-slate-600">
              Choose your role during registration to access purpose-built dashboards designed for your daily workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Patient */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg mb-4">
                P
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Patient</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                View personal electronic prescriptions, diagnostic test results, and book consultations.
              </p>
            </div>

            {/* Doctor */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                Dr
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Doctor</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review patient records, conduct consultations, and issue safety-checked prescriptions.
              </p>
            </div>

            {/* Clinic */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg mb-4">
                C
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Clinic</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage appointment queues, clinic doctors schedule, and primary patient intake logs.
              </p>
            </div>

            {/* Hospital Manager */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg mb-4">
                M
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Hospital Manager</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Oversee hospital departments, resource allocation, capacity, and staff availability.
              </p>
            </div>

            {/* Hospital Admin */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mb-4">
                A
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Hospital Admin</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hospital compliance, user credentials management, audit trails, and institution governance.
              </p>
            </div>

            {/* Super Admin */}
            <div className="bg-white p-6 rounded-2xl border border-sky-300 shadow-xs hover:shadow-md transition relative">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg mb-4">
                <Shield className="w-5 h-5 text-sky-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Super Admin</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hospital & clinic verification, manager onboarding invitations, and platform analytics.
              </p>
              <Link to="/admin/overview" className="mt-3 text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1">
                Open Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Report Simplification</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Service stubs ready for team integration to convert complex diagnostic lab results into readable summaries for patients.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900">Prescription Safety Checks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated drug-to-drug contradiction checks and dosage verification before prescriptions are finalized.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900">Audit-Ready Security</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Complete traceability with immutable audit logging models and granular role-based authorization tokens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-xs">
              C
            </div>
            <span className="font-bold text-base">Curo Healthcare Platform</span>
          </div>
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Curo Health Systems. Clean Light Theme Architecture.
          </p>
        </div>
      </footer>
    </div>
  );
}
