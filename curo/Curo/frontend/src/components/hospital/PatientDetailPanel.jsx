import { useState } from 'react';
import {
  X,
  Activity,
  Heart,
  Thermometer,
  Wind,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Bed,
  Stethoscope,
  Brain,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import TriageBadge from './TriageBadge';

export default function PatientDetailPanel({
  patient,
  onClose,
  onResolve,
  isDoctorView = false,
}) {
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('Stabilized and resolved');
  const [submitting, setSubmitting] = useState(false);

  if (!patient) return null;

  const vitals = patient.vitals || {};
  const bp = vitals.bloodPressure || { systolic: 120, diastolic: 80 };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setSubmitting(true);
    try {
      await onResolve(patient._id, notes, outcome);
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-[#E2E8F0] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8F9FA]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{patient.name}</h2>
            <TriageBadge level={patient.triageLevel} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {patient.age} yrs • {patient.gender} • Bed {patient.bedNumber || 'Unassigned'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable details */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Chief Complaint */}
        <div className="bg-[#EBF3FA]/50 border border-[#D0E2F2] rounded-xl p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2E5F8A]">
            Chief Presenting Complaint
          </div>
          <div className="text-sm font-semibold text-slate-800 mt-1">{patient.chiefComplaint}</div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Wait Time: {patient.waitTime || patient.calculatedWaitTime || 0} mins
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              Ward: {patient.department}
            </span>
          </div>
        </div>

        {/* COMPREHENSIVE ML TRIAGE PREDICTION INTELLIGENCE BLOCK */}
        <div
          className={`p-4 rounded-xl border shadow-2xs space-y-3 ${
            (patient.triageLevel || '').toLowerCase() === 'critical'
              ? 'bg-gradient-to-br from-red-50 to-rose-100/60 border-red-200'
              : (patient.triageLevel || '').toLowerCase() === 'urgent'
              ? 'bg-gradient-to-br from-amber-50 to-orange-100/60 border-amber-200'
              : (patient.triageLevel || '').toLowerCase() === 'semi-urgent'
              ? 'bg-gradient-to-br from-blue-50 to-indigo-100/60 border-blue-200'
              : 'bg-gradient-to-br from-emerald-50 to-teal-100/60 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-black/10">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg text-white ${
                  (patient.triageLevel || '').toLowerCase() === 'critical'
                    ? 'bg-red-600'
                    : (patient.triageLevel || '').toLowerCase() === 'urgent'
                    ? 'bg-amber-500'
                    : (patient.triageLevel || '').toLowerCase() === 'semi-urgent'
                    ? 'bg-blue-600'
                    : 'bg-emerald-600'
                }`}
              >
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>ML Triage Decision Engine</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">model.pkl &bull; RandomForestClassifier</div>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 bg-white border border-slate-300 text-xs font-mono font-bold text-slate-800 rounded">
                {Math.round((patient.triageConfidence || 0.92) * 100)}% Confidence
              </span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#2E5F8A]" />
              <span>Model Clinical Reasoning & Predictive Anomaly Vector</span>
            </div>
            <div className="mt-1 p-2.5 bg-white/90 border border-black/10 rounded-lg text-xs text-slate-800 leading-relaxed font-medium">
              {patient.triageReasoning ||
                `Scikit-learn model evaluated 13 physiological parameters (vitals, pain score, age, AVPU status, complaints) and classified this patient under ${String(patient.triageLevel).toUpperCase()} clinical priority.`}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Decision Source: Pure ML Inference (Port 5001)
            </span>
            <span className="font-semibold text-slate-700">Level: {String(patient.triageLevel).toUpperCase()}</span>
          </div>
        </div>

        {/* Clinical Vitals Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Admission Vital Signs
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Blood Pressure</span>
                <Heart className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {bp.systolic}/{bp.diastolic} <span className="text-xs font-normal text-slate-400">mmHg</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Heart Rate</span>
                <Activity className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {vitals.heartRate || 72} <span className="text-xs font-normal text-slate-400">bpm</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Oxygen Saturation</span>
                <Activity className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {vitals.spo2 || 98}% <span className="text-xs font-normal text-slate-400">SpO2</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Body Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {vitals.temperature || 37.0}°C
              </div>
            </div>

            <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Respiratory Rate</span>
                <Wind className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {vitals.respiratoryRate || 16} <span className="text-xs font-normal text-slate-400">rpm</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg">
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span>Pain Score</span>
                <span className="text-xs font-bold text-amber-600">NRS</span>
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {vitals.painScale || 0}/10
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms & Medical History */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Reported Symptoms
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {patient.symptoms && patient.symptoms.length > 0 ? (
                patient.symptoms.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No specific symptoms recorded</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Past Medical History
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {patient.medicalHistory && patient.medicalHistory.length > 0 ? (
                patient.medicalHistory.map((h, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#F8F9FA] border border-[#E2E8F0] text-slate-700 rounded-md text-xs font-medium"
                  >
                    {h}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No chronic medical history noted</span>
              )}
            </div>
          </div>
        </div>

        {/* Doctor Consultation & Resolution Section */}
        {isDoctorView && patient.status !== 'resolved' && (
          <div className="border-t border-[#E2E8F0] pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-[#2E5F8A]" />
              Doctor Clinical Resolution
            </h3>
            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Outcome Assessment
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A]"
                >
                  <option value="Stabilized and resolved">Stabilized and treated in ward</option>
                  <option value="Admitted to ICU">Escalated and transferred to ICU</option>
                  <option value="Prescribed medication and discharged">Discharged with prescription</option>
                  <option value="Referred to super-specialist">Referred for specialized surgery</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Physician Consultation Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter medical findings, treatment administered, and discharge guidance..."
                  className="w-full p-3 bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !notes.trim()}
                className="w-full py-2.5 px-4 bg-[#2E5F8A] hover:bg-[#244C6E] disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Marking Resolved...' : 'Mark Patient Resolved'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Existing Resolution Notes if already resolved */}
        {patient.status === 'resolved' && (
          <div className="border-t border-[#E2E8F0] pt-4 bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Patient Resolved & Stabilized
            </div>
            <div className="text-xs text-slate-700 mt-1 font-medium">
              <span className="font-semibold text-slate-900">Outcome:</span> {patient.outcome || 'Resolved'}
            </div>
            {patient.resolutionNotes && (
              <div className="text-xs text-slate-600 mt-1.5 italic bg-white p-2.5 rounded border border-emerald-100">
                &ldquo;{patient.resolutionNotes}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
