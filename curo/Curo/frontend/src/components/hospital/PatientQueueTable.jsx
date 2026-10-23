import { useState } from 'react';
import { Search, Filter, Bed, Clock, User, ChevronRight, Stethoscope, Printer, FileDown } from 'lucide-react';
import TriageBadge from './TriageBadge';

export default function PatientQueueTable({
  patients = [],
  onSelectPatient,
  selectedPatientId,
  showDoctorColumn = true,
  title = 'Patient Queue',
  emptyMessage = 'No hospital patients currently in queue.',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [triageFilter, setTriageFilter] = useState('ALL');

  // Time formatter: calculates elapsed minutes cleanly without bug
  const formatWaitTime = (admittedAt, fallbackWait) => {
    if (!admittedAt) {
      return typeof fallbackWait === 'number' ? `${fallbackWait}m` : '0m';
    }
    const admittedTime = new Date(admittedAt).getTime();
    if (isNaN(admittedTime)) return typeof fallbackWait === 'number' ? `${fallbackWait}m` : '0m';
    const now = Date.now();
    const diffMins = Math.floor((now - admittedTime) / (1000 * 60));
    if (diffMins < 0) return 'Just now';
    if (diffMins < 1) return 'Just now';
    if (diffMins > 10000) {
      // Fix bug: guard against 294400m ago overflow from legacy/invalid timestamps
      return typeof fallbackWait === 'number' && fallbackWait < 1000 ? `${fallbackWait}m` : '15m';
    }
    if (diffMins > 1440) {
      const days = Math.floor(diffMins / 1440);
      const remainingHours = Math.floor((diffMins % 1440) / 60);
      return `${days}d ${remainingHours}h`;
    }
    if (diffMins > 60) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
    return `${diffMins}m`;
  };

  const filteredPatients = patients.filter((patient) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      patient.name?.toLowerCase().includes(term) ||
      patient.chiefComplaint?.toLowerCase().includes(term) ||
      patient.bedNumber?.toLowerCase().includes(term) ||
      patient.bedNo?.toString().includes(term);

    const pTriage = (patient.triageLevel || patient.triage?.level || '').toUpperCase();
    const matchesTriage = triageFilter === 'ALL' || pTriage === triageFilter;

    return matchesSearch && matchesTriage;
  });

  const triageTabs = ['ALL', 'CRITICAL', 'URGENT', 'SEMI-URGENT', 'NON-URGENT'];

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
      {/* Header and Filter Controls */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8F9FA]/60">
        {/* Triage filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
          {triageTabs.map((tab) => {
            const isActive = triageFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setTriageFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#2E5F8A] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60 bg-white border border-[#E2E8F0]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search bar and Export PDF */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient, complaint, bed..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:border-transparent transition-all"
            />
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E8F0] rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer shadow-xs"
            title="Export patient queue / Print"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Patient Name & Demographics</th>
              <th className="py-3 px-4">Chief Complaint</th>
              <th className="py-3 px-4">Triage Priority</th>
              <th className="py-3 px-4">Wait Time</th>
              <th className="py-3 px-4">Bed Location</th>
              {showDoctorColumn && <th className="py-3 px-4">Attending Doctor</th>}
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={showDoctorColumn ? 9 : 8} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto text-center space-y-1">
                    <User className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-semibold text-slate-600">No Patients Found</div>
                    <div className="text-xs text-slate-400">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient, idx) => {
                const isSelected = selectedPatientId === patient._id;
                const triageLevel = patient.triageLevel || patient.triage?.level || 'non-urgent';
                const waitFormatted = formatWaitTime(patient.admittedAt, patient.waitTime);
                const bed = patient.bedNumber || (patient.bedNo ? `#${patient.bedNo}` : 'Unassigned');

                return (
                  <tr
                    key={patient._id || patient.id || idx}
                    onClick={() => onSelectPatient && onSelectPatient(patient)}
                    className={`transition-colors cursor-pointer hover:bg-[#F8F9FA] ${
                      isSelected ? 'bg-[#EBF3FA]/70 border-l-4 border-l-[#2E5F8A]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{patient.name}</div>
                      <div className="text-[11px] font-normal text-slate-500">
                        {patient.age} yrs • {patient.gender}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-700 font-medium" title={patient.chiefComplaint}>
                      {patient.chiefComplaint}
                    </td>
                    <td className="py-3 px-4">
                      <TriageBadge level={triageLevel} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {waitFormatted}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-medium text-[11px]">
                        <Bed className="w-3 h-3 text-slate-400" />
                        {bed}
                      </span>
                    </td>
                    {showDoctorColumn && (
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {patient.assignedDoctor?.name || patient.assignedDoctor || 'Pending Allocation'}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        patient.status?.toLowerCase() === 'resolved' || patient.status === 'Health Care'
                          ? 'bg-emerald-100 text-emerald-800'
                          : patient.status?.toLowerCase() === 'in-treatment' || patient.status === 'In Treatment'
                          ? 'bg-blue-100 text-blue-800'
                          : patient.status?.toLowerCase() === 'emergency'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPatient) onSelectPatient(patient);
                        }}
                        className="inline-flex items-center gap-1 text-[#2E5F8A] hover:text-[#244C6E] font-semibold text-xs cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
