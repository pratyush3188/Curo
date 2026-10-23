import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  AlertCircle,
  CheckCircle2,
  BedDouble,
  User,
  Printer,
} from 'lucide-react';
import Sidebar from '../../components/hospital/Sidebar';
import TopBar from '../../components/hospital/TopBar';

export const INITIAL_BED_PATIENTS = [
  { id: 'p1', name: 'Rahul Sharma', bedNo: 'ICU-101', condition: 'Stable', baseHeartRate: 75, baseSpo2: 98, baseTemp: 37.0, baseRespRate: 16 },
  { id: 'p2', name: 'Priya Patel', bedNo: 'ICU-102', condition: 'Tachycardia', baseHeartRate: 105, baseSpo2: 96, baseTemp: 37.2, baseRespRate: 20 },
  { id: 'p3', name: 'Amit Singh', bedNo: 'ICU-103', condition: 'Hypoxia Risk', baseHeartRate: 85, baseSpo2: 93, baseTemp: 36.8, baseRespRate: 22 },
  { id: 'p4', name: 'Sneha Gupta', bedNo: 'ICU-104', condition: 'Fever', baseHeartRate: 92, baseSpo2: 97, baseTemp: 38.5, baseRespRate: 18 },
  { id: 'p5', name: 'Vikram Malhotra', bedNo: 'ICU-105', condition: 'Critical', baseHeartRate: 115, baseSpo2: 89, baseTemp: 36.5, baseRespRate: 28 },
];

