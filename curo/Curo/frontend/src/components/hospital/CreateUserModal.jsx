import { useState } from 'react';
import { X, UserPlus, ShieldCheck, Mail, Lock, User, Phone, Building2 } from 'lucide-react';

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  role = 'doctor',
  defaultDepartment = '',
  departments = ['Emergency', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics'],
}) {
  const isManager = role === 'manager';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: defaultDepartment || 'Emergency',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EBF3FA] border border-[#D0E2F2] flex items-center justify-center text-[#2E5F8A]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isManager ? 'Provision Department Manager' : 'Provision Doctor Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {isManager ? 'Assign manager to supervise hospital ward' : 'Add doctor to clinical team'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={isManager ? 'Dr. Sunita Rao' : 'Dr. Rahul Sharma'}
                className="w-full pl-9 pr-3.5 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Hospital Staff Email <span className="text-rose-500">*</span>
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
                className="w-full pl-9 pr-3.5 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Initial Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-3.5 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
              />
            </div>
          </div>

          {isManager && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Department <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} Department
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Contact Phone (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98000 00000"
                className="w-full pl-9 pr-3.5 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#2E5F8A] hover:bg-[#244C6E] disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              {loading ? 'Creating...' : isManager ? 'Create Manager' : 'Create Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
