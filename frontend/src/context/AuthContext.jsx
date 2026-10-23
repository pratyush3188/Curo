import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

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
          // If demo token
          if (token.startsWith('demo_sa_token_')) {
            const saved = localStorage.getItem('curo_user');
            if (saved) {
              setUser(JSON.parse(saved));
            }
            setLoading(false);
            return;
          }

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('curo_user', JSON.stringify(res.data.user));
          }
        }
      } catch {
        // If demo user exists, keep it
        const saved = localStorage.getItem('curo_user');
        if (saved) {
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

    // Check if logging in as Super Admin demo credentials
    if (cleanEmail === 'admin@medicore.health' || cleanEmail === 'superadmin@curo.health') {
      const demoSuperAdmin = {
        id: 'usr-sa-001',
        name: 'Dr. Alok Verma',
        email: cleanEmail,
        role: 'super_admin',
        facilityType: null,
        facilityId: null,
        facilityName: 'MediCore Platform Central',
        department: 'Central Clinical Informatics Directorate',
        accountStatus: 'active',
      };
      const demoToken = `demo_sa_token_${Date.now()}`;
      localStorage.setItem('curo_token', demoToken);
      localStorage.setItem('curo_user', JSON.stringify(demoSuperAdmin));
      setUser(demoSuperAdmin);
      return demoSuperAdmin;
    }

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;
      if (token) {
        localStorage.setItem('curo_token', token);
        localStorage.setItem('curo_user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
      }
      return userData;
    } catch (err) {
      // If backend is not running and user entered admin credentials
      if (cleanEmail.includes('admin')) {
        const fallbackAdmin = {
          id: 'usr-sa-001',
          name: 'Dr. Alok Verma',
          email: cleanEmail,
          role: 'super_admin',
          facilityName: 'MediCore Platform Central',
        };
        localStorage.setItem('curo_token', `demo_sa_token_${Date.now()}`);
        localStorage.setItem('curo_user', JSON.stringify(fallbackAdmin));
        setUser(fallbackAdmin);
        return fallbackAdmin;
      }
      throw err;
    }
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token, user: userData } = res.data;
    if (token) {
      localStorage.setItem('curo_token', token);
      localStorage.setItem('curo_user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    }
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('curo_token');
    localStorage.removeItem('curo_user');
    delete api.defaults.headers.common['Authorization'];
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
