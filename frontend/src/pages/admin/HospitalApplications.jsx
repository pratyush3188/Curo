import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserPlus,
  Send,
  Save,
  X,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ReasonModal } from '../../components/common/ReasonModal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { InviteManagerModal } from '../../components/common/InviteManagerModal';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function HospitalApplications() {
  const [searchParams] = useSearchParams();
  const { success, warning, error: toastError } = useToast();

  const [hospitals, setHospitals] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Modals
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const [reasonModal, setReasonModal] = useState({ isOpen: false, title: '', subtitle: '', actionType: 'danger', action: null });
  const [inviteModal, setInviteModal] = useState({ isOpen: false, facility: null });

  const loadApplications = async () => {
    try {
      const data = await adminService.getHospitals();
      setHospitals(data);

      const reviewId = searchParams.get('review') || searchParams.get('id');
      if (reviewId) {
        const found = data.find((h) => h.id === reviewId);
        if (found) {
          setSelectedApp(found);
          setInternalNotes(found.reviewNotes || '');
        }
      } else if (selectedApp) {
        const fresh = data.find((h) => h.id === selectedApp.id);
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

  // Filter applications by tab & search
  const filteredList = hospitals.filter((h) => {
    const matchesTab = activeTab === 'all' || h.verificationStatus === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      h.name.toLowerCase().includes(q) ||
      h.regId.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const tabCounts = {
    all: hospitals.length,
    pending: hospitals.filter((h) => h.verificationStatus === 'pending').length,
    under_review: hospitals.filter((h) => h.verificationStatus === 'under_review').length,
    needs_more_information: hospitals.filter((h) => h.verificationStatus === 'needs_more_information').length,
    approved: hospitals.filter((h) => h.verificationStatus === 'approved').length,
    rejected: hospitals.filter((h) => h.verificationStatus === 'rejected').length,
  };

  const handleSelectApplication = (app) => {
    setSelectedApp(app);
    setInternalNotes(app.reviewNotes || '');
  };

  // Workflow Step 4: Mark Under Review
  const handleMarkUnderReview = async () => {
    if (!selectedApp) return;
    try {
      const updated = await adminService.markHospitalUnderReview(selectedApp.id, internalNotes);
      success(`Marked ${selectedApp.name} as Under Review.`);
      setSelectedApp(updated);
    } catch (err) {
      toastError(err.message || 'Failed to update review status');
    }
  };

  // Workflow Step 5: Save internal notes
  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    try {
      selectedApp.reviewNotes = internalNotes;
      await adminService.addAuditLog({
        action: 'REVIEW_NOTES_UPDATED',
        targetType: 'Hospital Application',
        targetId: selectedApp.id,
        targetName: selectedApp.name,
        outcome: 'info',
        details: `Updated internal compliance notes: ${internalNotes.substring(0, 80)}...`,
      });
      success('Internal review notes saved.');
    } catch (err) {
      toastError(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Workflow Step 5: Approve
  const handleApprove = () => {
    if (!selectedApp) return;
    setConfirmModal({
      isOpen: true,
      title: `Approve Hospital Application: ${selectedApp.name}`,
      message:
        'This will mark the application as Approved in demo review and unlock manager onboarding invitations. (Notice: This is a simulated approval and does not constitute real-world statutory certification).',
      action: async () => {
        try {
          const updated = await adminService.approveHospital(selectedApp.id, internalNotes);
          success(`Approved ${selectedApp.name}!`);
          setConfirmModal({ isOpen: false });
          setSelectedApp(updated);
          // Prompt for manager invitation immediately
          setInviteModal({ isOpen: true, facility: updated });
        } catch (err) {
          toastError(err.message || 'Approval failed');
        }
      },
    });
  };

  // Workflow Step 5: Reject
  const handleReject = () => {
    if (!selectedApp) return;
    setReasonModal({
      isOpen: true,
      title: `Reject Application: ${selectedApp.name}`,
      subtitle: 'Mandatory formal rejection reason will be recorded in compliance audit ledger.',
      actionType: 'danger',
      action: async (reason) => {
        try {
          const updated = await adminService.rejectHospital(selectedApp.id, reason);
          warning(`Application for ${selectedApp.name} rejected.`);
          setReasonModal({ isOpen: false });
          setSelectedApp(updated);
        } catch (err) {
          toastError(err.message || 'Rejection failed');
        }
      },
    });
  };

  // Workflow Step 5: Request Info
  const handleRequestInfo = () => {
    if (!selectedApp) return;
    setReasonModal({
      isOpen: true,
      title: `Request Additional Documentation: ${selectedApp.name}`,
      subtitle: 'Specify what documents or verifications are missing or require clarification.',
      actionType: 'warning',
      action: async (msg) => {
        try {
          const updated = await adminService.requestHospitalInformation(selectedApp.id, msg);
          success(`Sent additional information request to ${selectedApp.name}.`);
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
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          Hospital Application Verification Queue
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Step-by-step onboarding pipeline: review accreditations, conduct checks, record notes, and approve manager access.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { key: 'all', label: 'All Applications' },
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
                  ? 'bg-sky-600 text-white shadow-xs'
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

      {/* Main 2-Column Split: Queue List on Left, Interactive Review Panel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Quick Search inside queue */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search queue by hospital or city..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No hospital applications found matching this status filter.
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
                        ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {app.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {app.city}, {app.state} • ID: {app.regId}
                        </p>
                      </div>
                      <StatusBadge status={app.verificationStatus} type="application" />
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{app.documents?.length || 0} Docs Uploaded</span>
                      <span>{new Date(app.registeredAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Review Workbench (7 cols) */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-sky-600 dark:text-sky-400 font-bold">
                      {selectedApp.regId}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{selectedApp.type}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedApp.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedApp.address}</p>
                </div>

                <StatusBadge status={selectedApp.verificationStatus} type="application" />
              </div>

              {/* Review Workbench Content */}
              <div className="p-6 space-y-6 max-h-[620px] overflow-y-auto">
                {/* Step 1 & 2: Registration & Document Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    Submitted Regulatory Documents & Credentials
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(selectedApp.documents || []).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 transition cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-sky-600">
                            {doc.name}
                          </span>
                        </div>
                        <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Internal Review Notes */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                        2
                      </span>
                      Internal Review Notes & Compliance Findings
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </h4>

                  <textarea
                    rows={3}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Enter compliance evaluation notes, registry verification receipts, or observations..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  />
                </div>

                {/* Step 4 & 5: Interactive Action Controls */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] flex items-center justify-center font-bold">
                      3
                    </span>
                    Verification Workflow Actions
                  </h4>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {selectedApp.verificationStatus !== 'under_review' &&
                      selectedApp.verificationStatus !== 'approved' && (
                        <button
                          type="button"
                          onClick={handleMarkUnderReview}
                          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
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
                          Approve Hospital
                        </button>
                      </>
                    )}

                    {selectedApp.verificationStatus === 'approved' && !selectedApp.managerAccount && (
                      <button
                        type="button"
                        onClick={() => setInviteModal({ isOpen: true, facility: selectedApp })}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <UserPlus className="w-4 h-4" />
                        Initiate Manager Account Invitation
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 6: Application Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Audit Trail & Application Timeline
                  </h4>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-3 py-1">
                    {(selectedApp.timeline || []).map((tl, i) => (
                      <div key={i} className="relative pl-4 text-xs">
                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-sky-600"></div>
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
              <ClipboardCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Select an Application to Review
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Choose a hospital application from the queue on the left to inspect submitted documents, record notes, and advance the approval workflow.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        type="info"
        confirmText="Approve Application"
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

      <InviteManagerModal
        isOpen={inviteModal.isOpen}
        onClose={() => setInviteModal({ isOpen: false, facility: null })}
        initialFacility={inviteModal.facility}
        onSuccess={() => loadApplications()}
      />
    </div>
  );
}
