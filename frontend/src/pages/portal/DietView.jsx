import { useState, useEffect } from 'react';
import { 
  Utensils, FileText, ChevronDown, CheckCircle2, AlertTriangle, ShieldCheck, 
  ExternalLink, RotateCcw, Sparkles, Target, Globe
} from 'lucide-react';
import api from '../../api/client';
import clsx from 'clsx';

// eslint-disable-next-line no-unused-vars
export function DietView({ user, reports = [] }) {
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?._id || '');
  const [dietPreference, setDietPreference] = useState('Vegetarian');
  const [healthGoal, setHealthGoal] = useState('General Vitality & Wellness');
  const [language, setLanguage] = useState('English');
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDiet = async () => {
    setLoading(true);
    try {
      const res = await api.post('/reports/diet', {
        reportId: selectedReportId || undefined,
        dietPreference,
        healthGoals: healthGoal,
        language,
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
    fetchDiet();
  }, [dietPreference, selectedReportId, healthGoal, language]);

  const handleOpenDedicatedWindow = () => {
    if (!dietPlan) return;
    const w = window.open('', '_blank', 'width=920,height=850,scrollbars=yes,resizable=yes');
    if (!w) {
      alert('Pop-up blocked. Please allow pop-ups for this site to view the simplified window.');
      return;
    }
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CURO AI Clinical Nutrition & Diet Protocol</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap">
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 28px; line-height: 1.6; }
          .container { max-width: 840px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; padding: 40px; box-shadow: 0 10px 30px -5px rgba(0,0,0,0.06); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 28px; }
          .logo { font-weight: 900; font-size: 26px; color: #0284c7; letter-spacing: -0.5px; }
          .badge { background: #e0f2fe; color: #0369a1; padding: 5px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .strategy-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 20px; padding: 24px; margin-bottom: 28px; }
          .strategy-title { font-size: 24px; font-weight: 900; color: #15803d; margin: 4px 0 8px; }
          .meal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin: 20px 0; }
          .meal-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; }
          .meal-name { font-weight: 800; font-size: 15px; color: #0f172a; display: flex; justify-content: space-between; }
          .meal-tag { background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
          .macros { display: flex; gap: 12px; margin-top: 12px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; font-family: monospace; }
          .avoid-card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 20px; color: #991b1b; }
          .btn-print { background: #0284c7; color: white; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 13px; box-shadow: 0 4px 12px rgba(2,132,199,0.25); }
          .btn-print:hover { background: #0369a1; }
          @media print { body { padding: 0; background: white; } .container { box-shadow: none; border: none; padding: 0; } .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="logo">CURO NUTRITION AI</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Targeted Metabolic Nutrition Protocol &bull; Language: <strong>${language}</strong></div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Diet Preference: <strong>${dietPreference}</strong> | Goal: <strong>${healthGoal}</strong></div>
            </div>
            <div style="text-align: right;">
              <span class="badge">Alignment: ${dietPlan.alignment_score || 92}%</span>
              <div style="margin-top: 10px;"><button class="btn-print" onclick="window.print()">🖨️ Print / Save PDF</button></div>
            </div>
          </div>
          <div class="strategy-card">
            <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase;">Clinical Nutrition Strategy</div>
            <div class="strategy-title">${dietPlan.strategy}</div>
            <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">${dietPlan.description}</p>
          </div>
          <h3 style="font-size: 17px; font-weight: 800; margin: 24px 0 12px; color: #0f172a;">Daily Meal Protocol</h3>
          <div class="meal-grid">
            ${(dietPlan.meals || []).map(m => `
              <div class="meal-card">
                <div class="meal-name">
                  <span>${m.name}</span>
                  <span class="meal-tag">${m.tag}</span>
                </div>
                <p style="font-size: 13px; color: #475569; margin: 8px 0;">${m.description}</p>
                <div class="macros">
                  ${Object.entries(m.macros || {}).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          ${dietPlan.strict_avoidance?.length > 0 ? `
          <h3 style="font-size: 17px; font-weight: 800; margin: 24px 0 12px; color: #b91c1c;">Strict Foods to Avoid</h3>
          <div class="avoid-card">
            ${dietPlan.strict_avoidance.map(a => `<div style="margin-bottom: 8px;"><strong>⚠️ ${a.name}:</strong> ${a.description}</div>`).join('')}
          </div>
          ` : ''}
          <div style="margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Synthesized via CURO AI Nutrition Engine &bull; Tailored to individual clinical biomarkers and lifestyle targets.
          </div>
        </div>
      </body>
      </html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase">
              AI Precision Nutrition
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              AI Active
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">
            Clinical Diet & Wellness Protocol
          </h1>
          <p className="text-slate-500 max-w-2xl text-sm">
            AI-synthesized metabolic dietary regimens customized to your blood biomarkers, dietary preferences, and target clinical wellness goals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">
          <button
            onClick={fetchDiet}
            disabled={loading}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{loading ? 'AI is analyzing...' : 'Generate AI Diet Plan'}</span>
          </button>

          {dietPlan && (
            <button
              onClick={handleOpenDedicatedWindow}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
              title="Open clean printable protocol in a dedicated window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Dedicated Window</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        {/* Lab Report Context */}
        <label className="relative bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 hover:border-sky-500 transition cursor-pointer">
          <FileText className="h-4 w-4 text-sky-600 shrink-0" />
          <div className="truncate flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Report Baseline</span>
            <select 
              value={selectedReportId} 
              onChange={e => setSelectedReportId(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 cursor-pointer appearance-none w-full truncate pr-4"
            >
              <option value="">⚡ General Biomarker Profile</option>
              {reports.map(r => (
                <option key={r._id} value={r._id}>
                  {r.fileName} (Score: {r.healthScore || 85})
                </option>
              ))}
            </select>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 pointer-events-none" />
        </label>

        {/* Health Goal */}
        <label className="relative bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 hover:border-sky-500 transition cursor-pointer">
          <Target className="h-4 w-4 text-indigo-600 shrink-0" />
          <div className="truncate flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Health Goal</span>
            <select 
              value={healthGoal} 
              onChange={e => setHealthGoal(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 cursor-pointer appearance-none w-full truncate pr-4"
            >
              <option value="General Vitality & Wellness">General Vitality & Wellness</option>
              <option value="Diabetes & Blood Sugar Control">Diabetes & Blood Sugar Control</option>
              <option value="Weight Management & Fat Loss">Weight Management & Fat Loss</option>
              <option value="Cardiovascular & Lipid Control">Cardiovascular & Lipid Control</option>
              <option value="Hypertension & Blood Pressure">Hypertension & Blood Pressure</option>
              <option value="Thyroid & Hormonal Balance">Thyroid & Hormonal Balance</option>
            </select>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 pointer-events-none" />
        </label>

        {/* Dietary Preference */}
        <label className="relative bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 hover:border-sky-500 transition cursor-pointer">
          <Utensils className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="truncate flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Dietary Preference</span>
            <select 
              value={dietPreference} 
              onChange={e => setDietPreference(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 cursor-pointer appearance-none w-full truncate pr-4"
            >
              <option value="Vegetarian">🌱 Vegetarian Protocol</option>
              <option value="Non-Vegetarian">🍗 Non-Vegetarian Protocol</option>
              <option value="Vegan">🥑 Vegan Protocol</option>
              <option value="High-Protein">🍳 High Protein / Eggetarian</option>
            </select>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 pointer-events-none" />
        </label>

        {/* Language */}
        <label className="relative bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 hover:border-sky-500 transition cursor-pointer">
          <Globe className="h-4 w-4 text-sky-600 shrink-0" />
          <div className="truncate flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Language</span>
            <select 
              value={language} 
              onChange={e => setLanguage(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 cursor-pointer appearance-none w-full truncate pr-4"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Hinglish">Hinglish (Hindi-English)</option>
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="Gujarati">Gujarati (ગુજરાતી)</option>
            </select>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 absolute right-3 pointer-events-none" />
        </label>
      </div>

      {loading ? (
        <div className="bg-white rounded-[2rem] p-16 border border-slate-200 text-center flex flex-col items-center justify-center gap-3">
          <RotateCcw className="h-6 w-6 text-sky-600 animate-spin" />
          <span className="text-sm text-slate-700 font-bold">AI is analyzing...</span>
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
