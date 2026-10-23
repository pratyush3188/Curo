# Curo - Healthcare Web App Platform

Initial MERN stack project skeleton for the **Curo** healthcare web application. This codebase contains only the structural skeleton, directory architecture, configurations, and placeholder stubs for backend and frontend developers to build out assigned features.

---

## 📁 Repository Structure

```text
Curo/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration (db.js)
│   │   ├── constants/       # Role constants (roles.js)
│   │   ├── controllers/     # Controller placeholder stubs per module
│   │   ├── middleware/      # auth, roleCheck, errorHandler, notFound stubs
│   │   ├── models/          # Mongoose model placeholder stubs
│   │   ├── routes/          # Express route definitions (mounted under /api/v1)
│   │   ├── services/        # Service placeholders (AI report simplifier, prescription checker)
│   │   ├── utils/           # ApiError, asyncHandler, logger utilities
│   │   ├── app.js           # Express app configuration & middleware pipeline
│   │   └── server.js        # Server entrypoint and DB connection
│   ├── .env.example         # Environment template
│   ├── .gitignore
│   ├── .prettierrc
│   ├── eslint.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client instance with baseURL & credentials
│   │   ├── assets/          # Static assets
│   │   ├── components/      # Common & Layout UI component stubs
│   │   ├── context/         # AuthContext placeholder stub
│   │   ├── hooks/           # Custom hook stubs (e.g., useCurrentUser)
│   │   ├── pages/           # Pages (auth, patient, clinic, hospital roles, NotFound)
│   │   ├── routes/          # AppRouter & ProtectedRoute stubs
│   │   ├── utils/           # Frontend utilities & formatters
│   │   ├── App.jsx          # Root application wrapper
│   │   ├── index.css        # Tailwind CSS import
│   │   └── main.jsx         # React DOM mounting
│   ├── .env.example         # Frontend environment template
│   ├── .gitignore
│   ├── .prettierrc
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore               # Root gitignore
└── README.md
```

---

## 🛠️ Prerequisites

- **Node.js** (v18.x, v20.x, or later)
- **npm** (v9.x or later)
- **MongoDB** (Local instance or MongoDB Atlas URI)

---

## ⚙️ Environment Variables Setup

### Backend
Navigate to the `backend/` folder and duplicate `.env.example` as `.env`:

```bash
cd backend
cp .env.example .env
```

Default variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/curo
JWT_SECRET=supersecretjwtkey_change_in_production_123456
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend
Navigate to the `frontend/` folder and duplicate `.env.example` as `.env`:

```bash
cd frontend
cp .env.example .env
```

Default variables:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🚀 How to Install and Run

### 1. Backend

```bash
cd backend
npm install
npm run dev
```
- Server will run on: `http://localhost:5000`
- Health check endpoint: `http://localhost:5000/api/v1/health`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
- Client app will run on: `http://localhost:5173`

---

## 🌿 Branching & Commit Conventions

To maintain code quality and prevent merge conflicts across the team:
- **Feature Branches:** Create all feature branches using the format:
  ```text
  feature/<feature-name>
  ```
  *(e.g., `feature/patient-records`, `feature/doctor-consultations`)*
- **Pull Requests (PR):** All changes must be submitted via Pull Requests targeting the `main` branch.
- **Main Branch Protection:** **No direct pushes to `main`**. Every PR must pass code review and lint checks before merging.
- **Commit Messages:** Use clear and descriptive commit messages (e.g., `feat: add patient appointment booking stub`, `fix: resolve auth cookie parsing`).

---

## 🤝 Contributing & Healthcare Compliance

- **Never commit `.env` files** or secrets to version control.
- **Use fictional or de-identified data only**: Under HIPAA and data privacy principles, **never store or test with real patient health data**.
- Follow the project's ESLint and Prettier guidelines before opening a PR (`npm run lint`).
