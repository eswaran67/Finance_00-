import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Protect all dashboard routes
router.use(authenticateToken);

// GET /api/dashboard/stats - Summary for the Weekly Finance Dashboard
router.get('/stats', (req, res) => {
  try {
    const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
    const activeLoanCount = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'active'").get().count;
    const completedLoanCount = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'completed'").get().count;
    
    // Totals across all loans
    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(principal), 0) as totalPrincipal,
        COALESCE(SUM(total_amount), 0) as totalLoanAmount,
        COALESCE(SUM(amount_paid), 0) as totalAmountPaid
      FROM loans
    `).get();

    // Total collections received
    const collectionTotals = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalCollected FROM collections
    `).get();

    const totalCollected = collectionTotals.totalCollected;
    const totalDue = Math.max(0, totals.totalLoanAmount - totalCollected);

    // Date calculations
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = today.slice(0, 7); // e.g. '2026-10'
    const currentYearStr = String(currentYear);

    // 1. Today's collection (இன்றைய வசூல்)
    const todayCollectedRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE collection_date = ?
    `).get(today);

    // 2. This Week's collection (இந்த வார வசூல்)
    const thisWeekRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE strftime('%Y-%W', collection_date) = strftime('%Y-%W', 'now')
    `).get();

    // 3. This Month's collection (இந்த மாத வசூல் e.g. 2026-10)
    const thisMonthRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE strftime('%Y-%m', collection_date) = ?
    `).get(currentMonth);

    // 4. This Year's collection (இந்த வருட வசூல் e.g. 2026)
    const thisYearRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE strftime('%Y', collection_date) = ?
    `).get(currentYearStr);

    // Weekly Target across active loans
    const weeklyTargetRow = db.prepare(`
      SELECT COALESCE(SUM(weekly_installment), 0) as weeklyTarget 
      FROM loans 
      WHERE status = 'active'
    `).get();

    const weeklyTarget = weeklyTargetRow.weeklyTarget || 0;

    // Monthly breakdown history
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

    // All Collections with customer, loan & date details
    const recentCollections = db.prepare(`
      SELECT 
        c.id,
        c.amount,
        c.week_number,
        c.collection_date,
        strftime('%Y-%m', c.collection_date) as collection_month,
        strftime('%Y', c.collection_date) as collection_year,
        c.collector_name,
        c.notes,
        cust.id as customer_id,
        cust.name as customer_name,
        cust.area as customer_area,
        cust.phone as customer_phone,
        l.id as loan_id,
        l.total_amount,
        l.amount_paid as loan_total_paid,
        (l.total_amount - l.amount_paid) as loan_balance,
        l.weekly_installment
      FROM collections c
      JOIN customers cust ON c.customer_id = cust.id
      JOIN loans l ON c.loan_id = l.id
      ORDER BY c.id DESC
      LIMIT 100
    `).all();

    // Customers with detailed financial calculations
    const customers = db.prepare(`
      SELECT 
        cust.id,
        cust.name,
        cust.phone,
        cust.area,
        cust.address,
        cust.created_at,
        (SELECT COUNT(*) FROM loans WHERE customer_id = cust.id AND status = 'active') as active_loans_count,
        (SELECT COUNT(*) FROM loans WHERE customer_id = cust.id AND status = 'completed') as completed_loans_count,
        (SELECT COUNT(*) FROM loans WHERE customer_id = cust.id) as total_loans_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM loans WHERE customer_id = cust.id) as total_borrowed,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM loans WHERE customer_id = cust.id) as total_paid,
        (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM loans WHERE customer_id = cust.id AND status = 'active') as pending_balance,
        (SELECT MAX(start_date) FROM loans WHERE customer_id = cust.id) as latest_loan_date
      FROM customers cust
      ORDER BY cust.name ASC
    `).all();

    // Loans with full calculation details (vangina amount, balance, start_date)
    const loans = db.prepare(`
      SELECT 
        l.id,
        l.customer_id,
        l.principal,
        l.interest_rate,
        l.total_amount,
        l.weekly_installment,
        l.tenure_weeks,
        l.weeks_paid,
        l.amount_paid,
        (l.total_amount - l.amount_paid) as balance_amount,
        l.status,
        l.start_date,
        l.created_at,
        c.name as customer_name,
        c.phone as customer_phone,
        c.area as customer_area
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      ORDER BY 
        CASE WHEN l.status = 'active' THEN 0 ELSE 1 END,
        l.id DESC
    `).all();

    // Today's pending borrowers (who need to pay today)
    const todayPendingDues = db.prepare(`
      SELECT 
        l.id as loan_id,
        l.customer_id,
        l.principal,
        l.total_amount,
        l.amount_paid,
        (l.total_amount - l.amount_paid) as balance_amount,
        l.weekly_installment,
        l.weeks_paid,
        l.tenure_weeks,
        l.start_date,
        c.name as customer_name,
        c.phone as customer_phone,
        c.area as customer_area,
        (SELECT COUNT(*) FROM collections WHERE loan_id = l.id AND collection_date = ?) as paid_today_count
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      WHERE l.status = 'active' AND (l.total_amount - l.amount_paid) > 0
      ORDER BY l.weekly_installment DESC
    `).all(today).filter(l => l.paid_today_count === 0);

    // Unique areas for route filtering
    const areas = db.prepare(`
      SELECT DISTINCT area FROM customers WHERE area IS NOT NULL AND area != '' ORDER BY area ASC
    `).all().map(r => r.area);

    res.json({
      summary: {
        totalCustomers: customerCount,
        activeLoans: activeLoanCount,
        completedLoans: completedLoanCount,
        totalDisbursed: totals.totalPrincipal,
        totalExpected: totals.totalLoanAmount,
        totalCollected: totalCollected,
        pendingDue: totalDue,
        weeklyTarget: weeklyTarget,
        // Time period specific metrics:
        todayCollected: todayCollectedRow.total,
        todayCount: todayCollectedRow.count,
        todayPendingDuesCount: todayPendingDues.length,
        thisWeekCollected: thisWeekRow.total,
        thisWeekCount: thisWeekRow.count,
        thisMonthCollected: thisMonthRow.total,
        thisMonthCount: thisMonthRow.count,
        thisYearCollected: thisYearRow.total,
        thisYearCount: thisYearRow.count,
        currentMonthName: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        currentYear: currentYear,
        todayDate: today
      },
      periodStats: {
        today: todayCollectedRow,
        thisWeek: thisWeekRow,
        thisMonth: thisMonthRow,
        thisYear: thisYearRow
      },
      todayPendingDues,
      monthlyBreakdown,
      recentCollections,
      customers,
      loans,
      areas
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data.' });
  }
});

