import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  UserCheck,
  Mail,
  Building2,
  Clock,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { TableSkeleton, DrawerSkeleton } from '../../components/common/SkeletonLoader';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function UserManagement() {
  const [searchParams] = useSearchParams();
  const { success, warning, error: toastError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Selected User Drawer
  const [selectedUser, setSelectedUser] = useState(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    action: null,
  });

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers({
        search,
        role: roleFilter,
        accountStatus: statusFilter,
      });
      setUsers(data);

      if (selectedUser) {
        const fresh = data.find((u) => u.id === selectedUser.id);
        if (fresh) setSelectedUser(fresh);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    window.addEventListener(DATA_CHANGE_EVENT, loadUsers);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadUsers);
  }, [search, roleFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  // Actions
  const handleToggleSuspend = (user) => {
    if (user.role === 'super_admin') {
      toastError('Platform Super Admin cannot be suspended or locked.');
      return;
    }

    const isCurrentlySuspended = user.accountStatus === 'suspended';
    const nextStatus = isCurrentlySuspended ? 'active' : 'suspended';

    setConfirmModal({
      isOpen: true,
      type: isCurrentlySuspended ? 'info' : 'danger',
      title: `${isCurrentlySuspended ? 'Reactivate' : 'Suspend'} Account: ${user.name}`,
      message: isCurrentlySuspended
        ? `Re-enabling this account will restore immediate portal access for ${user.email}.`
        : `Suspending this account will revoke current active sessions and deny logins across the platform for ${user.email}.`,
      action: async () => {
        try {
          await adminService.updateAccountStatus(user.id, nextStatus, 'Super Admin discretionary status update');
          if (nextStatus === 'suspended') {
            warning(`Suspended account for ${user.name}.`);
          } else {
            success(`Reactivated account for ${user.name}.`);
          }
          setConfirmModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Operation failed');
        }
      },
    });
  };

  const handleToggleDeactivate = (user) => {
    if (user.role === 'super_admin') {
      toastError('Platform Super Admin cannot be deactivated.');
      return;
    }

    const isInactive = user.accountStatus === 'inactive';
    const nextStatus = isInactive ? 'active' : 'inactive';

    setConfirmModal({
      isOpen: true,
      type: isInactive ? 'info' : 'warning',
      title: `${isInactive ? 'Activate' : 'Deactivate'} Account: ${user.name}`,
      message: `Change user account status to "${nextStatus}"?`,
      action: async () => {
        try {
          await adminService.updateAccountStatus(user.id, nextStatus, 'Manual account state toggle');
          success(`Account state set to ${nextStatus}.`);
          setConfirmModal({ isOpen: false });
        } catch (err) {
          toastError(err.message || 'Operation failed');
        }
      },
    });
  };

  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Facility Name', 'Department', 'Status', 'Last Login', 'Created Date'];
    const rows = users.map((u) => [
      u.id,
      `"${u.name}"`,
      u.email,
      u.role,
      `"${u.facilityName || 'N/A'}"`,
      `"${u.department || 'N/A'}"`,
      u.accountStatus,
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'N/A',
      new Date(u.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CURO_Accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported platform accounts ledger to CSV.');
  };

  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Facility Accounts & Governance Administration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administer platform authority and onboarded facility manager accounts. Individual clinician and patient identities are strictly partitioned and shielded.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Accounts CSV
        </button>
      </div>

      {/* Privacy Partitioning Notice */}
      <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <strong>HIPAA & DISHA Privacy Partitioning Notice:</strong> Super Admin access is architecturally restricted to governance accounts (Super Admin, Hospital Managers, Clinic Managers, Department Managers). Individual patient records, consultation notes, and doctor medical credentials exist solely in isolated facility EHR databases and cannot be retrieved or browsed from this platform administration panel.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by manager name, email, facility, or department..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">All Administrative Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="hospital_manager">Hospital Manager</option>
              <option value="department_manager">Department Manager</option>
              <option value="clinic_manager">Clinic Manager</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
              <option value="pending_activation">Pending Activation</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {users.length}
            </span>{' '}
            identities registered
            {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-semibold ml-2 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset filters
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            System Constraint: Exactly 1 Super Administrator Account
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : paginatedUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No matching user accounts
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No user records match the specified search or role filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">User Name</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Associated Facility</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => setSelectedUser(u)}
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={u.role} type="role" />
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                      {u.facilityName || 'Platform General'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {u.department || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={u.accountStatus} type="account" />
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>

                    <td
                      className="py-3 px-4 sm:px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View Account Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {u.role !== 'super_admin' && (
                          <>
                            {u.accountStatus === 'suspended' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleSuspend(u)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                                title="Reactivate Account"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleSuspend(u)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                title="Suspend Account"
                              >
                                <ShieldAlert className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, users.length)} of {users.length} user records
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

      {/* User Details Side Drawer */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fadeIn"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sky-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                  {selectedUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Account Status Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Account Status
                  </span>
                  <StatusBadge status={selectedUser.accountStatus} type="account" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Assigned Role
                  </span>
                  <StatusBadge status={selectedUser.role} type="role" />
                </div>
              </div>

              {/* Facility & Department Assignment */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Affiliation & Clinical Unit
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Facility:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedUser.facilityName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Facility Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-white uppercase">
                      {selectedUser.facilityType || 'Platform'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Department:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedUser.department || 'Not Assigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Direct Contact:</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">
                      {selectedUser.phone || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Access Timestamps */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Access History & Security Credentials
                </h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Created:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Active Session:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {selectedUser.lastLogin
                        ? new Date(selectedUser.lastLogin).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Multi-Factor Authentication (2FA):</span>
                    <span className="text-emerald-600 font-semibold">Enforced via Policy</span>
                  </div>
                </div>
              </div>

              {selectedUser.role === 'super_admin' && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-[11px] leading-relaxed">
                  <strong>Protected System Administrator:</strong> This account holds the single platform-level governance authority and cannot be suspended or demoted.
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">ID: {selectedUser.id}</span>

              {selectedUser.role !== 'super_admin' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleDeactivate(selectedUser)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {selectedUser.accountStatus === 'inactive' ? 'Set Active' : 'Deactivate'}
                  </button>

                  {selectedUser.accountStatus === 'suspended' ? (
                    <button
                      type="button"
                      onClick={() => handleToggleSuspend(selectedUser)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Reactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleSuspend(selectedUser)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Suspend
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.action}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}
