import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  FileCode,
} from 'lucide-react';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function AuditLogs() {
  const { success } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected Log Drawer
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    try {
      const data = await adminService.getAuditLogs({
        search,
        action: actionFilter,
        targetType: targetTypeFilter,
        outcome: outcomeFilter,
      });
      setLogs(data);

      if (selectedLog) {
        const fresh = data.find((l) => l.id === selectedLog.id);
        if (fresh) setSelectedLog(fresh);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    window.addEventListener(DATA_CHANGE_EVENT, loadLogs);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadLogs);
  }, [search, actionFilter, targetTypeFilter, outcomeFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('all');
    setTargetTypeFilter('all');
    setOutcomeFilter('all');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Action', 'Target Type', 'Target ID', 'Target Name', 'Outcome', 'Details'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.actor}"`,
      l.action,
      l.targetType,
      l.targetId,
      `"${l.targetName}"`,
      l.outcome,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CURO_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported audit trail to CSV.');
  };

  const totalPages = Math.ceil(logs.length / pageSize) || 1;
  const paginatedLogs = logs.slice((page - 1) * pageSize, page * pageSize);

  // Extract unique actions for dropdown
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action))).filter(Boolean);
  const uniqueTargetTypes = Array.from(new Set(logs.map((l) => l.targetType))).filter(Boolean);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Compliance & System Audit Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable append-only record tracking all facility approvals, rejections, manager invitations, and administrative overrides.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Audit Ledger CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search audit trail..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">All Action Types</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">All Target Types</option>
              {uniqueTargetTypes.map((tt) => (
                <option key={tt} value={tt}>
                  {tt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={outcomeFilter}
              onChange={(e) => {
                setOutcomeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="warning">Warning / Alert</option>
              <option value="info">Informational</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {logs.length}
            </span>{' '}
            audit entries recorded
            {(search || actionFilter !== 'all' || targetTypeFilter !== 'all' || outcomeFilter !== 'all') && (
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
            Retention: 365 Days • Non-repudiation enabled
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={10} cols={7} />
        ) : paginatedLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No matching audit records
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your query or resetting filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Timestamp (IST)</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Target Type</th>
                  <th className="py-3.5 px-4">Target Name / ID</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedLogs.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => setSelectedLog(l)}
                  >
                    <td className="py-3 px-4 sm:px-6 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                      {l.actor}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {l.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {l.targetType}
                    </td>

                    <td className="py-3 px-4 text-slate-900 dark:text-white font-medium truncate max-w-[180px]">
                      {l.targetName}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          l.outcome === 'success'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : l.outcome === 'warning'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                        }`}
                      >
                        {l.outcome}
                      </span>
                    </td>

                    <td
                      className="py-3 px-4 sm:px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        title="Inspect Log Entry"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
            {Math.min(page * pageSize, logs.length)} of {logs.length} audit records
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

      {/* Audit Detail Modal / Drawer */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Audit Event Payload
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Action:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedLog.action}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actor:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedLog.actor}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Type:</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedLog.targetType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedLog.targetId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Name:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {selectedLog.targetName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outcome:</span>
                  <span className="uppercase font-bold text-emerald-600">
                    {selectedLog.outcome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recorded:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Operation Narrative & Context
                </label>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs leading-relaxed border border-slate-800">
                  {selectedLog.details}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
