import {
  ClinicProfile,
  Doctor,
  PatientRecord,
  AppointmentRequest,
  ConsultationRecord,
  ClinicCommunicationMessage,
  ClinicUser
} from '../types';

export const INITIAL_CLINICS: ClinicProfile[] = [
  {
    id: 'clinic-curo-care',
    name: 'Curo Multispeciality Clinic',
    tagline: 'Leading Cardiology, Endocrinology & Comprehensive Family Healthcare',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80',
    email: 'contact@curocare.in',
    phone: '+91 98201 54321',
    address: {
      street: '402, Lotus Health Enclave, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400053',
      country: 'India'
    },
    description:
      'Curo Multispeciality Clinic provides comprehensive outpatient care, specialized clinical diagnostics, chronic disease consultation and preventive wellness.',
    registrationNumber: 'MH-MUM-MED-2024-89',
    defaultAppointmentDurationMinutes: 30,
    cancellationPolicy: {
      freeCancellationHoursNotice: 24,
      feePercentageAfterNotice: 50,
      policyTerms:
        'Appointments cancelled with at least 24 hours notice incur no fee. Late cancellations may incur a 50% reservation charge.'
    },
    services: [
      {
        id: 'srv-c1-1',
        name: 'Comprehensive Cardiology Assessment & ECG',
        durationMinutes: 45,
        consultationFee: 1500,
        currency: 'INR',
        supportedModes: ['in-person', 'video'],
        description: 'Detailed cardiac risk profiling, resting ECG review, BP mapping and medication titration.'
      },
      {
        id: 'srv-c1-2',
        name: 'Diabetes & Endocrinology Follow-up',
        durationMinutes: 30,
        consultationFee: 1000,
        currency: 'INR',
        supportedModes: ['in-person', 'video', 'voice'],
        description: 'HbA1c monitoring, continuous glucose log review, thyroid management and lifestyle prescription.'
      },
      {
        id: 'srv-c1-3',
        name: 'Preventive Health & Executive Wellness Screen',
        durationMinutes: 60,
        consultationFee: 2000,
        currency: 'INR',
        supportedModes: ['in-person'],
        description: 'Full body checkup, systemic examination, metabolic assessment, and lifestyle recommendations.'
      }
    ],
    weeklyHours: [
      {
        day: 'Monday',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
        breaks: [{ label: 'Lunch Break', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Tuesday',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
        breaks: [{ label: 'Lunch Break', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Wednesday',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
        breaks: [{ label: 'Lunch Break', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Thursday',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
        breaks: [{ label: 'Lunch Break', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Friday',
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
        breaks: [{ label: 'Lunch Break', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Saturday',
        isOpen: true,
        openTime: '09:30',
        closeTime: '14:00',
        breaks: []
      },
      {
        day: 'Sunday',
        isOpen: false,
        openTime: '10:00',
        closeTime: '13:00',
        breaks: []
      }
    ],
    specialClosures: [
      { date: '2026-11-01', reason: 'Diwali Festival' },
      { date: '2026-12-25', reason: 'Christmas Holiday' }
    ]
  }
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-in-1',
    clinicId: 'clinic-curo-care',
    fullName: 'Dr. Rajesh Sharma',
    title: 'MD, DM (Cardiology), Senior Interventional Cardiologist',
    specialties: ['Cardiology', 'Hypertension & Lipidology', 'Preventive Heart Care'],
    qualifications: ['MBBS (AIIMS New Delhi)', 'MD (Internal Medicine)', 'DM (Cardiology)'],
    bio: 'Over 18 years of experience in clinical cardiology, coronary intervention, preventative lipid clinics and lifestyle disease reversal.',
    consultationFee: 1500,
    supportedModes: ['in-person', 'video'],
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    weeklySchedule: [
      {
        day: 'Monday',
        isWorking: true,
        shifts: [{ start: '09:30', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Tuesday',
        isWorking: true,
        shifts: [{ start: '09:30', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Wednesday',
        isWorking: true,
        shifts: [{ start: '09:30', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Thursday',
        isWorking: true,
        shifts: [{ start: '09:30', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Friday',
        isWorking: true,
        shifts: [{ start: '09:30', end: '16:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Saturday',
        isWorking: true,
        shifts: [{ start: '10:00', end: '13:30' }],
        breaks: []
      },
      { day: 'Sunday', isWorking: false, shifts: [], breaks: [] }
    ],
    leaves: []
  },
  {
    id: 'doc-in-2',
    clinicId: 'clinic-curo-care',
    fullName: 'Dr. Priya Patel',
    title: 'MD, DNB (Endocrinology), Consultant Diabetologist',
    specialties: ['Type 1 & 2 Diabetes', 'Thyroid Disorders', 'Metabolic Syndrome'],
    qualifications: ['MBBS (KEM Hospital Mumbai)', 'MD (Medicine)', 'DNB (Endocrinology)'],
    bio: 'Specialist in metabolic disorder management, continuous glucose monitoring (CGM), gestational diabetes and thyroid disorders.',
    consultationFee: 1000,
    supportedModes: ['in-person', 'video', 'voice'],
    avatarUrl: 'https://images.unsplash.com/photo-1594824813689-13824ca3ad54?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    weeklySchedule: [
      {
        day: 'Monday',
        isWorking: true,
        shifts: [{ start: '10:00', end: '17:30' }],
        breaks: [{ label: 'Lunch', start: '13:30', end: '14:30' }]
      },
      {
        day: 'Tuesday',
        isWorking: true,
        shifts: [{ start: '10:00', end: '17:30' }],
        breaks: [{ label: 'Lunch', start: '13:30', end: '14:30' }]
      },
      {
        day: 'Wednesday',
        isWorking: true,
        shifts: [{ start: '10:00', end: '17:30' }],
        breaks: [{ label: 'Lunch', start: '13:30', end: '14:30' }]
      },
      {
        day: 'Thursday',
        isWorking: true,
        shifts: [{ start: '10:00', end: '17:30' }],
        breaks: [{ label: 'Lunch', start: '13:30', end: '14:30' }]
      },
      {
        day: 'Friday',
        isWorking: true,
        shifts: [{ start: '10:00', end: '15:30' }],
        breaks: []
      },
      { day: 'Saturday', isWorking: false, shifts: [], breaks: [] },
      { day: 'Sunday', isWorking: false, shifts: [], breaks: [] }
    ],
    leaves: [{ startDate: '2026-11-12', endDate: '2026-11-14', reason: 'National Endocrine Conclave' }]
  },
  {
    id: 'doc-in-3',
    clinicId: 'clinic-curo-care',
    fullName: 'Dr. Amit Verma',
    title: 'MBBS, MD (General Medicine), Physician Specialist',
    specialties: ['Internal Medicine', 'Preventive Health', 'Geriatric Care'],
    qualifications: ['MBBS (Maulana Azad Medical College)', 'MD (Internal Medicine)'],
    bio: 'Dedicated clinician emphasizing patient-centered primary care, acute infection management, and annual health screenings.',
    consultationFee: 800,
    supportedModes: ['in-person', 'video'],
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    weeklySchedule: [
      {
        day: 'Monday',
        isWorking: true,
        shifts: [{ start: '09:00', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Tuesday',
        isWorking: true,
        shifts: [{ start: '09:00', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Wednesday',
        isWorking: true,
        shifts: [{ start: '09:00', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Thursday',
        isWorking: true,
        shifts: [{ start: '09:00', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      {
        day: 'Friday',
        isWorking: true,
        shifts: [{ start: '09:00', end: '17:00' }],
        breaks: [{ label: 'Lunch', start: '13:00', end: '14:00' }]
      },
      { day: 'Saturday', isWorking: true, shifts: [{ start: '09:30', end: '13:00' }], breaks: [] },
      { day: 'Sunday', isWorking: false, shifts: [], breaks: [] }
    ],
    leaves: []
  }
];

export const INITIAL_PATIENTS: PatientRecord[] = [
  {
    id: 'PAT-IND-101',
    clinicId: 'clinic-curo-care',
    fullName: 'Aarav Mehta',
    dateOfBirth: '1979-05-18',
    gender: 'Male',
    phone: '+91 98210 98765',
    email: 'aarav.mehta@example.com',
    emergencyContact: {
      name: 'Pooja Mehta',
      relation: 'Spouse',
      phone: '+91 98210 98760'
    },
    bloodGroup: 'B+',
    allergies: ['Penicillin', 'Sulfa drugs'],
    chronicConditions: ['Essential Hypertension (Stage 1)', 'Dyslipidemia'],
    registeredDate: '2025-02-14',
    documents: [
      {
        id: 'DOC-101-1',
        title: 'Resting 12-Lead ECG Report (Normal Sinus)',
        fileType: 'pdf',
        fileSize: '1.2 MB',
        uploadedAt: '2026-09-15',
        isRestricted: false
      },
      {
        id: 'DOC-101-2',
        title: 'Lipid Profile & Liver Function Panel',
        fileType: 'lab_result',
        fileSize: '650 KB',
        uploadedAt: '2026-10-12',
        isRestricted: false
      }
    ]
  },
  {
    id: 'PAT-IND-102',
    clinicId: 'clinic-curo-care',
    fullName: 'Ananya Iyer',
    dateOfBirth: '1988-10-09',
    gender: 'Female',
    phone: '+91 98199 43210',
    email: 'ananya.iyer@example.com',
    emergencyContact: {
      name: 'Ramesh Iyer',
      relation: 'Father',
      phone: '+91 98199 43211'
    },
    bloodGroup: 'O+',
    allergies: ['Ciprofloxacin'],
    chronicConditions: ['Type 2 Diabetes Mellitus (HbA1c 7.1%)', 'Hypothyroidism'],
    registeredDate: '2025-06-20',
    documents: [
      {
        id: 'DOC-102-1',
        title: 'HbA1c & Fasting Insulin Trend',
        fileType: 'lab_result',
        fileSize: '820 KB',
        uploadedAt: '2026-10-18',
        isRestricted: false
      },
      {
        id: 'DOC-102-2',
        title: 'Thyroid Ultrasound Scan Report',
        fileType: 'imaging_scan',
        fileSize: '2.5 MB',
        uploadedAt: '2026-08-10',
        isRestricted: false
      }
    ]
  },
  {
    id: 'PAT-IND-103',
    clinicId: 'clinic-curo-care',
    fullName: 'Vikram Malhotra',
    dateOfBirth: '1965-12-04',
    gender: 'Male',
    phone: '+91 98330 11223',
    email: 'vikram.malhotra@example.com',
    emergencyContact: {
      name: 'Sunita Malhotra',
      relation: 'Spouse',
      phone: '+91 98330 11224'
    },
    bloodGroup: 'A+',
    allergies: ['Aspirin (Mild Gastritis)'],
    chronicConditions: ['Coronary Artery Disease (Stable)', 'Mild Osteoarthritis'],
    registeredDate: '2024-11-05',
    documents: [
      {
        id: 'DOC-103-1',
        title: '2D Echocardiography & Color Doppler Report',
        fileType: 'imaging_scan',
        fileSize: '3.8 MB',
        uploadedAt: '2026-09-28',
        isRestricted: true
      }
    ]
  },
  {
    id: 'PAT-IND-104',
    clinicId: 'clinic-curo-care',
    fullName: 'Sneha Kulkarni',
    dateOfBirth: '1995-03-22',
    gender: 'Female',
    phone: '+91 97690 55443',
    email: 'sneha.kulkarni@example.com',
    emergencyContact: {
      name: 'Nitin Kulkarni',
      relation: 'Brother',
      phone: '+91 97690 55440'
    },
    bloodGroup: 'AB+',
    allergies: [],
    chronicConditions: ['Vitamin D3 Deficiency', 'Mild Allergic Rhinitis'],
    registeredDate: '2026-01-18',
    documents: [
      {
        id: 'DOC-104-1',
        title: 'Complete Blood Count & Vitamin Panel',
        fileType: 'lab_result',
        fileSize: '540 KB',
        uploadedAt: '2026-10-15',
        isRestricted: false
      }
    ]
  }
];

export const INITIAL_APPOINTMENT_REQUESTS: AppointmentRequest[] = [
  {
    id: 'ENQ-IN-001',
    clinicId: 'clinic-curo-care',
    patientId: 'PAT-IND-101',
    patientName: 'Aarav Mehta',
    patientContact: {
      phone: '+91 98210 98765',
      email: 'aarav.mehta@example.com'
    },
    doctorId: 'doc-in-1',
    doctorName: 'Dr. Rajesh Sharma',
    specialty: 'Cardiology',
    serviceId: 'srv-c1-1',
    serviceName: 'Comprehensive Cardiology Assessment & ECG',
    consultationMode: 'in-person',
    preferredDate: '2026-10-24',
    preferredTimeRange: '10:00 - 11:30',
    reasonForVisit: 'Occasional morning palpitations, routine BP monitoring and quarterly evaluation.',
    createdAt: '2026-10-23T09:30:00Z',
    status: 'Confirmed',
    confirmedSlot: {
      date: '2026-10-24',
      startTime: '10:30',
      endTime: '11:15'
    },
    fee: 1500,
    paymentStatus: 'Paid'
  },
  {
    id: 'ENQ-IN-002',
    clinicId: 'clinic-curo-care',
    patientId: 'PAT-IND-102',
    patientName: 'Ananya Iyer',
    patientContact: {
      phone: '+91 98199 43210',
      email: 'ananya.iyer@example.com'
    },
    doctorId: 'doc-in-2',
    doctorName: 'Dr. Priya Patel',
    specialty: 'Type 1 & 2 Diabetes',
    serviceId: 'srv-c1-2',
    serviceName: 'Diabetes & Endocrinology Follow-up',
    consultationMode: 'video',
    preferredDate: '2026-10-24',
    preferredTimeRange: '11:30 - 12:30',
    reasonForVisit: 'Review fasting glucose trends and adjust morning Metformin / Thyronorm dosages.',
    createdAt: '2026-10-22T14:15:00Z',
    status: 'Confirmed',
    confirmedSlot: {
      date: '2026-10-24',
      startTime: '11:30',
      endTime: '12:00'
    },
    fee: 1000,
    paymentStatus: 'Paid'
  },
  {
    id: 'ENQ-IN-003',
    clinicId: 'clinic-curo-care',
    patientId: 'PAT-IND-103',
    patientName: 'Vikram Malhotra',
    patientContact: {
      phone: '+91 98330 11223',
      email: 'vikram.malhotra@example.com'
    },
    doctorId: 'doc-in-1',
    doctorName: 'Dr. Rajesh Sharma',
    specialty: 'Cardiology',
    serviceId: 'srv-c1-1',
    serviceName: 'Comprehensive Cardiology Assessment & ECG',
    consultationMode: 'in-person',
    preferredDate: '2026-10-25',
    preferredTimeRange: '10:00 - 12:00',
    reasonForVisit: 'Quarterly review of cardiac medications, post-stent 1-year follow-up checkup.',
    createdAt: '2026-10-23T11:20:00Z',
    status: 'New',
    fee: 1500,
    paymentStatus: 'Pending'
  },
  {
    id: 'ENQ-IN-004',
    clinicId: 'clinic-curo-care',
    patientId: 'PAT-IND-104',
    patientName: 'Sneha Kulkarni',
    patientContact: {
      phone: '+91 97690 55443',
      email: 'sneha.kulkarni@example.com'
    },
    doctorId: 'doc-in-3',
    doctorName: 'Dr. Amit Verma',
    specialty: 'Internal Medicine',
    serviceId: 'srv-c1-3',
    serviceName: 'Preventive Health & Executive Wellness Screen',
    consultationMode: 'in-person',
    preferredDate: '2026-10-26',
    preferredTimeRange: '14:00 - 16:00',
    reasonForVisit: 'Pre-employment comprehensive medical checkup and recurring allergy assessment.',
    createdAt: '2026-10-23T15:00:00Z',
    status: 'Pending Review',
    fee: 2000,
    paymentStatus: 'Pending'
  }
];

export const INITIAL_CONSULTATIONS: ConsultationRecord[] = [
  {
    id: 'CON-IN-001',
    clinicId: 'clinic-curo-care',
    appointmentId: 'ENQ-IN-001',
    patientId: 'PAT-IND-101',
    patientName: 'Aarav Mehta',
    doctorId: 'doc-in-1',
    doctorName: 'Dr. Rajesh Sharma',
    consultationDate: '2026-10-24',
    consultationMode: 'in-person',
    status: 'Finalized',
    patientReportedSymptoms:
      'Patient reports occasional evening stress-related palpitations. Denies any breathlessness on brisk walking or chest heaviness.',
    doctorObservations:
      'BP 134/86 mmHg, Pulse 72 bpm regular. S1/S2 heard normally without murmur. Lungs clear bilaterally. Resting ECG shows regular sinus rhythm without ischemic changes.',
    clinicalAssessment:
      'Mild stage 1 hypertension with stress-induced sinus tachycardia. Well compensated cardiac status. Advised lifestyle modifications, salt restriction and moderate aerobic walking.',
    prescriptions: [
      {
        id: 'RX-IN-101',
        medicationName: 'Telmisartan Tablets IP',
        dosage: '40 mg',
        frequency: 'Once daily after breakfast',
        duration: '60 days',
        instructions: 'Take regularly at the same time. Maintain a weekly home blood pressure log.'
      },
      {
        id: 'RX-IN-102',
        medicationName: 'Atorvastatin Tablets IP',
        dosage: '10 mg',
        frequency: 'Once daily at bedtime',
        duration: '60 days',
        instructions: 'Avoid citrus fruit juices within 2 hours of taking medication.'
      }
    ],
    followUpRecommendation: {
      recommendedDate: '2026-11-28',
      notes: 'Repeat lipid panel and serum creatinine before the visit.',
      isScheduled: true
    },
    finalizedAt: '2026-10-24T11:10:00Z',
    doctorSignatureStamp: 'Dr. Rajesh Sharma, MD, DM (Reg. #MCI-2006-04289)'
  }
];

export const INITIAL_COMMUNICATIONS: ClinicCommunicationMessage[] = [
  {
    id: 'MSG-IN-001',
    clinicId: 'clinic-curo-care',
    appointmentId: 'ENQ-IN-001',
    patientId: 'PAT-IND-101',
    patientName: 'Aarav Mehta',
    channel: 'SMS',
    type: 'Appointment Confirmation',
    subject: 'Appointment Confirmed - Dr. Rajesh Sharma',
    body: 'Namaste Aarav ji, your appointment with Dr. Rajesh Sharma is confirmed for 24-Oct-2026 at 10:30 AM at Curo Multispeciality Clinic.',
    sentAt: '2026-10-23T10:00:00Z',
    sentBy: 'Clinic Front Desk',
    mockDeliveryStatus: 'Mock Dispatched (Demo Only)'
  },
  {
    id: 'MSG-IN-002',
    clinicId: 'clinic-curo-care',
    appointmentId: 'ENQ-IN-002',
    patientId: 'PAT-IND-102',
    patientName: 'Ananya Iyer',
    channel: 'Email',
    type: 'Appointment Confirmation',
    subject: 'Confirmed Tele-Consultation - Dr. Priya Patel',
    body: 'Dear Ananya, your video consultation with Dr. Priya Patel is confirmed for 24-Oct-2026 at 11:30 AM IST. Link will be active 10 mins prior.',
    sentAt: '2026-10-23T11:45:00Z',
    sentBy: 'Clinic Care Coordinator',
    mockDeliveryStatus: 'Mock Dispatched (Demo Only)'
  }
];

export const MOCK_CLINIC_USERS: ClinicUser[] = [
  {
    id: 'usr-in-reception',
    fullName: 'Sunita Deshmukh',
    email: 'reception@curocare.in',
    role: 'Reception Staff',
    clinicId: 'clinic-curo-care',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-in-doc-1',
    fullName: 'Dr. Rajesh Sharma',
    email: 'dr.rajesh@curocare.in',
    role: 'Authorized Doctor',
    clinicId: 'clinic-curo-care',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-in-doc-2',
    fullName: 'Dr. Priya Patel',
    email: 'dr.priya@curocare.in',
    role: 'Authorized Doctor',
    clinicId: 'clinic-curo-care',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813689-13824ca3ad54?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-in-doc-3',
    fullName: 'Dr. Amit Verma',
    email: 'dr.amit@curocare.in',
    role: 'Authorized Doctor',
    clinicId: 'clinic-curo-care',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
  }
];
