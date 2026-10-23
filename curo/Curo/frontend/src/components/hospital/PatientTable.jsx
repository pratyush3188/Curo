import { useState } from 'react';
import { Search, Filter, Bed, Clock, User, ChevronRight, Stethoscope } from 'lucide-react';
import TriageBadge from './TriageBadge';

export default function PatientTable({
  patients = [],
  onSelectPatient,
  selectedPatientId,
  showDoctorColumn = true,
  emptyMessage = 'No hospital patients currently in queue.',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [triageFilter, setTriageFilter] = useState('all');

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.bedNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTriage =
      triageFilter === 'all' ||
      patient.triageLevel.toLowerCase() === triageFilter.toLowerCase();

    return matchesSearch && matchesTriage;
  });

  const triageTabs = [
    { id: 'all', label: 'All Cases' },
    { id: 'critical', label: 'Critical' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'semi-urgent', label: 'Semi-Urgent' },
    { id: 'non-urgent', label: 'Non-Urgent' },
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
      {/* Controls & Filter Bar */}
      <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8F9FA]/50">
        {/* Triage filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {triageTabs.map((tab) => {
            const isActive = triageFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTriageFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#2E5F8A] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60 bg-white border border-[#E2E8F0]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, complaint, bed..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E5F8A] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Patient Name & Demographics</th>
              <th className="py-3 px-4">Chief Complaint</th>
              <th className="py-3 px-4">Triage Priority</th>
              <th className="py-3 px-4">Bed Location</th>
              <th className="py-3 px-4">Wait Time</th>
              {showDoctorColumn && <th className="py-3 px-4">Attending Doctor</th>}
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={showDoctorColumn ? 8 : 7} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto text-center space-y-1">
                    <User className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-sm font-semibold text-slate-600">No Patients Found</div>
                    <div className="text-xs text-slate-400">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => {
                const isSelected = selectedPatientId === patient._id;
                const waitMins = patient.waitTime || patient.calculatedWaitTime || 0;
                return (
                  <tr
                    key={patient._id}
                    onClick={() => onSelectPatient && onSelectPatient(patient)}
                    className={`transition-colors cursor-pointer hover:bg-[#F8F9FA] ${
                      isSelected ? 'bg-[#EBF3FA]/70 border-l-4 border-l-[#2E5F8A]' : ''
                    }`}
                  >
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
                      <TriageBadge level={patient.triageLevel} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-medium text-[11px]">
                        <Bed className="w-3 h-3 text-slate-400" />
                        {patient.bedNumber || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-medium ${
                        waitMins > 60 ? 'text-rose-600 font-semibold' : 'text-slate-600'
                      }`}>
                        <Clock className="w-3 h-3 text-slate-400" />
                        {waitMins} mins
                      </span>
                    </td>
                    {showDoctorColumn && (
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {patient.assignedDoctor?.name || 'Pending Allocation'}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        patient.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : patient.status === 'in-treatment'
                          ? 'bg-blue-100 text-blue-800'
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
                        className="inline-flex items-center gap-1 text-[#2E5F8A] hover:text-[#244C6E] font-semibold text-xs"
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
