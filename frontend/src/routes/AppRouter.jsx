import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminProtectedRoute from './AdminProtectedRoute';

// Layout
import { AdminLayout } from '../components/layout/AdminLayout';

// Public / Base Pages
import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import NotFound from '../pages/NotFound';

// Lazy Loaded Super Admin Pages for Optimized Bundles
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const AdminOverview = lazy(() => import('../pages/admin/AdminOverview'));
const HospitalManagement = lazy(() => import('../pages/admin/HospitalManagement'));
const HospitalApplications = lazy(() => import('../pages/admin/HospitalApplications'));
const ClinicManagement = lazy(() => import('../pages/admin/ClinicManagement'));
const ClinicApplications = lazy(() => import('../pages/admin/ClinicApplications'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const AuditLogs = lazy(() => import('../pages/admin/AuditLogs'));
const Analytics = lazy(() => import('../pages/admin/Analytics'));
const AdminSettings = lazy(() => import('../pages/admin/AdminSettings'));

// Dedicated User Portal (Shown immediately after signup)
const UserPortal = lazy(() => import('../pages/portal/UserPortal'));

// Other Role Stubs
const PatientDashboard = lazy(() => import('../pages/patient/PatientDashboard'));
const ClinicDashboard = lazy(() => import('../pages/clinic/ClinicDashboard'));
const AdminDashboard = lazy(() => import('../pages/hospital/admin/AdminDashboard'));
const ManagerDashboard = lazy(() => import('../pages/hospital/manager/ManagerDashboard'));
const DoctorDashboard = lazy(() => import('../pages/hospital/doctor/DoctorDashboard'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-9 h-9 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
      Loading interface...
    </p>
  </div>
);

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Dedicated User Portal for newly signed up & logged-in users */}
        <Route path="/portal" element={<UserPortal />} />

        {/* Super Admin Protected Portal Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/admin/overview" element={<AdminOverview />} />
            <Route path="/admin/hospitals" element={<HospitalManagement />} />
            <Route path="/admin/hospital-applications" element={<HospitalApplications />} />
            <Route path="/admin/clinics" element={<ClinicManagement />} />
            <Route path="/admin/clinic-applications" element={<ClinicApplications />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/invitations" element={<Navigate to="/admin/hospitals" replace />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Separate Hospital/Clinic/Patient Portals (Placeholders as per spec) */}
        <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
          <Route path="/patient" element={<PatientDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['clinic']} />}>
          <Route path="/clinic" element={<ClinicDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['hospital_admin']} />}>
          <Route path="/hospital/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
          <Route path="/hospital/manager" element={<ManagerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
          <Route path="/hospital/doctor" element={<DoctorDashboard />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
