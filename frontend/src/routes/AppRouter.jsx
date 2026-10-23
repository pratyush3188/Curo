import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Home / Landing
import Home from '../pages/Home';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Role-specific Pages
import PatientDashboard from '../pages/patient/PatientDashboard';
import ClinicDashboard from '../pages/clinic/ClinicDashboard';
import AdminDashboard from '../pages/hospital/admin/AdminDashboard';
import ManagerDashboard from '../pages/hospital/manager/ManagerDashboard';
import DoctorDashboard from '../pages/hospital/doctor/DoctorDashboard';

// 404
import NotFound from '../pages/NotFound';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Patient routes */}
      <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
        <Route path="/patient" element={<PatientDashboard />} />
      </Route>

      {/* Clinic routes */}
      <Route element={<ProtectedRoute allowedRoles={['clinic']} />}>
        <Route path="/clinic" element={<ClinicDashboard />} />
      </Route>

      {/* Hospital Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['hospital_admin']} />}>
        <Route path="/hospital/admin" element={<AdminDashboard />} />
      </Route>

      {/* Hospital Manager routes */}
      <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
        <Route path="/hospital/manager" element={<ManagerDashboard />} />
      </Route>

      {/* Doctor routes */}
      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route path="/hospital/doctor" element={<DoctorDashboard />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
