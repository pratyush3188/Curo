import { useState } from 'react';
import { GitCompare, ChevronDown, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export function CompareView({ reports }) {
  const [report1Id, setReport1Id] = useState(reports[1]?._id || reports[0]?._id || '');
  const [report2Id, setReport2Id] = useState(reports[0]?._id || '');

  const report1 = reports.find((r) => r._id === report1Id);
  const report2 = reports.find((r) => r._id === report2Id);

  const delta = (report2?.healthScore || 0) - (report1?.healthScore || 0);

  const biomarkers = [
     { name: 'Fasting Plasma Glucose', sub: 'Glycemic control baseline', ref: '70 - 99 mg/dL', base: '118 mg/dL', cur: '92 mg/dL', improved: true },
     { name: 'LDL ("Bad") Cholesterol', sub: 'Cardiovascular lipid plaque risk', ref: '< 100 mg/dL', base: '148 mg/dL', cur: '118 mg/dL', improved: true },
     { name: 'Total Cholesterol', sub: 'Overall serum lipid density', ref: '< 200 mg/dL', base: '236 mg/dL', cur: '188 mg/dL', improved: true },
     { name: 'Serum Creatinine', sub: 'Kidney glomerular filtration rate', ref: '0.7 - 1.3 mg/dL', base: '0.9 mg/dL', cur: '0.9 mg/dL', stable: true }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div>
        <div className="text-[10px] font-black tracking-widest text-sky-600 uppercase mb-1">
          Comparative Analysis
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Report Comparison</h1>
        <p className="text-slate-500 max-w-2xl text-base">
          Detailed biomarker variance analysis between selected clinical dates.
        </p>
      </div>

      <div className="bg-white rounded-[2rem] p-10 border border-slate-200 shadow-sm relative">
         {/* Top Grid Base Vs Insight */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Overall Health Score</h3>
                    <p className="text-slate-500 text-xs">Aggregate metabolic efficiency progression</p>
                  </div>
                  {delta !== 0 && (
                     <span className={clsx(
                        "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        delta > 0 ? "bg-sky-50 text-sky-600 border border-sky-200" : "bg-red-50 text-red-600"
                     )}>
                        {delta > 0 ? `+${delta} Points Improved` : `${delta} Points Variance`}
                     </span>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-8 items-center border-b border-slate-100 pb-12">
                  <div className="relative">
                     <div className="absolute top-0 right-0 p-2 bg-slate-50 rounded-xl border border-slate-200 z-10 w-full max-w-[180px]">
                       <select 
                         value={report1Id} 
                         onChange={e => setReport1Id(e.target.value)} 
                         className="w-full text-xs font-bold text-slate-600 bg-transparent outline-none uppercase tracking-widest cursor-pointer appearance-none"
                       >
                          <option value="" disabled>Select Baseline</option>
                          {reports.map(r => (
                            <option key={r._id} value={r._id}>
                              {format(new Date(r.createdAt), 'MMM dd, yyyy')}
                            </option>
                          ))}
                       </select>
                       <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                     </div>
                     <div className="text-6xl font-medium text-slate-300 mt-12 flex items-baseline gap-2">
                       {report1?.healthScore || '--'}<span className="text-2xl text-slate-200 font-bold">/100</span>
                     </div>
                     <span className="text-xs font-bold text-slate-400 mt-1 block">Baseline Assessment</span>
                  </div>
                  
                  <div className="relative">
                     <div className="absolute top-0 right-0 p-2 bg-sky-50 rounded-xl border border-sky-200 w-full max-w-[180px] z-10">
                       <select 
                         value={report2Id} 
                         onChange={e => setReport2Id(e.target.value)} 
                         className="w-full text-xs font-bold text-sky-600 bg-transparent outline-none uppercase tracking-widest cursor-pointer appearance-none"
                       >
                          <option value="" disabled>Select Current</option>
                          {reports.map(r => (
                            <option key={r._id} value={r._id}>
                              {format(new Date(r.createdAt), 'MMM dd, yyyy')}
                            </option>
                          ))}
                       </select>
                       <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sky-600 pointer-events-none" />
                     </div>
                     
                     <div className="mt-12 flex items-center gap-6">
                       <div className="text-6xl font-black text-sky-600 flex items-baseline gap-2">
                         {report2?.healthScore || '--'}<span className="text-2xl text-sky-300 font-bold">/100</span>
                       </div>
                       {delta > 0 && <div className="h-1.5 w-24 bg-sky-600 rounded-full"></div>}
                     </div>
                     <span className="text-xs font-bold text-sky-600 mt-1 block">Current Assessment</span>
                  </div>
               </div>
            </div>

            {/* Quick Insight Box */}
            <div className="bg-gradient-to-br from-sky-700 to-sky-600 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-md">
               <GitCompare className="h-6 w-6 text-white/50 mb-6" />
               <div>
                  <h3 className="text-lg font-bold mb-3">Clinical Insight Summary</h3>
                  <p className="text-sky-100/90 text-xs leading-relaxed mb-6">
                    Biomarker evaluation indicates favorable lipid stabilization. Fasting glucose parameters demonstrate positive convergence toward physiological reference standards.
                  </p>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-sky-200">Validated by Curo Engine</span>
               <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full border-4 border-white/5 pointer-events-none"></div>
            </div>
         </div>

         {/* Key Biomarkers Table */}
         <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Key Biomarkers Delta</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
               <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                     <tr>
                        <th className="p-4">Biomarker</th>
                        <th className="p-4">Reference Range</th>
                        <th className="p-4">Baseline Result</th>
                        <th className="p-4">Current Result</th>
                        <th className="p-4">Trajectory Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                     {biomarkers.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                           <td className="p-4">
                              <p className="font-bold text-slate-900">{b.name}</p>
                              <p className="text-[11px] text-slate-400">{b.sub}</p>
                           </td>
                           <td className="p-4 text-slate-500">{b.ref}</td>
                           <td className="p-4 font-bold text-slate-600">{b.base}</td>
                           <td className="p-4 font-bold text-sky-600">{b.cur}</td>
                           <td className="p-4">
                              {b.improved && (
                                 <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                    ✓ Improved
                                 </span>
                              )}
                              {b.stable && (
                                 <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                    &bull; Maintained
                                 </span>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
