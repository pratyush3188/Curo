import { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Building2,
  Stethoscope,
  Clock,
  UserPlus,
  BarChart3,
  ShieldCheck,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import api from '../../../api/client';
import Sidebar from '../../../components/hospital/Sidebar';
import TopBar from '../../../components/hospital/TopBar';
import StatCard from '../../../components/hospital/StatCard';
import CreateUserModal from '../../../components/hospital/CreateUserModal';
import AlertsSection from '../../../components/hospital/AlertsSection';
import PatientAdmissionForm from '../../../components/hospital/PatientAdmissionForm';

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [managers, setManagers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, managersRes, alertsRes] = await Promise.all([
        api.get('/hospital/owner/stats'),
        api.get('/hospital/owner/managers'),
        api.get('/hospital/alerts'),
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (managersRes.data?.managers) setManagers(managersRes.data.managers);
      if (alertsRes.data?.alerts) setAlerts(alertsRes.data.alerts);
    } catch (err) {
      console.error('Failed to load owner stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleCreateManager = async (formData) => {
    const res = await api.post('/hospital/owner/create-manager', formData);
    setFeedback(`Department Manager ${formData.name} successfully created!`);
    setTimeout(() => setFeedback(''), 5000);
    fetchData();
    return res.data;
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await api.put(`/hospital/alerts/${alertId}/acknowledge`);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      fetchData();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar
          title="Hospital Owner Portal"
          subtitle="Owner executive overview, clinical throughput & ward leadership orchestration"
          extraAction={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdmissionModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2E5F8A] hover:bg-[#244C6E] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Admit Patient</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E8F0] rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>Create Manager</span>
              </button>
            </div>
          }
        />

        <main className="p-8 space-y-8 flex-1">
          {/* Notification feedback */}
          {feedback && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Top Key Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Admitted Today"
              value={stats?.totalPatientsToday ?? '—'}
              subtitle="All clinical units"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Critical Cases"
              value={stats?.criticalCases ?? '—'}
              subtitle="Requires ICU attention"
              icon={AlertTriangle}
              color={stats?.criticalCases > 0 ? 'red' : 'emerald'}
            />
            <StatCard
              title="Active Wards"
              value={stats?.activeDepartments ?? '—'}
              subtitle="Functional units"
              icon={Building2}
              color="slate"
            />
            <StatCard
              title="Attending Doctors"
              value={stats?.totalDoctors ?? '—'}
              subtitle="On-duty roster"
              icon={Stethoscope}
              color="emerald"
            />
            <StatCard
              title="Ward Managers"
              value={stats?.totalManagers ?? '—'}
              subtitle="Appointed supervisors"
              icon={ShieldCheck}
              color="slate"
            />
            <StatCard
              title="Avg Wait Time"
              value={`${stats?.avgWaitTimeMinutes ?? 0}m`}
              subtitle="Triage to care"
              icon={Clock}
              color="amber"
            />
          </div>

          {/* High-Risk Alerts Section */}
          <div id="alerts">
            <AlertsSection alerts={alerts} onAcknowledge={handleAcknowledgeAlert} loading={loading} />
          </div>

          {/* 1. TOP SECTION: Ward Supervisors & Physician Workload Directory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Managers Directory (1 col) */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ward Supervisors</h3>
                  <p className="text-xs text-slate-500">Appointed Department Managers</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#EBF3FA] text-[#2E5F8A] border border-[#D0E2F2] rounded">
                  {managers.length} Assigned
                </span>
              </div>

              <div className="flex-1 divide-y divide-[#E2E8F0] overflow-y-auto max-h-72">
                {managers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No managers appointed yet.</div>
                ) : (
                  managers.map((mgr) => (
                    <div key={mgr._id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{mgr.name}</div>
                        <div className="text-[11px] text-slate-500">{mgr.email}</div>
                      </div>
                      <span className="px-2.5 py-1 bg-[#EBF3FA] text-[#2E5F8A] border border-[#D0E2F2] rounded text-[11px] font-semibold">
                        {mgr.department}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Doctor Workload & Roster Table (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Physician Clinical Workload</h3>
                  <p className="text-xs text-slate-500">Roster active patients, resolved cases, and department assignment</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#EBF3FA] text-[#2E5F8A] border border-[#D0E2F2] rounded">
                  {(stats?.doctorWorkload || []).length} Doctors
                </span>
              </div>

              <div className="overflow-x-auto flex-1 max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#F8F9FA] z-10">
                    <tr className="border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Physician Name</th>
                      <th className="py-2.5 px-3">Ward</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Active</th>
                      <th className="py-2.5 px-3">Resolved</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {(stats?.doctorWorkload || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No doctors registered yet.
                        </td>
                      </tr>
                    ) : (
                      (stats?.doctorWorkload || []).map((doc) => (
                        <tr key={doc._id} className="hover:bg-[#F8F9FA] transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-700 font-bold shrink-0">
                              {doc.name[3] || 'D'}
                            </div>
                            <span className="truncate">{doc.name}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">{doc.department}</td>
                          <td className="py-2.5 px-3 text-slate-500 truncate">{doc.email}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-mono">
                              {doc.activePatients}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-mono">
                              {doc.resolvedPatients}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              On Roster
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. SECONDARY SECTION: Department Throughput & Volume Chart */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ward Volume Breakdown</h3>
                <p className="text-xs text-slate-500">Active and treated patients admitted per department</p>
              </div>
              <BarChart3 className="w-4 h-4 text-[#2E5F8A]" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.departmentComparison || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  />
                  <Bar dataKey="patientCount" name="Patients" fill="#2E5F8A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>

      {/* Create Manager Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateManager}
        role="manager"
      />

      {/* Patient Admission & ML Triage Modal */}
      <PatientAdmissionForm
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        onPatientAdmitted={(newPatient) => {
          setFeedback(`Patient ${newPatient.name} admitted successfully with ${newPatient.triageLevel.toUpperCase()} triage priority!`);
          fetchData();
        }}
      />
    </div>
  );
}
