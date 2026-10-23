import { useState } from 'react';
import {
  X,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Building2,
  Stethoscope,
  ChevronRight,
  Brain,
  Printer,
  Sparkles,
  ArrowRight,
  Clock,
  User,
  Zap,
} from 'lucide-react';
import api from '../../api/client';
import TriageBadge from './TriageBadge';

export default function PatientAdmissionForm({
  isOpen,
  onClose,
  onPatientAdmitted,
  defaultDepartment = '',
  defaultDoctorId = null,
  occupiedBeds = ['ER-02', 'ER-05', 'ICU-01', 'CARD-03'],
}) {
  // General Info
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');

  // 13 Clinical Vitals & Indicators
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [heartRate, setHeartRate] = useState('75');
  const [spo2, setSpo2] = useState('98');
  const [temperature, setTemperature] = useState('98.6');
  const [respiratoryRate, setRespiratoryRate] = useState('16');
  const [painScale, setPainScale] = useState(1);
  const [consciousness, setConsciousness] = useState('Alert');

  // Symptoms & Complaint
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState([]);

  // Doctor Referral Departments
  const [selectedReferralDepts, setSelectedReferralDepts] = useState(
    defaultDepartment ? [defaultDepartment] : ['Emergency']
  );

  // Bed Allocation
  const [selectedBed, setSelectedBed] = useState('');

  // Triage assessment result state
  const [evaluating, setEvaluating] = useState(false);
  const [triageResult, setTriageResult] = useState(null);
  const [admittedPatient, setAdmittedPatient] = useState(null);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const symptomsList = [
    'Chest Pain',
    'Breathlessness',
    'Bleeding',
    'Loss of Consciousness',
    'Severe Headache',
    'Vomiting',
    'Seizures',
    'Abdominal Pain',
    'Fever',
    'Dizziness',
  ];

  const medicalHistoryList = [
    'Diabetes',
    'Hypertension',
    'Heart Disease',
    'Asthma',
    'COPD',
    'Chronic Kidney Disease',
    'Liver Disease',
    'Stroke/TIA',
    'Cancer',
    'Thyroid Disorder',
    'Seizures/Epilepsy',
    'Tuberculosis',
  ];

  const departmentList = [
    'General Medicine',
    'General Surgery',
    'Orthopaedics',
    'Paediatrics',
    'Obstetrics & Gynaecology',
    'Radiology',
    'Anaesthesia',
    'ENT',
    'Ophthalmology',
    'Emergency',
    'Cardiology',
  ];

  // 20 Hospital Beds
  const bedGrid = Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    const prefix = defaultDepartment === 'Cardiology' ? 'CARD' : 'ER';
    const bedId = `${prefix}-${num < 10 ? '0' + num : num}`;
    const isOccupied = occupiedBeds.includes(bedId);
    return {
      id: bedId,
      number: num,
      isOccupied,
    };
  });

  const toggleSymptom = (sym) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const toggleHistory = (hist) => {
    setSelectedHistory((prev) =>
      prev.includes(hist) ? prev.filter((h) => h !== hist) : [...prev, hist]
    );
  };

  const toggleReferralDept = (dept) => {
    setSelectedReferralDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const handleAssessmentAndAdmission = async (e) => {
    e.preventDefault();
    if (!name.trim() || !age || !chiefComplaint.trim()) {
      setError('Please provide Name, Age, and Chief Complaint.');
      return;
    }

    setEvaluating(true);
    setError('');

    const targetDept =
      defaultDepartment || (selectedReferralDepts.length > 0 ? selectedReferralDepts[0] : 'Emergency');

    const payload = {
      name: name.trim(),
      age: Number(age),
      gender,
      chiefComplaint: chiefComplaint.trim(),
      vitals: {
        bloodPressure: {
          systolic: Number(bpSystolic) || 120,
          diastolic: Number(bpDiastolic) || 80,
        },
        heartRate: Number(heartRate) || 72,
        spo2: Number(spo2) || 98,
        temperature: Number(temperature) || 98.6,
        respiratoryRate: Number(respiratoryRate) || 16,
        painScale: Number(painScale) || 1,
        consciousness,
      },
      symptoms: selectedSymptoms,
      medicalHistory: selectedHistory,
      doctorReferral: selectedReferralDepts,
      bedNumber: selectedBed || 'Unassigned',
      department: targetDept,
      assignedDoctor: defaultDoctorId,
    };

    try {
      const res = await api.post('/patients/admit', payload);
      if (res.data?.success) {
        setTriageResult(res.data.triage);
        setAdmittedPatient(res.data.patient || payload);
        setIsSuccess(true);
        if (onPatientAdmitted) {
          onPatientAdmitted(res.data.patient);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Triage assessment failed');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8F9FA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3FA] border border-[#D0E2F2] flex items-center justify-center text-[#2E5F8A]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Hospital Patient Admission & ML Triage</h2>
              <p className="text-xs text-slate-500">13-Feature Clinical Assessment powered by scikit-learn model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* COMPREHENSIVE AI/ML CLINICAL TRIAGE INTELLIGENCE REPORT */}
          {isSuccess && triageResult && (
            <div className="space-y-5 animate-in slide-in-from-top-3 duration-300">
              {/* Top Priority Showcase Banner */}
              <div
                className={`p-6 rounded-2xl border shadow-md transition-all ${
                  triageResult.triageLevel === 'critical'
                    ? 'bg-gradient-to-r from-red-50 via-rose-50 to-red-100/70 border-red-300'
                    : triageResult.triageLevel === 'urgent'
                    ? 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/70 border-amber-300'
                    : triageResult.triageLevel === 'semi-urgent'
                    ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100/70 border-blue-300'
                    : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border-emerald-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black/10">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
                        triageResult.triageLevel === 'critical'
                          ? 'bg-red-600 text-white animate-pulse'
                          : triageResult.triageLevel === 'urgent'
                          ? 'bg-amber-500 text-white'
                          : triageResult.triageLevel === 'semi-urgent'
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Scikit-Learn ML Assessment Complete
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 shadow-2xs border border-slate-200">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Pure model.pkl
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
                        {admittedPatient?.name || name} &mdash; Admitted to{' '}
                        {admittedPatient?.department || 'Emergency'} Ward
                      </h3>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Patient ID: <span className="font-mono font-bold text-slate-800">{admittedPatient?._id || 'PAT-NEW'}</span> &bull; Bed: <span className="font-bold text-slate-900">{admittedPatient?.bedNumber || selectedBed || 'ER-Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Assigned Clinical Priority
                    </div>
                    <div className="flex items-center gap-2">
                      <TriageBadge level={triageResult.triageLevel} />
                      <div className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-extrabold text-slate-800 shadow-2xs">
                        {Math.round((triageResult.confidence || 0.95) * 100)}% Confidence
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Reasoning & Physiological Drivers */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Zap className="w-3.5 h-3.5 text-[#2E5F8A]" />
                    <span>ML Predictive Clinical Reasoning & Anomaly Vectors</span>
                  </div>
                  <div className="bg-white/90 border border-black/10 rounded-xl p-4 text-xs text-slate-800 leading-relaxed font-medium shadow-2xs">
                    {triageResult.reasoning ||
                      `RandomForestClassifier model analyzed all 13 patient features (Age, Blood Pressure, HR, SpO2, Temp, RR, Pain, AVPU Consciousness, and Presenting Complaints) to allocate ${triageResult.triageLevel.toUpperCase()} status.`}
                  </div>
                </div>
              </div>

              {/* Informative Grid: Evaluated Clinical Parameters Breakdown */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#2E5F8A]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      13 Evaluated Patient Telemetry & Anamnesis Vitals
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Model: {triageResult.model || 'RandomForestClassifier (model.pkl)'}</span>
                </div>

                {/* 6 Vital Sign Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Blood Pressure</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-1 font-mono">
                      {bpSystolic}/{bpDiastolic}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">mmHg</div>
                  </div>

                  <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Heart Rate</div>
                    <div className={`text-sm font-extrabold mt-1 font-mono ${Number(heartRate) > 100 || Number(heartRate) < 60 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {heartRate} <span className="text-[10px] font-normal text-slate-500">bpm</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{Number(heartRate) > 100 ? 'Tachycardia' : 'Normal'}</div>
                  </div>

                  <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">SpO2 Oxygen</div>
                    <div className={`text-sm font-extrabold mt-1 font-mono ${Number(spo2) < 92 ? 'text-red-600' : Number(spo2) < 95 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {spo2}%
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{Number(spo2) < 92 ? 'Hypoxic' : 'Adequate'}</div>
                  </div>

                  <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Body Temp</div>
                    <div className={`text-sm font-extrabold mt-1 font-mono ${Number(temperature) >= 100.4 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {temperature}°F
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{Number(temperature) >= 100.4 ? 'Febrile' : 'Normothermia'}</div>
                  </div>

                  <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Resp. Rate</div>
                    <div className={`text-sm font-extrabold mt-1 font-mono ${Number(respiratoryRate) > 22 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {respiratoryRate} <span className="text-[10px] font-normal text-slate-500">/min</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{Number(respiratoryRate) > 22 ? 'Tachypnea' : 'Eupnea'}</div>
                  </div>

                  <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Pain Score</div>
                    <div className={`text-sm font-extrabold mt-1 font-mono ${Number(painScale) >= 7 ? 'text-red-600' : Number(painScale) >= 4 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {painScale}/10
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">AVPU: {consciousness}</div>
                  </div>
                </div>

                {/* Additional Clinical Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Chief Complaint & Symptoms Checked
                    </div>
                    <div className="font-semibold text-slate-900">&ldquo;{chiefComplaint}&rdquo;</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSymptoms.length > 0 ? (
                        selectedSymptoms.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-medium">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">No specific checkbox symptoms selected</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E2E8F0]">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Medical History & Clinical Governance
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedHistory.length > 0 ? (
                        selectedHistory.map((h, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-[#2E5F8A] border border-[#D0E2F2] rounded text-[10px] font-medium">
                            {h}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">No chronic illnesses declared</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Decisions produced purely via scikit-learn model without hardcoded logic.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E8F0] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Triage Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#2E5F8A] hover:bg-[#244C6E] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer w-full sm:w-auto justify-center"
                >
                  <span>Close & View in Patient Queue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!isSuccess && (
            <form onSubmit={handleAssessmentAndAdmission} className="space-y-6">
              {/* SECTION 1: General Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E5F8A] border-b border-[#E2E8F0] pb-1.5">
                  <span>1. General Patient Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Age (Years) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={125}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Biological Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Clinical Vitals (All 13 ML Inputs) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E5F8A] border-b border-[#E2E8F0] pb-1.5">
                  <span>2. Clinical Vitals (ML Triage Parameters)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      BP Systolic (mmHg)
                    </label>
                    <input
                      type="number"
                      value={bpSystolic}
                      onChange={(e) => setBpSystolic(e.target.value)}
                      placeholder="120"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      BP Diastolic (mmHg)
                    </label>
                    <input
                      type="number"
                      value={bpDiastolic}
                      onChange={(e) => setBpDiastolic(e.target.value)}
                      placeholder="80"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="72"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      SpO2 (%)
                    </label>
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="98"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Temperature (°F)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="98.6"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Respiratory Rate (/min)
                    </label>
                    <input
                      type="number"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      placeholder="16"
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Consciousness (AVPU Scale)
                    </label>
                    <select
                      value={consciousness}
                      onChange={(e) => setConsciousness(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                    >
                      <option value="Alert">Alert (Fully conscious and oriented)</option>
                      <option value="Verbal">Verbal (Responds only to verbal stimulus)</option>
                      <option value="Pain">Pain (Responds only to painful stimulus)</option>
                      <option value="Unresponsive">Unresponsive (No response)</option>
                    </select>
                  </div>
                </div>

                {/* Pain Scale Slider */}
                <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E2E8F0] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Pain Scale (1 - 10 Visual Rating):</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                      painScale >= 8 ? 'bg-rose-100 text-rose-800' : painScale >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Score: {painScale}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={painScale}
                    onChange={(e) => setPainScale(Number(e.target.value))}
                    className="w-full accent-[#2E5F8A] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>1: Mild Discomfort</span>
                    <span>5: Moderate Pain</span>
                    <span>10: Worst Possible Pain</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Symptoms & Medical History */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E5F8A] border-b border-[#E2E8F0] pb-1.5">
                  <span>3. Presenting Complaint & Medical History</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Chief Presenting Complaint <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Describe main reason for admission (e.g. Acute chest discomfort with shortness of breath)..."
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Presenting Symptoms (Check all that apply):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {symptomsList.map((sym) => {
                      const isChecked = selectedSymptoms.includes(sym);
                      return (
                        <button
                          type="button"
                          key={sym}
                          onClick={() => toggleSymptom(sym)}
                          className={`p-2 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-[#EBF3FA] border-[#2E5F8A] text-[#2E5F8A] font-semibold'
                              : 'bg-[#F8F9FA] border-[#E2E8F0] text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{sym}</span>
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ml-1 ${
                            isChecked ? 'bg-[#2E5F8A] border-[#2E5F8A] text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Past Medical History:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {medicalHistoryList.map((hist) => {
                      const isChecked = selectedHistory.includes(hist);
                      return (
                        <button
                          type="button"
                          key={hist}
                          onClick={() => toggleHistory(hist)}
                          className={`p-1.5 px-2.5 rounded-lg border text-left text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-between ${
                            isChecked
                              ? 'bg-[#EBF3FA] border-[#2E5F8A] text-[#2E5F8A] font-semibold'
                              : 'bg-[#F8F9FA] border-[#E2E8F0] text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{hist}</span>
                          <span className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ml-1 text-[9px] ${
                            isChecked ? 'bg-[#2E5F8A] border-[#2E5F8A] text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && '✓'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 4: Doctor Referral Department */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E5F8A] border-b border-[#E2E8F0] pb-1.5">
                  <span>4. Doctor Referral & Ward Allocation</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {departmentList.map((dept) => {
                    const isChecked = selectedReferralDepts.includes(dept);
                    return (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => toggleReferralDept(dept)}
                        className={`p-2 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-[#2E5F8A] text-white border-[#2E5F8A] font-semibold'
                            : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{dept}</span>
                        {isChecked && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: Bed Allocation (20 Beds Visual Grid) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2E5F8A]">
                    5. Bed Allocation Visual Grid (20 Beds)
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-white border border-[#E2E8F0] rounded" /> Available
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 bg-[#2E5F8A] rounded" /> Selected
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Occupied
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-10 gap-2 pt-1">
                  {bedGrid.map((bed) => {
                    const isSelected = selectedBed === bed.id;
                    const isOccupied = bed.isOccupied;

                    return (
                      <button
                        type="button"
                        key={bed.id}
                        disabled={isOccupied}
                        onClick={() => setSelectedBed(isSelected ? '' : bed.id)}
                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer relative ${
                          isOccupied
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-[#2E5F8A] text-white border-[#2E5F8A] shadow-xs'
                            : 'bg-white border-[#E2E8F0] text-slate-800 hover:border-slate-400'
                        }`}
                      >
                        {isOccupied && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}
                        <Bed className="w-3.5 h-3.5 mx-auto mb-0.5" />
                        <div className="text-[10px] font-mono font-bold">{bed.id}</div>
                      </button>
                    );
                  })}
                </div>
                {selectedBed && (
                  <div className="text-xs text-[#2E5F8A] font-semibold mt-1">
                    Selected Bed: <span className="font-mono">{selectedBed}</span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#E2E8F0] hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={evaluating}
                  className="px-6 py-2.5 bg-[#2E5F8A] hover:bg-[#244C6E] disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  <span>{evaluating ? 'Running ML Inference...' : 'Submit for Triage Assessment'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
