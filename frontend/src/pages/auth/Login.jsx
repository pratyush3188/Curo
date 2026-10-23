import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authLightHero from '../../assets/auth_light_hero.jpg';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'patient') navigate('/portal');
      else if (user.role === 'clinic') navigate('/clinic');
      else if (user.role === 'doctor') navigate('/hospital/doctor');
      else if (user.role === 'manager') navigate('/hospital/manager');
      else if (user.role === 'hospital_owner' || user.role === 'hospital_admin') navigate('/hospital/owner');
      else if (user.role === 'super_admin') navigate('/admin/overview');
      else navigate('/portal');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-slate-900 antialiased">
      {/* 60% Left Section - Bright Light Medical Experience */}
      <div className="relative hidden lg:flex lg:w-[60%] flex-col justify-between overflow-hidden bg-slate-100 p-12 xl:p-16 border-r border-slate-200">
        <img
          src={authLightHero}
          alt="Curo Healthcare Clinic Reception"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Soft daylight gradient overlay for readable contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/40" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">Curo</span>
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Healthcare OS
              </span>
            </div>
          </Link>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-slate-700">
              Modern Clinical Care & Patient Portals
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Healthcare management, simplified and connected.
          </h1>

          <p className="text-base text-slate-600 font-normal leading-relaxed">
            Welcome to Curo. Securely access clinical consultations, verify diagnostic reports, and manage hospital administration with unified workflows.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
            <div className="bg-white/85 backdrop-blur-sm p-4 rounded-xl border border-slate-200/70 shadow-xs">
              <p className="text-2xl font-extrabold text-blue-600">99.9%</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">Reliable Uptime</p>
            </div>
            <div className="bg-white/85 backdrop-blur-sm p-4 rounded-xl border border-slate-200/70 shadow-xs">
              <p className="text-2xl font-extrabold text-emerald-600">HIPAA</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">Compliant Design</p>
            </div>
            <div className="bg-white/85 backdrop-blur-sm p-4 rounded-xl border border-slate-200/70 shadow-xs">
              <p className="text-2xl font-extrabold text-indigo-600">5 Roles</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">Dedicated Portals</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs font-medium text-slate-500 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Curo Health Systems Inc.</span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
            End-to-End SSL Encrypted
          </span>
        </div>
      </div>

      {/* 40% Right Section - Form */}
      <div className="flex-1 lg:w-[40%] flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-16 bg-white relative">
        <div className="mx-auto w-full max-w-sm space-y-7">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg">
                C
              </div>
              <span className="text-xl font-bold text-slate-900">Curo</span>
            </Link>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Sign In
            </h2>
            <p className="text-sm text-slate-500">
              Enter your registered email and password to continue.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="doctor@hospital.org or patient@mail.com"
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 cursor-pointer rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              Register here
            </Link>
          </div>

          <div className="text-center">
            <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              &larr; Back to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
