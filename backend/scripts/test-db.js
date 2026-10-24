import { db, initDatabase } from '../src/db.js';

initDatabase();

console.log('--- DATABASE VERIFICATION ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

const users = db.prepare("SELECT id, name, email, role FROM users").all();
console.log('Users:', users);

const customers = db.prepare("SELECT id, name, phone, area FROM customers").all();
console.log(`Customers (${customers.length}):`, customers.map(c => `${c.name} (${c.area})`).join(', '));

const loans = db.prepare("SELECT id, principal, total_amount, weekly_installment, status FROM loans").all();
console.log(`Loans (${loans.length}):`, loans);

const collections = db.prepare("SELECT id, amount, week_number, collection_date FROM collections").all();
console.log(`Collections (${collections.length}):`, collections);

console.log('--- ALL DATABASE CHECKS PASSED ---');
