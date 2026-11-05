import { db } from '../db.js';

/**
 * Returns today's date string YYYY-MM-DD and current day name (e.g. 'Thursday')
 */
export function getTodayDateAndDay() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];
  return { todayStr, dayName, now };
}

/**
 * Formats template placeholders with real borrower financial figures
 */
export function formatReminderMessage(template, params) {
  if (!template) return '';
  return template
    .replace(/\{customer_name\}/g, params.customer_name || 'வாடிக்கையாளர்')
    .replace(/\{installment\}/g, Number(params.installment || 0).toLocaleString('en-IN'))
    .replace(/\{balance\}/g, Number(params.balance || 0).toLocaleString('en-IN'))
    .replace(/\{due_date\}/g, params.due_date || '')
    .replace(/\{collection_day\}/g, params.collection_day || '')
    .replace(/\{finance_name\}/g, params.finance_name || 'Weekly Finance')
    .replace(/\{area\}/g, params.area || '');
}

/**
 * Retrieves the global notification settings
 */
export async function getNotificationSettings() {
  const row = await db.get('SELECT * FROM notification_settings ORDER BY id ASC LIMIT 1');
  if (row) return row;

  return {
    auto_send_enabled: 1,
    send_time: '09:00',
    send_channel: 'whatsapp',
    provider: 'whatsapp_direct',
    finance_name: 'Weekly Finance',
    tamil_template: 'வணக்கம் {customer_name}, {finance_name}-லிருந்து நினைவூட்டல்: உங்கள் வாரத் தவணை ₹{installment} இன்று ({due_date}) செலுத்த வேண்டியுள்ளது. (மீதி பாக்கி: ₹{balance}). நன்றி!',
    english_template: 'Hello {customer_name}, Reminder from {finance_name}: Your weekly installment of ₹{installment} is due today ({due_date}). (Pending Balance: ₹{balance}). Thank you!',
    last_cron_run: null
  };
}

/**
 * Finds all active borrowers whose installment is due today and not paid today
 */
