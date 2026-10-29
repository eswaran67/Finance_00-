/**
 * Migration Script: Local SQLite -> Turso Cloud Database
 * Usage:
 *   node scripts/migrate-to-turso.js
 * Requires:
 *   TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in backend/.env
 */
import { createClient } from '@libsql/client';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error('\n❌ ERROR: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required in backend/.env to migrate.');
  console.log('Example:');
  console.log('TURSO_DATABASE_URL=libsql://your-db-name.turso.io');
  console.log('TURSO_AUTH_TOKEN=your-token-here\n');
  process.exit(1);
}

const localDbPath = path.resolve(__dirname, '../thunai_ledger.db');
const localClient = createClient({ url: `file:${localDbPath}` });
const remoteClient = createClient({ url: tursoUrl, authToken: tursoToken });

async function migrate() {
  console.log('\n🚀 Starting Migration from Local SQLite to Turso Cloud...');
  console.log(`Source (Local): ${localDbPath}`);
  console.log(`Destination (Turso): ${tursoUrl}\n`);

  // 1. Create tables on Turso
  console.log('1. Creating schema on Turso Cloud...');
  await remoteClient.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await remoteClient.execute(`
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

  await remoteClient.execute(`
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
      status TEXT DEFAULT 'active',
      start_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  await remoteClient.execute(`
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

  // 2. Transfer Users
  const users = (await localClient.execute('SELECT * FROM users')).rows;
  console.log(`2. Migrating ${users.length} users...`);
  for (const u of users) {
    await remoteClient.execute({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [u.id, u.name, u.email, u.password_hash, u.role, u.created_at]
    });
  }

  // 3. Transfer Customers
  const customers = (await localClient.execute('SELECT * FROM customers')).rows;
  console.log(`3. Migrating ${customers.length} customers...`);
  for (const c of customers) {
    await remoteClient.execute({
      sql: `INSERT OR IGNORE INTO customers (id, user_id, name, phone, area, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.user_id, c.name, c.phone, c.area, c.address, c.created_at]
    });
  }

  // 4. Transfer Loans
  const loans = (await localClient.execute('SELECT * FROM loans')).rows;
  console.log(`4. Migrating ${loans.length} loans...`);
  for (const l of loans) {
    await remoteClient.execute({
      sql: `INSERT OR IGNORE INTO loans (id, customer_id, principal, interest_rate, total_amount, weekly_installment, tenure_weeks, weeks_paid, amount_paid, status, start_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [l.id, l.customer_id, l.principal, l.interest_rate, l.total_amount, l.weekly_installment, l.tenure_weeks, l.weeks_paid, l.amount_paid, l.status, l.start_date, l.created_at]
    });
  }

  // 5. Transfer Collections
  const collections = (await localClient.execute('SELECT * FROM collections')).rows;
  console.log(`5. Migrating ${collections.length} collections...`);
  for (const col of collections) {
    await remoteClient.execute({
      sql: `INSERT OR IGNORE INTO collections (id, loan_id, customer_id, amount, week_number, collection_date, collector_name, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [col.id, col.loan_id, col.customer_id, col.amount, col.week_number, col.collection_date, col.collector_name, col.notes, col.created_at]
    });
  }

  console.log('\n🎉 ALL DATA MIGRATED TO TURSO CLOUD SUCCESSFULLY!');
  console.log('Your cloud database is now permanent, live, and will never be deleted.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});

