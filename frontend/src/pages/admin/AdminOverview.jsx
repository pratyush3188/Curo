import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Stethoscope,
  ClipboardCheck,
  FileCheck2,
  UserCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Activity,
  Cpu,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { InviteManagerModal } from '../../components/common/InviteManagerModal';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { adminService, DATA_CHANGE_EVENT } from '../../services/adminService';

export default function AdminOverview() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteInitialFacility, setInviteInitialFacility] = useState(null);

  const loadData = async () => {
    try {
      const [dashStats, analyticsData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAnalytics(timeRange),
      ]);
      setStats(dashStats);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener(DATA_CHANGE_EVENT, loadData);
    return () => window.removeEventListener(DATA_CHANGE_EVENT, loadData);
  }, [timeRange]);

  const handleOpenInvite = (facilityType = 'hospital') => {
    setInviteInitialFacility({ type: facilityType });
    setInviteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
        <CardSkeleton count={4} />
        <CardSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Platform Operational Command Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time verification queue, facility access controls, and AI microservice health.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/hospital-applications')}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            Review Applications ({stats?.pendingHospitalApps + stats?.pendingClinicApps || 0})
          </button>

          <button
            onClick={() => handleOpenInvite('hospital')}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Invite Hospital Manager
          </button>

          <button
            onClick={() => handleOpenInvite('clinic')}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Invite Clinic Manager
          </button>
        </div>
      </div>

      {/* 8 Primary KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ecosystem Metrics & Queue Status
          </h3>
          <span className="text-[11px] text-slate-400">Click any card to inspect filtered records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Hospitals */}
          <StatCard
            title="Total Hospitals"
            value={stats?.totalHospitals || 0}
            icon={Building2}
            trend="+2 this month"
            trendPositive={true}
            href="/admin/hospitals"
            colorScheme="blue"
            subtitle="Registered medical centers"
          />

          {/* Card 2: Verified Hospitals */}
          <StatCard
            title="Verified Hospitals"
            value={stats?.verifiedHospitals || 0}
            icon={CheckCircle2}
            trend={`${Math.round(((stats?.verifiedHospitals || 0) / (stats?.totalHospitals || 1)) * 100)}% verified`}
            trendPositive={true}
            href="/admin/hospitals?status=approved"
            colorScheme="emerald"
            subtitle="NABH / regulatory cleared"
          />

          {/* Card 3: Pending Hospital Apps */}
          <StatCard
            title="Pending Hospital Apps"
            value={stats?.pendingHospitalApps || 0}
            icon={ClipboardCheck}
            badgeText={stats?.pendingHospitalApps > 0 ? 'Action Needed' : 'Queue Clear'}
            href="/admin/hospital-applications"
            colorScheme="amber"
            subtitle="Requires Super Admin review"
          />

          {/* Card 4: Total Private Clinics */}
          <StatCard
            title="Private Clinics"
            value={stats?.totalClinics || 0}
            icon={Stethoscope}
            trend="+3 this month"
            trendPositive={true}
            href="/admin/clinics"
            colorScheme="teal"
            subtitle="Outpatient clinics & polyclinics"
          />

          {/* Card 5: Pending Clinic Apps */}
          <StatCard
            title="Pending Clinic Apps"
            value={stats?.pendingClinicApps || 0}
            icon={FileCheck2}
            badgeText={stats?.pendingClinicApps > 0 ? 'Needs Attention' : 'All Clear'}
            href="/admin/clinic-applications"
            colorScheme="indigo"
            subtitle="Awaiting credential check"
          />

          {/* Card 6: Registered Doctors */}
          <StatCard
            title="Registered Doctors"
            value={stats?.doctorsCount || 0}
            icon={UserCheck}
            trend="+12% active"
            trendPositive={true}
            href="/admin/analytics"
            colorScheme="purple"
            subtitle="Aggregate verified physicians (Privacy Partitioned)"
          />

          {/* Card 7: Registered Patients */}
          <StatCard
            title="Registered Patients"
            value={stats?.patientsCount || 0}
            icon={Users}
            trend="+24% active"
            trendPositive={true}
            href="/admin/analytics"
            colorScheme="blue"
            subtitle="Aggregate AI report portal users (Privacy Partitioned)"
          />

          {/* Card 8: Active Facility Accounts */}
          <StatCard
            title="Active Facility Accounts"
            value={stats?.activeFacilityAccounts || 0}
            icon={ShieldCheck}
            trend="Manager onboarded"
            trendPositive={true}
            href="/admin/users"
            colorScheme="emerald"
            subtitle="Onboarded facility managers"
          />
        </div>
      </div>

      {/* Charts Section: Registration Trends & Application Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trends Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Facility Onboarding Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly cumulative registration progression for Hospitals and Clinics
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {['7d', '30d', 'all'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeRange(t)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase transition cursor-pointer ${
                    timeRange === t
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.monthlyData || []}>
                <defs>
                  <linearGradient id="colorHosp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  dataKey="hospitals"
                  name="Hospitals"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHosp)"
                />
                <Area
                  type="monotone"
                  dataKey="clinics"
                  name="Clinics"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClin)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-600"></span>
              <span>Hospitals Cumulative</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-600"></span>
              <span>Private Clinics Cumulative</span>
            </div>
          </div>
        </div>

        {/* Application Status Donut Chart (1 col) */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Application Review Status
              </h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {analytics?.approvedRate || 0}% Cleared
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution across all registered facilities
            </p>
          </div>

          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.statusDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(analytics?.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {(analytics?.statusDistribution || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  {item.name}:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Applications & System Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications Queue */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Facility Applications
              </h3>
            </div>
            <Link
              to="/admin/hospital-applications"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
            >
              View Full Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(stats?.recentApplications || []).map((app) => (
              <div
                key={`${app.facilityType}-${app.id}`}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {app.name}
                    </p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {app.facilityType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {app.city}, {app.state} • ID: {app.regId}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={app.verificationStatus} type="application" />
                  <button
                    onClick={() =>
                      navigate(
                        app.facilityType === 'hospital'
                          ? `/admin/hospital-applications?review=${app.id}`
                          : `/admin/clinic-applications?review=${app.id}`
                      )
                    }
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Admin Audit Activity Feed */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Admin Operations Feed
              </h3>
            </div>
            <Link
              to="/admin/audit-logs"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
            >
              Full Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(stats?.recentActivities || []).map((act) => (
              <div key={act.id} className="py-2.5 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {act.targetName}
                    </p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {act.details}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400">
                    {act.action.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Microservices & AI Engine Status Section */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Platform Microservices & AI Architecture Status
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  All Systems Nominal
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Core clinical AI pipelines, HIPAA encryption gateways, and FHIR API relays.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            System Clock: 2026-10-23 IST (Simulated)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Service 1 */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200">AI Report Explainer</span>
              <span className="text-emerald-400 font-bold text-[11px]">99.98%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Simplifies multi-page lab/radiology findings into patient-comprehensible explanations.
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-mono">Latency: 142ms • Gemini Engine</div>
          </div>

          {/* Service 2 */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200">Prescription Safety Engine</span>
              <span className="text-emerald-400 font-bold text-[11px]">99.95%</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Evaluates drug-drug interactions, dosage anomalies, and contraindication warnings.
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-mono">Latency: 89ms • Clinical Rules</div>
          </div>

          {/* Service 3 */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200">EHR FHIR Gateway</span>
              <span className="text-emerald-400 font-bold text-[11px]">Healthy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Secure bi-directional bridge syncing facility triage and patient medical records.
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-mono">Protocol: HL7 FHIR R4</div>
          </div>

          {/* Service 4 */}
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-200">Compliance & OCR Pipeline</span>
              <span className="text-emerald-400 font-bold text-[11px]">Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Authenticates uploaded hospital NABH seals, medical licenses, and trade certificates.
            </p>
            <div className="mt-2 text-[10px] text-slate-400 font-mono">OCR Queue: 0 pending</div>
          </div>
        </div>
      </div>

      {/* Invite Manager Modal */}
      <InviteManagerModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        initialFacility={inviteInitialFacility}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
