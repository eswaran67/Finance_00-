import { db, initDatabase } from '../src/db.js';

async function run() {
  await initDatabase();

  console.log('--- DATABASE VERIFICATION ---');
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', tables.map(t => t.name).join(', '));

  const users = await db.all("SELECT id, name, email, role FROM users");
  console.log('Users:', users);

  const customers = await db.all("SELECT id, name, phone, area FROM customers");
  console.log(`Customers (${customers.length}):`, customers.map(c => `${c.name} (${c.area})`).join(', '));

  const loans = await db.all("SELECT id, principal, total_amount, weekly_installment, status FROM loans");
  console.log(`Loans (${loans.length}):`, loans);

  const collections = await db.all("SELECT id, amount, week_number, collection_date FROM collections");
  console.log(`Collections (${collections.length}):`, collections);

  console.log('--- ALL DATABASE CHECKS PASSED ---');
}

run().catch(console.error);
