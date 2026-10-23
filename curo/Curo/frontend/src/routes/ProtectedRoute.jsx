import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component
 * Validates authentication status and checks permitted roles.
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="w-9 h-9 border-3 border-[#2E5F8A]/30 border-t-[#2E5F8A] rounded-full animate-spin mb-3" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verifying Hospital Authorization...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