// GET /api/dashboard/today-dues - Borrowers who need to pay today
router.get('/today-dues', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dueLoans = db.prepare(`
      SELECT 
        l.id as loan_id,
        l.customer_id,
        l.principal,
        l.total_amount,
        l.amount_paid,
        (l.total_amount - l.amount_paid) as balance_amount,
        l.weekly_installment,
        l.weeks_paid,
        l.tenure_weeks,
        l.start_date,
        c.name as customer_name,
        c.phone as customer_phone,
        c.area as customer_area,
        (SELECT COUNT(*) FROM collections WHERE loan_id = l.id AND collection_date = ?) as paid_today_count
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      WHERE l.status = 'active' AND (l.total_amount - l.amount_paid) > 0
      ORDER BY l.weekly_installment DESC
    `).all(today);

    const pendingToday = dueLoans.filter(l => l.paid_today_count === 0);

    res.json({
      date: today,
      count: pendingToday.length,
      dues: pendingToday
    });
  } catch (error) {
    console.error('Fetch today dues error:', error);
    res.status(500).json({ message: 'Failed to fetch today dues.' });
  }
});

// GET /api/dashboard/collections/by-date - Search collections on any specific date
router.get('/collections/by-date', (req, res) => {
  try {
    const searchDate = req.query.date || new Date().toISOString().split('T')[0];
    
    const collections = db.prepare(`
      SELECT 
        c.id,
        c.amount,
        c.week_number,
        c.collection_date,
        c.collector_name,
        c.notes,
        cust.id as customer_id,
        cust.name as customer_name,
        cust.area as customer_area,
        cust.phone as customer_phone,
        l.id as loan_id,
        l.total_amount,
        l.amount_paid as loan_total_paid,
        (l.total_amount - l.amount_paid) as loan_balance,
        l.weekly_installment
      FROM collections c
      JOIN customers cust ON c.customer_id = cust.id
      JOIN loans l ON c.loan_id = l.id
      WHERE c.collection_date = ?
      ORDER BY c.id DESC
    `).all(searchDate);

    const totalRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE collection_date = ?
    `).get(searchDate);

    res.json({
      date: searchDate,
      totalCollected: totalRow.total,
      count: totalRow.count,
      collections
    });
  } catch (error) {
    console.error('Fetch collections by date error:', error);
    res.status(500).json({ message: 'Failed to search collections by date.' });
  }
});

// GET /api/dashboard/customers/:id/statement - Customer Passbook & Full History
router.get('/customers/:id/statement', (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const loans = db.prepare(`
      SELECT 
        l.*,
        (l.total_amount - l.amount_paid) as balance_amount
      FROM loans l 
      WHERE l.customer_id = ? 
      ORDER BY l.id DESC
    `).all(customerId);

    const collections = db.prepare(`
      SELECT 
        c.*,
        l.total_amount,
        l.weekly_installment
      FROM collections c
      JOIN loans l ON c.loan_id = l.id
      WHERE c.customer_id = ?
      ORDER BY c.id DESC
    `).all(customerId);

    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_borrowed,
        COALESCE(SUM(amount_paid), 0) as total_paid
      FROM loans 
      WHERE customer_id = ?
    `).get(customerId);

    res.json({
      customer,
      loans,
      collections,
      summary: {
        totalBorrowed: totals.total_borrowed,
        totalPaid: totals.total_paid,
        pendingBalance: Math.max(0, totals.total_borrowed - totals.total_paid)
      }
    });
  } catch (error) {
    console.error('Customer statement error:', error);
    res.status(500).json({ message: 'Failed to load customer statement.' });
  }
});

