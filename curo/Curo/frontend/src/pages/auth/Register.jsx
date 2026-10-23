import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
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
      const user = await register(formData);
      // Route based on registered role
      if (user.role === 'patient') navigate('/patient');
      else if (user.role === 'clinic') navigate('/clinic');
      else if (user.role === 'doctor') navigate('/hospital/doctor');
      else if (user.role === 'manager') navigate('/hospital/manager');
      else if (user.role === 'hospital_owner' || user.role === 'hospital_admin') navigate('/hospital/owner');
      else navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check form values.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-extrabold tracking-tight text-blue-600">Curo</span>
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">Create Account</h2>
          <p className="text-sm text-slate-500">Join the Curo healthcare platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Dr. John Doe / Jane Smith"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Select Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="clinic">Clinic</option>
              <option value="manager">Hospital Manager</option>
              <option value="hospital_owner">Hospital Owner</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-sm transition-colors text-sm cursor-pointer mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
