import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component stub
 * TODO: Verify authentication status and authorized user roles
 */
// eslint-disable-next-line no-unused-vars
export default function ProtectedRoute({ allowedRoles = [] }) {
  // eslint-disable-next-line no-unused-vars
  const { isAuthenticated, user } = useAuth();

  // TODO: If not authenticated, redirect to /login
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  // TODO: If role not authorized, redirect to unauthorized/home
  // if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
  //   return <Navigate to="/" replace />;
  // }

  return <Outlet />;
}
