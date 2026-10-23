import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(formData.email, formData.password);
      // Route based on role
      if (user.role === 'patient') navigate('/patient');
      else if (user.role === 'clinic') navigate('/clinic');
      else if (user.role === 'doctor') navigate('/hospital/doctor');
      else if (user.role === 'manager') navigate('/hospital/manager');
      else if (user.role === 'hospital_owner' || user.role === 'hospital_admin') navigate('/hospital/owner');
      else navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const setDemoCreds = (email, password) => {
    setFormData({ email, password });
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-8">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#2E5F8A] flex items-center justify-center text-white font-bold text-lg shadow-xs">
              C
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Curo</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-800">Hospital Portal Sign In</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2E5F8A]" />
            <span>For authorized hospital staff only</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="staff@curo.hospital"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#2E5F8A] hover:bg-[#244C6E] disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-xs transition-colors text-xs cursor-pointer mt-1"
          >
            {loading ? 'Authenticating Staff...' : 'Sign In to Hospital Portal'}
          </button>
        </form>

        {/* Quick Demo Credentials for Hackathon Evaluators */}
        <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Quick Demo Accounts (password123)
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setDemoCreds('owner@curo.hospital', 'password123')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors cursor-pointer text-center"
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => setDemoCreds('manager.emergency@curo.hospital', 'password123')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors cursor-pointer text-center"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoCreds('dr.sharma@curo.hospital', 'password123')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold transition-colors cursor-pointer text-center"
            >
              Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
