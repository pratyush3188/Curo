import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function UserPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20">
                C
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900">Curo</span>
                <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  User Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">{user?.name || 'Valued User'}</span>
              <span className="text-[11px] text-slate-500 capitalize">{user?.role || 'patient'} &bull; {user?.email}</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-900/10">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Account Created & Live in Database
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome to your Curo Portal, {user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed font-light">
              Your profile has been saved. From this user portal, you can monitor your health records, view assigned appointments, and manage clinical info.
            </p>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold transition cursor-pointer border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profile Overview
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 text-sm font-bold transition cursor-pointer border-b-2 ${
              activeTab === 'appointments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Appointments
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`pb-3 text-sm font-bold transition cursor-pointer border-b-2 ${
              activeTab === 'records'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Medical Reports & Prescriptions
          </button>
        </div>

        {/* Tab 1: Profile Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shadow-blue-500/20">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{user?.role} Account</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-500">Phone:</span>
                  <span className="text-xs font-bold text-slate-800">{user?.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-500">Gender:</span>
                  <span className="text-xs font-bold text-slate-800 capitalize">{user?.gender || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-500">Date of Birth:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-500">Location:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {user?.address?.city ? `${user.address.city}, ${user.address.state || ''}` : 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-slate-500">Country:</span>
                  <span className="text-xs font-bold text-slate-800">{user?.address?.country || 'India'}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>Active MongoDB account linked</span>
              </div>
            </div>

            {/* Health / Professional Info Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {user?.role === 'patient' ? 'Medical & Emergency Profile' : 'Professional & Clinical Profile'}
                </h3>
                <p className="text-xs text-slate-500">
                  {user?.role === 'patient'
                    ? 'Important personal medical emergency metrics saved in the system.'
                    : 'Institutional affiliation and license credentials.'}
                </p>
              </div>

              {user?.role === 'patient' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Blood Group</span>
                    <p className="text-xl font-black text-rose-600 mt-1">{user?.bloodGroup || 'Not specified'}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Emergency Contact</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">{user?.emergencyContact?.name || 'Not provided'}</p>
                    <p className="text-xs text-slate-500">
                      {user?.emergencyContact?.phone || ''} {user?.emergencyContact?.relationship ? `(${user.emergencyContact.relationship})` : ''}
                    </p>
                  </div>

                  <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Allergies & Medical History</span>
                    <p className="text-sm text-slate-700 mt-1">
                      {user?.medicalHistorySummary || 'No known allergies or past medical chronic conditions recorded.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Specialization</span>
                    <p className="text-base font-bold text-blue-600 mt-1">
                      {user?.professionalInfo?.specialization || 'General Practice'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase">License / Registration</span>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {user?.professionalInfo?.licenseNumber || 'Pending verification'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Affiliated Hospital / Clinic</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {user?.professionalInfo?.hospitalAffiliation || 'Independent Practitioner'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Experience & Qualification</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {user?.professionalInfo?.qualification || 'Medical Graduate'} ({user?.professionalInfo?.experienceYears || 0} years)
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('appointments')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Book / Manage Consultations
                </button>
                <button
                  onClick={() => setActiveTab('records')}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Upload Health Documents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Appointments */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              📅
            </div>
            <h3 className="text-xl font-bold text-slate-900">Appointments Schedule</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              You have no pending consultations scheduled for today. You can book an appointment with any verified doctor or clinic.
            </p>
            <div className="pt-2">
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition cursor-pointer">
                + Schedule New Consultation
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Medical Records & Prescriptions */}
        {activeTab === 'records' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              📑
            </div>
            <h3 className="text-xl font-bold text-slate-900">Medical Reports & Prescriptions</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Diagnostic test results, laboratory scans, and electronic prescriptions will appear here once uploaded by your healthcare provider.
            </p>
            <div className="pt-2">
              <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm transition cursor-pointer">
                + Upload Lab Document
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
