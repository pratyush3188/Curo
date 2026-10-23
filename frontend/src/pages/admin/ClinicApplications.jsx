import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileCheck2,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Send,
  Save,
  X,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ReasonModal } from '../../components/common/ReasonModal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { ApprovalCredentialsModal } from '../../components/common/ApprovalCredentialsModal';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function ClinicApplications() {
  const [searchParams] = useSearchParams();
  const { success, warning, error: toastError } = useToast();

  const [clinics, setClinics] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Modals
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const [reasonModal, setReasonModal] = useState({ isOpen: false, title: '', subtitle: '', actionType: 'danger', action: null });
  const [approvalModal, setApprovalModal] = useState({ isOpen: false, facility: null });

  const loadApplications = async () => {
    try {
      const data = await adminService.getClinics();
      setClinics(data);

      const reviewId = searchParams.get('review') || searchParams.get('id');
      if (reviewId) {
        const found = data.find((c) => c.id === reviewId);
        if (found) {
          setSelectedApp(found);
          setInternalNotes(found.reviewNotes || '');
        }
      } else if (selectedApp) {
        const fresh = data.find((c) => c.id === selectedApp.id);
        if (fresh) {
          setSelectedApp(fresh);
          setInternalNotes(fresh.reviewNotes || '');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadApplications();
    window.addEventListener(DATA_CHANGE_EVENT, loadApplications);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadApplications);
  }, []);

  const filteredList = clinics.filter((c) => {
    const matchesTab = activeTab === 'all' || c.verificationStatus === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.regId.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const tabCounts = {
    all: clinics.length,
    pending: clinics.filter((c) => c.verificationStatus === 'pending').length,
    under_review: clinics.filter((c) => c.verificationStatus === 'under_review').length,
    needs_more_information: clinics.filter((c) => c.verificationStatus === 'needs_more_information').length,
    approved: clinics.filter((c) => c.verificationStatus === 'approved').length,
    rejected: clinics.filter((c) => c.verificationStatus === 'rejected').length,
  };

  const handleSelectApplication = (app) => {
    setSelectedApp(app);
    setInternalNotes(app.reviewNotes || '');
  };

  const handleMarkUnderReview = async () => {
    if (!selectedApp) return;
    try {
      const updated = await adminService.markClinicUnderReview(selectedApp.id, internalNotes);
      success(`Marked ${selectedApp.name} as Under Review.`);
      setSelectedApp(updated);
    } catch (err) {
      toastError(err.message || 'Failed to update review status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    try {
      selectedApp.reviewNotes = internalNotes;
      await adminService.addAuditLog({
        action: 'REVIEW_NOTES_UPDATED',
        targetType: 'Clinic Application',
        targetId: selectedApp.id,
        targetName: selectedApp.name,
        outcome: 'info',
        details: `Saved internal notes: ${internalNotes.substring(0, 80)}...`,
      });
      success('Internal review notes saved.');
    } catch (err) {
      toastError(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleApprove = () => {
    if (!selectedApp) return;
    setApprovalModal({ isOpen: true, facility: selectedApp });
  };

  const handleReject = () => {
    if (!selectedApp) return;
    setReasonModal({
      isOpen: true,
      title: `Reject Clinic: ${selectedApp.name}`,
      subtitle: 'Mandatory justification required for compliance logging.',
      actionType: 'danger',
      action: async (reason) => {
        try {
          const updated = await adminService.rejectClinic(selectedApp.id, reason);
          warning(`Clinic ${selectedApp.name} rejected.`);
          setReasonModal({ isOpen: false });
          setSelectedApp(updated);
        } catch (err) {
          toastError(err.message || 'Rejection failed');
        }
      },
    });
  };

  const handleRequestInfo = () => {
    if (!selectedApp) return;
    setReasonModal({
      isOpen: true,
      title: `Request Additional Documentation: ${selectedApp.name}`,
      subtitle: 'Specify what documents or verifications are missing.',
      actionType: 'warning',
      action: async (msg) => {
        try {
          const updated = await adminService.requestClinicInformation(selectedApp.id, msg);
          success(`Information request dispatched to ${selectedApp.name}.`);
          setReasonModal({ isOpen: false });
          setSelectedApp(updated);
        } catch (err) {
          toastError(err.message || 'Request failed');
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          Private Clinic Application Queue
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Verification pipeline for outpatient specialty clinics, dental practices, and local healthcare centers.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { key: 'all', label: 'All Clinics' },
          { key: 'pending', label: 'Pending Queue' },
          { key: 'under_review', label: 'Under Review' },
          { key: 'needs_more_information', label: 'Needs Info' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
        ].map((tab) => {
          const count = tabCounts[tab.key] || 0;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clinic queue..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No clinic applications found in this queue tab.
              </div>
            ) : (
              filteredList.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => handleSelectApplication(app)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-400 dark:border-teal-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {app.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {app.category} • {app.city}
                        </p>
                      </div>
                      <StatusBadge status={app.verificationStatus} type="application" />
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>ID: {app.regId}</span>
                      <span>{new Date(app.registeredAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Review Workbench (7 cols) */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold">
                      {selectedApp.regId}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{selectedApp.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedApp.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedApp.address}</p>
                </div>

                <StatusBadge status={selectedApp.verificationStatus} type="application" />
              </div>

              <div className="p-6 space-y-6 max-h-[620px] overflow-y-auto">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    Submitted Trade Licenses & Doctor Registrations
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(selectedApp.documents || []).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600">
                            {doc.name}
                          </span>
                        </div>
                        <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                        2
                      </span>
                      Internal Review Notes
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </h4>

                  <textarea
                    rows={3}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Enter observations, council registration verification, or trade permit checks..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    Clinic Workflow Actions
                  </h4>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {selectedApp.verificationStatus !== 'under_review' &&
                      selectedApp.verificationStatus !== 'approved' && (
                        <button
                          type="button"
                          onClick={handleMarkUnderReview}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          Mark as Under Review
                        </button>
                      )}

                    {selectedApp.verificationStatus !== 'approved' && (
                      <>
                        <button
                          type="button"
                          onClick={handleRequestInfo}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          Request More Information
                        </button>

                        <button
                          type="button"
                          onClick={handleReject}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          Reject Application
                        </button>

                        <button
                          type="button"
                          onClick={handleApprove}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve Clinic
                        </button>
                      </>
                    )}

                    {selectedApp.verificationStatus === 'approved' && !selectedApp.managerAccount && (
                      <button
                        type="button"
                        onClick={() => setInviteModal({ isOpen: true, facility: selectedApp })}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        Initiate Clinic Manager Invitation
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Application Timeline
                  </h4>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-3 py-1">
                    {(selectedApp.timeline || []).map((tl, i) => (
                      <div key={i} className="relative pl-4 text-xs">
                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-teal-600"></div>
                        <p className="font-semibold text-slate-900 dark:text-white leading-snug">
                          {tl.event}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tl.date).toLocaleDateString()} • Actor: {tl.actor}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[420px] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <FileCheck2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Select a Clinic Application to Review
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Choose a private clinic submission from the left queue to inspect medical council documents and perform verification.
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        type="info"
        confirmText="Approve Clinic"
      />

      <ReasonModal
        isOpen={reasonModal.isOpen}
        onClose={() => setReasonModal({ ...reasonModal, isOpen: false })}
        onSubmit={reasonModal.action}
        title={reasonModal.title}
        subtitle={reasonModal.subtitle}
        actionType={reasonModal.actionType}
      />

      <DocumentPreviewModal
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
      />

      <ApprovalCredentialsModal
        isOpen={approvalModal.isOpen}
        onClose={() => {
          setApprovalModal({ isOpen: false, facility: null });
          loadApplications();
        }}
        facility={approvalModal.facility}
        facilityType="clinic"
        onApprove={async ({ notes, assignEmail, assignPassword }) => {
          const res = await adminService.approveClinic(approvalModal.facility.id, notes, {
            assignEmail,
            assignPassword,
          });
          success(`Approved ${approvalModal.facility.name}! Credentials assigned.`);
          loadApplications();
          if (selectedApp?.id === approvalModal.facility.id) {
            setSelectedApp((prev) => ({
              ...prev,
              verificationStatus: 'approved',
              accountStatus: 'active',
            }));
          }
          return res;
        }}
      />
    </div>
  );
}
