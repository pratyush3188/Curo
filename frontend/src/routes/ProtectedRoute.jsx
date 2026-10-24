import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component stub
 * TODO: Verify authentication status and authorized user roles
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Super Admin has omni-clearance to inspect all portals
  if (user.role === 'super_admin') {
    return <Outlet />;
  }

  if (allowedRoles.length > 0) {
    const userRole = (user.role || '').toLowerCase();
    const facilityType = (user.associatedFacilityType || user.facilityType || '').toLowerCase();

    const isMatch = allowedRoles.some((r) => {
      const lower = r.toLowerCase();
      return (
        userRole === lower ||
        userRole.includes(lower) ||
        lower.includes(userRole) ||
        facilityType === lower
      );
    });

    if (!isMatch) {
      if (userRole.includes('clinic') || facilityType === 'clinic') {
        return <Navigate to="/clinic" replace />;
      }
      if (userRole.includes('hospital') || userRole.includes('owner') || facilityType === 'hospital') {
        return <Navigate to="/hospital/owner" replace />;
      }
      if (userRole === 'doctor') {
        return <Navigate to="/hospital/doctor" replace />;
      }
      if (userRole === 'manager' || userRole === 'department_manager') {
        return <Navigate to="/hospital/manager" replace />;
      }
      return <Navigate to="/portal" replace />;
    }
  }

  return <Outlet />;
}
