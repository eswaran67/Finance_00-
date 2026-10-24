# Thunai Ledger - Weekly Finance Dashboard

A full-stack Weekly Finance Management Application with exact UI design replication, Node.js + Express backend, SQLite database persistence, and JWT authentication.

---

## 📸 Design Overview

- **Branding**: Thunai Ledger (`WEEKLY FINANCE DASHBOARD`)
- **Theme Palette**: 
  - Primary Teal: `#0b5f58` / `#0b4c49`
  - Subtitle Teal: `#0f766e`
  - Alert Warning Cream/Amber: Background `#fffbeb`, Border `#fde68b`, Text `#92400e`
  - Typography: Inter (Semi-bold / Bold headings, clean slate inputs)
- **Features**:
  - Exact pixel-matched Auth Card from the reference design
  - "Failed to fetch" banner simulation and live server connectivity
  - Create account & Sign in toggle modes
  - Pre-filled sample email (`1234@gmail.com`)
  - Interactive Weekly Finance Dashboard with live SQLite database CRUD
  - Management of **Customers**, **Weekly Loans**, and **Collections**

---

## 📁 Project Architecture

```
finance/
├── backend/
│   ├── .env                 # Backend environment variables
│   ├── .env.example         # Backend environment template
│   ├── package.json         # Backend dependencies (Express, SQLite, JWT, bcryptjs)
│   ├── thunai_ledger.db     # SQLite database (auto-generated)
│   ├── src/
│   │   ├── server.js        # Main Express server entry point
│   │   ├── db.js            # SQLite database initialization & migrations
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT authentication middleware
│   │   └── routes/
│   │       ├── authRoutes.js       # Register, Login, Me endpoints
│   │       └── dashboardRoutes.js  # Stats, Customers, Loans, Collections
│   └── scripts/
│       ├── test-db.js       # Database schema verification
│       └── test-api.js      # End-to-end API test suite
│
├── frontend/
│   ├── .env                 # Frontend environment variables
│   ├── .env.example         # Frontend environment template
│   ├── package.json         # React 19 + Vite 8
│   ├── index.html           # HTML template with Inter font and wallet favicon
│   └── src/
│       ├── App.jsx          # Main application orchestrator
│       ├── App.css          # Pixel-accurate custom CSS styles
│       ├── index.css        # Clean reset & typography
│       ├── components/
│       │   ├── AuthCard.jsx    # Exact UI implementation of the reference page
│       │   ├── Dashboard.jsx   # Weekly finance operations center
│       │   └── WalletIcon.jsx  # Custom SVG wallet glyph matching reference
│       └── main.jsx         # React DOM mount point
│
└── package.json             # Root runner scripts
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=thunai_ledger_jwt_secret_key_987654321
DATABASE_FILE=./thunai_ledger.db
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄️ Database Schema (SQLite)

The database `thunai_ledger.db` is initialized automatically on first startup:

1. **`users`**: User accounts (email, hashed password, name, role).
2. **`customers`**: Borrowers info (name, phone, area/route, address).
3. **`loans`**: Microfinance loan accounts (principal, interest rate, total repayment, weekly installment, tenure in weeks, weeks paid, status).
4. **`collections`**: Weekly repayment ledger (amount collected, week number, collection date, notes).

### Default Credentials
- **Email**: `1234@gmail.com`
- **Password**: `password123`

---

## 🚀 Getting Started

### 1. Start the Backend Server
```bash
cd backend
npm start
```
The backend starts at `http://localhost:5000`.

### 2. Start the Frontend Development Server
In another terminal:
```bash
cd frontend
npm run dev
```
The frontend opens at `http://localhost:5173`.

### 3. Verification & Tests
You can verify the database and test all API endpoints:
```bash
cd backend
node scripts/test-db.js
node scripts/test-api.js
```
