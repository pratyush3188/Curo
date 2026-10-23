# CURO — AI-Powered Healthcare Management Platform

The **CURO** platform connects patients, private clinics, and large multi-specialty hospitals with an operational Super Admin governance module.

---

## 🏛️ Super Admin Governance & Privacy Architecture

The Super Admin portal is designed around **strict healthcare data partitioning**:
- **Separation of Responsibilities**: The Super Admin oversees facility compliance, statutory verification, initial manager account activation, platform telemetry, and system audit logs.
- **Strict Privacy Partitioning**: Under regulatory requirements (HIPAA/GDPR/DISHA guidelines), the Super Admin is strictly prevented from querying or drilling down into identifiable doctor and patient profiles, prescriptions, consultations, or diagnostic records. The backend enforces this with a hard `403 Forbidden` guard on individual clinician/patient lookups and returns only aggregate platform metrics.
- **Single Super Admin Governance**: Exactly one Super Admin account exists on the platform. The Super Admin cannot be demoted, suspended, or deactivated.

---

## 📁 Repository Structure

```text
Curo/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection (database.js) & seed data (seedData.js)
│   │   ├── constants/       # Role constants (roles.js)
│   │   ├── controllers/     # Modular controllers (dashboard, hospitals, clinics, applications, invitations, users, settings, audit)
│   │   ├── middleware/      # auth, roleCheck, authorize, validate, errorHandler
│   │   ├── models/          # Mongoose schemas (User, Hospital, Clinic, Application, Invitation, AuditLog, AdminSettings)
│   │   ├── routes/          # Express route definitions mounted under /api/v1 and /api
│   │   ├── scripts/         # Standalone database seeder (seed.js)
│   │   ├── services/        # Business logic services (auditService.js)
│   │   ├── utils/           # ApiError, asyncHandler
│   │   ├── validators/      # Zod request payload schemas (adminValidators.js)
│   │   ├── app.js           # Express app configuration & middleware pipeline
│   │   └── server.js        # Server entrypoint and DB connection
│   ├── tests/               # Integration test suite (adminBackend.test.js - 27 tests)
│   ├── .env.example         # Environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client re-export
│   │   ├── components/      # Layout (Header, Sidebar, CommandPalette) & Common UI components
│   │   ├── context/         # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/           # Admin pages (Overview, Hospitals, Clinics, Applications, Users, Audit, Settings)
│   │   ├── routes/          # AppRouter & AdminProtectedRoute
│   │   ├── services/        # Centralized apiClient.js, adminApi.js, adminService.js
│   │   ├── App.jsx          # Root application wrapper
│   │   └── main.jsx         # React DOM mounting
│   ├── .env.example         # Frontend environment template
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🛠️ Prerequisites

- **Node.js**: v18.x, v20.x, or later (tested on v24)
- **npm**: v9.x or later
- **MongoDB**: MongoDB Atlas URI or Local MongoDB instance

---

## ⚙️ Environment Variables Setup

### Backend Configuration
In `backend/`, copy `.env.example` to `.env`:

```bash
cd backend
cp .env.example .env
```

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/curo?retryWrites=true&w=majority
JWT_SECRET=curo_super_admin_jwt_secret_production_key_2026_healthcare
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend Configuration
In `frontend/`, copy `.env.example` to `.env`:

```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🚀 How to Install and Run

### 1. Database Seeding

To initialize the MongoDB database with default facilities, governance accounts, audit logs, and settings:

```bash
cd backend
npm run seed
```

### 2. Starting the Backend Server

```bash
cd backend
npm run dev
# or npm start
```
- Server endpoint: `http://localhost:5000`
- API Health check: `http://localhost:5000/api/v1/health`

### 3. Starting the Frontend Application

```bash
cd frontend
npm run dev
```
- Client portal: `http://localhost:5173`

---

## 🧪 Testing

The backend includes a comprehensive integration test suite running against MongoDB:

```bash
cd backend
npm test
```

The test suite covers:
1. Health checks & public endpoints
2. Super Admin authentication & token enforcement
3. Dashboard telemetry & analytics calculations
4. Hospital & Clinic CRUD operations and status toggling
5. Application review workflow (review, approve, reject with reason, request more info)
6. Manager invitation workflow (SHA-256 hashed single-use tokens, simulated activation)
7. User management & Privacy Partitioning (hard `403 Forbidden` on patient/clinician personal profiles)
8. System audit logging & configuration settings

---

## 🔑 Default Super Admin Credentials

- **Email**: `admin@curo.health`
- **Password**: `Admin@Demo2026!`
- **Role**: `super_admin`

---

## 🤝 Contributing & Healthcare Compliance

- **Never commit `.env` files** or secrets to version control.
- **De-identified data only**: Under HIPAA, GDPR, and DISHA principles, never store or test with real patient health information.
- Follow ESLint standards (`npm run lint` in both frontend and backend directories) before opening Pull Requests.