// POST /api/dashboard/customers - Create new customer
router.post('/customers', (req, res) => {
  try {
    const { name, phone, area, address } = req.body;
    if (!name || !phone || !area) {
      return res.status(400).json({ message: 'Name, phone, and area are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO customers (user_id, name, phone, area, address)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.user.id, name.trim(), phone.trim(), area.trim(), address ? address.trim() : '');

    res.status(201).json({
      message: 'Customer added successfully',
      id: Number(result.lastInsertRowid)
    });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({ message: 'Failed to add customer.' });
  }
});

// DELETE /api/dashboard/customers/:id - Delete customer
router.delete('/customers/:id', (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    db.prepare('DELETE FROM collections WHERE customer_id = ?').run(customerId);
    db.prepare('DELETE FROM loans WHERE customer_id = ?').run(customerId);
    db.prepare('DELETE FROM customers WHERE id = ?').run(customerId);

    res.json({
      message: `Customer "${customer.name}" and all records have been deleted successfully.`
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Failed to delete customer.' });
  }
});

// POST /api/dashboard/loans - Create new weekly loan
router.post('/loans', (req, res) => {
  try {
    const { customer_id, principal, interest_rate = 10, tenure_weeks = 10, start_date } = req.body;
    if (!customer_id || !principal) {
      return res.status(400).json({ message: 'Customer ID and principal amount are required.' });
    }

    const princ = Number(principal);
    const rate = Number(interest_rate);
    const weeks = Number(tenure_weeks);
    const totalAmount = Math.round(princ + (princ * rate / 100));
    const weeklyInstallment = Math.round(totalAmount / weeks);
    const sDate = start_date || new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO loans (customer_id, principal, interest_rate, total_amount, weekly_installment, tenure_weeks, weeks_paid, amount_paid, status, start_date)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'active', ?)
    `);

    const result = stmt.run(customer_id, princ, rate, totalAmount, weeklyInstallment, weeks, sDate);

    res.status(201).json({
      message: 'Loan disbursed successfully',
      loan_id: Number(result.lastInsertRowid),
      totalAmount,
      weeklyInstallment,
      start_date: sDate
    });
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({ message: 'Failed to disburse loan.' });
  }
});

// PUT /api/dashboard/loans/:id/status - Mark loan as completed
router.put('/loans/:id/status', (req, res) => {
  try {
    const loanId = req.params.id;
    const { status } = req.body;
    const validStatus = status === 'completed' ? 'completed' : 'active';
    
    db.prepare('UPDATE loans SET status = ? WHERE id = ?').run(validStatus, loanId);

    res.json({
      message: `Loan status updated to ${validStatus}.`
    });
  } catch (error) {
    console.error('Update loan status error:', error);
    res.status(500).json({ message: 'Failed to update loan status.' });
  }
});

// DELETE /api/dashboard/loans/:id - Delete a loan
router.delete('/loans/:id', (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = db.prepare('SELECT id, customer_id, status FROM loans WHERE id = ?').get(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan account not found.' });
    }

    db.prepare('DELETE FROM collections WHERE loan_id = ?').run(loanId);
    db.prepare('DELETE FROM loans WHERE id = ?').run(loanId);

    res.json({
      message: 'Loan account and its collection entries deleted successfully.'
    });
  } catch (error) {
    console.error('Delete loan error:', error);
    res.status(500).json({ message: 'Failed to delete loan.' });
  }
});

// POST /api/dashboard/collections - Record received payment
router.post('/collections', (req, res) => {
  try {
    const { loan_id, customer_id, amount, week_number, collection_date, collector_name, notes } = req.body;
    if (!loan_id || !amount) {
      return res.status(400).json({ message: 'Loan ID and payment amount are required.' });
    }

    const payAmount = Number(amount);
    const dateOfCollection = collection_date || new Date().toISOString().split('T')[0];

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan_id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan account not found.' });
    }

    const custId = customer_id || loan.customer_id;
    const weekNum = week_number ? Number(week_number) : (loan.weeks_paid + 1);

    const insertColl = db.prepare(`
      INSERT INTO collections (loan_id, customer_id, amount, week_number, collection_date, collector_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const collResult = insertColl.run(
      loan_id, 
      custId, 
      payAmount, 
      weekNum, 
      dateOfCollection, 
      collector_name || req.user.name || 'Admin', 
      notes || 'Weekly installment payment'
    );

    const newAmountPaid = loan.amount_paid + payAmount;
    const newWeeksPaid = Math.max(loan.weeks_paid + 1, weekNum);
    const newStatus = newAmountPaid >= loan.total_amount ? 'completed' : loan.status;

    db.prepare(`
      UPDATE loans 
      SET amount_paid = ?, weeks_paid = ?, status = ?
      WHERE id = ?
    `).run(newAmountPaid, newWeeksPaid, newStatus, loan_id);

    const remainingBalance = Math.max(0, loan.total_amount - newAmountPaid);

    res.status(201).json({
      message: 'Payment collection recorded successfully',
      collection_id: Number(collResult.lastInsertRowid),
      amountPaid: payAmount,
      totalPaidNow: newAmountPaid,
      remainingBalance,
      isCompleted: newStatus === 'completed'
    });
  } catch (error) {
    console.error('Record collection error:', error);
    res.status(500).json({ message: 'Failed to record collection.' });
  }
});

// DELETE /api/dashboard/collections/:id - Undo / delete a collection entry
router.delete('/collections/:id', (req, res) => {
  try {
    const collectionId = req.params.id;
    const coll = db.prepare('SELECT * FROM collections WHERE id = ?').get(collectionId);
    if (!coll) {
      return res.status(404).json({ message: 'Collection entry not found.' });
    }

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(coll.loan_id);
    if (loan) {
      const rollbackAmountPaid = Math.max(0, loan.amount_paid - coll.amount);
      const rollbackWeeksPaid = Math.max(0, loan.weeks_paid - 1);
      const rollbackStatus = rollbackAmountPaid < loan.total_amount ? 'active' : loan.status;

      db.prepare(`
        UPDATE loans 
        SET amount_paid = ?, weeks_paid = ?, status = ?
        WHERE id = ?
      `).run(rollbackAmountPaid, rollbackWeeksPaid, rollbackStatus, loan.id);
    }

    db.prepare('DELETE FROM collections WHERE id = ?').run(collectionId);

    res.json({
      message: 'Collection payment removed and loan balance reversed successfully.'
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ message: 'Failed to delete collection entry.' });
  }
});

export default router;
