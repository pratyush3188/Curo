import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
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
  ChevronDown,
  X,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { ReasonModal } from '../../components/common/ReasonModal';
import { DocumentPreviewModal } from '../../components/common/DocumentPreviewModal';
import { InviteManagerModal } from '../../components/common/InviteManagerModal';
import { TableSkeleton, DrawerSkeleton } from '../../components/common/SkeletonLoader';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function HospitalManagement() {
  const [searchParams] = useSearchParams();
  const { success, error: toastError, warning } = useToast();

  const [hospitals, setHospitals] = useState([]);
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

  // Selected Hospital Drawer
  const [selectedHospital, setSelectedHospital] = useState(null);
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
  const [inviteModal, setInviteModal] = useState({
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
      if (selectedHospital?.id) loadFacilityInvitations(selectedHospital.id);
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
          if (selectedHospital?.id) loadFacilityInvitations(selectedHospital.id);
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
      success(`Simulated manager activation successful! Account created for ${res.user.name} and facility activated.`);
      loadHospitals();
      if (selectedHospital?.id) loadFacilityInvitations(selectedHospital.id);
    } catch (err) {
      toastError(err.message || 'Failed to simulate activation');
    }
  };

  const loadHospitals = async () => {
    try {
      const data = await adminService.getHospitals({
        search,
        verificationStatus,
        accountStatus,
        state: stateFilter,
        sortBy,
      });
      setHospitals(data);

      // If URL had review param or drawer is open, keep selected record fresh
      const reviewId = searchParams.get('id');
      if (reviewId) {
        const found = data.find((h) => h.id === reviewId);
        if (found) setSelectedHospital(found);
      } else if (selectedHospital) {
        const fresh = data.find((h) => h.id === selectedHospital.id);
        if (fresh) setSelectedHospital(fresh);
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
    window.addEventListener(DATA_CHANGE_EVENT, loadHospitals);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadHospitals);
  }, [search, verificationStatus, accountStatus, stateFilter, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setVerificationStatus('all');
    setAccountStatus('all');
    setStateFilter('all');
    setSortBy('newest');
    setPage(1);
  };

  const handleOpenDrawer = async (hospital) => {
    setDrawerLoading(true);
    setSelectedHospital(hospital);
    loadFacilityInvitations(hospital.id);
    try {
      const full = await adminService.getHospitalById(hospital.id);
      setSelectedHospital(full);
      setReviewNoteInput(full.reviewNotes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Actions
  const handleApprove = (hosp) => {
    setConfirmModal({
      isOpen: true,
      type: 'info',
      title: 'Approve Hospital Application (Demo)',
      message: `Are you sure you want to approve "${hosp.name}"? This updates the verification state to Approved and allows initiating the hospital manager onboarding invitation.`,
      action: async () => {
        try {
          await adminService.approveHospital(hosp.id, reviewNoteInput);
          success(`Approved ${hosp.name} in demo verification queue.`);
          setConfirmModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Approval failed');
        }
      },
    });
  };

  const handleReject = (hosp) => {
    setReasonModal({
      isOpen: true,
      title: `Reject Application: ${hosp.name}`,
      subtitle: 'A mandatory rejection reason is required for compliance logging.',
      actionType: 'danger',
      action: async (reason) => {
        try {
          await adminService.rejectHospital(hosp.id, reason);
          warning(`Rejected application for ${hosp.name}.`);
          setReasonModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Rejection failed');
        }
      },
    });
  };

  const handleRequestInfo = (hosp) => {
    setReasonModal({
      isOpen: true,
      title: `Request Additional Information: ${hosp.name}`,
      subtitle: 'Provide specific details regarding the documentation or certificates required.',
      actionType: 'warning',
      action: async (message) => {
        try {
          await adminService.requestHospitalInformation(hosp.id, message);
          success(`Information request sent to ${hosp.name}.`);
          setReasonModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Request failed');
        }
      },
    });
  };

  const handleSuspend = (hosp) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: `Suspend Facility: ${hosp.name}`,
      message: `Suspending this facility will pause doctor logins, department routing, and EHR integrations for this hospital. This action is logged in the system audit trail.`,
      action: async () => {
        try {
          await adminService.suspendHospital(hosp.id, 'Routine administrative compliance suspension');
          warning(`Hospital ${hosp.name} has been suspended.`);
          setConfirmModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Suspension failed');
        }
      },
    });
  };

  const handleReactivate = (hosp) => {
    setConfirmModal({
      isOpen: true,
      type: 'info',
      title: `Reactivate Facility: ${hosp.name}`,
      message: `Restore operational status and allow hospital manager and doctors to resume access.`,
      action: async () => {
        try {
          await adminService.reactivateHospital(hosp.id);
          success(`Hospital ${hosp.name} restored to Active.`);
          setConfirmModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Reactivation failed');
        }
      },
    });
  };

  const handleExportCSV = () => {
    if (hospitals.length === 0) return;
    const headers = ['Registration ID', 'Hospital Name', 'Type', 'City', 'State', 'Email', 'Departments', 'Verification Status', 'Account Status', 'Registered Date'];
    const rows = hospitals.map((h) => [
      h.regId,
      `"${h.name}"`,
      `"${h.type}"`,
      h.city,
      h.state,
      h.email,
      h.departmentsCount,
      h.verificationStatus,
      h.accountStatus,
      new Date(h.registeredAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CURO_Hospitals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported hospital registry to CSV.');
  };

  // Pagination slice
  const totalPages = Math.ceil(hospitals.length / pageSize) || 1;
  const paginatedHospitals = hospitals.slice((page - 1) * pageSize, page * pageSize);

  // Unique states for filter
  const uniqueStates = Array.from(new Set(hospitals.map((h) => h.state))).filter(Boolean);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Hospital Registry & Governance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Oversee multi-specialty medical centers, review regulatory accreditations, and control account lifecycles.
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
            onClick={() => setInviteModal({ isOpen: true, facility: null })}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Invite Manager
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by hospital name, ID, city, or email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          {/* Verification Status Filter */}
          <div>
            <select
              value={verificationStatus}
              onChange={(e) => {
                setVerificationStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">All Verification Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="needs_more_information">Needs More Info</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              value={accountStatus}
              onChange={(e) => {
                setAccountStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="pending_activation">Pending Activation</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* State / Location Filter */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">All Regions / States</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Badges & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {hospitals.length}
            </span>{' '}
            hospitals found
            {(search || verificationStatus !== 'all' || accountStatus !== 'all' || stateFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold ml-2 cursor-pointer"
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
              <option value="name">Hospital Name (A-Z)</option>
              <option value="departments">Most Departments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hospital List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : paginatedHospitals.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No matching hospital facilities
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any hospitals matching your current search or filter criteria.
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
                  <th className="py-3.5 px-4 sm:px-6">Hospital Facility</th>
                  <th className="py-3.5 px-4">Registration ID</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Departments</th>
                  <th className="py-3.5 px-4">Verification</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Date Registered</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedHospitals.map((hosp) => (
                  <tr
                    key={hosp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => handleOpenDrawer(hosp)}
                  >
                    {/* Facility Name & Avatar */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-900">
                          {hosp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {hosp.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{hosp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Registration ID */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {hosp.regId}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-white">{hosp.city}</span>,{' '}
                      <span className="text-slate-400 text-[11px]">{hosp.state}</span>
                    </td>

                    {/* Departments */}
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {hosp.departmentsCount || hosp.departments?.length || 0}
                      </span>{' '}
                      Depts
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={hosp.verificationStatus} type="application" />
                    </td>

                    {/* Account Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={hosp.accountStatus} type="account" />
                    </td>

                    {/* Registered Date */}
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(hosp.registeredAt).toLocaleDateString()}
                    </td>

                    {/* Row Actions */}
                    <td
                      className="py-3 px-4 sm:px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(hosp)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View Details & Documents"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {hosp.verificationStatus === 'approved' && !hosp.managerAccount && (
                          <button
                            type="button"
                            onClick={() => setInviteModal({ isOpen: true, facility: hosp })}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            title="Invite Hospital Manager"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}

                        {hosp.accountStatus === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleSuspend(hosp)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Suspend Hospital Account"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}

                        {hosp.accountStatus === 'suspended' && (
                          <button
                            type="button"
                            onClick={() => handleReactivate(hosp)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            title="Reactivate Hospital Account"
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
            {Math.min(page * pageSize, hospitals.length)} of {hospitals.length} facilities
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

      {/* Hospital Details Side Drawer */}
      {selectedHospital && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fadeIn"
          onClick={() => setSelectedHospital(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                  {selectedHospital.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedHospital.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-slate-500">{selectedHospital.regId}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">{selectedHospital.type}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedHospital(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerLoading ? (
                <DrawerSkeleton />
              ) : (
                <>
                  {/* Status & Key Metrics Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Verification
                      </span>
                      <StatusBadge status={selectedHospital.verificationStatus} type="application" />
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Account Status
                      </span>
                      <StatusBadge status={selectedHospital.accountStatus} type="account" />
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Bed Capacity
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedHospital.bedCapacity || 350} Beds
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        ICU Units
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedHospital.icuBeds || 45} ICU
                      </span>
                    </div>
                  </div>

                  {/* Contact & Representative Info */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Facility & Representative Coordinates
                    </h4>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {selectedHospital.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {selectedHospital.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {selectedHospital.phone}
                        </span>
                      </div>
                      {selectedHospital.authorizedRepresentative && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                          <span className="text-[11px] text-slate-400 block">Authorized Medical Officer:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedHospital.authorizedRepresentative.name} (
                            {selectedHospital.authorizedRepresentative.designation})
                          </span>
                          <span className="text-slate-500 block text-[11px]">
                            {selectedHospital.authorizedRepresentative.email} •{' '}
                            {selectedHospital.authorizedRepresentative.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Departments List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Approved Clinical Departments ({selectedHospital.departments?.length || 0})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedHospital.departments || []).map((dep, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verification Documents */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Submitted Regulatory Documents ({selectedHospital.documents?.length || 0})</span>
                      <span className="text-[10px] text-sky-600 font-normal">Click to preview document</span>
                    </h4>

                    <div className="space-y-2">
                      {(selectedHospital.documents || []).map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 transition cursor-pointer flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600">
                                {doc.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {doc.size} • Uploaded {doc.uploadDate} • Status: {doc.status}
                              </p>
                            </div>
                          </div>
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assigned Hospital Manager & Invitation Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Facility Manager & Onboarding Status
                      </h4>
                      {selectedHospital.verificationStatus === 'approved' && !selectedHospital.managerAccount && (
                        <button
                          type="button"
                          onClick={() => setInviteModal({ isOpen: true, facility: selectedHospital })}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Invite Manager
                        </button>
                      )}
                    </div>

                    {/* Active Manager Account Card */}
                    {selectedHospital.managerAccount && (
                      <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                            HM
                          </div>
                          <div>
                            <p className="font-bold text-emerald-950 dark:text-emerald-100">
                              {selectedHospital.managerAccount.name}
                            </p>
                            <p className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                              {selectedHospital.managerAccount.email} • Assigned Hospital Manager
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={selectedHospital.managerAccount.status} type="account" />
                      </div>
                    )}

                    {/* Contextual Facility Invitations */}
                    {facilityInvitations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Invitations ({facilityInvitations.length})
                        </p>
                        {facilityInvitations.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                  {inv.inviteeName}
                                </p>
                                <p className="text-slate-500 text-[11px]">{inv.email}</p>
                              </div>
                              <StatusBadge status={inv.status} type="invitation" />
                            </div>

                            <div className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Sent: {new Date(inv.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
                            </div>

                            {/* Simulated link and action controls */}
                            <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyLink(inv)}
                                className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-600 cursor-pointer transition"
                              >
                                {copiedInvId === inv.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>

                              <div className="flex items-center gap-1.5">
                                {inv.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSimulateActivation(inv)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                                      title="Simulate manager opening link and setting credentials"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      Simulate Activation
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleResendInvitation(inv)}
                                      className="p-1 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                      title="Resend invitation email"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeInvitation(inv)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                      title="Revoke invitation"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No manager and no invitations yet */}
                    {!selectedHospital.managerAccount && facilityInvitations.length === 0 && (
                      <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-amber-900 dark:text-amber-200">
                            No Manager Account Active
                          </p>
                          <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                            {selectedHospital.verificationStatus === 'approved'
                              ? 'Facility approved. Ready to invite hospital manager.'
                              : 'Manager accounts can be invited once facility verification is approved.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Application Timeline History */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Application & Audit Timeline
                    </h4>
                    <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-2 space-y-4 py-1">
                      {(selectedHospital.timeline || []).map((tl, i) => (
                        <div key={i} className="relative pl-4 text-xs">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-sky-600"></div>
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

            {/* Drawer Sticky Footer Action Bar */}
            <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Reg: {selectedHospital.regId} • Updated:{' '}
                {new Date(selectedHospital.updatedAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                {selectedHospital.verificationStatus !== 'approved' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleReject(selectedHospital)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestInfo(selectedHospital)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Request Info
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedHospital)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      Approve Hospital
                    </button>
                  </>
                )}

                {selectedHospital.verificationStatus === 'approved' && (
                  <>
                    {selectedHospital.accountStatus === 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleSuspend(selectedHospital)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Suspend Facility
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReactivate(selectedHospital)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Reactivate Facility
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

      <InviteManagerModal
        isOpen={inviteModal.isOpen}
        onClose={() => setInviteModal({ isOpen: false, facility: null })}
        initialFacility={inviteModal.facility}
        onSuccess={() => loadHospitals()}
      />
    </div>
  );
}
