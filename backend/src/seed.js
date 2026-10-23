import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { User } from './models/User.js';
import { Department } from './models/Department.js';
import { Patient } from './models/Patient.js';
import { AuditLog } from './models/AuditLog.js';

export const seedDatabase = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/curo';
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[Seed] Connected to MongoDB: ${uri}`);
    }

    // Clean existing mock data
    await User.deleteMany({
      email: {
        $in: [
          'admin@curo.hospital',
          'manager.emergency@curo.hospital',
          'manager.cardio@curo.hospital',
          'dr.sharma@curo.hospital',
          'dr.patel@curo.hospital',
          'dr.verma@curo.hospital',
          'dr.menon@curo.hospital',
        ],
      },
    });

    console.log('[Seed] Inserting departments...');
    const emergencyDept = await Department.findOneAndUpdate(
      { name: 'Emergency' },
      { name: 'Emergency', description: '24/7 Trauma, Critical & Emergency Care' },
      { upsert: true, new: true }
    );

    const cardiologyDept = await Department.findOneAndUpdate(
      { name: 'Cardiology' },
      { name: 'Cardiology', description: 'Comprehensive Heart, Vascular & Coronary Care' },
      { upsert: true, new: true }
    );

    console.log('[Seed] Creating Hospital Admin...');
    const admin = await User.create({
      name: 'Dr. Rajesh Singhania',
      email: 'admin@curo.hospital',
      password: 'password123',
      role: 'hospital_admin',
      phone: '+91 98110 00001',
      department: 'Administration',
      isActive: true,
    });

    console.log('[Seed] Creating Department Managers...');
    const emergencyManager = await User.create({
      name: 'Dr. Sunita Rao',
      email: 'manager.emergency@curo.hospital',
      password: 'password123',
      role: 'manager',
      department: 'Emergency',
      phone: '+91 98110 00002',
      createdBy: admin._id,
      isActive: true,
    });

    const cardiologyManager = await User.create({
      name: 'Dr. Anil Kulkarni',
      email: 'manager.cardio@curo.hospital',
      password: 'password123',
      role: 'manager',
      department: 'Cardiology',
      phone: '+91 98110 00003',
      createdBy: admin._id,
      isActive: true,
    });

    emergencyDept.managerId = emergencyManager._id;
    await emergencyDept.save();

    cardiologyDept.managerId = cardiologyManager._id;
    await cardiologyDept.save();

    console.log('[Seed] Creating Doctors...');
    const drSharma = await User.create({
      name: 'Dr. Rahul Sharma',
      email: 'dr.sharma@curo.hospital',
      password: 'password123',
      role: 'doctor',
      department: 'Emergency',
      phone: '+91 98220 11001',
      createdBy: emergencyManager._id,
      isActive: true,
    });

    const drPatel = await User.create({
      name: 'Dr. Priya Patel',
      email: 'dr.patel@curo.hospital',
      password: 'password123',
      role: 'doctor',
      department: 'Emergency',
      phone: '+91 98220 11002',
      createdBy: emergencyManager._id,
      isActive: true,
    });

    const drVerma = await User.create({
      name: 'Dr. Amit Verma',
      email: 'dr.verma@curo.hospital',
      password: 'password123',
      role: 'doctor',
      department: 'Cardiology',
      phone: '+91 98220 11003',
      createdBy: cardiologyManager._id,
      isActive: true,
    });

    const drMenon = await User.create({
      name: 'Dr. Kavita Menon',
      email: 'dr.menon@curo.hospital',
      password: 'password123',
      role: 'doctor',
      department: 'Cardiology',
      phone: '+91 98220 11004',
      createdBy: cardiologyManager._id,
      isActive: true,
    });

    console.log('[Seed] Seeding 10 Hospital Patients with clinical vitals...');
    await Patient.deleteMany({});

    const now = new Date();
    const minutesAgo = (mins) => new Date(now.getTime() - mins * 60 * 1000);

    const patientsData = [
      {
        name: 'Aarav Mehta',
        age: 48,
        gender: 'Male',
        chiefComplaint: 'Acute chest pain radiating to left arm with diaphoresis',
        triageLevel: 'critical',
        vitals: {
          bloodPressure: { systolic: 175, diastolic: 108 },
          heartRate: 118,
          spo2: 89,
          temperature: 37.1,
          respiratoryRate: 28,
          painScale: 9,
        },
        symptoms: ['Chest Pain', 'Shortness of Breath', 'Diaphoresis', 'Dizziness'],
        medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
        bedNumber: 'ICU-01',
        department: 'Cardiology',
        assignedDoctor: drVerma._id,
        status: 'in-treatment',
        outcome: '',
        isAlertAcknowledged: false,
        admittedAt: minutesAgo(35),
      },
      {
        name: 'Meera Iyer',
        age: 34,
        gender: 'Female',
        chiefComplaint: 'Severe respiratory distress with audible wheezing',
        triageLevel: 'critical',
        vitals: {
          bloodPressure: { systolic: 138, diastolic: 92 },
          heartRate: 122,
          spo2: 87,
          temperature: 37.4,
          respiratoryRate: 30,
          painScale: 7,
        },
        symptoms: ['Shortness of Breath', 'Chest Tightness', 'Cough'],
        medicalHistory: ['Asthma'],
        bedNumber: 'ER-02',
        department: 'Emergency',
        assignedDoctor: drSharma._id,
        status: 'in-treatment',
        isAlertAcknowledged: false,
        admittedAt: minutesAgo(20),
      },
      {
        name: 'Vikramaditya Rathore',
        age: 58,
        gender: 'Male',
        chiefComplaint: 'Sudden onset slurred speech and right-side arm weakness',
        triageLevel: 'urgent',
        vitals: {
          bloodPressure: { systolic: 168, diastolic: 102 },
          heartRate: 94,
          spo2: 95,
          temperature: 36.9,
          respiratoryRate: 20,
          painScale: 4,
        },
        symptoms: ['Facial Droop', 'Slurred Speech', 'Headache'],
        medicalHistory: ['Hypertension', 'High Cholesterol'],
        bedNumber: 'ER-05',
        department: 'Emergency',
        assignedDoctor: drSharma._id,
        status: 'in-treatment',
        isAlertAcknowledged: true,
        acknowledgedAt: minutesAgo(40),
        admittedAt: minutesAgo(50),
      },
      {
        name: 'Ananya Deshmukh',
        age: 26,
        gender: 'Female',
        chiefComplaint: 'Acute right lower quadrant abdominal pain with fever',
        triageLevel: 'urgent',
        vitals: {
          bloodPressure: { systolic: 114, diastolic: 74 },
          heartRate: 98,
          spo2: 98,
          temperature: 38.6,
          respiratoryRate: 18,
          painScale: 8,
        },
        symptoms: ['Abdominal Pain', 'Fever', 'Nausea', 'Vomiting'],
        medicalHistory: ['No known chronic illnesses'],
        bedNumber: 'ER-08',
        department: 'Emergency',
        assignedDoctor: drPatel._id,
        status: 'waiting',
        isAlertAcknowledged: true,
        admittedAt: minutesAgo(65),
      },
      {
        name: 'Rohan Banerjee',
        age: 62,
        gender: 'Male',
        chiefComplaint: 'Palpitations and dizziness on exertion',
        triageLevel: 'urgent',
        vitals: {
          bloodPressure: { systolic: 142, diastolic: 88 },
          heartRate: 110,
          spo2: 96,
          temperature: 36.7,
          respiratoryRate: 19,
          painScale: 3,
        },
        symptoms: ['Palpitations', 'Fatigue', 'Dizziness'],
        medicalHistory: ['Arrhythmia', 'Coronary Artery Disease'],
        bedNumber: 'CARD-03',
        department: 'Cardiology',
        assignedDoctor: drMenon._id,
        status: 'in-treatment',
        isAlertAcknowledged: true,
        admittedAt: minutesAgo(90),
      },
      {
        name: 'Suresh Nambiar',
        age: 45,
        gender: 'Male',
        chiefComplaint: 'Suspected closed ankle fracture after slip-and-fall',
        triageLevel: 'semi-urgent',
        vitals: {
          bloodPressure: { systolic: 126, diastolic: 80 },
          heartRate: 82,
          spo2: 99,
          temperature: 36.8,
          respiratoryRate: 16,
          painScale: 6,
        },
        symptoms: ['Swelling', 'Inability to bear weight', 'Local pain'],
        medicalHistory: ['None'],
        bedNumber: 'ER-12',
        department: 'Emergency',
        assignedDoctor: drPatel._id,
        status: 'waiting',
        admittedAt: minutesAgo(110),
      },
      {
        name: 'Sneha Chawla',
        age: 31,
        gender: 'Female',
        chiefComplaint: 'Moderate persistent migraine with photophobia',
        triageLevel: 'semi-urgent',
        vitals: {
          bloodPressure: { systolic: 118, diastolic: 76 },
          heartRate: 76,
          spo2: 99,
          temperature: 37.0,
          respiratoryRate: 15,
          painScale: 6,
        },
        symptoms: ['Headache', 'Photophobia', 'Mild Nausea'],
        medicalHistory: ['Chronic Migraines'],
        bedNumber: 'ER-14',
        department: 'Emergency',
        assignedDoctor: drSharma._id,
        status: 'waiting',
        admittedAt: minutesAgo(85),
      },
      {
        name: 'Devendra Kothari',
        age: 70,
        gender: 'Male',
        chiefComplaint: 'Routine cardiac rehabilitation review and rhythm check',
        triageLevel: 'non-urgent',
        vitals: {
          bloodPressure: { systolic: 128, diastolic: 82 },
          heartRate: 70,
          spo2: 98,
          temperature: 36.6,
          respiratoryRate: 14,
          painScale: 0,
        },
        symptoms: ['Mild fatigue'],
        medicalHistory: ['Post CABG (2022)'],
        bedNumber: 'CARD-07',
        department: 'Cardiology',
        assignedDoctor: drVerma._id,
        status: 'waiting',
        admittedAt: minutesAgo(130),
      },
      {
        name: 'Pooja Bhattacharya',
        age: 23,
        gender: 'Female',
        chiefComplaint: 'Minor laceration on forearm with controlled bleeding',
        triageLevel: 'non-urgent',
        vitals: {
          bloodPressure: { systolic: 116, diastolic: 72 },
          heartRate: 74,
          spo2: 100,
          temperature: 36.8,
          respiratoryRate: 14,
          painScale: 2,
        },
        symptoms: ['Skin laceration'],
        medicalHistory: ['Tetanus up to date'],
        bedNumber: 'ER-18',
        department: 'Emergency',
        assignedDoctor: drPatel._id,
        status: 'resolved',
        outcome: 'Sutured, dressed, discharged home with analgesics',
        resolutionNotes: 'Wound irrigated with normal saline. 3 interrupted sutures applied. Advised suture removal in 7 days.',
        admittedAt: minutesAgo(240),
        resolvedAt: minutesAgo(170),
      },
      {
        name: 'Harpreet Singh Sandhu',
        age: 52,
        gender: 'Male',
        chiefComplaint: 'Post-stent follow-up and angina evaluation',
        triageLevel: 'non-urgent',
        vitals: {
          bloodPressure: { systolic: 124, diastolic: 78 },
          heartRate: 68,
          spo2: 98,
          temperature: 36.7,
          respiratoryRate: 15,
          painScale: 1,
        },
        symptoms: ['Stable'],
        medicalHistory: ['Coronary Stent (DES 2024)', 'Hyperlipidemia'],
        bedNumber: 'CARD-10',
        department: 'Cardiology',
        assignedDoctor: drMenon._id,
        status: 'resolved',
        outcome: 'Medication titrated, stable ECG',
        resolutionNotes: 'ECG demonstrates normal sinus rhythm with no ST changes. Aspirin & Statin continued. Review in 3 months.',
        admittedAt: minutesAgo(300),
        resolvedAt: minutesAgo(220),
      },
    ];

    await Patient.insertMany(patientsData);

    console.log('[Seed] Logging audit entries...');
    await AuditLog.create({
      userId: admin._id,
      action: 'SYSTEM_INITIALIZATION_AND_SEED',
      details: {
        totalPatientsSeeded: patientsData.length,
        adminUser: admin.email,
      },
    });

    console.log('✅ [Seed] Successfully seeded:');
    console.log(' - 1 Hospital Admin: admin@curo.hospital (pass: password123)');
    console.log(' - 2 Managers: manager.emergency@curo.hospital, manager.cardio@curo.hospital (pass: password123)');
    console.log(' - 4 Doctors: dr.sharma@curo.hospital, dr.patel@curo.hospital, dr.verma@curo.hospital, dr.menon@curo.hospital (pass: password123)');
    console.log(' - 10 Clinical Patients (Emergency & Cardiology)');
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  }
};

if (process.argv[2] === '--run') {
  seedDatabase().then(() => {
    process.exit(0);
  });
}
