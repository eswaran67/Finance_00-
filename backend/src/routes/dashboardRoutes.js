import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Protect all dashboard routes
router.use(authenticateToken);

// GET /api/dashboard/stats - Summary for the Weekly Finance Dashboard
router.get('/stats', async (req, res) => {
  try {
    const custRow = await db.get('SELECT COUNT(*) as count FROM customers');
    const customerCount = custRow ? custRow.count : 0;

    const activeRow = await db.get("SELECT COUNT(*) as count FROM loans WHERE status = 'active'");
    const activeLoanCount = activeRow ? activeRow.count : 0;

    const completedRow = await db.get("SELECT COUNT(*) as count FROM loans WHERE status = 'completed'");
    const completedLoanCount = completedRow ? completedRow.count : 0;
    
    // Totals across all loans
    const totals = await db.get(`
      SELECT 
        COALESCE(SUM(principal), 0) as totalPrincipal,
        COALESCE(SUM(total_amount), 0) as totalLoanAmount,
        COALESCE(SUM(amount_paid), 0) as totalAmountPaid
      FROM loans
    `) || { totalPrincipal: 0, totalLoanAmount: 0, totalAmountPaid: 0 };

    // Total collections received
    const collectionTotals = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as totalCollected FROM collections
    `) || { totalCollected: 0 };

    const totalCollected = collectionTotals.totalCollected;
    const totalDue = Math.max(0, totals.totalLoanAmount - totalCollected);

    // Date calculations
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = today.slice(0, 7); // e.g. '2026-10'
    const currentYearStr = String(currentYear);

    // 1. Today's collection (இன்றைய வசூல்)
    const todayCollectedRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE collection_date = ?
    `, today) || { total: 0, count: 0 };

    // 2. This Week's collection (இந்த வார வசூல்)
    const thisWeekRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE strftime('%Y-%W', collection_date) = strftime('%Y-%W', 'now')
    `) || { total: 0, count: 0 };

    // 3. This Month's collection (இந்த மாத வசூல் e.g. 2026-10)
    const thisMonthRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE strftime('%Y-%m', collection_date) = ?
    `, currentMonth) || { total: 0, count: 0 };

    // 4. This Year's collection (இந்த வருட வசூல் e.g. 2026)
    const thisYearRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE strftime('%Y', collection_date) = ?
    `, currentYearStr) || { total: 0, count: 0 };

    // Weekly Target across active loans
    const weeklyTargetRow = await db.get(`
      SELECT COALESCE(SUM(weekly_installment), 0) as weeklyTarget 
      FROM loans 
      WHERE status = 'active'
    `) || { weeklyTarget: 0 };

    const weeklyTarget = weeklyTargetRow.weeklyTarget || 0;

    // Monthly breakdown history
    const monthlyBreakdown = await db.all(`
      SELECT 
        strftime('%Y-%m', collection_date) as month_key,
        strftime('%Y', collection_date) as year,
        COUNT(*) as count,
        SUM(amount) as total
      FROM collections
      GROUP BY month_key
      ORDER BY month_key DESC
    `);

    // All Collections with customer, loan & date details
    const recentCollections = await db.all(`
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
    `);

    // Customers with detailed financial calculations
    const customers = await db.all(`
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
    `);

    // Loans with full calculation details (vangina amount, balance, start_date)
    const loans = await db.all(`
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
    `);

    // Today's pending borrowers (who need to pay today)
    const allDueLoans = await db.all(`
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
    `, today);

    const todayPendingDues = allDueLoans.filter(l => l.paid_today_count === 0);

    // Unique areas for route filtering
    const areasRows = await db.all(`
      SELECT DISTINCT area FROM customers WHERE area IS NOT NULL AND area != '' ORDER BY area ASC
    `);
    const areas = areasRows.map(r => r.area);

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
        todayDate: today,
        databaseProvider: db.isTurso ? 'Turso Cloud SQLite' : 'Local SQLite',
        isPermanentCloud: Boolean(db.isTurso)
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
router.get('/today-dues', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dueLoans = await db.all(`
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
    `, today);

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
router.get('/collections/by-date', async (req, res) => {
  try {
    const searchDate = req.query.date || new Date().toISOString().split('T')[0];
    
    const collections = await db.all(`
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
    `, searchDate);

    const totalRow = await db.get(`
      SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count 
      FROM collections 
      WHERE collection_date = ?
    `, searchDate) || { total: 0, count: 0 };

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
router.get('/customers/:id/statement', async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await db.get('SELECT * FROM customers WHERE id = ?', customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    const loans = await db.all(`
      SELECT 
        l.*,
        (l.total_amount - l.amount_paid) as balance_amount
      FROM loans l 
      WHERE l.customer_id = ? 
      ORDER BY l.id DESC
    `, customerId);

    const collections = await db.all(`
      SELECT 
        c.*,
        l.total_amount,
        l.weekly_installment
      FROM collections c
      JOIN loans l ON c.loan_id = l.id
      WHERE c.customer_id = ?
      ORDER BY c.id DESC
    `, customerId);

    const totals = await db.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_borrowed,
        COALESCE(SUM(amount_paid), 0) as total_paid
      FROM loans 
      WHERE customer_id = ?
    `, customerId) || { total_borrowed: 0, total_paid: 0 };

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
router.post('/customers', async (req, res) => {
  try {
    const { name, phone, area, address } = req.body;
    if (!name || !phone || !area) {
      return res.status(400).json({ message: 'Name, phone, and area are required.' });
    }

    const result = await db.run(
      'INSERT INTO customers (user_id, name, phone, area, address) VALUES (?, ?, ?, ?, ?)',
      req.user.id, name.trim(), phone.trim(), area.trim(), address ? address.trim() : ''
    );

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
router.delete('/customers/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await db.get('SELECT id, name FROM customers WHERE id = ?', customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    await db.run('DELETE FROM collections WHERE customer_id = ?', customerId);
    await db.run('DELETE FROM loans WHERE customer_id = ?', customerId);
    await db.run('DELETE FROM customers WHERE id = ?', customerId);

    res.json({
      message: `Customer "${customer.name}" and all records have been deleted successfully.`
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Failed to delete customer.' });
  }
});

// POST /api/dashboard/loans - Create new weekly loan
router.post('/loans', async (req, res) => {
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

    const result = await db.run(
      `INSERT INTO loans (customer_id, principal, interest_rate, total_amount, weekly_installment, tenure_weeks, weeks_paid, amount_paid, status, start_date)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, 'active', ?)`,
      customer_id, princ, rate, totalAmount, weeklyInstallment, weeks, sDate
    );

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
router.put('/loans/:id/status', async (req, res) => {
  try {
    const loanId = req.params.id;
    const { status } = req.body;
    const validStatus = status === 'completed' ? 'completed' : 'active';
    
    await db.run('UPDATE loans SET status = ? WHERE id = ?', validStatus, loanId);

    res.json({
      message: `Loan status updated to ${validStatus}.`
    });
  } catch (error) {
    console.error('Update loan status error:', error);
    res.status(500).json({ message: 'Failed to update loan status.' });
  }
});

// DELETE /api/dashboard/loans/:id - Delete a loan
router.delete('/loans/:id', async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await db.get('SELECT id, customer_id, status FROM loans WHERE id = ?', loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan account not found.' });
    }

    await db.run('DELETE FROM collections WHERE loan_id = ?', loanId);
    await db.run('DELETE FROM loans WHERE id = ?', loanId);

    res.json({
      message: 'Loan account and its collection entries deleted successfully.'
    });
  } catch (error) {
    console.error('Delete loan error:', error);
    res.status(500).json({ message: 'Failed to delete loan.' });
  }
});

// POST /api/dashboard/collections - Record received payment
router.post('/collections', async (req, res) => {
  try {
    const { loan_id, customer_id, amount, week_number, collection_date, collector_name, notes } = req.body;
    if (!loan_id || !amount) {
      return res.status(400).json({ message: 'Loan ID and payment amount are required.' });
    }

    const payAmount = Number(amount);
    const dateOfCollection = collection_date || new Date().toISOString().split('T')[0];

    const loan = await db.get('SELECT * FROM loans WHERE id = ?', loan_id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan account not found.' });
    }

    const custId = customer_id || loan.customer_id;
    const weekNum = week_number ? Number(week_number) : (loan.weeks_paid + 1);

    const collResult = await db.run(
      `INSERT INTO collections (loan_id, customer_id, amount, week_number, collection_date, collector_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

    await db.run(
      `UPDATE loans 
       SET amount_paid = ?, weeks_paid = ?, status = ?
       WHERE id = ?`,
      newAmountPaid, newWeeksPaid, newStatus, loan_id
    );

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
router.delete('/collections/:id', async (req, res) => {
  try {
    const collectionId = req.params.id;
    const coll = await db.get('SELECT * FROM collections WHERE id = ?', collectionId);
    if (!coll) {
      return res.status(404).json({ message: 'Collection entry not found.' });
    }

    const loan = await db.get('SELECT * FROM loans WHERE id = ?', coll.loan_id);
    if (loan) {
      const rollbackAmountPaid = Math.max(0, loan.amount_paid - coll.amount);
      const rollbackWeeksPaid = Math.max(0, loan.weeks_paid - 1);
      const rollbackStatus = rollbackAmountPaid < loan.total_amount ? 'active' : loan.status;

      await db.run(
        `UPDATE loans 
         SET amount_paid = ?, weeks_paid = ?, status = ?
         WHERE id = ?`,
        rollbackAmountPaid, rollbackWeeksPaid, rollbackStatus, loan.id
      );
    }

    await db.run('DELETE FROM collections WHERE id = ?', collectionId);

    res.json({
      message: 'Collection payment removed and loan balance reversed successfully.'
    });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ message: 'Failed to delete collection entry.' });
  }
});

// GET /api/dashboard/export-all - Complete Data Export for "Save to My Files"
router.get('/export-all', async (req, res) => {
  try {
    const customers = await db.all(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM loans WHERE customer_id = c.id AND status = 'active') as active_loans_count,
        (SELECT COUNT(*) FROM loans WHERE customer_id = c.id AND status = 'completed') as completed_loans_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM loans WHERE customer_id = c.id) as total_borrowed,
        (SELECT COALESCE(SUM(amount_paid), 0) FROM loans WHERE customer_id = c.id) as total_paid,
        (SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM loans WHERE customer_id = c.id AND status = 'active') as pending_balance
      FROM customers c
      ORDER BY c.id ASC
    `);

    const loans = await db.all(`
      SELECT 
        l.*,
        cust.name as customer_name,
        cust.phone as customer_phone,
        cust.area as customer_area,
        (l.total_amount - l.amount_paid) as pending_balance
      FROM loans l
      LEFT JOIN customers cust ON l.customer_id = cust.id
      ORDER BY l.id ASC
    `);

    const collections = await db.all(`
      SELECT 
        c.*,
        cust.name as customer_name,
        cust.phone as customer_phone,
        cust.area as customer_area,
        l.principal as loan_principal,
        l.total_amount as loan_total_amount,
        l.weekly_installment as loan_weekly_installment,
        (l.total_amount - l.amount_paid) as current_loan_balance
      FROM collections c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      LEFT JOIN loans l ON c.loan_id = l.id
      ORDER BY c.collection_date DESC, c.id DESC
    `);

    const summary = {
      totalCustomers: customers.length,
      totalLoans: loans.length,
      activeLoans: loans.filter(l => l.status === 'active').length,
      completedLoans: loans.filter(l => l.status === 'completed').length,
      totalPrincipalDisbursed: loans.reduce((sum, l) => sum + (Number(l.principal) || 0), 0),
      totalRepayablePortfolio: loans.reduce((sum, l) => sum + (Number(l.total_amount) || 0), 0),
      totalCollected: collections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
      totalOutstandingBalance: loans
        .filter(l => l.status === 'active')
        .reduce((sum, l) => sum + Math.max(0, (Number(l.total_amount) || 0) - (Number(l.amount_paid) || 0)), 0),
      totalReceipts: collections.length
    };

    res.json({
      success: true,
      appName: 'Weekly Finance',
      exportedAt: new Date().toISOString(),
      summary,
      customers,
      loans,
      collections
    });
  } catch (error) {
    console.error('Export all data error:', error);
    res.status(500).json({ message: 'Failed to export database records.' });
  }
});

export default router;
