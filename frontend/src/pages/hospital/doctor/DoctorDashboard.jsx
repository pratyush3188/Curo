import { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Stethoscope,
  CheckCircle2,
  Clock,
  Activity,
  Info,
} from 'lucide-react';
import api from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../../components/hospital/Sidebar';
import TopBar from '../../../components/hospital/TopBar';
import StatCard from '../../../components/hospital/StatCard';
import PatientQueueTable from '../../../components/hospital/PatientQueueTable';
import PatientDetailPanel from '../../../components/hospital/PatientDetailPanel';
import VitalsChart from '../../../components/hospital/VitalsChart';
import PatientAdmissionForm from '../../../components/hospital/PatientAdmissionForm';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, patientsRes] = await Promise.all([
        api.get('/hospital/doctor/stats'),
        api.get('/hospital/doctor/patients'),
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (patientsRes.data?.patients) {
        setPatients(patientsRes.data.patients);
        // Default select first active or critical patient if none selected
        if (!selectedPatient && patientsRes.data.patients.length > 0) {
          const criticalOrActive =
            patientsRes.data.patients.find((p) => p.status !== 'resolved') ||
            patientsRes.data.patients[0];
          setSelectedPatient(criticalOrActive);
        }
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 25000); // 25s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleResolvePatient = async (patientId, notes, outcome) => {
    try {
      const res = await api.put(`/hospital/doctor/patient/${patientId}/resolve`, {
        notes,
        outcome,
      });

      setFeedback(`Patient successfully resolved and clinical notes recorded.`);
      setTimeout(() => setFeedback(''), 5000);

      // Update local state
      setPatients((prev) =>
        prev.map((p) => (p._id === patientId ? { ...p, status: 'resolved', notes, outcome } : p))
      );

      if (selectedPatient?._id === patientId) {
        setSelectedPatient((prev) => ({ ...prev, status: 'resolved', notes, outcome }));
      }

      fetchData();
      return res.data;
    } catch (err) {
      console.error('Failed to resolve patient:', err);
      throw err;
    }
  };

  const activeVitals = selectedPatient?.vitals || {};

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar
          title="Physician Clinical Workstation"
          subtitle={`Attending Doctor: ${user?.name || 'Physician'} • ${user?.department || 'Clinical'} Ward`}
          extraAction={
            <button
              onClick={() => setIsAdmissionModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2E5F8A] hover:bg-[#244C6E] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Admit Patient</span>
            </button>
          }
        />

        <main className="p-8 space-y-8 flex-1">
          {/* Clinical Disclaimer Banner */}
          <div className="p-3.5 bg-[#EBF3FA] border border-[#D0E2F2] rounded-xl flex items-center gap-2.5 text-xs text-[#2E5F8A]">
            <Info className="w-4 h-4 shrink-0 text-[#2E5F8A]" />
            <span>
              <strong>Clinical Governance Disclaimer:</strong> Curo is a hospital workflow coordination and triage decision-support tool. It is <u>not an autonomous clinical diagnosis system</u>. All therapeutic orders and discharge approvals remain the sole responsibility of the registered physician.
            </span>
          </div>

          {/* Feedback notification */}
          {feedback && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Doctor Key Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="My Patients Today"
              value={stats?.myPatientsToday ?? '—'}
              subtitle="Allocated to my shift"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Cases Resolved"
              value={stats?.resolvedCount ?? '—'}
              subtitle="Consultations completed"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Active / In-Treatment"
              value={stats?.activeCount ?? '—'}
              subtitle="Awaiting intervention"
              icon={Clock}
              color={stats?.activeCount > 3 ? 'amber' : 'slate'}
            />
            <StatCard
              title="Critical Monitored"
              value={stats?.criticalCount ?? '—'}
              subtitle="Level-1 priority alerts"
              icon={AlertTriangle}
              color={stats?.criticalCount > 0 ? 'red' : 'emerald'}
            />
          </div>

          {/* Live Physiological Telemetry for Selected Patient */}
          <div id="vitals">
            {selectedPatient ? (
              <VitalsChart
                baseHeartRate={activeVitals.heartRate || 75}
                baseSpo2={activeVitals.spo2 || 98}
                baseTemp={activeVitals.temperature || 37.0}
                baseRespRate={activeVitals.respiratoryRate || 16}
                patientName={`${selectedPatient.name} (${selectedPatient.bedNumber || 'Bed Unassigned'})`}
              />
            ) : (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <div className="text-sm font-semibold text-slate-600">No Patient Selected for Telemetry</div>
                <div className="text-xs">Click any patient in your queue below to link continuous vitals telemetry.</div>
              </div>
            )}
          </div>

          {/* Assigned Patients Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Assigned Patient Queue</h3>
                <p className="text-xs text-slate-500">Select any patient record to review vitals and mark clinical resolution</p>
              </div>
              <span className="text-xs font-bold text-[#2E5F8A]">
                {patients.length} Assigned Case{patients.length !== 1 ? 's' : ''}
              </span>
            </div>

            <PatientQueueTable
              patients={patients}
              onSelectPatient={(p) => setSelectedPatient(p)}
              selectedPatientId={selectedPatient?._id}
              showDoctorColumn={false}
              emptyMessage="You have no patients currently allocated in your active queue."
            />
          </div>
        </main>
      </div>

      {/* Slide-in Patient Detail & Resolution Panel */}
      {selectedPatient && (
        <PatientDetailPanel
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onResolve={handleResolvePatient}
          isDoctorView={true}
        />
      )}

      {/* Patient Admission & ML Triage Modal */}
      <PatientAdmissionForm
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        defaultDepartment={user?.department || 'Emergency'}
        defaultDoctorId={user?._id}
        onPatientAdmitted={(newPatient) => {
          setFeedback(`Patient ${newPatient.name} admitted under your care with ${newPatient.triageLevel.toUpperCase()} priority!`);
          fetchData();
        }}
      />
    </div>
  );
}
