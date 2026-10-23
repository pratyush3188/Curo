import { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Stethoscope,
  Clock,
  UserPlus,
  CheckCircle2,
  Building,
} from 'lucide-react';
import api from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../../components/hospital/Sidebar';
import TopBar from '../../../components/hospital/TopBar';
import StatCard from '../../../components/hospital/StatCard';
import PatientQueueTable from '../../../components/hospital/PatientQueueTable';
import PatientDetailPanel from '../../../components/hospital/PatientDetailPanel';
import CreateUserModal from '../../../components/hospital/CreateUserModal';
import AlertsSection from '../../../components/hospital/AlertsSection';
import PatientAdmissionForm from '../../../components/hospital/PatientAdmissionForm';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const departmentName = user?.department || 'Emergency';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, patientsRes, alertsRes] = await Promise.all([
        api.get('/hospital/manager/department-stats'),
        api.get('/hospital/manager/patients'),
        api.get('/hospital/alerts'),
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (patientsRes.data?.patients) setPatients(patientsRes.data.patients);
      if (alertsRes.data?.alerts) setAlerts(alertsRes.data.alerts);
    } catch (err) {
      console.error('Failed to load manager department data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleCreateDoctor = async (formData) => {
    const res = await api.post('/hospital/manager/create-doctor', formData);
    setFeedback(`Doctor ${formData.name} successfully registered to ${departmentName}!`);
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
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar
          title={`${departmentName} Ward Operations`}
          subtitle={`Department supervision, triage queue management & physician performance`}
          extraAction={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdmissionModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2E5F8A] hover:bg-[#244C6E] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>New Patient</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E8F0] rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>Create Doctor</span>
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

          {/* Department Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Supervised Ward"
              value={departmentName}
              subtitle="Current Department"
              icon={Building}
              color="blue"
            />
            <StatCard
              title="Patients Today"
              value={stats?.patientsToday ?? '—'}
              subtitle="New admissions"
              icon={Users}
              color="slate"
            />
            <StatCard
              title="Resolved Today"
              value={stats?.resolvedToday ?? '—'}
              subtitle="Stabilized/Discharged"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Active Doctors"
              value={stats?.activeDoctorsCount ?? '—'}
              subtitle="Attending on shift"
              icon={Stethoscope}
              color="blue"
            />
            <StatCard
              title="Pending in Queue"
              value={stats?.pendingCases ?? '—'}
              subtitle="Awaiting physician"
              icon={Clock}
              color={stats?.pendingCases > 5 ? 'amber' : 'slate'}
            />
          </div>

          {/* Department High-Risk Alerts */}
          <div id="alerts">
            <AlertsSection alerts={alerts} onAcknowledge={handleAcknowledgeAlert} loading={loading} />
          </div>

          {/* Doctor Performance Table in this Department (Displayed on Top) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{departmentName} Physician Roster & Workload</h3>
                <p className="text-xs text-slate-500">Attending ward doctors, case allocations, and turnaround throughput</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-[#EBF3FA] text-[#2E5F8A] border border-[#D0E2F2] rounded-lg">
                {(stats?.doctorPerformance || []).length} Doctors On Roster
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Physician Name</th>
                    <th className="py-3 px-4">Staff Contact</th>
                    <th className="py-3 px-4">Total Cases Assigned</th>
                    <th className="py-3 px-4">Resolved Cases</th>
                    <th className="py-3 px-4">Avg Resolve Turnaround</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {(stats?.doctorPerformance || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No doctors assigned to this ward yet. Use &ldquo;Create Doctor&rdquo; above.
                      </td>
                    </tr>
                  ) : (
                    (stats?.doctorPerformance || []).map((doc) => (
                      <tr key={doc._id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#EBF3FA] text-[#2E5F8A] flex items-center justify-center text-[10px] font-bold">
                            {doc.name[3] || 'D'}
                          </div>
                          <span>{doc.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{doc.email}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{doc.assignedPatients}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{doc.resolvedPatients}</td>
                        <td className="py-3 px-4 text-slate-700 font-mono">
                          ~{doc.avgResolveTimeMinutes || 30} mins
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Patient Queue Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ward Patient Queue</h3>
                <p className="text-xs text-slate-500">Live clinical triage priority, bed status and wait times</p>
              </div>
              <span className="text-xs font-bold text-[#2E5F8A]">{patients.length} Total Patients</span>
            </div>

            <PatientQueueTable
              patients={patients}
              onSelectPatient={(p) => setSelectedPatient(p)}
              selectedPatientId={selectedPatient?._id}
              showDoctorColumn={true}
              emptyMessage={`No patients currently in the ${departmentName} queue.`}
            />
          </div>
        </main>
      </div>

      {/* Slide-in Patient Detail Panel */}
      {selectedPatient && (
        <PatientDetailPanel
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          isDoctorView={false}
        />
      )}

      {/* Create Doctor Modal */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateDoctor}
        role="doctor"
        defaultDepartment={departmentName}
      />

      {/* Patient Admission & ML Triage Modal */}
      <PatientAdmissionForm
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        defaultDepartment={departmentName}
        onPatientAdmitted={(newPatient) => {
          setFeedback(`Patient ${newPatient.name} admitted to ${departmentName} with ${newPatient.triageLevel.toUpperCase()} priority!`);
          fetchData();
        }}
      />
    </div>
  );
}
