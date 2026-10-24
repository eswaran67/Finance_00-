# Finance_00 - Weekly Finance Management Dashboard

A full-stack modern Weekly Finance (வாராந்திர நிதி மேலாண்மை) Management Application with executive UI design, Node.js + Express backend, SQLite database persistence, JWT authentication, bilingual localization (English & Tamil), and real-time ledger accounting.

---

## 📸 Key Features

- **Executive Luxury Design**:
  - Obsidian Dark Mode and Crisp High-Contrast Light Mode with instant 1-click switcher.
  - Balanced 3x2 metric cards with glow effects and live status badges.
  - Fully responsive layout matching modern FinTech dashboard standards.
- **Bilingual Localization (English & தமிழ்)**:
  - Instant one-click language toggle (`🌐 English / தமிழ்`) on navigation bar and authentication screen.
  - 100% comprehensive Tamil microfinance terminology (*தவணை*, *அசல்*, *வட்டி*, *பாக்கி*, *வசூல்*, *பாஸ்புக்*).
  - Language selection auto-persists in `localStorage`.
- **Payment Due Notifications**:
  - Top payment due alert banner for borrowers scheduled to pay today.
  - Interactive notification bell dropdown with total pending amounts, direct WhatsApp reminders, and a **"Clear All (அனைத்தும் நீக்கு)"** button.
- **Dynamic Date Search**:
  - Search collections by any custom calendar date.
  - Quick buttons for **⚡ Today (இன்று)**, **📅 Yesterday (நேற்று)**, and **All Receipts**.
- **Financial Accounting & Portfolio Analytics**:
  - Today's Collection, This Week Collection, This Month Collection, Year Collection, Pending Balance, and All-Time Recovered.
  - Customer directory with route/area filters.
  - Active loans tracker with weekly repayment progress bars.
  - Detailed collection receipts ledger.
  - Customer Passbook modal with printable statement slip.
  - Route Sheet (வசூல் பட்டியல்) for daily field collection agents.
  - Delete / Settle loan management with balance integrity checks.

---

## 📁 Project Architecture

```
finance/
├── backend/
│   ├── .env                 # Backend environment variables
│   ├── .env.example         # Backend environment template
│   ├── package.json         # Backend dependencies (Express, better-sqlite3/sqlite3, JWT, bcryptjs)
│   ├── thunai_ledger.db     # SQLite database
│   ├── src/
│   │   ├── server.js        # Express API server entry point
│   │   ├── db.js            # SQLite database schema & migrations
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
│       ├── App.jsx          # Main application orchestrator & theme/lang state
│       ├── App.css          # Luxury executive FinTech styling
│       ├── translations.js  # Bilingual English & Tamil dictionary
│       ├── components/
│       │   ├── AuthCard.jsx    # Authentication card with mode switch
│       │   ├── Dashboard.jsx   # Core financial management hub
│       │   └── WalletIcon.jsx  # Custom brand SVG icon
│       └── main.jsx         # React DOM mount point
│
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=weekly_finance_jwt_secret_key_987654321
DATABASE_FILE=./thunai_ledger.db
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄️ Database Schema (SQLite)

The SQLite database stores relational microfinance records:

1. **`users`**: User accounts (email, hashed password, name, role).
2. **`customers`**: Borrower profiles (name, phone, area/route, address).
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
The backend runs at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

### 2. Start the Frontend Development Server
In another terminal:
```bash
cd frontend
npm run dev
```
The frontend opens at `http://localhost:5173` (or `http://localhost:5174`).