export function useMultiPatientVitals() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const nowMs = Date.now();
    const initialPatients = INITIAL_BED_PATIENTS.map((p) => {
      const history = [];
      for (let i = 29; i >= 0; i--) {
        const t = new Date(nowMs - i * 1000);
        const timeMs = t.getTime();
        history.push({
          timestamp: t.toISOString(),
          timeLabel: t.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          heartRate: Math.round(p.baseHeartRate + 5 * Math.sin(timeMs / 5000) + (Math.random() * 4 - 2)),
          spo2: Math.min(100, Math.round(p.baseSpo2 + 2 * Math.sin(timeMs / 8000) + (Math.random() * 2 - 1))),
          temperature: Number((p.baseTemp + 0.2 * Math.sin(timeMs / 20000) + (Math.random() * 0.2 - 0.1)).toFixed(1)),
          respiratoryRate: Math.round(p.baseRespRate + 2 * Math.sin(timeMs / 4000) + (Math.random() * 2 - 1)),
        });
      }
      return { ...p, data: history };
    });

    setPatients(initialPatients);

    const interval = setInterval(() => {
      const now = new Date();
      const timeMs = now.getTime();

      setPatients((prevPatients) =>
        prevPatients.map((p) => {
          const newPoint = {
            timestamp: now.toISOString(),
            timeLabel: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            heartRate: Math.round(p.baseHeartRate + 5 * Math.sin(timeMs / 5000) + (Math.random() * 4 - 2)),
            spo2: Math.min(100, Math.round(p.baseSpo2 + 2 * Math.sin(timeMs / 8000) + (Math.random() * 2 - 1))),
            temperature: Number((p.baseTemp + 0.2 * Math.sin(timeMs / 20000) + (Math.random() * 0.2 - 0.1)).toFixed(1)),
            respiratoryRate: Math.round(p.baseRespRate + 2 * Math.sin(timeMs / 4000) + (Math.random() * 2 - 1)),
          };
          const nextData = [...p.data, newPoint];
          if (nextData.length > 30) nextData.shift();
          return { ...p, data: nextData };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return patients;
}

const checkStatus = (vital, value) => {
  switch (vital) {
    case 'hr': return value >= 60 && value <= 100 ? 'Normal' : 'Alert';
    case 'spo2': return value >= 95 ? 'Normal' : 'Alert';
    case 'temp': return value >= 36.5 && value <= 37.5 ? 'Normal' : 'Alert';
    case 'rr': return value >= 12 && value <= 20 ? 'Normal' : 'Alert';
    default: return 'Normal';
  }
};

const getOverallStatus = (current) => {
  if (!current) return 'Normal';
  const hrStatus = checkStatus('hr', current.heartRate);
  const spo2Status = checkStatus('spo2', current.spo2);
  const tempStatus = checkStatus('temp', current.temperature);
  const rrStatus = checkStatus('rr', current.respiratoryRate);

  if (hrStatus === 'Alert' || spo2Status === 'Alert' || tempStatus === 'Alert' || rrStatus === 'Alert') {
    return 'Critical';
  }
  return 'Stable';
};

export default function LiveDataPage() {
  const patients = useMultiPatientVitals();
  const [selectedId, setSelectedId] = useState('p1');

  const activePatient = patients.find((p) => p.id === selectedId) || patients[0];

  const renderChartCard = (title, vitalKey, icon, unit, color, vitalType) => {
    if (!activePatient || !activePatient.data.length) return null;
    const current = activePatient.data[activePatient.data.length - 1];
    const value = current[vitalKey];
    const status = checkStatus(vitalType, value);
    const isAlert = status === 'Alert';

    return (
      <div
        className={`bg-white rounded-xl shadow-xs border p-4 transition-colors ${
          isAlert ? 'border-red-300 ring-1 ring-red-100' : 'border-[#E2E8F0]'
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isAlert ? 'bg-red-50 text-red-500' : 'bg-[#EBF3FA] text-[#2E5F8A]'}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-2xl font-bold transition-colors ${isAlert ? 'text-red-600' : 'text-slate-900'}`}>
                  {value}
                </span>
                <span className="text-xs font-medium text-slate-500">{unit}</span>
              </div>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              isAlert ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isAlert ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {status}
          </div>
        </div>

        <div className="h-28 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activePatient.data}>
              <XAxis dataKey="timeLabel" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                itemStyle={{ color: color, fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey={vitalKey}
                stroke={isAlert ? '#ef4444' : color}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar
          title="Live ICU Patient Telemetry"
          subtitle="Real-time physiologic telemetry streaming from ICU ward bedside monitors"
          extraAction={
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E8F0] rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Export PDF</span>
              </button>
            </div>
          }
        />

        <main className="p-8 space-y-6 flex-1">
          {/* Header Banner with status */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#2E5F8A]" />
                Live Ward Bed Telemetry (1Hz Stream)
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">Continuous vitals monitoring with real-time anomaly alerts</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-[#F8F9FA] px-3 py-1.5 rounded-full border border-[#E2E8F0] font-mono whitespace-nowrap">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{patients.length} ICU Beds Online</span>
            </div>
          </div>

          {/* Per-Bed Patient Cards */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Select Monitored Bed
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {patients.map((p) => {
                const current = p.data[p.data.length - 1];
                const overallStatus = getOverallStatus(current);
                const isCritical = overallStatus === 'Critical';
                const isSelected = p.id === selectedId;

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`text-left rounded-xl p-3 border transition-all duration-150 relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF3FA] border-[#2E5F8A] shadow-xs ring-2 ring-[#2E5F8A]/30'
                        : 'bg-white border-[#E2E8F0] hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <BedDouble className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-xs tracking-tight">{p.bedNo}</span>
                      </div>
                      {isCritical && (
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900 text-xs truncate">{p.name}</div>
                    <div className={`text-[11px] mt-1 font-bold ${isCritical ? 'text-red-600' : 'text-emerald-600'}`}>
                      {isCritical ? 'ALERT' : 'STABLE'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Patient Details and Telemetry Graphs */}
          {activePatient ? (
            <div className="bg-white p-5 border border-[#E2E8F0] rounded-xl space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="bg-[#EBF3FA] p-2.5 rounded-lg text-[#2E5F8A]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{activePatient.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Bed Location: <strong className="text-slate-800">{activePatient.bedNo}</strong> &bull; Condition: {activePatient.condition}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Telemetry Channel: Active
                  </span>
                </div>
              </div>

              {/* 4 Recharts Sub-Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {renderChartCard('Heart Rate', 'heartRate', <Heart className="w-4 h-4" />, 'bpm', '#2E5F8A', 'hr')}
                {renderChartCard('SpO2 Saturation', 'spo2', <Wind className="w-4 h-4" />, '%', '#7C3AED', 'spo2')}
                {renderChartCard('Body Temp', 'temperature', <Thermometer className="w-4 h-4" />, '°C', '#D97706', 'temp')}
                {renderChartCard('Resp. Rate', 'respiratoryRate', <Activity className="w-4 h-4" />, '/min', '#059669', 'rr')}
              </div>

              {/* Raw JSON Stream Terminal */}
              <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xs border border-slate-700">
                <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                  <h4 className="text-slate-300 text-[11px] font-mono font-semibold uppercase tracking-wider">
                    RAW TELEMETRY &mdash; Stream: hospital/icu/{activePatient.bedNo.toLowerCase()}/telemetry
                  </h4>
                  <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    1 Hz Stream
                  </span>
                </div>
                <div className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed h-36 overflow-y-auto w-full flex flex-col-reverse">
                  <div>
                    {[...activePatient.data]
                      .reverse()
                      .slice(0, 4)
                      .map((point, index) => (
                        <div key={index} className="text-emerald-400 mb-1.5 truncate">
                          <span className="text-slate-500">[{point.timestamp}]</span>{' '}
                          <span className="text-slate-300">{'{'}</span>
                          <span className="text-blue-300"> "hr"</span>: <span className="text-amber-300">{point.heartRate}</span>,
                          <span className="text-blue-300"> "spo2"</span>: <span className="text-amber-300">{point.spo2}</span>,
                          <span className="text-blue-300"> "temp"</span>: <span className="text-amber-300">{point.temperature}</span>,
                          <span className="text-blue-300"> "rr"</span>: <span className="text-amber-300">{point.respiratoryRate}</span>
                          <span className="text-slate-300"> {'}'}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-xl border border-[#E2E8F0]">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">Loading Telemetry</h3>
              <p className="text-xs text-slate-500">Connecting to ICU monitor gateway...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
