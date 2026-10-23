import { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Search, Star, Phone, Calendar, 
  Clock, Video, UserCheck, X, CheckCircle2, ChevronRight 
} from 'lucide-react';
import api from '../../api/client';

// eslint-disable-next-line no-unused-vars
export function ClinicsView({ user, onBookSuccess }) {
  const [clinics, setClinics] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected clinic modal / detail page view
  const [activeClinic, setActiveClinic] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);

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
          new Set(clinicList.map((c) => c.locality || c.city).filter(Boolean))
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
    setSelectedDoctor(doctor);
    setBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      await api.post('/appointments', {
        institutionType: 'clinic',
        institutionId: activeClinic._id,
        institutionName: activeClinic.name,
        doctorName: selectedDoctor.name,
        doctorSpecialization: selectedDoctor.specialization,
        consultationType: bookingForm.consultationType,
        appointmentDate: bookingForm.appointmentDate,
        timeSlot: bookingForm.timeSlot,
        reasonForVisit: bookingForm.reasonForVisit,
        notes: bookingForm.notes,
      });

      setBookingModal(false);
      setToast(`Appointment confirmed with ${selectedDoctor.name}!`);
      setTimeout(() => setToast(''), 4000);
      if (onBookSuccess) onBookSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filtered = clinics.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.locality.toLowerCase().includes(search.toLowerCase()) ||
    c.doctors?.some(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.specialization.toLowerCase().includes(search.toLowerCase()))
  );

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
              placeholder="Search by clinic name, doctor, or treatment..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-sky-500"
            />
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing {filtered.length} Verified Clinics
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
          {filtered.map((clinic) => (
            <div 
              key={clinic._id} 
              className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image & Header */}
              <div>
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img
                    src={clinic.imageUrl}
                    alt={clinic.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-sky-700 flex items-center gap-1 shadow-xs">
                    <MapPin className="h-3 w-3" /> {clinic.locality}, {clinic.city}
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 flex items-center gap-1 shadow-xs">
                    <Star className="h-3.5 w-3.5 fill-current" /> {clinic.rating}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{clinic.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{clinic.overview}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" /> {clinic.address}
                    </p>
                  </div>

                  {/* Doctors List inside clinic */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Available Practicing Doctors ({clinic.doctors?.length || 0})
                    </span>
                    <div className="space-y-2.5">
                      {clinic.doctors?.map((doc, idx) => (
                        <div 
                          key={idx} 
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-sky-50/50 transition-colors"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                            <p className="text-[11px] text-sky-600 font-semibold">{doc.specialization}</p>
                            <p className="text-[10px] text-slate-400">{doc.qualification} &bull; {doc.experienceYears}y exp &bull; ₹{doc.consultationFee}</p>
                          </div>

                          <button
                            onClick={() => handleOpenBooking(clinic, doc)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Calendar className="h-3.5 w-3.5" /> Book
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinic Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {clinic.phone}
                </span>
                <span className="text-sky-700 font-bold">Open Daily</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Booking Modal */}
      {bookingModal && selectedDoctor && activeClinic && (
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
                Schedule Medical Consultation
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                Book with {selectedDoctor.name}
              </h2>
              <p className="text-xs text-slate-500">{selectedDoctor.specialization} &bull; {activeClinic.name}</p>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Consultation Type Selector (Online vs Offline) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Consultation Mode
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
                    <Building2 className="h-4 w-4" /> In-Clinic Visit
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
                    <Video className="h-4 w-4" /> Online Tele-Consult
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Appointment Date
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
                    Time Slot
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
                  Reason for Consultation / Symptoms
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up consultation, fever, persistent cough..."
                  value={bookingForm.reasonForVisit}
                  onChange={(e) => setBookingForm({ ...bookingForm, reasonForVisit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Additional Notes for Doctor (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Any pre-existing conditions or medications you take..."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-2xl flex items-center justify-between text-xs text-sky-800 font-bold">
                <span>Estimated Consultation Fee:</span>
                <span>₹{selectedDoctor.consultationFee}</span>
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-md shadow-sky-500/20 text-xs transition cursor-pointer"
              >
                {bookingLoading ? 'Confirming Appointment...' : 'Confirm Appointment Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
