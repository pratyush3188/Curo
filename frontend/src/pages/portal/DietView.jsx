import { useState, useEffect } from 'react';
import { Utensils, FileText, ChevronDown, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import clsx from 'clsx';

// eslint-disable-next-line no-unused-vars
export function DietView({ user, reports }) {
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?._id || '');
  const [dietPreference, setDietPreference] = useState('Vegetarian');
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDiet = async (pref, rId) => {
    setLoading(true);
    try {
      const res = await api.post('/reports/diet', {
        reportId: rId || selectedReportId,
        dietPreference: pref || dietPreference,
      });
      if (res.data?.diet) {
        setDietPlan(res.data.diet);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiet(dietPreference, selectedReportId);
  }, [dietPreference, selectedReportId]);

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 space-y-8">
      {/* Top Selector Layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <label className="relative bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xs hover:border-sky-500 transition-colors cursor-pointer w-full sm:w-auto">
          <FileText className="h-5 w-5 text-slate-400" />
          <select 
            value={selectedReportId} 
            onChange={e => setSelectedReportId(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 cursor-pointer appearance-none pr-8"
          >
            {reports.length === 0 && <option value="">No reports found in MongoDB</option>}
            {reports.map(r => (
              <option key={r._id} value={r._id}>
                {r.fileName} - Score: {r.healthScore || 85}
              </option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 pointer-events-none" />
        </label>

        <label className="relative bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xs hover:border-sky-500 transition-colors cursor-pointer w-full sm:w-auto">
          <div className="h-5 w-5 rounded-full flex items-center justify-center border-2 border-slate-300">
            <div className={clsx("h-2.5 w-2.5 rounded-full", dietPreference === 'Vegetarian' ? 'bg-green-500' : 'bg-red-500')} />
          </div>
          <select 
            value={dietPreference} 
            onChange={e => setDietPreference(e.target.value)}
            className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 cursor-pointer appearance-none pr-8"
          >
            <option value="Vegetarian">🌱 Vegetarian Protocol</option>
            <option value="Non-Vegetarian">🍗 Non-Vegetarian Protocol</option>
          </select>
          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 pointer-events-none" />
        </label>
      </div>

      {loading ? (
        <div className="bg-white rounded-[2rem] p-16 border border-slate-200 text-center text-xs text-slate-500 font-bold">
          Synthesizing personalized clinical nutrition plan...
        </div>
      ) : dietPlan ? (
        <div className="space-y-8">
          {/* Strategy Card */}
          <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                   <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase">
                     Targeted Metabolic Strategy
                   </span>
                   <h2 className="text-3xl font-black text-slate-900 mt-1">{dietPlan.strategy}</h2>
                </div>
                <div className="bg-sky-50 border border-sky-200 px-4 py-2 rounded-2xl text-xs font-bold text-sky-700">
                   {dietPlan.alignment_score}% Clinical Biomarker Alignment
                </div>
             </div>
             <p className="text-xs text-slate-600 leading-relaxed max-w-3xl font-medium">
               {dietPlan.description}
             </p>
          </div>

          {/* Meals Grid */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Daily Meal Protocol</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dietPlan.meals?.map((m, idx) => (
                <div key={idx} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm space-y-3">
                   <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-slate-900">{m.name}</span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                         {m.tag}
                      </span>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">{m.description}</p>
                   
                   <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-[11px] font-mono text-slate-600">
                      {Object.entries(m.macros || {}).map(([k, v]) => (
                        <div key={k}>
                           <span className="text-slate-400 font-sans text-[10px] uppercase block">{k}</span>
                           <span className="font-bold text-slate-800">{v}</span>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Superfoods vs Strict Avoidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                   <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                   <h4 className="font-bold text-slate-900 text-sm">Optimal Categories to Emphasize</h4>
                </div>
                <div className="space-y-3">
                   {dietPlan.optimal_categories?.map((cat, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                         <span className="text-xs font-bold text-slate-800 block mb-1">{cat.name}</span>
                         <span className="text-xs text-slate-500">{cat.items?.join(', ')}</span>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                   <AlertTriangle className="h-5 w-5 text-red-500" />
                   <h4 className="font-bold text-slate-900 text-sm">Strict Avoidance Protocol</h4>
                </div>
                <div className="space-y-3">
                   {dietPlan.strict_avoidance?.map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-red-50/50 rounded-2xl border border-red-100">
                         <span className="text-xs font-bold text-red-900 block mb-1">{item.name}</span>
                         <span className="text-xs text-slate-600">{item.description}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          {/* Physician Note */}
          <div className="p-6 bg-slate-100 rounded-[2rem] border border-slate-200 text-xs text-slate-700 leading-relaxed">
             <strong className="text-slate-900 block mb-1">Clinical Note & Guidance:</strong>
             {dietPlan.physician_note}
          </div>
        </div>
      ) : null}
    </div>
  );
}
