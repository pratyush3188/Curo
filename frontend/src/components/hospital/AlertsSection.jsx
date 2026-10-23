import { AlertTriangle, CheckCircle, Clock, Bed, User, ShieldCheck } from 'lucide-react';
import TriageBadge from './TriageBadge';

export default function AlertsSection({ alerts = [], onAcknowledge, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
        <div className="w-6 h-6 border-2 border-[#2E5F8A]/30 border-t-[#2E5F8A] rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs text-slate-500 font-medium">Scanning live high-risk clinical alerts...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-rose-50/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Clinical Emergency & Critical Alerts</h3>
            <p className="text-[11px] text-slate-500">Unacknowledged Level-1 Critical physiological triage triggers</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          alerts.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
        }`}>
          {alerts.length} Active
        </span>
      </div>

      <div className="p-4 divide-y divide-[#E2E8F0]">
        {alerts.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-800">All Clear — No Active Critical Alerts</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All admitted patients are stabilized or their emergency alarms have been acknowledged by attending physicians.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const vitals = alert.vitals || {};
            const bp = vitals.bloodPressure || {};
            return (
              <div key={alert._id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{alert.name}</span>
                    <TriageBadge level="critical" />
                    <span className="text-xs text-slate-500">({alert.age} yrs • {alert.gender})</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium">{alert.chiefComplaint}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-mono text-rose-600 font-semibold">
                      SpO2: {vitals.spo2 || 88}% | HR: {vitals.heartRate || 120} bpm | BP: {bp.systolic || 170}/{bp.diastolic || 105}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3 text-slate-400" />
                      Bed {alert.bedNumber || 'Unassigned'} ({alert.department})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Wait: {alert.waitTime || alert.calculatedWaitTime || 0} mins
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onAcknowledge && onAcknowledge(alert._id)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acknowledge Alert</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
