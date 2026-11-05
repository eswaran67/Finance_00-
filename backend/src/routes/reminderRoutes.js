import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  getTodayDueBorrowers,
  sendReminderForLoan,
  sendAllDueReminders,
  getNotificationSettings,
  checkAndRunDailyAutomatedReminders
} from '../services/reminderService.js';

const router = Router();

// Protect all reminder routes with auth
router.use(authenticateToken);

// 1. GET /api/reminders/due-today - Get list of borrowers due today with reminder status
router.get('/due-today', async (req, res) => {
  try {
    const borrowers = await getTodayDueBorrowers();
    const settings = await getNotificationSettings();

    const dueTodayCount = borrowers.filter(b => b.isDueToday).length;
    const pendingReminderCount = borrowers.filter(b => b.canSendReminder).length;
    const sentTodayCount = borrowers.filter(b => b.alreadyRemindedToday).length;

    res.json({
      settings,
      borrowers,
      summary: {
        totalBorrowers: borrowers.length,
        dueTodayCount,
        pendingReminderCount,
        sentTodayCount
      }
    });
  } catch (error) {
    console.error('Error fetching today dues for reminders:', error);
    res.status(500).json({ message: 'Failed to fetch due borrowers.', error: error.message });
  }
});

// 2. POST /api/reminders/send-all-today - 1-Click trigger to send reminders to all today's dues
router.post('/send-all-today', async (req, res) => {
  try {
    const result = await sendAllDueReminders('manual_blast');
    res.json({
      message: `Dispatched reminders to ${result.sentCount} customers successfully.`,
      ...result
    });
  } catch (error) {
    console.error('Error dispatching all reminders:', error);
    res.status(500).json({ message: 'Failed to send reminders to all borrowers.', error: error.message });
  }
});

// 3. POST /api/reminders/send-single - Send reminder to one specific borrower
router.post('/send-single', async (req, res) => {
  try {
    const { loanId } = req.body;
    if (!loanId) {
      return res.status(400).json({ message: 'loanId is required.' });
    }

    const result = await sendReminderForLoan(loanId, 'manual_single');
    res.json({
      message: `Reminder sent to ${result.customerName} successfully.`,
      result
    });
  } catch (error) {
    console.error('Error sending single reminder:', error);
    res.status(500).json({ message: 'Failed to send reminder.', error: error.message });
  }
});

// 4. GET /api/reminders/logs - View reminder delivery logs
router.get('/logs', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = await db.all(`
      SELECT 
        r.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.area as customer_area,
        l.weekly_installment
      FROM reminder_logs r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN loans l ON r.loan_id = l.id
      ORDER BY r.id DESC
      LIMIT ?
    `, limit);

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching reminder logs:', error);
    res.status(500).json({ message: 'Failed to fetch reminder history.', error: error.message });
  }
});

// 5. GET /api/reminders/settings - Get auto-reminder configuration
router.get('/settings', async (req, res) => {
  try {
    const settings = await getNotificationSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ message: 'Failed to load notification settings.', error: error.message });
  }
});

// 6. PUT /api/reminders/settings - Update auto-reminder configuration
router.put('/settings', async (req, res) => {
  try {
    const {
      auto_send_enabled = 1,
      send_time = '09:00',
      send_channel = 'whatsapp',
      provider = 'whatsapp_direct',
      finance_name = 'Weekly Finance',
      tamil_template,
      english_template,
      api_key = '',
      api_url = '',
      sender_phone = ''
    } = req.body;

    const existing = await getNotificationSettings();

    if (existing.id) {
      await db.run(`
        UPDATE notification_settings 
        SET 
          auto_send_enabled = ?,
          send_time = ?,
          send_channel = ?,
          provider = ?,
          finance_name = ?,
          tamil_template = ?,
          english_template = ?,
          api_key = ?,
          api_url = ?,
          sender_phone = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `,
        auto_send_enabled ? 1 : 0,
        send_time,
        send_channel,
        provider,
        finance_name,
        tamil_template,
        english_template,
        api_key,
        api_url,
        sender_phone,
        existing.id
      );
    } else {
      await db.run(`
        INSERT INTO notification_settings (
          auto_send_enabled, send_time, send_channel, provider, finance_name,
          tamil_template, english_template, api_key, api_url, sender_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        auto_send_enabled ? 1 : 0,
        send_time,
        send_channel,
        provider,
        finance_name,
        tamil_template,
        english_template,
        api_key,
        api_url,
        sender_phone
      );
    }

    const updated = await getNotificationSettings();
    res.json({
      message: 'Notification settings updated successfully.',
      settings: updated
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Failed to update settings.', error: error.message });
  }
});

// 7. POST /api/reminders/trigger-cron - Manually invoke background scheduler check
router.post('/trigger-cron', async (req, res) => {
  try {
    const result = await checkAndRunDailyAutomatedReminders();
    res.json({ message: 'Scheduler check completed.', result });
  } catch (error) {
    res.status(500).json({ message: 'Cron trigger failed.', error: error.message });
  }
});

export default router;
