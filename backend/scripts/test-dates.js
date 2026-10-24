import { db } from '../src/db.js';

const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const currentYear = String(now.getFullYear());
const currentMonth = todayStr.slice(0, 7); // '2026-10'

console.log('Today:', todayStr, 'Current Month:', currentMonth, 'Current Year:', currentYear);

// Test monthly collection
const monthResult = db.prepare(`
  SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
  FROM collections 
  WHERE strftime('%Y-%m', collection_date) = ?
`).get(currentMonth);
console.log('This Month Collections:', monthResult);

// Test weekly collection (current week starting Monday)
// In SQLite, strftime('%Y-%W', date) gives Year-Week
const currentWeek = db.prepare(`SELECT strftime('%Y-%W', 'now') as week`).get().week;
const weekResult = db.prepare(`
  SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
  FROM collections 
  WHERE strftime('%Y-%W', collection_date) = strftime('%Y-%W', 'now')
`).get();
console.log('This Week Collections (Week ' + currentWeek + '):', weekResult);

// Test yearly collection (2026)
const yearResult = db.prepare(`
  SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
  FROM collections 
  WHERE strftime('%Y', collection_date) = ?
`).get(currentYear);
console.log('This Year Collections:', yearResult);

// Monthly breakdown across all time
const monthlyBreakdown = db.prepare(`
  SELECT 
    strftime('%Y-%m', collection_date) as month_key,
    strftime('%Y', collection_date) as year,
    COUNT(*) as count,
    SUM(amount) as total
  FROM collections
  GROUP BY month_key
  ORDER BY month_key DESC
`).all();
console.log('Monthly Breakdown:', monthlyBreakdown);
