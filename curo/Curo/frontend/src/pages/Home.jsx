import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          C
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Curo
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Healthcare Web App Platform Skeleton
        </p>

        {/* Auth status & quick actions */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-left">
          {isAuthenticated ? (
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Logged in as
              </p>
              <p className="text-sm font-bold text-slate-800">{user?.name} ({user?.role})</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  to={
                    user.role === 'patient'
                      ? '/patient'
                      : user.role === 'clinic'
                      ? '/clinic'
                      : user.role === 'doctor'
                      ? '/hospital/doctor'
                      : user.role === 'manager'
                      ? '/hospital/manager'
                      : '/hospital/owner'
                  }
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-medium cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-600">
                Ready for team development. Test the base authentication flow:
              </p>
              <div className="flex gap-2 mt-1">
                <Link
                  to="/login"
                  className="flex-1 text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Backend health status card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Backend Status
            </span>
            <button
              onClick={checkHealth}
              disabled={healthStatus.loading}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer disabled:opacity-50"
            >
              Recheck
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {healthStatus.loading && (
              <div className="flex items-center text-sm text-amber-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping mr-2"></span>
                Checking /api/v1/health...
              </div>
            )}

            {!healthStatus.loading && healthStatus.data && (
              <div className="flex items-center text-sm text-emerald-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
                Online & Healthy: {JSON.stringify(healthStatus.data)}
              </div>
            )}

            {!healthStatus.loading && healthStatus.error && (
              <div className="flex items-center text-sm text-rose-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2"></span>
                Error: {healthStatus.error}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Target API: <span className="font-mono text-slate-600">{import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}</span>
        </div>
      </div>
    </div>
  );
}
