import { useState } from 'react';
import { 
  FileText, Search, Download, Trash2, Bell, ChevronDown, 
  Pin, Share2, Plus 
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import api from '../../api/client';

export function ReportsView({ reports, onRefresh, onNavigate }) {
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [filterRange, setFilterRange] = useState('All Time');

  const handleDeleteReport = async (id) => {
    if (window.confirm("Are you sure you want to completely delete this diagnostic report?")) {
      try {
        await api.delete(`/reports/${id}`);
        setToast('Report removed successfully.');
        setTimeout(() => setToast(''), 3000);
        onRefresh();
      } catch {
        alert('Failed to delete report.');
      }
    }
  };

  const handlePin = async (id) => {
    try {
      await api.patch(`/reports/${id}/pin`);
      onRefresh();
    } catch {
      // Ignore
    }
  };

  const downloadSimplified = (r) => {
     if (!r.simplifiedMarkdown) return alert('Simplified report is not available for this record.');
     const blob = new Blob([r.simplifiedMarkdown], { type: 'text/plain' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `Curo-Simplified-${r.fileName || 'Report'}.txt`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

  const handleShare = (id) => {
     navigator.clipboard.writeText(`${window.location.origin}/portal?report=${id}`);
     setToast('Direct secure report link copied to clipboard!');
     setTimeout(() => setToast(''), 3000);
  };

  const filtered = reports.filter(r => 
    r.fileName?.toLowerCase().includes(search.toLowerCase()) || 
    r.reportType?.toLowerCase().includes(search.toLowerCase()) ||
    r.symptoms?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
         <div className="fixed top-6 right-6 z-50 bg-sky-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-sky-500/20 animate-in fade-in slide-in-from-top-4 text-xs">
            {toast}
         </div>
      )}

      {/* Search Header */}
      <div className="flex justify-between items-center bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200">
         <div className="relative flex-1 max-w-2xl">
           <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <input 
             type="text"
             value={search}
             onChange={e => setSearch(e.target.value)}
             placeholder="Search reports by file name, category or finding..."
             className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-0 outline-none text-slate-900 text-xs font-medium"
           />
         </div>
         <div className="flex items-center gap-4 px-4 border-l border-slate-200">
           <button className="relative text-slate-400 hover:text-sky-600 transition-colors cursor-pointer">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
           </button>
           <button 
             onClick={() => onNavigate('analyzer')}
             className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
           >
             <Plus className="h-4 w-4" /> New Report
           </button>
         </div>
      </div>

      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Medical Reports History</h1>
        <p className="text-slate-500 text-sm">Review and manage clinical diagnostic findings from AI-assisted lab analyses.</p>
      </div>

      {/* Filter range bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timeframe:</span>
            <div className="relative min-w-[160px]">
              <select 
                value={filterRange}
                onChange={e => setFilterRange(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl font-bold text-xs text-slate-700 outline-none cursor-pointer"
              >
                 <option>All Time</option>
                 <option>Last 30 Days</option>
                 <option>Last 6 Months</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
         </div>

         <div className="text-xs font-bold text-slate-500">
            Showing {filtered.length} of {reports.length} Archival Records
         </div>
      </div>

      {/* Reports Cards Grid (medsimplify styling) */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border border-slate-200 text-center space-y-3">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No diagnostic reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload a laboratory or clinical report via the Analyzer tab to begin automated tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => (
            <div 
              key={r._id} 
              className={clsx(
                "bg-white rounded-3xl p-6 border transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between relative group",
                r.pinned ? "border-sky-300 bg-gradient-to-br from-white to-sky-50/20" : "border-slate-200"
              )}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePin(r._id)}
                      className={clsx("cursor-pointer transition-colors", r.pinned ? "text-amber-500" : "text-slate-300 hover:text-amber-400")}
                      title={r.pinned ? "Unpin Report" : "Pin Report"}
                    >
                      <Pin className="h-4 w-4 fill-current" />
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                      {r.reportType || 'Blood Test'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    {format(new Date(r.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1.5 truncate" title={r.fileName}>
                  {r.fileName}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {r.diseasePrediction || 'Standard routine metabolic analysis with AI clinical review.'}
                </p>

                <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between mb-4 border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase">Health Score</span>
                  <span className="text-lg font-black text-sky-600">{r.healthScore || 85}/100</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => downloadSimplified(r)}
                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                    title="Download Plain Text Summary"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleShare(r._id)}
                    className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                    title="Share Link"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteReport(r._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <button 
                  onClick={() => onNavigate('analyzer', r)}
                  className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
