import { useAuth } from '../context/AuthContext';

/**
 * Placeholder hook for user authentication
 */
export const useCurrentUser = () => {
  const { user, isAuthenticated } = useAuth();
  return { user, isAuthenticated };
};
