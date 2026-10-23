import { useState, useEffect } from 'react';
import { 
  Building, MapPin, Search, Star, Phone, Calendar, 
  Bed, AlertCircle, FileText, Activity, Shield, Users, 
  Video, X, CheckCircle2, ChevronRight 
} from 'lucide-react';
import api from '../../api/client';

// eslint-disable-next-line no-unused-vars
export function HospitalsView({ user, onBookSuccess }) {
  const [hospitals, setHospitals] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Dedicated Detailed Hospital Page View state
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [hospitalDetail, setHospitalDetail] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Booking Modal
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    consultationType: 'offline',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '11:00 AM',
    reasonForVisit: 'Specialist Consultation',
    notes: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState('');

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hospitals?locality=${selectedLocality}`);
      const hospList = Array.isArray(res.data) ? res.data : (res.data?.hospitals || []);
      setHospitals(hospList);
      if (res.data?.localities && res.data.localities.length > 0) {
        setLocalities(res.data.localities);
      } else {
        const extractedLocs = Array.from(
          new Set(hospList.map((h) => h.locality || h.city).filter(Boolean))
        );
        setLocalities(extractedLocs);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [selectedLocality]);

  const handleOpenHospitalDetail = async (hospital) => {
    setSelectedHospital(hospital);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/hospitals/${hospital._id}`);
      if (res.data) {
        setHospitalDetail(res.data);
      }
    } catch {
      // Fallback
      setHospitalDetail({
        hospital,
        userAppointments: [],
        userReports: [],
        totalVisits: 0,
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenBooking = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      await api.post('/appointments', {
        institutionType: 'hospital',
        institutionId: selectedHospital._id,
        institutionName: selectedHospital.name,
        doctorName: selectedDoctor.name,
        doctorSpecialization: selectedDoctor.specialization,
        consultationType: bookingForm.consultationType,
        appointmentDate: bookingForm.appointmentDate,
        timeSlot: bookingForm.timeSlot,
        reasonForVisit: bookingForm.reasonForVisit,
        notes: bookingForm.notes,
      });

      setBookingModal(false);
      setToast(`Hospital appointment confirmed with ${selectedDoctor.name}!`);
      setTimeout(() => setToast(''), 4000);
      if (onBookSuccess) onBookSuccess();
      if (selectedHospital) handleOpenHospitalDetail(selectedHospital);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book hospital appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.locality.toLowerCase().includes(search.toLowerCase()) ||
    h.departments?.some(d => d.toLowerCase().includes(search.toLowerCase())) ||
    h.doctors?.some(doc => doc.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Render Full Dedicated Hospital Detail Page if selected
  if (selectedHospital) {
    const hosp = hospitalDetail?.hospital || selectedHospital;
    const visits = hospitalDetail?.userAppointments || [];
    const reports = hospitalDetail?.userReports || [];

    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
        {toast && (
          <div className="fixed top-6 right-6 z-50 bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-sky-500/20 text-xs animate-in fade-in slide-in-from-top-4">
            ✓ {toast}
          </div>
        )}

        {/* Back Button */}
        <div>
          <button
            onClick={() => setSelectedHospital(null)}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1.5 cursor-pointer"
          >
            &larr; Back to Hospital Directory
          </button>
        </div>

        {/* Top Hospital Hero & Image Display (Exact requirement: Image, about hospital, patient visits, doctor info) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Hospital Image on Side (5 cols) */}
            <div className="lg:col-span-5 relative min-h-[340px]">
              <img
                src={hosp.imageUrl}
                alt={hosp.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-[10px] font-bold tracking-wider uppercase text-sky-300">NABH & JCI Accredited Hospital</span>
                <p className="text-sm font-bold">{hosp.locality}, {hosp.city}</p>
              </div>
            </div>

            {/* About Hospital & Key Stats (7 cols) */}
            <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full">
                    Tertiary Healthcare Centre
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <Star className="h-4 w-4 fill-current" /> {hosp.rating} Rating
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {hosp.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0" /> {hosp.address}
                </p>
                <p className="text-xs text-slate-600 mt-4 leading-relaxed font-normal">
                  {hosp.overview}
                </p>
              </div>

              {/* Quick Facility Metrics */}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Beds</span>
                  <p className="text-lg font-black text-slate-900">{hosp.totalBeds}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ICU Available</span>
                  <p className="text-lg font-black text-emerald-600">{hosp.icuBedsAvailable} Beds</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency</span>
                  <p className="text-xs font-black text-rose-600 mt-1">{hosp.emergencyHelpline}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Patient Common Interaction History with this Hospital */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* User's History at this Hospital (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase">Personal Medical Record</span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">Your History at this Hospital</h3>
              <p className="text-xs text-slate-500">Record of visits, past consultations, and diagnostic encounters.</p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-800">Total Visits Recorded</span>
                <p className="text-2xl font-black text-sky-900 mt-0.5">{visits.length} Visit(s)</p>
              </div>
              <Activity className="h-8 w-8 text-sky-600 opacity-60" />
            </div>

            {/* Visit Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Past Appointments & Status</h4>
              {visits.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                  No prior appointment history logged at this hospital yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map((apt) => (
                    <div key={apt._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-900">{apt.doctorName}</span>
                        <span className="text-emerald-700 capitalize text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{apt.reasonForVisit} &bull; {apt.consultationType} visit</p>
                      <p className="text-[10px] font-mono text-slate-400">{apt.appointmentDate} at {apt.timeSlot}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Common Diagnostic Reports Linked */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Linked Lab Reports ({reports.length})</h4>
              {reports.length === 0 ? (
                <p className="text-xs text-slate-400">No linked lab reports.</p>
              ) : (
                <div className="space-y-2">
                  {reports.slice(0, 3).map((r) => (
                    <div key={r._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 truncate">{r.fileName}</span>
                      <span className="font-extrabold text-sky-600">{r.healthScore}/100</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hospital Doctors & Departments (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase">Consulting Faculty</span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">Specialist Doctors & Faculty</h3>
              <p className="text-xs text-slate-500">Book direct online tele-consults or in-person hospital visits.</p>
            </div>

            {/* Department Tags */}
            <div className="flex flex-wrap gap-2">
              {hosp.departments?.map((dept, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">
                  {dept}
                </span>
              ))}
            </div>

            {/* Doctors List */}
            <div className="space-y-4">
              {hosp.doctors?.map((doc, idx) => (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
                        {doc.department}
                      </span>
                    </div>
                    <p className="text-xs text-sky-700 font-semibold">{doc.specialization}</p>
                    <p className="text-[11px] text-slate-500">
                      {doc.qualification} &bull; {doc.experienceYears} Years Clinical Exp.
                    </p>
                    <p className="text-[11px] font-bold text-slate-700">
                      Consultation Fee: ₹{doc.consultationFee}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenBooking(doc)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Book Consultation
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {bookingModal && selectedDoctor && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-slate-100 space-y-6 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setBookingModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">
                  Hospital Specialist Booking
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">
                  Book with {selectedDoctor.name}
                </h2>
                <p className="text-xs text-slate-500">{selectedDoctor.specialization} &bull; {selectedHospital.name}</p>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Consultation Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingForm({ ...bookingForm, consultationType: 'offline' })}
                      className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        bookingForm.consultationType === 'offline'
                          ? 'bg-sky-50 border-sky-500 text-sky-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building className="h-4 w-4" /> Hospital OPD Visit
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingForm({ ...bookingForm, consultationType: 'online' })}
                      className={`py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        bookingForm.consultationType === 'online'
                          ? 'bg-sky-50 border-sky-500 text-sky-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Video className="h-4 w-4" /> Video Tele-Consult
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Date of Visit
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingForm.appointmentDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Appointment Slot
                    </label>
                    <select
                      value={bookingForm.timeSlot}
                      onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
                    >
                      {selectedDoctor.availableSlots?.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Presenting Symptoms / Purpose
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chest pain evaluation, second surgical opinion..."
                    value={bookingForm.reasonForVisit}
                    onChange={(e) => setBookingForm({ ...bookingForm, reasonForVisit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Special Instructions / Notes
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Prior surgeries, allergies, or diagnostic scans you will bring..."
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500"
                  />
                </div>

                <div className="p-3 bg-sky-50 rounded-2xl flex items-center justify-between text-xs text-sky-800 font-bold">
                  <span>Specialist Consultation Fee:</span>
                  <span>₹{selectedDoctor.consultationFee}</span>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md shadow-sky-500/20 text-xs transition cursor-pointer"
                >
                  {bookingLoading ? 'Scheduling...' : 'Confirm Hospital Booking'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Hospital Directory Grid View
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      <div>
        <div className="text-[10px] font-black tracking-widest text-sky-600 uppercase mb-1">
          Tertiary Care Network
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Hospitals & Medical Centers</h1>
        <p className="text-slate-500 max-w-2xl text-base">
          Browse verified hospitals in your locality, review clinical faculties, and view your linked health history.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <MapPin className="h-4 w-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 pl-10 pr-8 py-2.5 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">📍 All Hospital Localities</option>
              {localities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by hospital name, department, or surgeon..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500"
            />
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing {filtered.length} Hospitals
        </span>
      </div>

      {/* Hospitals Grid */}
      {loading ? (
        <div className="bg-white p-16 rounded-[2rem] border border-slate-200 text-center text-xs font-bold text-slate-400">
          Loading hospital directory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-16 rounded-[2rem] border border-slate-200 text-center space-y-3">
          <Building className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No hospitals found for this filter</h3>
          <p className="text-xs text-slate-500">Please select another locality or clear your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((hosp) => (
            <div 
              key={hosp._id} 
              className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={hosp.imageUrl}
                    alt={hosp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-sky-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {hosp.locality}
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-current" /> {hosp.rating}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{hosp.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{hosp.overview}</p>
                  
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {hosp.departments?.slice(0, 3).map((dept, i) => (
                      <span key={i} className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                        {dept}
                      </span>
                    ))}
                    {(hosp.departments?.length || 0) > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold self-center">
                        +{(hosp.departments?.length || 0) - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <button
                  onClick={() => handleOpenHospitalDetail(hosp)}
                  className="w-full py-3 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  View Hospital Profile & Doctors &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
