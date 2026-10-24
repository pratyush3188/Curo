import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Copy,
  Check,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ReasonModal } from '../../components/common/ReasonModal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { TableSkeleton, DrawerSkeleton } from '../../components/common/SkeletonLoader';
import { ApprovalCredentialsModal } from '../../components/common/ApprovalCredentialsModal';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function ClinicManagement() {
  const [searchParams] = useSearchParams();
  const { success, error: toastError, warning } = useToast();

  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [verificationStatus, setVerificationStatus] = useState(searchParams.get('status') || 'all');
  const [accountStatus, setAccountStatus] = useState(searchParams.get('account') || 'all');
  const [stateFilter, setStateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Selected Clinic Drawer
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [reviewNoteInput, setReviewNoteInput] = useState('');

  // Modals state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    action: null,
  });
  const [reasonModal, setReasonModal] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    actionType: 'danger',
    action: null,
  });
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    facility: null,
  });

  // Contextual Facility Invitations State
  const [facilityInvitations, setFacilityInvitations] = useState([]);
  const [copiedInvId, setCopiedInvId] = useState(null);

  const loadFacilityInvitations = async (facilityId) => {
    if (!facilityId) {
      setFacilityInvitations([]);
      return;
    }
    try {
      const invs = await adminService.getInvitationsByFacilityId(facilityId);
      setFacilityInvitations(invs);
    } catch (err) {
      console.error('Failed to load facility invitations:', err);
    }
  };

  const handleCopyLink = (inv) => {
    navigator.clipboard.writeText(inv.simulatedLink);
    setCopiedInvId(inv.id);
    success(`Copied activation link for ${inv.inviteeName}`);
    setTimeout(() => setCopiedInvId(null), 2500);
  };

  const handleResendInvitation = async (inv) => {
    try {
      await adminService.resendInvitation(inv.id);
      success(`Simulated resend: Fresh activation link dispatched to ${inv.email}.`);
      if (selectedClinic?.id) loadFacilityInvitations(selectedClinic.id);
    } catch (err) {
      toastError(err.message || 'Failed to resend invitation');
    }
  };

  const handleRevokeInvitation = async (inv) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Revoke Manager Invitation',
      message: `Revoke onboarding token for ${inv.inviteeName} (${inv.email})? They will no longer be able to activate this account.`,
      action: async () => {
        try {
          await adminService.revokeInvitation(inv.id);
          warning(`Revoked invitation for ${inv.inviteeName}.`);
          if (selectedClinic?.id) loadFacilityInvitations(selectedClinic.id);
          setConfirmModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Failed to revoke invitation');
        }
      },
    });
  };

  const handleSimulateActivation = async (inv) => {
    try {
      const res = await adminService.activateInvitation(inv.id);
      success(`Simulated manager activation successful! Account created for ${res.user.name} and clinic activated.`);
      loadClinics();
      if (selectedClinic?.id) loadFacilityInvitations(selectedClinic.id);
    } catch (err) {
      toastError(err.message || 'Failed to simulate activation');
    }
  };

  const loadClinics = async () => {
    try {
      const data = await adminService.getClinics({
        search,
        verificationStatus,
        accountStatus,
        state: stateFilter,
        sortBy,
      });
      setClinics(data);

      const reviewId = searchParams.get('id');
      if (reviewId) {
        const found = data.find((c) => c.id === reviewId);
        if (found) setSelectedClinic(found);
      } else if (selectedClinic) {
        const fresh = data.find((c) => c.id === selectedClinic.id);
        if (fresh) setSelectedClinic(fresh);
      }
    } catch (err) {
      console.error('Failed to load clinics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinics();
    window.addEventListener(DATA_CHANGE_EVENT, loadClinics);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadClinics);
  }, [search, verificationStatus, accountStatus, stateFilter, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setVerificationStatus('all');
    setAccountStatus('all');
    setStateFilter('all');
    setSortBy('newest');
    setPage(1);
  };

  const handleOpenDrawer = async (clinic) => {
    setDrawerLoading(true);
    setSelectedClinic(clinic);
    loadFacilityInvitations(clinic.id);
    try {
      const full = await adminService.getClinicById(clinic.id);
      setSelectedClinic(full);
      setReviewNoteInput(full.reviewNotes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Actions
  const handleApprove = (cln) => {
    setApprovalModal({ isOpen: true, facility: cln });
  };

  const handleReject = (cln) => {
    setReasonModal({
      isOpen: true,
      title: `Reject Clinic: ${cln.name}`,
      subtitle: 'Mandatory rejection justification will be saved to audit ledger.',
      actionType: 'danger',
      action: async (reason) => {
        try {
          await adminService.rejectClinic(cln.id, reason);
          warning(`Rejected application for ${cln.name}.`);
          setReasonModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Rejection failed');
        }
      },
    });
  };

  const handleRequestInfo = (cln) => {
    setReasonModal({
      isOpen: true,
      title: `Request Additional Documentation: ${cln.name}`,
      subtitle: 'Specify required certifications or trade licenses.',
      actionType: 'warning',
      action: async (message) => {
        try {
          await adminService.requestClinicInformation(cln.id, message);
          success(`Information request sent to ${cln.name}.`);
          setReasonModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Request failed');
        }
      },
    });
  };

  const handleSuspend = (cln) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: `Suspend Clinic: ${cln.name}`,
      message: `Suspending this clinic pauses doctor appointment scheduling and patient communications.`,
      action: async () => {
        try {
          await adminService.suspendClinic(cln.id, 'Administrative review suspension');
          warning(`Clinic ${cln.name} suspended.`);
          setConfirmModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Suspension failed');
        }
      },
    });
  };

  const handleReactivate = (cln) => {
    setConfirmModal({
      isOpen: true,
      type: 'info',
      title: `Reactivate Clinic: ${cln.name}`,
      message: `Restore active account access for clinic doctors and manager.`,
      action: async () => {
        try {
          await adminService.reactivateClinic(cln.id);
          success(`Clinic ${cln.name} restored to Active.`);
          setConfirmModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Reactivation failed');
        }
      },
    });
  };

  const handleExportCSV = () => {
    if (clinics.length === 0) return;
    const headers = ['Registration ID', 'Clinic Name', 'Category', 'City', 'State', 'Email', 'Doctors', 'Verification Status', 'Account Status', 'Registered Date'];
    const rows = clinics.map((c) => [
      c.regId,
      `"${c.name}"`,
      `"${c.category || ''}"`,
      c.city,
      c.state,
      c.email,
      c.doctorsCount || 0,
      c.verificationStatus,
      c.accountStatus,
      new Date(c.registeredAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CURO_Clinics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported clinic directory to CSV.');
  };

  const totalPages = Math.ceil(clinics.length / pageSize) || 1;
  const paginatedClinics = clinics.slice((page - 1) * pageSize, page * pageSize);
  const uniqueStates = Array.from(new Set(clinics.map((c) => c.state))).filter(Boolean);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Private Clinic Directory & Operations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage specialty polyclinics, outpatient diagnostic centers, and verified practitioner establishments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setApprovalModal({ isOpen: true, facility: clinics[0] || null })}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            Assign Credentials
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by clinic name, specialization, city, or email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>

          <div>
            <select
              value={verificationStatus}
              onChange={(e) => {
                setVerificationStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            >
              <option value="all">All Verification Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="needs_more_information">Needs More Info</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <select
              value={accountStatus}
              onChange={(e) => {
                setAccountStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="pending_activation">Pending Activation</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            >
              <option value="all">All Regions</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {clinics.length}
            </span>{' '}
            clinics found
            {(search || verificationStatus !== 'all' || accountStatus !== 'all' || stateFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold ml-2 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="newest">Newest Registered</option>
              <option value="name">Clinic Name (A-Z)</option>
              <option value="doctors">Doctor Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clinic List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : paginatedClinics.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No matching clinic establishments
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No clinics match the current filter parameters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Clinic Establishment</th>
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Practitioners</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedClinics.map((cln) => (
                  <tr
                    key={cln.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => handleOpenDrawer(cln)}
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-900">
                          {cln.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {cln.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {cln.category || cln.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {cln.regId}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-white">{cln.city}</span>,{' '}
                      <span className="text-slate-400 text-[11px]">{cln.state}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {cln.doctorsCount || 1}
                      </span>{' '}
                      Doctors
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={cln.verificationStatus} type="application" />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={cln.accountStatus} type="account" />
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(cln.registeredAt).toLocaleDateString()}
                    </td>

                    <td
                      className="py-3 px-4 sm:px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(cln)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setApprovalModal({ isOpen: true, facility: cln })}
                          className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition"
                          title={cln.verificationStatus === 'approved' ? 'Update Credentials / Password' : 'Approve & Assign Login'}
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {cln.accountStatus === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleSuspend(cln)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Suspend Clinic"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}

                        {cln.accountStatus === 'suspended' && (
                          <button
                            type="button"
                            onClick={() => handleReactivate(cln)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            title="Reactivate Clinic"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, clinics.length)} of {clinics.length} establishments
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clinic Details Side Drawer */}
      {selectedClinic && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fadeIn"
          onClick={() => setSelectedClinic(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                  {selectedClinic.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedClinic.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-slate-500">{selectedClinic.regId}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                      {selectedClinic.category}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedClinic(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerLoading ? (
                <DrawerSkeleton />
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Verification
                      </span>
                      <StatusBadge status={selectedClinic.verificationStatus} type="application" />
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Account Status
                      </span>
                      <StatusBadge status={selectedClinic.accountStatus} type="account" />
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Doctors
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedClinic.doctorsCount || 2} Staff
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Consult Rooms
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedClinic.consultationRooms || 2} Rooms
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Clinic Address & Lead Practitioner
                    </h4>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {selectedClinic.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {selectedClinic.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {selectedClinic.phone}
                        </span>
                      </div>
                      {selectedClinic.authorizedRepresentative && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                          <span className="text-[11px] text-slate-400 block">Lead Physician / Proprietor:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedClinic.authorizedRepresentative.name} (
                            {selectedClinic.authorizedRepresentative.designation})
                          </span>
                          <span className="text-slate-500 block text-[11px]">
                            {selectedClinic.authorizedRepresentative.email} •{' '}
                            {selectedClinic.authorizedRepresentative.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Submitted Licenses & Certificates ({selectedClinic.documents?.length || 0})</span>
                      <span className="text-[10px] text-teal-600 font-normal">Click to preview</span>
                    </h4>
                    <div className="space-y-2">
                      {(selectedClinic.documents || []).map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600">
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {doc.size} • Uploaded {doc.uploadDate}
                              </p>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Clinic Credentials Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Clinic Administrator Credentials
                      </h4>
                      <button
                        type="button"
                        onClick={() => setApprovalModal({ isOpen: true, facility: selectedClinic })}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {selectedClinic.verificationStatus === 'approved' ? 'Update / Assign Password' : 'Approve & Assign Login'}
                      </button>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Assigned Role</span>
                        <span className="font-bold text-teal-700 dark:text-teal-300">Clinic Manager / Clinic</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Specific Dashboard</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[11px]">/clinic</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[11px]">Login Email / User ID</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {selectedClinic.authorizedRepresentative?.email || selectedClinic.email || 'None assigned'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Access Mode:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Direct Manual Login (No Invitation Link Needed)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Clinic History
                    </h4>
                    <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-3 py-1">
                      {(selectedClinic.timeline || []).map((tl, i) => (
                        <div key={i} className="relative pl-4 text-xs">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-teal-600"></div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {tl.event}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(tl.date).toLocaleDateString()} • Actor: {tl.actor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Reg: {selectedClinic.regId}
              </span>

              <div className="flex items-center gap-2">
                {selectedClinic.verificationStatus !== 'approved' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedClinic)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestInfo(selectedClinic)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Request Info
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedClinic)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Approve Clinic
                    </button>
                  </>
                )}

                {selectedClinic.verificationStatus === 'approved' && (
                  <>
                    {selectedClinic.accountStatus === 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleSuspend(selectedClinic)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Suspend Clinic
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReactivate(selectedClinic)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Reactivate Clinic
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Modals */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
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
          loadClinics();
        }}
        facility={approvalModal.facility}
        facilityType="clinic"
        onApprove={async ({ notes, assignEmail, assignPassword }) => {
          const res = await adminService.approveClinic(approvalModal.facility.id, notes, {
            assignEmail,
            assignPassword,
          });
          success(`Approved ${approvalModal.facility.name}! Credentials assigned.`);
          loadClinics();
          if (selectedClinic?.id === approvalModal.facility.id) {
            setSelectedClinic((prev) => ({
              ...prev,
              verificationStatus: 'approved',
              accountStatus: 'active',
              authorizedRepresentative: {
                ...prev?.authorizedRepresentative,
                email: assignEmail,
              },
            }));
          }
          return res;
        }}
      />
    </div>
  );
}
