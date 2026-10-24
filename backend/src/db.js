import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFilePath = process.env.DATABASE_FILE 
  ? path.resolve(__dirname, '..', process.env.DATABASE_FILE)
  : path.resolve(__dirname, '../thunai_ledger.db');

console.log(`[Database] Initializing SQLite database at: ${dbFilePath}`);

export const db = new DatabaseSync(dbFilePath);

// Enable WAL mode & foreign keys for performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 2. Customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      area TEXT NOT NULL,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 3. Loans table (Weekly microfinance model)
  db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      principal REAL NOT NULL,
      interest_rate REAL NOT NULL,
      total_amount REAL NOT NULL,
      weekly_installment REAL NOT NULL,
      tenure_weeks INTEGER NOT NULL,
      weeks_paid INTEGER DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'overdue'
      start_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  // 4. Collections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      week_number INTEGER NOT NULL,
      collection_date TEXT NOT NULL,
      collector_name TEXT DEFAULT 'Admin',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  // Seed default user and demo data if not exists
  seedInitialData();
}

function seedInitialData() {
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCheck.count === 0) {
    console.log('[Database] Seeding initial users and ledger data...');

    // Default user from screenshot: 1234@gmail.com
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role) 
      VALUES (?, ?, ?, ?)
    `);
    const userResult = insertUser.run('Finance Manager', '1234@gmail.com', hashedPassword, 'admin');
    const userId = Number(userResult.lastInsertRowid);

    // Seed customers
    const insertCustomer = db.prepare(`
      INSERT INTO customers (user_id, name, phone, area, address)
      VALUES (?, ?, ?, ?, ?)
    `);

    const c1 = insertCustomer.run(userId, 'Ravi Kumar', '+91 98401 23456', 'Market Street', 'No 14, North Car Street');
    const c2 = insertCustomer.run(userId, 'Meena Selvam', '+91 98402 34567', 'Bazaar Branch', 'Shop 7, Gandhi Road');
    const c3 = insertCustomer.run(userId, 'Karthik Raja', '+91 98403 45678', 'Anna Nagar', 'Plot 42, 2nd Main Road');
    const c4 = insertCustomer.run(userId, 'Anitha Devi', '+91 98404 56789', 'Railway Station Area', 'Near Old Bus Stand');

    // Seed loans
    const insertLoan = db.prepare(`
      INSERT INTO loans (customer_id, principal, interest_rate, total_amount, weekly_installment, tenure_weeks, weeks_paid, amount_paid, status, start_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Ravi: 10,000 principal + 1,000 interest = 11,000 across 10 weeks (1,100 / week), paid 4 weeks
    const l1 = insertLoan.run(Number(c1.lastInsertRowid), 10000, 10, 11000, 1100, 10, 4, 4400, 'active', '2026-09-20');
    // Meena: 20,000 principal + 2,000 interest = 22,000 across 10 weeks (2,200 / week), paid 2 weeks
    const l2 = insertLoan.run(Number(c2.lastInsertRowid), 20000, 10, 22000, 2200, 10, 2, 4400, 'active', '2026-10-04');
    // Karthik: 15,000 principal + 1,500 interest = 16,500 across 10 weeks (1,650 / week), paid 1 week
    const l3 = insertLoan.run(Number(c3.lastInsertRowid), 15000, 10, 16500, 1650, 10, 1, 1650, 'active', '2026-10-11');
    // Anitha: 10,000 principal + 1,000 interest = 11,000 across 10 weeks (1,100 / week), fully completed
    const l4 = insertLoan.run(Number(c4.lastInsertRowid), 10000, 10, 11000, 1100, 10, 10, 11000, 'completed', '2026-08-01');

    // Seed recent collections
    const insertCollection = db.prepare(`
      INSERT INTO collections (loan_id, customer_id, amount, week_number, collection_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertCollection.run(Number(l1.lastInsertRowid), Number(c1.lastInsertRowid), 1100, 4, '2026-10-18', 'Cash collected on schedule');
    insertCollection.run(Number(l2.lastInsertRowid), Number(c2.lastInsertRowid), 2200, 2, '2026-10-18', 'UPI payment received');
    insertCollection.run(Number(l3.lastInsertRowid), Number(c3.lastInsertRowid), 1650, 1, '2026-10-18', 'Week 1 installment');
    insertCollection.run(Number(l1.lastInsertRowid), Number(c1.lastInsertRowid), 1100, 3, '2026-10-11', 'Week 3 installment');

    console.log('[Database] Seeded default user (1234@gmail.com / password123) and sample finance records successfully.');
  }
}

