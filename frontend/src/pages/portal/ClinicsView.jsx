import { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Search, Star, Phone, Calendar, 
  Clock, X, CheckCircle2, ChevronRight, Stethoscope, DollarSign
} from 'lucide-react';
import api from '../../api/client';

export function ClinicsView({ user, onBookSuccess }) {
  const [clinics, setClinics] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [bookingModal, setBookingModal] = useState(false);
  const [activeClinic, setActiveClinic] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    consultationType: 'offline', // 'online' | 'offline'
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    reasonForVisit: 'General Consultation',
    notes: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState('');

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/clinics?locality=${selectedLocality}`);
      const clinicList = Array.isArray(res.data) ? res.data : (res.data?.clinics || []);
      setClinics(clinicList);
      if (res.data?.localities && res.data.localities.length > 0) {
        setLocalities(res.data.localities);
      } else {
        const extractedLocs = Array.from(
          new Set(
            clinicList.map((c) => {
              if (c.locality) return c.locality;
              if (c.city) return c.city;
              if (typeof c.address === 'object' && c.address?.city) return c.address.city;
              return null;
            }).filter(Boolean)
          )
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
    fetchClinics();
  }, [selectedLocality]);

  const handleOpenBooking = (clinic, doctor) => {
    setActiveClinic(clinic);
    setSelectedDoctor(doctor || {
      name: 'On-Duty OPD Physician',
      specialization: clinic.specialties?.[0] || 'General Medicine',
      consultationFee: clinic.services?.[0]?.consultationFee || 500,
    });
    setBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      await api.post('/appointments', {
        institutionType: 'clinic',
        institutionId: activeClinic._id || activeClinic.id,
        institutionName: activeClinic.name,
        doctorName: selectedDoctor.name || selectedDoctor.fullName || 'Attending Physician',
        doctorSpecialization: selectedDoctor.specialization || 'General OPD',
        consultationType: bookingForm.consultationType,
        appointmentDate: bookingForm.appointmentDate,
        timeSlot: bookingForm.timeSlot,
        reasonForVisit: bookingForm.reasonForVisit,
        notes: bookingForm.notes,
      });

      setBookingModal(false);
      setToast(`Appointment confirmed with ${selectedDoctor.name || 'doctor'}!`);
      setTimeout(() => setToast(''), 4000);
      if (onBookSuccess) onBookSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const searchLower = (search || '').toLowerCase();
  const filtered = clinics.filter((c) => {
    const nameMatch = (c.name || '').toLowerCase().includes(searchLower);
    const locString = (typeof c.address === 'object' ? `${c.address.street || ''} ${c.address.city || ''}` : (c.address || '')) + ' ' + (c.locality || c.city || '');
    const locMatch = locString.toLowerCase().includes(searchLower);
    const specialtyMatch = (c.specialties || []).some((s) => (s || '').toLowerCase().includes(searchLower));
    const doctorMatch = (c.doctors || []).some(
      (d) =>
        (d.name || d.fullName || '').toLowerCase().includes(searchLower) ||
        (d.specialization || d.specialty || '').toLowerCase().includes(searchLower)
    );
    return nameMatch || locMatch || specialtyMatch || doctorMatch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-sky-500/20 text-xs animate-in fade-in slide-in-from-top-4">
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="text-[10px] font-black tracking-widest text-sky-600 uppercase mb-1">
          Community Health Network
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">Find Nearby Clinics & Book Doctors</h1>
        <p className="text-slate-500 max-w-2xl text-base">
          Filter by your locality to explore licensed neighborhood clinics, view practicing doctors, and schedule online/in-person appointments.
        </p>
      </div>

      {/* Locality & Search Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px]">
            <MapPin className="h-4 w-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 pl-10 pr-8 py-2.5 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">📍 All Localities / Neighborhoods</option>
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
              placeholder="Search clinic name, doctor, or treatment..."
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400 px-3">
          Showing {filtered.length} Registered Clinics
        </span>
      </div>

      {/* Clinics List */}
      {loading ? (
        <div className="bg-white p-16 rounded-[2rem] border border-slate-200 text-center text-xs font-bold text-slate-400">
          Loading clinics in selected locality...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-16 rounded-[2rem] border border-slate-200 text-center space-y-3">
          <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No clinics found in this locality</h3>
          <p className="text-xs text-slate-500">Try selecting &quot;All Localities&quot; from the filter above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((clinic) => {
            const clinicCity = (typeof clinic.address === 'object' ? clinic.address?.city : null) || clinic.city || clinic.locality || 'Mumbai';
            const clinicAddress = typeof clinic.address === 'object'
              ? `${clinic.address?.street || ''}, ${clinic.address?.city || clinicCity}`
              : (clinic.address || `${clinicCity}, ${clinic.state || 'Maharashtra'}`);

            const hasDoctors = Array.isArray(clinic.doctors) && clinic.doctors.length > 0;

            return (
              <div 
                key={clinic._id || clinic.id} 
                className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Header Banner */}
                <div>
                  <div className="relative h-44 overflow-hidden bg-gradient-to-r from-teal-600 via-sky-600 to-blue-700 flex flex-col justify-between p-6 text-white">
                    <div className="flex items-center justify-between">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {clinicCity}
                      </span>
                      <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-200 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-current" /> {clinic.rating || '4.8'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-teal-200 tracking-wider">
                        {clinic.category || 'Multi-Specialty Polyclinic'}
                      </span>
                      <h3 className="text-2xl font-black text-white">{clinic.name}</h3>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {clinic.description || clinic.overview || 'Comprehensive outpatient healthcare clinic offering multi-specialty medical consultations, diagnostic review, and clinical triage.'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span>{clinicAddress}</span>
                      </p>
                    </div>

                    {/* Specialties Pills */}
                    {Array.isArray(clinic.specialties) && clinic.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {clinic.specialties.map((s, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Doctors List inside clinic */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                        {hasDoctors ? `Available Practicing Doctors (${clinic.doctors.length})` : 'Clinic OPD Consultation'}
                      </span>
                      <div className="space-y-2.5">
                        {hasDoctors ? (
                          clinic.doctors.map((doc, idx) => (
                            <div 
                              key={idx} 
                              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-sky-50/50 transition-colors"
                            >
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">{doc.name || doc.fullName}</h4>
                                <p className="text-[11px] text-sky-600 font-semibold">{doc.specialization || doc.specialty || 'General OPD'}</p>
                                <p className="text-[10px] text-slate-400">
                                  {doc.qualification || 'MBBS'} &bull; {doc.experienceYears || 5}y exp &bull; ₹{doc.consultationFee || 500}
                                </p>
                              </div>

                              <button
                                onClick={() => handleOpenBooking(clinic, doc)}
                                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Calendar className="h-3.5 w-3.5" /> Book
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center justify-between gap-3">
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">General OPD Physician & Triage</h4>
                              <p className="text-[11px] text-teal-700 font-semibold">Walk-in & Online Appointments Available</p>
                              <p className="text-[10px] text-slate-500">Standard Consultation Fee: ₹{clinic.services?.[0]?.consultationFee || 500}</p>
                            </div>

                            <button
                              onClick={() => handleOpenBooking(clinic, null)}
                              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Calendar className="h-3.5 w-3.5" /> Book OPD
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinic Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {clinic.phone || '+91 83026 11592'}
                  </span>
                  <span className="text-teal-700 font-bold">Open Mon - Sat</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Booking Modal */}
      {bookingModal && selectedDoctor && activeClinic && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Confirm Clinic Appointment</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeClinic.name} &bull; {selectedDoctor.name || selectedDoctor.fullName || 'Doctor'}</p>
              </div>
              <button 
                onClick={() => setBookingModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Doctor & Specialty
                </label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                  {selectedDoctor.name || selectedDoctor.fullName || 'Attending Physician'} ({selectedDoctor.specialization || 'General OPD'})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingForm.appointmentDate}
                    onChange={e => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Preferred Time Slot
                  </label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={e => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="10:00 AM">10:00 AM - Morning</option>
                    <option value="11:30 AM">11:30 AM - Morning</option>
                    <option value="02:00 PM">02:00 PM - Afternoon</option>
                    <option value="04:30 PM">04:30 PM - Evening</option>
                    <option value="06:00 PM">06:00 PM - Evening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Reason for Visit / Symptoms
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Health checkup, blood pressure, fever, cough"
                  value={bookingForm.reasonForVisit}
                  onChange={e => setBookingForm({ ...bookingForm, reasonForVisit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBookingModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-500/20 cursor-pointer disabled:opacity-50"
                >
                  {bookingLoading ? 'Confirming...' : 'Confirm Consultation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
