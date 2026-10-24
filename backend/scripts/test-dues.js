import { db } from '../src/db.js';

const today = new Date().toISOString().split('T')[0];
const dueLoans = db.prepare(`
  SELECT 
    l.id as loan_id,
    l.weekly_installment,
    (l.total_amount - l.amount_paid) as balance_amount,
    l.weeks_paid,
    l.tenure_weeks,
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    c.area as customer_area,
    (SELECT COUNT(*) FROM collections WHERE loan_id = l.id AND collection_date = ?) as paid_today_count
  FROM loans l
  JOIN customers c ON l.customer_id = c.id
  WHERE l.status = 'active' AND (l.total_amount - l.amount_paid) > 0
`).all(today);

const pendingToday = dueLoans.filter(l => l.paid_today_count === 0);

console.log('Today:', today);
console.log('Total Active Loans:', dueLoans.length);
console.log('Pending Today Count:', pendingToday.length);
console.log('Pending Borrowers:', pendingToday.map(p => `${p.customer_name} (${p.customer_area}) - Due: ₹${p.weekly_installment}`));

