import React, { useState, useEffect } from 'react';
import { X, Mail, User, Phone, Building2, Check, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const InviteManagerModal = ({
  isOpen,
  onClose,
  initialFacility = null, // { id, name, type }
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedFacilityType, setSelectedFacilityType] = useState('hospital');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [createdInvitation, setCreatedInvitation] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadApprovedFacilities();
      setCreatedInvitation(null);
      setCopied(false);
      setFieldErrors({});

      if (initialFacility) {
        setSelectedFacilityId(initialFacility.id);
        setSelectedFacilityType(initialFacility.type || 'hospital');
        setFormData({
          name: initialFacility.authorizedRepresentative?.name || '',
          email: initialFacility.authorizedRepresentative?.email || '',
          phone: initialFacility.authorizedRepresentative?.phone || '',
        });
      } else {
        setSelectedFacilityId('');
        setFormData({ name: '', email: '', phone: '' });
      }
    }
  }, [isOpen, initialFacility]);

  const loadApprovedFacilities = async () => {
    try {
      const [hospitals, clinics] = await Promise.all([
        adminService.getHospitals(),
        adminService.getClinics(),
      ]);

      const approvedHospitals = hospitals
        .filter((h) => h.verificationStatus === 'approved')
        .map((h) => ({ id: h.id, name: h.name, type: 'hospital' }));

      const approvedClinics = clinics
        .filter((c) => c.verificationStatus === 'approved')
        .map((c) => ({ id: c.id, name: c.name, type: 'clinic' }));

      setFacilities([...approvedHospitals, ...approvedClinics]);

      if (!initialFacility && approvedHospitals.length > 0) {
        setSelectedFacilityId(approvedHospitals[0].id);
        setSelectedFacilityType('hospital');
      }
    } catch (err) {
      console.error('Failed to load facilities:', err);
    }
  };

  if (!isOpen) return null;

  const handleFacilityChange = (e) => {
    const facId = e.target.value;
    setSelectedFacilityId(facId);
    const target = facilities.find((f) => f.id === facId);
    if (target) {
      setSelectedFacilityType(target.type);
    }
  };

  const validate = () => {
    const errs = {};
    if (!selectedFacilityId) errs.facility = 'Please select an approved facility.';
    if (!formData.name.trim()) errs.name = "Manager's full name is required.";
    if (!formData.email.trim()) {
      errs.email = 'Official work email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid corporate email format.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const target = facilities.find((f) => f.id === selectedFacilityId);

    try {
      const invitation = await adminService.createManagerInvitation({
        facilityId: selectedFacilityId,
        facilityType: selectedFacilityType,
        facilityName: target ? target.name : 'Healthcare Facility',
        inviteeName: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: selectedFacilityType === 'hospital' ? 'hospital_manager' : 'clinic_manager',
      });

      setCreatedInvitation(invitation);
      success(`Invitation created for ${invitation.inviteeName}`);
      if (onSuccess) onSuccess(invitation);
    } catch (err) {
      toastError(err.message || 'Failed to create manager invitation');
      setFieldErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInvitation) return;
    navigator.clipboard.writeText(createdInvitation.simulatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateActivation = async () => {
    if (!createdInvitation) return;
    setActivating(true);
    try {
      await adminService.activateInvitation(createdInvitation.id);
      success(`Manager account activated! ${createdInvitation.inviteeName} is now active.`);
      onClose();
    } catch (err) {
      toastError(err.message || 'Activation failed');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        <button
          onClick={onClose}
          disabled={loading || activating}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdInvitation ? (
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Invite Facility Manager
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Generate an initial credential activation invitation for an approved facility
                </p>
              </div>
            </div>

            {/* Note banner */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-0.5">Simulated Email Dispatch</p>
              <p>
                In this demo environment, invitations generate a test activation token. No real external email is transmitted.
              </p>
            </div>

            {fieldErrors.submit && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-300">
                {fieldErrors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Select Facility */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Target Facility
                </label>
                <div className="relative">
                  <select
                    value={selectedFacilityId}
                    onChange={handleFacilityChange}
                    disabled={!!initialFacility}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all disabled:opacity-75"
                  >
                    <option value="">Select an approved facility</option>
                    {facilities.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name} ({fac.type === 'hospital' ? 'Hospital' : 'Private Clinic'})
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.facility && (
                  <p className="mt-1 text-xs text-rose-500">{fieldErrors.facility}</p>
                )}
              </div>

              {/* Manager Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Manager Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Rajesh Singhania"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-rose-500">{fieldErrors.name}</p>
                )}
              </div>

              {/* Official Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., rajesh.singhania@apexapollo.org"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-rose-500">{fieldErrors.email}</p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Contact Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., +91 98101 23456"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Assigned Role Pill */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Assigned Platform Role:</span>
                <span className="font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  {selectedFacilityType === 'hospital' ? 'Hospital Manager' : 'Clinic Manager'}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      Generating Invitation...
                    </>
                  ) : (
                    'Generate & Send Invitation'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Success Screen: Generated Invitation Details */
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Invitation Generated Successfully
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A secure onboarding invitation has been created for {createdInvitation.inviteeName}.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invitee:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{createdInvitation.inviteeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{createdInvitation.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Facility:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{createdInvitation.facilityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-semibold text-sky-600 dark:text-sky-400 uppercase">
                  {createdInvitation.role.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token Status:</span>
                <span className="font-semibold text-amber-600">Pending Activation (Valid 30 Days)</span>
              </div>
            </div>

            {/* Simulated Link copy box */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Simulated Activation Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdInvitation.simulatedLink}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Immediate Activation simulation button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulateActivation}
                disabled={activating}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition"
              >
                {activating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    Simulating Activation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Simulate Manager Activation Now (Test Flow)
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-1">
                Instantly marks invitation accepted, creates manager account, and activates facility.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
