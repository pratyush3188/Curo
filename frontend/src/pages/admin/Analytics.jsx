import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Building2,
  Stethoscope,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Users,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function Analytics() {
  const { success } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const loadData = async () => {
    try {
      const data = await adminService.getAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener(DATA_CHANGE_EVENT, loadData);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadData);
  }, [period]);

  const handleExportCSV = () => {
    if (!analytics) return;
    const lines = [
      'Category,Metric,Value',
      `Performance,Total Facilities Registered,${analytics.totalFacilities}`,
      `Performance,Approval Rate,${analytics.approvedRate}%`,
      `Performance,Average Review Turnaround,${analytics.averageReviewDays} Days`,
      `Lifecycle,Active Facilities,${analytics.activeFacilities}`,
      `Lifecycle,Pending Activation Facilities,${analytics.pendingActFacilities}`,
      `Lifecycle,Suspended Facilities,${analytics.suspendedFacilities}`,
      `Lifecycle,Inactive Facilities,${analytics.inactiveFacilities}`,
      ...analytics.statusDistribution.map((s) => `Status Distribution,${s.name},${s.value}`),
      ...analytics.roleDistribution.map((r) => `User Role Distribution,${r.role},${r.count}`),
      ...analytics.geographicDistribution.map((g) => `Geographic Distribution,${g.state},${g.count}`),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CURO_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Exported analytics metrics summary to CSV.');
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6 animate-pulse pb-12">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            Healthcare Ecosystem Analytics & Reporting
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Platform governance intelligence computed directly from the current persistent demo dataset.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none shadow-xs"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time History</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Metrics CSV
          </button>
        </div>
      </div>

      {/* Privacy Partitioning Notice */}
      <div className="p-3.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 flex items-center gap-3 text-xs text-sky-800 dark:text-sky-300">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <strong>Privacy Partitioning Architecture:</strong> Patient and clinician personal records are isolated within individual hospital and clinic EHR modules under HIPAA/DISHA guidelines. The Super Admin console accesses only non-identifiable, platform-wide aggregate counts and demographic telemetry.
        </p>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Facilities Evaluated
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {analytics?.totalFacilities || 0}
            </span>
            <span className="text-xs text-emerald-600 font-bold">+18% growth</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Hospitals and outpatient clinics</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Application Approval Rate
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">
              {analytics?.approvedRate || 0}%
            </span>
            <span className="text-xs text-slate-400">of total queue</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Passed document and license audit</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Review SLA Turnaround
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
              {analytics?.averageReviewDays || 2.4} Days
            </span>
            <span className="text-xs text-emerald-600 font-bold">Within 3-day SLA</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Submission to initial admin decision</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active vs Suspended Ratio
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {analytics?.activeFacilities || 0} / {analytics?.suspendedFacilities || 0}
            </span>
            <span className="text-xs text-slate-400">Active / Paused</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {analytics?.pendingActFacilities || 0} pending manager activation
          </p>
        </div>
      </div>

      {/* Chart Row 1: Monthly Velocity & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding Velocity */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Facility Registrations & Approvals Over Time
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly progression of onboarding and Super Admin approvals
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyData || []}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="approvals"
                  name="Approved Facilities"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="hospitals"
                  name="Hospital Submissions"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fill="#0284c7"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="clinics"
                  name="Clinic Submissions"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill="#0f766e"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Role Distribution */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Platform User Role Composition
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribution across all 6 platform role archetypes
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.roleDistribution || []} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="role" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Registered Accounts" fill="#0284c7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 2: Geographic Distribution & Account Status Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Region Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                Geographic Facility Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registered healthcare units across Indian states and union territories
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {(analytics?.geographicDistribution || []).map((geo) => {
              const pct = Math.round((geo.count / (analytics.totalFacilities || 1)) * 100);
              return (
                <div key={geo.state} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{geo.state}</span>
                    <span className="text-slate-900 dark:text-white">
                      {geo.count} Facilities ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Facility Lifecycle & Activation Health */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Facility Account Activation Status Funnel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Operational readiness state of verified facilities
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase block mb-1">
                Active Facilities
              </span>
              <span className="text-3xl font-extrabold text-emerald-600">
                {analytics?.activeFacilities || 0}
              </span>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-1">
                Manager active, live bookings enabled
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase block mb-1">
                Pending Activation
              </span>
              <span className="text-3xl font-extrabold text-amber-600">
                {analytics?.pendingActFacilities || 0}
              </span>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1">
                Approved, manager invite sent
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase block mb-1">
                Suspended Facilities
              </span>
              <span className="text-3xl font-extrabold text-rose-600">
                {analytics?.suspendedFacilities || 0}
              </span>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-1">
                Under administrative compliance hold
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                Inactive Facilities
              </span>
              <span className="text-3xl font-extrabold text-slate-600 dark:text-slate-400">
                {analytics?.inactiveFacilities || 0}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Rejected or voluntarily closed
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500">
            Note: All statistics dynamically synchronize when facilities are approved, rejected, or activated anywhere in the portal.
          </div>
        </div>
      </div>
    </div>
  );
}
