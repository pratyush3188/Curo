import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import adminApi from '../services/adminApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('curo_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('curo_token');
        if (token) {
          // If demo offline token, preserve local demo user
          if (token.startsWith('demo_sa_token_')) {
            const saved = localStorage.getItem('curo_user');
            if (saved) {
              setUser(JSON.parse(saved));
            }
            setLoading(false);
            return;
          }

          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await adminApi.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('curo_user', JSON.stringify(res.user));
          }
        }
      } catch (err) {
        // If backend is offline or network error, keep offline session if exists
        const saved = localStorage.getItem('curo_user');
        if (!err.response && saved) {
          try {
            const u = JSON.parse(saved);
            if (u.role === 'super_admin') {
              setUser(u);
              setLoading(false);
              return;
            }
          } catch (e) {
            void e;
          }
        }
        logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const cleanEmail = email?.trim().toLowerCase();

    try {
      // 1. First attempt real backend authentication
      const res = await adminApi.login({ email: cleanEmail, password });
      const { token, user: userData } = res;
      if (token) {
        localStorage.setItem('curo_token', token);
        localStorage.setItem('curo_user', JSON.stringify(userData));
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
      }
      return userData;
    } catch (err) {
      // 2. If the backend is running and returned a formal error (401 invalid creds, 403, 400), throw it!
      if (err.response) {
        const message = err.response.data?.message || 'Invalid email or password credentials.';
        throw new Error(message, { cause: err });
      }

      // 3. Fallback only if backend is completely offline (Network Error / ECONNREFUSED)
      if (cleanEmail === 'admin@curo.health' || cleanEmail === 'admin@medicore.health' || cleanEmail === 'superadmin@curo.health') {
        const demoSuperAdmin = {
          id: 'usr-sa-001',
          name: 'Dr. Alok Verma',
          email: cleanEmail,
          role: 'super_admin',
          facilityType: null,
          facilityId: null,
          facilityName: 'CURO Platform Central',
          department: 'Central Clinical Informatics Directorate',
          accountStatus: 'active',
        };
        const demoToken = `demo_sa_token_${Date.now()}`;
        localStorage.setItem('curo_token', demoToken);
        localStorage.setItem('curo_user', JSON.stringify(demoSuperAdmin));
        setUser(demoSuperAdmin);
        return demoSuperAdmin;
      }

      throw new Error(err.message || 'Unable to connect to CURO authentication service.', { cause: err });
    }
  };

  const register = async (formData) => {
    const res = await apiClient.post('/auth/register', formData);
    const { token, user: userData } = res.data;
    if (token) {
      localStorage.setItem('curo_token', token);
      localStorage.setItem('curo_user', JSON.stringify(userData));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    }
    return userData;
  };

  const logout = () => {
    try {
      adminApi.logout().catch(() => {});
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('curo_token');
    localStorage.removeItem('curo_user');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
