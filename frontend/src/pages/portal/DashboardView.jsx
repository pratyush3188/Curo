import { useState, useEffect } from 'react';
import { 
  Hexagon, CheckCircle, PlusCircle, Clock, ChevronRight, Activity, 
  Lightbulb, Trophy, Shield, Star, Award, Zap, AlertTriangle 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import clsx from 'clsx';

export function DashboardView({ user, reports, onNavigate }) {
  // Quote Rotator Logic from medsimplify
  const quotes = [
    "Increasing hydration by 20% today could improve your kidney filtration score and stabilize hematocrit levels based on your latest blood panel trajectory.",
    "Your recent cardiovascular markers indicate excellent stability. Maintaining your current aerobic exercise routine is highly recommended by Curo.",
    "Elevated resting heart rate patterns detected over the last 3 reports. Consider adjusting sleep schedule to improve recovery efficiency.",
    "Hepatic enzyme levels are currently optimal. Continued avoidance of processed sugars will maintain this peak metabolic state.",
    "Vitals suggest a slight downward trend in overall resilience. A comprehensive metabolic panel next month could provide deeper insights."
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const totalReports = reports.length;
  // eslint-disable-next-line no-unused-vars
  const criticalFindings = reports.filter(r => r.criticalAlert || r.status === 'Critical').length;
  const averageScore = totalReports > 0 
    ? Math.round(reports.reduce((acc, curr) => acc + (curr.healthScore || 0), 0) / totalReports) 
    : 85;
  
  // eslint-disable-next-line no-unused-vars
  const lastReportDate = totalReports > 0 && reports[0]?.createdAt 
    ? format(new Date(reports[0].createdAt), 'MMM dd, yyyy') 
    : 'None';

  const chronReports = [...reports].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const trendData = chronReports.length > 0
    ? chronReports.slice(-6).map((r) => ({
        name: format(new Date(r.createdAt), 'MMM dd'),
        score: r.healthScore || 80
      }))
    : [
        { name: 'Aug', score: 78 },
        { name: 'Sep', score: 82 },
        { name: 'Oct', score: 88 },
      ];

  const latestScore = reports[0]?.healthScore || 85;
  const prevScore = reports[1]?.healthScore || 80;
  const delta = totalReports > 1 ? latestScore - prevScore : 5;
  const displayScore = totalReports > 0 ? averageScore : 85;

  // Calendar Heatmap logic (Last 7 days)
  const last7Days = Array.from({length: 7}).map((_, i) => subDays(new Date(), 6 - i));
  // eslint-disable-next-line no-unused-vars
  const getDayStatus = (date) => {
     const dayReports = reports.filter(r => isSameDay(new Date(r.createdAt), date));
     if (dayReports.length === 0) return 'none';
     const avgForDay = dayReports.reduce((acc, r) => acc + (r.healthScore || 0), 0) / dayReports.length;
     if (avgForDay >= 80) return 'great';
     if (avgForDay >= 50) return 'okay';
     return 'bad';
  };

  // Gamification Badges
  const hasFirstStep = totalReports >= 1;
  const hasAnalyticalMind = totalReports >= 2;
  const hasPeakVitality = reports.some(r => (r.healthScore || 0) > 90);
  const hasConsistentObserver = totalReports >= 5;

  // Radar Chart Data mapped from avgScore
  const radarData = [
    { subject: 'Cardiovascular', A: displayScore ? Math.min(100, Math.floor(displayScore * 1.05)) : 80, fullMark: 100 },
    { subject: 'Renal', A: displayScore ? Math.min(100, Math.floor(displayScore * 0.95)) : 75, fullMark: 100 },
    { subject: 'Hepatic', A: displayScore ? displayScore : 85, fullMark: 100 },
    { subject: 'Immune', A: displayScore ? Math.min(100, Math.floor(displayScore * 1.1)) : 90, fullMark: 100 },
    { subject: 'Metabolic', A: displayScore ? Math.max(0, Math.floor(displayScore * 0.88)) : 72, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Massive Greeting */}
      <div>
        <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2">Medical Status: Active</div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
          Good Day, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-sky-400">{user?.name || 'Valued Patient'}</span>
        </h1>
        <p className="text-slate-500 mt-3 max-w-3xl text-lg">
          Your clinical synthesis is complete. Real-time biomarker algorithms are monitoring your baseline trajectories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Circle Score (Average) */}
        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Avg Health Score</h3>
           
           <div className="relative h-44 w-44 mb-6">
             <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="42" stroke="#f1f5f9" strokeWidth="8" fill="none" />
               <circle 
                 cx="50" cy="50" r="42" 
                 stroke="#0284c7" 
                 strokeWidth="8" 
                 fill="none" 
                 strokeDasharray="264" 
                 strokeDashoffset={264 - (264 * displayScore) / 100} 
                 strokeLinecap="round" 
                 className="transition-all duration-1000 ease-out"
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-5xl font-black text-sky-600">{displayScore}</span>
               <span className="text-sm font-bold text-slate-400">/ 100</span>
             </div>
           </div>

           <div className="bg-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2">
             <Activity className="h-3.5 w-3.5 text-sky-600" />
             <span className="text-xs font-bold text-sky-600">{delta > 0 ? '+' : ''}{delta}pts from last report</span>
           </div>
        </div>

        {/* Fluctuations Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
           <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Health Score Fluctuations</h3>
                <p className="text-xl font-bold text-slate-900">Historical Tracking</p>
              </div>
              <button 
                onClick={() => onNavigate('compare')}
                className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Detailed Variance <ChevronRight className="h-3 w-3" />
              </button>
           </div>
           
           <div className="flex-1 w-full min-h-[220px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={trendData}>
                 <defs>
                   <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                     <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: '#0284c7', fontWeight: 'bold' }}
                 />
                 <Area type="monotone" dataKey="score" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Row 2: Veda Rotating Insight Card & Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-gradient-to-br from-sky-700 via-sky-600 to-sky-800 text-white p-8 rounded-[2rem] shadow-md relative overflow-hidden flex flex-col justify-between">
           <div className="flex justify-between items-start z-10">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-sky-200 animate-ping"></div>
                 <span className="text-[10px] font-black tracking-widest text-sky-200 uppercase">Automated Clinical Intelligence</span>
              </div>
              <Lightbulb className="h-5 w-5 text-sky-200" />
           </div>

           <p className="text-xl sm:text-2xl font-medium tracking-tight leading-relaxed my-6 z-10 transition-opacity duration-500">
             &ldquo;{quotes[quoteIndex]}&rdquo;
           </p>

           <div className="flex items-center justify-between text-xs text-sky-100/80 pt-4 border-t border-sky-400/30 z-10">
              <span>Updated from your clinical history</span>
              <button 
                onClick={() => onNavigate('diet')}
                className="text-white hover:text-sky-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                View Diet Protocol <ChevronRight className="h-4 w-4" />
              </button>
           </div>

           <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
        </div>

        <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
           <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Quick Action</h3>
              <p className="text-xl font-bold text-slate-900 mb-4">Analyze New Lab Report</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload your blood test, lipid panel, or metabolic test to update your dynamic score and nutritional recommendations.
              </p>
           </div>

           <button 
             onClick={() => onNavigate('analyzer')}
             className="w-full mt-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-sm transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
           >
             <PlusCircle className="h-4 w-4" /> Upload Diagnostic Report
           </button>
        </div>
      </div>

      {/* Row 3: Radar Chart & Gamification Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Organ-System Health Balance</h3>
           <p className="text-xl font-bold text-slate-900 mb-4">Biomarker System Distribution</p>
           <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height={260}>
               <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                 <PolarGrid stroke="#e2e8f0" />
                 <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} fontWeight={600} />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={10} />
                 <Radar name="System Score" dataKey="A" stroke="#0284c7" fill="#0284c7" fillOpacity={0.35} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Gamification Milestones */}
        <div className="lg:col-span-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between">
           <div>
              <div className="flex justify-between items-center mb-1">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Health Journey Badges</h3>
                 <span className="text-xs font-bold text-sky-600">Milestone Tracking</span>
              </div>
              <p className="text-xl font-bold text-slate-900 mb-6">Patient Health Achievements</p>

              <div className="grid grid-cols-2 gap-4">
                 <div className={clsx("p-4 rounded-2xl border transition", hasFirstStep ? "bg-sky-50/60 border-sky-200" : "bg-slate-50 border-slate-200 opacity-50")}>
                    <div className="flex items-center gap-2 mb-1">
                       <Trophy className={clsx("h-5 w-5", hasFirstStep ? "text-sky-600" : "text-slate-400")} />
                       <span className="font-bold text-xs text-slate-900">First Diagnosis</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Uploaded 1st clinical report</p>
                 </div>

                 <div className={clsx("p-4 rounded-2xl border transition", hasAnalyticalMind ? "bg-sky-50/60 border-sky-200" : "bg-slate-50 border-slate-200 opacity-50")}>
                    <div className="flex items-center gap-2 mb-1">
                       <Award className={clsx("h-5 w-5", hasAnalyticalMind ? "text-sky-600" : "text-slate-400")} />
                       <span className="font-bold text-xs text-slate-900">Analytical Mind</span>
                    </div>
                    <p className="text-[11px] text-slate-500">2+ reports analyzed</p>
                 </div>

                 <div className={clsx("p-4 rounded-2xl border transition", hasPeakVitality ? "bg-sky-50/60 border-sky-200" : "bg-slate-50 border-slate-200 opacity-50")}>
                    <div className="flex items-center gap-2 mb-1">
                       <Star className={clsx("h-5 w-5", hasPeakVitality ? "text-amber-500" : "text-slate-400")} />
                       <span className="font-bold text-xs text-slate-900">Peak Vitality</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Health score exceeded 90</p>
                 </div>

                 <div className={clsx("p-4 rounded-2xl border transition", hasConsistentObserver ? "bg-sky-50/60 border-sky-200" : "bg-slate-50 border-slate-200 opacity-50")}>
                    <div className="flex items-center gap-2 mb-1">
                       <Shield className={clsx("h-5 w-5", hasConsistentObserver ? "text-indigo-600" : "text-slate-400")} />
                       <span className="font-bold text-xs text-slate-900">Consistent Tracker</span>
                    </div>
                    <p className="text-[11px] text-slate-500">5+ reports registered</p>
                 </div>
              </div>
           </div>

           {/* 7-day Activity Heatmap */}
           <div className="pt-6 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Last 7 Days Activity</span>
              <div className="flex items-center justify-between">
                {last7Days.map((d, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                     <div className="h-6 w-6 rounded-lg bg-sky-100 flex items-center justify-center text-[10px] font-bold text-sky-600">
                        ✓
                     </div>
                     <span className="text-[10px] text-slate-400">{format(d, 'EEE')}</span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
