import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect Turso Cloud or local file
const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
const isTurso = Boolean(tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://') || tursoUrl.startsWith('http://')));

const dbFilePath = process.env.DATABASE_FILE 
  ? path.resolve(__dirname, '..', process.env.DATABASE_FILE)
  : path.resolve(__dirname, '../thunai_ledger.db');

export const client = isTurso
  ? createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN
    })
  : createClient({
      url: `file:${dbFilePath}`
    });

console.log(`[Database] Initialized ${isTurso ? 'Turso Cloud Database (Lifetime Free)' : `Local SQLite at: ${dbFilePath}`}`);

// Helper wrapper providing async get, all, and run
export const db = {
  // Single row
  async get(sql, ...params) {
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await client.execute({ sql, args });
    return res.rows[0] || null;
  },

  // All rows
  async all(sql, ...params) {
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await client.execute({ sql, args });
    return res.rows || [];
  },

  // Execute insert / update / delete
  async run(sql, ...params) {
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const res = await client.execute({ sql, args });
    return {
      lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : null,
      rowsAffected: res.rowsAffected
    };
  },

  // Raw execute
  async execute(stmt) {
    return client.execute(stmt);
  },

  // Batch statements
  async batch(statements, mode = 'write') {
    return client.batch(statements, mode);
  },

  isTurso
};

export async function initDatabase() {
  // 1. Users table
  await client.execute(`
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
  await client.execute(`
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
  await client.execute(`
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
  await client.execute(`
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

  // 5. Automated Reminder Logs Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER,
      customer_id INTEGER,
      customer_name TEXT,
      phone TEXT,
      channel TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'sms'
      message_type TEXT DEFAULT 'due_reminder', -- 'due_reminder', 'overdue_alert', 'payment_receipt'
      message_body TEXT NOT NULL,
      status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'delivered'
      sent_by TEXT DEFAULT 'automatic_cron', -- 'automatic_cron', 'manual_single', 'manual_blast'
      sent_at TEXT DEFAULT (datetime('now')),
      response_info TEXT,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );
  `);

  // 6. Notification Settings Table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auto_send_enabled INTEGER DEFAULT 1,
      send_time TEXT DEFAULT '09:00',
      send_channel TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'sms', 'both'
      provider TEXT DEFAULT 'whatsapp_direct', -- 'whatsapp_direct', 'ultramsg', 'twilio', 'webhook', 'mock'
      finance_name TEXT DEFAULT 'Weekly Finance',
      api_key TEXT,
      api_url TEXT,
      sender_phone TEXT,
      tamil_template TEXT,
      english_template TEXT,
      last_cron_run TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe schema migrations: add missing columns if they do not exist
  const safeAddColumn = async (table, colDef) => {
    try {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${colDef};`);
    } catch {
      // Column already exists, safe to continue
    }
  };

  // Customers table enhancements
  await safeAddColumn('customers', 'whatsapp_number TEXT');
  await safeAddColumn('customers', "preferred_lang TEXT DEFAULT 'ta'");
  await safeAddColumn('customers', 'notification_enabled INTEGER DEFAULT 1');
  await safeAddColumn('customers', 'id_proof_number TEXT');

  // Loans table enhancements
  await safeAddColumn('loans', "collection_day TEXT DEFAULT 'Monday'");
  await safeAddColumn('loans', 'next_due_date TEXT');
  await safeAddColumn('loans', 'last_reminder_sent TEXT');
  await safeAddColumn('loans', "reminder_status TEXT DEFAULT 'pending'");

  // Initialize default notification settings if empty
  const settingsCheck = await db.get('SELECT COUNT(*) as count FROM notification_settings');
  if (!settingsCheck || Number(settingsCheck.count) === 0) {
    const defaultTaTemplate = 'வணக்கம் {customer_name}, {finance_name}-லிருந்து நினைவூட்டல்: உங்கள் வாரத் தவணை ₹{installment} இன்று ({due_date}) செலுத்த வேண்டியுள்ளது. (மீதி பாக்கி: ₹{balance}). நன்றி!';
    const defaultEnTemplate = 'Hello {customer_name}, Reminder from {finance_name}: Your weekly installment of ₹{installment} is due today ({due_date}). (Pending Balance: ₹{balance}). Thank you!';
    
    await db.run(`
      INSERT INTO notification_settings (
        auto_send_enabled, send_time, send_channel, provider, finance_name, tamil_template, english_template
      ) VALUES (1, '09:00', 'whatsapp', 'whatsapp_direct', 'Weekly Finance', ?, ?)
    `, defaultTaTemplate, defaultEnTemplate);
  }

  // Seed default user and demo data if not exists
  await seedInitialData();
}

