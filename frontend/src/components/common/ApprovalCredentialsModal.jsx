import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Copy,
  Check,
  X,
  Eye,
  EyeOff,
  Building2,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

export const ApprovalCredentialsModal = ({
  isOpen,
  onClose,
  facility,
  facilityType = 'hospital',
  onApprove,
}) => {
  if (!isOpen || !facility) return null;

  const defaultEmail =
    facility.authorizedRepresentative?.email ||
    facility.email ||
    facility.ownerEmail ||
    '';

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('Curo@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert('Login Email / ID is required.');
      return;
    }
    if (!password || password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await onApprove({
        notes,
        assignEmail: email.trim().toLowerCase(),
        assignPassword: password.trim(),
      });
      setSuccessResult({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: facilityType === 'hospital' ? 'Hospital Owner' : 'Clinic Manager',
        dashboardUrl: facilityType === 'hospital' ? '/hospital/owner' : '/clinic',
      });
    } catch (err) {
      alert(err.message || 'Approval failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!successResult) return;
    const text = `CURO Healthcare Login Credentials\nEmail: ${successResult.email}\nPassword: ${successResult.password}\nPortal: ${window.location.origin}/login\nRole: ${successResult.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const Icon = facilityType === 'hospital' ? Building2 : Stethoscope;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-600 to-sky-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {successResult ? 'Credentials Provisioned' : `Approve & Assign Credentials`}
              </h3>
              <p className="text-xs text-sky-100">{facility.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!successResult ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-900 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Manual Credential Assignment</p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  No invitation email required. Assign the facility login ID and password directly.
                  The user can immediately log in at <span className="font-semibold text-sky-700">/login</span> to access their {facilityType === 'hospital' ? 'Hospital Owner' : 'Clinic'} Dashboard.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Assigned Login Email / User ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@facility.org"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Assigned Password
                </label>
                <button
                  type="button"
                  onClick={() => setPassword(`Curo@${Math.floor(1000 + Math.random() * 9000)}!`)}
                  className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Generate Password
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter strong password"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-hidden transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Internal Compliance Review Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Regulatory documents checked and validated by Super Admin."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-hidden transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Activating...' : 'Approve & Activate Credentials'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">Application Approved & Activated!</h4>
              <p className="text-xs text-slate-500 mt-1">
                The facility administrator can now log in at <span className="font-semibold text-slate-700">/login</span>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="font-bold text-sky-700">{successResult.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Login Email:</span>
                <span className="font-bold text-slate-900 font-mono">{successResult.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Password:</span>
                <span className="font-bold text-slate-900 font-mono">{successResult.password}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Dashboard:</span>
                <span className="font-semibold text-emerald-600">{successResult.dashboardUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Credentials Copied!' : 'Copy Credentials'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
