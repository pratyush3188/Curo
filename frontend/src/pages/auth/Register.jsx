import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authLightHero from '../../assets/auth_light_hero.jpg';

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Core Credentials
    name: '',
    email: '',
    password: '',
    role: 'patient',
    phone: '',
    gender: '',
    dateOfBirth: '',

    // Step 2: Address & Demographics
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',

    // Step 3 (Patient): Medical Profile
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyRelationship: '',
    medicalHistorySummary: '',

    // Step 3 (Doctor/Hospital/Clinic): Professional Profile
    specialization: '',
    licenseNumber: '',
    experienceYears: '',
    hospitalAffiliation: '',
    qualification: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
        setError('Please fill in all required account fields (Name, Email, Password).');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
    }
    setError('');
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(formData);
      // Redirect new user directly to their User Portal
      navigate('/portal');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check form values.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isHealthcareStaff = ['doctor', 'clinic', 'manager', 'hospital_admin'].includes(formData.role);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* 60% Left Side - Visual Healthcare Experience */}
      <div className="relative hidden lg:flex lg:w-[50%] xl:w-[55%] flex-col justify-between overflow-hidden bg-slate-100 p-12 xl:p-16 border-r border-slate-200">
        <img
          src={authLightHero}
          alt="Curo Healthcare Clinic Reception"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-transparent to-white/40" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              C
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-slate-900">Curo</span>
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Healthcare OS
              </span>
            </div>
          </Link>
        </div>

        {/* Dynamic Contextual Information */}
        <div className="relative z-10 max-w-xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold text-slate-700">
              Verified MongoDB Atlas Registration
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Complete profile onboarding for patient & provider safety.
          </h1>

          <p className="text-base text-slate-600 font-normal leading-relaxed">
            Every account is structured with HIPAA-ready data isolation. Patients get instant access to lab records and prescriptions; healthcare providers receive verified clinical workspaces.
          </p>

          {/* Stepper overview in left bar */}
          <div className="space-y-3 pt-4 border-t border-slate-200/80">
            <div className={`flex items-center gap-3 p-3 rounded-xl transition ${currentStep === 1 ? 'bg-blue-50 border border-blue-200' : 'bg-white/60'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                1
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Identity & Role Credentials</p>
                <p className="text-[11px] text-slate-500">Name, email, secure password & role selection</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl transition ${currentStep === 2 ? 'bg-blue-50 border border-blue-200' : 'bg-white/60'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                2
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Contact & Address Demographics</p>
                <p className="text-[11px] text-slate-500">Phone, city, state, and emergency reach</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl transition ${currentStep === 3 ? 'bg-blue-50 border border-blue-200' : 'bg-white/60'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                3
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {isHealthcareStaff ? 'Clinical Credentials & Affiliation' : 'Medical Profile & Emergency Contact'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isHealthcareStaff ? 'Medical license, specialty & hospital info' : 'Blood group, emergency contact & allergies'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs font-medium text-slate-500 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Curo Health Systems Inc.</span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
            Direct MongoDB Atlas Encryption
          </span>
        </div>
      </div>

      {/* 40% Right Side - Multi-Step Detailed Form */}
      <div className="flex-1 lg:w-[50%] xl:w-[45%] flex flex-col justify-center px-6 py-10 sm:px-12 xl:px-16 bg-white relative overflow-y-auto">
        <div className="mx-auto w-full max-w-lg space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg">
                C
              </div>
              <span className="text-xl font-bold text-slate-900">Curo</span>
            </Link>
          </div>

          {/* Stepper Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Step {currentStep} of 3
              </span>
              <span className="text-xs font-medium text-slate-500">
                {currentStep === 1 && 'Basic Account'}
                {currentStep === 2 && 'Demographics & Address'}
                {currentStep === 3 && (isHealthcareStaff ? 'Professional Details' : 'Health & Emergency')}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Create Your Account
            </h2>
            <p className="text-sm text-slate-500">
              Fill in your details to register securely in our database.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-700 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={currentStep === 3 ? handleSubmit : handleNext} className="space-y-4">
            {/* STEP 1: Basic Credentials */}
            {currentStep === 1 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Rajesh Kumar or Ananya Sharma"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@organization.com or personal@gmail.com"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Account Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor (Physician)</option>
                      <option value="clinic">Clinic Representative</option>
                      <option value="manager">Hospital Manager</option>
                      <option value="hospital_admin">Hospital Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Demographics & Address */}
            {currentStep === 2 && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="House/Apartment #, Sector, Street"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai, Delhi, Bangalore"
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Maharashtra, Karnataka"
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Zip / PIN Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      placeholder="400001"
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="India"
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Role-Specific Details */}
            {currentStep === 3 && (
              <div className="space-y-3.5">
                {!isHealthcareStaff ? (
                  // Patient Fields
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Blood Group
                        </label>
                        <select
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="Unknown">Don't know / Select</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleChange}
                          placeholder="e.g. Spouse / Parent Name"
                          className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Emergency Phone
                        </label>
                        <input
                          type="tel"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                          placeholder="+91 98765 00000"
                          className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Relationship
                        </label>
                        <input
                          type="text"
                          name="emergencyRelationship"
                          value={formData.emergencyRelationship}
                          onChange={handleChange}
                          placeholder="e.g. Father, Spouse, Friend"
                          className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                        Known Allergies or Medical History (Optional)
                      </label>
                      <textarea
                        name="medicalHistorySummary"
                        rows="2"
                        value={formData.medicalHistorySummary}
                        onChange={handleChange}
                        placeholder="e.g. Penicillin allergy, diabetic, hypertension..."
                        className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </>
                ) : (
                  // Healthcare Staff Fields
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          placeholder="e.g. Cardiology, Pediatrics, General"
                          className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          License / Registration #
                        </label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          placeholder="e.g. MCI-2023-8894"
                          className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="experienceYears"
                          min="0"
                          value={formData.experienceYears}
                          onChange={handleChange}
                          placeholder="e.g. 8"
                          className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Highest Qualification
                        </label>
                        <input
                          type="text"
                          name="qualification"
                          value={formData.qualification}
                          onChange={handleChange}
                          placeholder="e.g. MBBS, MD, MS, MHA"
                          className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                        Hospital or Clinic Affiliation
                      </label>
                      <input
                        type="text"
                        name="hospitalAffiliation"
                        value={formData.hospitalAffiliation}
                        onChange={handleChange}
                        placeholder="e.g. Apollo Hospital, Fortis, Sunrise Clinic"
                        className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Form Action Controls */}
            <div className="pt-2 flex items-center gap-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-1/3 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  &larr; Back
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 text-sm transition cursor-pointer"
                >
                  Continue to Step {currentStep + 1} &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 text-sm transition cursor-pointer"
                >
                  {loading ? 'Saving to Database...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </form>

          <div className="pt-3 border-t border-slate-200 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              Sign In
            </Link>
          </div>

          <div className="text-center">
            <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
              &larr; Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
