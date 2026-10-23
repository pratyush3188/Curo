import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Activity, Heart, Wind, Thermometer } from 'lucide-react';

export default function VitalsChart({
  baseHeartRate = 75,
  baseSpo2 = 98,
  baseTemp = 37.0,
  baseRespRate = 16,
  patientName = 'Patient',
}) {
  const [data, setData] = useState([]);
  const [activeMetric, setActiveMetric] = useState('heartRate');

  // Generate initial stream data
  useEffect(() => {
    const initial = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 1500);
      initial.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        heartRate: Math.round(baseHeartRate + (Math.random() * 6 - 3)),
        spo2: Math.min(100, Math.round(baseSpo2 + (Math.random() * 2 - 1))),
        temperature: Number((baseTemp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        respiratoryRate: Math.round(baseRespRate + (Math.random() * 2 - 1)),
      });
    }
    setData(initial);
  }, [baseHeartRate, baseSpo2, baseTemp, baseRespRate]);

  // Real-time simulated ticker every 1.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setData((prev) => {
        if (!prev.length) return prev;
        const now = new Date();
        const nextPoint = {
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          heartRate: Math.round(baseHeartRate + (Math.random() * 6 - 3)),
          spo2: Math.min(100, Math.max(70, Math.round(baseSpo2 + (Math.random() * 2 - 1)))),
          temperature: Number((baseTemp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
          respiratoryRate: Math.round(baseRespRate + (Math.random() * 2 - 1)),
        };
        return [...prev.slice(1), nextPoint];
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [baseHeartRate, baseSpo2, baseTemp, baseRespRate]);

  const latest = data[data.length - 1] || {
    heartRate: baseHeartRate,
    spo2: baseSpo2,
    temperature: baseTemp,
    respiratoryRate: baseRespRate,
  };

  const metrics = [
    {
      id: 'heartRate',
      label: 'Heart Rate',
      value: `${latest.heartRate} bpm`,
      icon: Heart,
      color: '#E11D48',
      domain: [50, 160],
      normal: '60-100 bpm',
    },
    {
      id: 'spo2',
      label: 'SpO2 Level',
      value: `${latest.spo2}%`,
      icon: Activity,
      color: '#2563EB',
      domain: [80, 100],
      normal: '95-100%',
    },
    {
      id: 'respiratoryRate',
      label: 'Respiratory Rate',
      value: `${latest.respiratoryRate} rpm`,
      icon: Wind,
      color: '#059669',
      domain: [10, 35],
      normal: '12-20 rpm',
    },
    {
      id: 'temperature',
      label: 'Temperature',
      value: `${latest.temperature}°C`,
      icon: Thermometer,
      color: '#D97706',
      domain: [35, 41],
      normal: '36.5-37.5°C',
    },
  ];

  const currentMetricConfig = metrics.find((m) => m.id === activeMetric) || metrics[0];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
      {/* Header and Live indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Live Physiological Stream</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live ICU Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Continuous bed monitoring for {patientName}</p>
        </div>
      </div>

      {/* Metric selection tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {metrics.map((m) => {
          const Icon = m.icon;
          const isSelected = activeMetric === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#EBF3FA] border-[#2E5F8A] shadow-xs'
                  : 'bg-[#F8F9FA] border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-lg font-extrabold text-slate-900 tracking-tight">{m.value}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Ref: {m.normal}</div>
            </button>
          );
        })}
      </div>

      {/* Chart container */}
      <div className="h-48 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              domain={currentMetricConfig.domain}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '11px',
                fontWeight: 600,
                color: '#1E293B',
              }}
            />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={currentMetricConfig.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