async function seedInitialData() {
  const userCheck = await db.get('SELECT COUNT(*) as count FROM users');
  if (!userCheck || Number(userCheck.count) === 0) {
    console.log('[Database] Seeding initial users and ledger data...');

    // Default user from screenshot: 1234@gmail.com
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const userResult = await db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      'Finance Manager', '1234@gmail.com', hashedPassword, 'admin'
    );
    const userId = userResult.lastInsertRowid;

    // Seed customers
    const c1 = await db.run(
      'INSERT INTO customers (user_id, name, phone, area, address) VALUES (?, ?, ?, ?, ?)',
      userId, 'Ravi Kumar', '+91 98401 23456', 'Market Street', 'No 14, North Car Street'
    );
    const c2 = await db.run(
      'INSERT INTO customers (user_id, name, phone, area, address) VALUES (?, ?, ?, ?, ?)',
      userId, 'Meena Selvam', '+91 98402 34567', 'Bazaar Branch', 'Shop 7, Gandhi Road'
    );
    const c3 = await db.run(
      'INSERT INTO customers (user_id, name, phone, area, address) VALUES (?, ?, ?, ?, ?)',
      userId, 'Karthik Raja', '+91 98403 45678', 'Anna Nagar', 'Plot 42, 2nd Main Road'
    );
    const c4 = await db.run(
      'INSERT INTO customers (user_id, name, phone, area, address) VALUES (?, ?, ?, ?, ?)',
      userId, 'Anitha Devi', '+91 98404 56789', 'Railway Station Area', 'Near Old Bus Stand'
    );

    // Seed loans
    const l1 = await db.run(
      'INSERT INTO loans (customer_id, principal, interest_rate, total_amount, weekly_installment, tenure_weeks, weeks_paid, amount_paid, status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      c1.lastInsertRowid, 10000, 10, 11000, 1100, 10, 4, 4400, 'active', '2026-09-20'
    );
    const l2 = await db.run(
      'INSERT INTO loans (customer_id, principal, interest_rate, total_amount, weekly_installment, tenure_weeks, weeks_paid, amount_paid, status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      c2.lastInsertRowid, 20000, 10, 22000, 2200, 10, 2, 4400, 'active', '2026-10-04'
    );
    const l3 = await db.run(
      'INSERT INTO loans (customer_id, principal, interest_rate, total_amount, weekly_installment, tenure_weeks, weeks_paid, amount_paid, status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      c3.lastInsertRowid, 15000, 10, 16500, 1650, 10, 1, 1650, 'active', '2026-10-11'
    );
    const l4 = await db.run(
      'INSERT INTO loans (customer_id, principal, interest_rate, total_amount, weekly_installment, tenure_weeks, weeks_paid, amount_paid, status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      c4.lastInsertRowid, 10000, 10, 11000, 1100, 10, 10, 11000, 'completed', '2026-08-01'
    );

    // Seed recent collections
    await db.run(
      'INSERT INTO collections (loan_id, customer_id, amount, week_number, collection_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      l1.lastInsertRowid, c1.lastInsertRowid, 1100, 4, '2026-10-18', 'Cash collected on schedule'
    );
    await db.run(
      'INSERT INTO collections (loan_id, customer_id, amount, week_number, collection_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      l2.lastInsertRowid, c2.lastInsertRowid, 2200, 2, '2026-10-18', 'UPI payment received'
    );
    await db.run(
      'INSERT INTO collections (loan_id, customer_id, amount, week_number, collection_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      l3.lastInsertRowid, c3.lastInsertRowid, 1650, 1, '2026-10-18', 'Week 1 installment'
    );
    await db.run(
      'INSERT INTO collections (loan_id, customer_id, amount, week_number, collection_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      l1.lastInsertRowid, c1.lastInsertRowid, 1100, 3, '2026-10-11', 'Week 3 installment'
    );

    console.log('[Database] Seeded default user (1234@gmail.com / password123) and sample finance records successfully.');
  }
}