export async function getTodayDueBorrowers() {
  const { todayStr, dayName } = getTodayDateAndDay();

  // Active loans with outstanding balance
  const query = `
    SELECT 
      l.id as loan_id,
      l.customer_id,
      l.principal,
      l.interest_rate,
      l.total_amount,
      l.weekly_installment,
      l.tenure_weeks,
      l.weeks_paid,
      l.amount_paid,
      (l.total_amount - l.amount_paid) as balance_amount,
      l.status as loan_status,
      l.start_date,
      COALESCE(l.collection_day, 'Monday') as collection_day,
      l.next_due_date,
      l.last_reminder_sent,
      l.reminder_status,
      c.name as customer_name,
      c.phone as customer_phone,
      COALESCE(c.whatsapp_number, c.phone) as whatsapp_number,
      c.area as customer_area,
      COALESCE(c.preferred_lang, 'ta') as preferred_lang,
      COALESCE(c.notification_enabled, 1) as notification_enabled,
      c.id_proof_number,
      (SELECT COUNT(*) FROM collections WHERE loan_id = l.id AND collection_date = ?) as paid_today_count
    FROM loans l
    JOIN customers c ON l.customer_id = c.id
    WHERE l.status = 'active' AND (l.total_amount - l.amount_paid) > 0
    ORDER BY l.weekly_installment DESC
  `;

  const rows = await db.all(query, todayStr);

  const settings = await getNotificationSettings();

  return rows.map((borrower) => {
    // Determine if due today:
    // 1) Explicit next_due_date is today
    // 2) OR collection_day matches today's day of week
    // 3) OR collection_day is 'Daily'
    // 4) If neither set, check weekly cycle from start_date
    const isDueByDate = borrower.next_due_date === todayStr;
    const isDueByDay = borrower.collection_day === dayName || borrower.collection_day === 'Daily';
    
    // In Tamil microfinance, loans are collected weekly on their collection day
    const isDueToday = isDueByDate || isDueByDay;
    const hasPaidToday = borrower.paid_today_count > 0;
    const alreadyRemindedToday = borrower.last_reminder_sent === todayStr;

    // Pick appropriate template
    const template = borrower.preferred_lang === 'en' 
      ? settings.english_template 
      : settings.tamil_template;

    const formattedMessage = formatReminderMessage(template, {
      customer_name: borrower.customer_name,
      installment: borrower.weekly_installment,
      balance: borrower.balance_amount,
      due_date: todayStr,
      collection_day: borrower.collection_day,
      finance_name: settings.finance_name || 'Weekly Finance',
      area: borrower.customer_area
    });

    // Clean phone for WhatsApp (e.g. +91 98401 23456 -> 919840123456)
    const rawPhone = borrower.whatsapp_number || borrower.customer_phone || '';
    const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
    const fullPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const waUrl = fullPhone ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(formattedMessage)}` : '';

    return {
      ...borrower,
      isDueToday,
      hasPaidToday,
      alreadyRemindedToday,
      formattedMessage,
      cleanPhone: fullPhone,
      waUrl,
      canSendReminder: isDueToday && !hasPaidToday && borrower.notification_enabled === 1 && !alreadyRemindedToday
    };
  });
}

/**
 * Dispatches an automated reminder for a single loan
 */
export async function sendReminderForLoan(loanId, triggerType = 'automatic_cron') {
  const { todayStr } = getTodayDateAndDay();
  const settings = await getNotificationSettings();

  const borrower = await db.get(`
    SELECT 
      l.id as loan_id,
      l.customer_id,
      l.weekly_installment,
      (l.total_amount - l.amount_paid) as balance_amount,
      COALESCE(l.collection_day, 'Monday') as collection_day,
      l.last_reminder_sent,
      c.name as customer_name,
      c.phone as customer_phone,
      COALESCE(c.whatsapp_number, c.phone) as whatsapp_number,
      c.area as customer_area,
      COALESCE(c.preferred_lang, 'ta') as preferred_lang,
      COALESCE(c.notification_enabled, 1) as notification_enabled
    FROM loans l
    JOIN customers c ON l.customer_id = c.id
    WHERE l.id = ?
  `, loanId);

  if (!borrower) {
    throw new Error(`Loan with ID ${loanId} not found`);
  }

  const template = borrower.preferred_lang === 'en' 
    ? settings.english_template 
    : settings.tamil_template;

  const messageBody = formatReminderMessage(template, {
    customer_name: borrower.customer_name,
    installment: borrower.weekly_installment,
    balance: borrower.balance_amount,
    due_date: todayStr,
    collection_day: borrower.collection_day,
    finance_name: settings.finance_name || 'Weekly Finance',
    area: borrower.customer_area
  });

  const rawPhone = borrower.whatsapp_number || borrower.customer_phone || '';
  const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
  const fullPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

  let deliveryStatus = 'sent';
  let responseInfo = `Dispatched via ${settings.provider || 'whatsapp_direct'}`;

  // If a remote webhook or UltraMsg/Twilio API is configured, call it
  if (settings.provider === 'webhook' && settings.api_url) {
    try {
      const res = await fetch(settings.api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: fullPhone,
          message: messageBody,
          channel: settings.send_channel || 'whatsapp',
          customer_name: borrower.customer_name,
          loan_id: borrower.loan_id
        })
      });
      responseInfo = `Webhook response status: ${res.status}`;
      if (!res.ok) deliveryStatus = 'failed';
    } catch (e) {
      deliveryStatus = 'failed';
      responseInfo = `Webhook error: ${e.message}`;
    }
  }

  // Record in reminder_logs
  const logResult = await db.run(`
    INSERT INTO reminder_logs (
      loan_id, customer_id, customer_name, phone, channel, message_type,
      message_body, status, sent_by, response_info
    ) VALUES (?, ?, ?, ?, ?, 'due_reminder', ?, ?, ?, ?)
  `, 
    borrower.loan_id,
    borrower.customer_id,
    borrower.customer_name,
    rawPhone,
    settings.send_channel || 'whatsapp',
    messageBody,
    deliveryStatus,
    triggerType,
    responseInfo
  );

  // Update loan record
  await db.run(`
    UPDATE loans 
    SET last_reminder_sent = ?, reminder_status = ? 
    WHERE id = ?
  `, todayStr, deliveryStatus, borrower.loan_id);

  return {
    success: deliveryStatus === 'sent',
    logId: logResult.lastInsertRowid,
    loanId: borrower.loan_id,
    customerName: borrower.customer_name,
    phone: rawPhone,
    messageBody,
    status: deliveryStatus
  };
}

/**
 * Sends reminders to ALL due borrowers today who haven't received one yet
 */
export async function sendAllDueReminders(triggerType = 'manual_blast') {
  const allBorrowers = await getTodayDueBorrowers();
  const eligible = allBorrowers.filter(b => b.isDueToday && !b.hasPaidToday && b.notification_enabled === 1 && !b.alreadyRemindedToday);

  const results = [];
  for (const borrower of eligible) {
    try {
      const res = await sendReminderForLoan(borrower.loan_id, triggerType);
      results.push(res);
    } catch (err) {
      results.push({
        success: false,
        loanId: borrower.loan_id,
        customerName: borrower.customer_name,
        error: err.message
      });
    }
  }

  return {
    totalEligible: eligible.length,
    sentCount: results.filter(r => r.success).length,
    results
  };
}

/**
 * Daily scheduler function checked periodically by background worker
 */
export async function checkAndRunDailyAutomatedReminders() {
  try {
    const settings = await getNotificationSettings();
    if (!settings.auto_send_enabled) {
      return { skipped: true, reason: 'Auto-messaging is disabled in settings' };
    }

    const { todayStr, now } = getTodayDateAndDay();

    // Check if already executed today
    if (settings.last_cron_run === todayStr) {
      return { skipped: true, reason: `Already ran today (${todayStr})` };
    }

    // Check scheduled send_time (e.g. '09:00')
    const [targetHour, targetMin] = (settings.send_time || '09:00').split(':').map(Number);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    // If current time is past or at scheduled time
    const isTimeToRun = currentHour > targetHour || (currentHour === targetHour && currentMin >= targetMin);

    if (!isTimeToRun) {
      return { skipped: true, reason: `Current time ${currentHour}:${currentMin} is before scheduled send_time ${settings.send_time}` };
    }

    console.log(`[Auto-Reminder] Running daily automated due reminder broadcast for ${todayStr}...`);
    const dispatchResult = await sendAllDueReminders('automatic_cron');

    // Update last_cron_run
    await db.run('UPDATE notification_settings SET last_cron_run = ? WHERE id = ?', todayStr, settings.id || 1);

    console.log(`[Auto-Reminder] Dispatched ${dispatchResult.sentCount} automated reminders successfully!`);
    return {
      success: true,
      todayStr,
      sentCount: dispatchResult.sentCount,
      results: dispatchResult.results
    };
  } catch (error) {
    console.error('[Auto-Reminder] Error in daily scheduler check:', error);
    return { error: error.message };
  }
}
