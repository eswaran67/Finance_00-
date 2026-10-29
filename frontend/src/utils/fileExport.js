// =================================================================
// SAVE TO MY FILES & DATA EXPORT ENGINE
// Supports Complete JSON Backups, Full Excel/CSV Ledgers, Date-Wise Reports
// UTF-8 BOM encoded for 100% accurate Tamil & English character rendering
// =================================================================

import { apiEndpoint } from '../apiConfig';

/**
 * Trigger immediate browser download of a Blob file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Format today's date YYYY-MM-DD
 */
export function getExportDateStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * 1. EXPORT FULL SYSTEM BACKUP (JSON)
 * Contains entire database state: customers, loans, collections, summaries
 */
export function exportFullJsonBackup(backupData, customDate = getExportDateStr()) {
  const exportPayload = {
    app: "Weekly Finance Management System",
    version: "2.0-executive",
    exportedAt: new Date().toISOString(),
    exportedDate: customDate,
    totalRecords: {
      customers: backupData?.customers?.length || 0,
      loans: backupData?.loans?.length || 0,
      collections: backupData?.collections?.length || 0
    },
    summary: backupData?.summary || {},
    customers: backupData?.customers || [],
    loans: backupData?.loans || [],
    collections: backupData?.collections || []
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `weekly-finance-full-backup-${customDate}.json`);
  return true;
}

/**
 * 2. EXPORT FULL ACCOUNTS LEDGER (CSV / EXCEL)
 * Formatted with UTF-8 BOM (\uFEFF) so Excel opens Tamil and English cleanly
 */
export function exportFullLedgerCsv(collections = [], loans = [], customers = [], customDate = getExportDateStr()) {
  const headers = [
    "Receipt ID",
    "Collection Date",
    "Customer Name",
    "Phone Number",
    "Area / Route",
    "Loan ID",
    "Weekly Installment (Rs)",
    "Amount Paid Today (Rs)",
    "Week Number",
    "Current Loan Balance (Rs)",
    "Total Loan Amount (Rs)",
    "Collector Name",
    "Notes"
  ];

  // Helper to escape CSV cell contents safely
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = collections.map(c => [
    escapeCell(c.id ? `REC-${c.id}` : '-'),
    escapeCell(c.collection_date || ''),
    escapeCell(c.customer_name || ''),
    escapeCell(c.customer_phone || ''),
    escapeCell(c.customer_area || ''),
    escapeCell(c.loan_id ? `LN-${c.loan_id}` : '-'),
    escapeCell(c.weekly_installment || c.loan_weekly_installment || ''),
    escapeCell(c.amount || 0),
    escapeCell(c.week_number ? `Week ${c.week_number}` : '-'),
    escapeCell(c.loan_balance !== undefined ? c.loan_balance : (c.current_loan_balance || 0)),
    escapeCell(c.total_amount || c.loan_total_amount || ''),
    escapeCell(c.collector_name || 'Admin'),
    escapeCell(c.notes || '')
  ]);

  // Compute total collected
  const totalAmount = collections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const summaryRow = [
    escapeCell("TOTAL SUMMARY"),
    escapeCell(`Generated on ${customDate}`),
    escapeCell(`${collections.length} Collections Total`),
    escapeCell(""),
    escapeCell(""),
    escapeCell(""),
    escapeCell("TOTAL RS:"),
    escapeCell(totalAmount),
    escapeCell(""),
    escapeCell(""),
    escapeCell(""),
    escapeCell(""),
    escapeCell("")
  ];

  const csvContent = "\uFEFF" + [
    headers.map(h => `"${h}"`).join(","),
    ...rows.map(r => r.join(",")),
    summaryRow.join(",")
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `weekly-finance-ledger-${customDate}.csv`);
  return true;
}

/**
 * 3. EXPORT CUSTOMERS DIRECTORY (CSV / EXCEL)
 */
export function exportCustomersCsv(customers = [], customDate = getExportDateStr()) {
  const headers = [
    "Customer ID",
    "Customer Name",
    "Phone Number",
    "Area / Route",
    "Address",
    "Active Loans",
    "Completed Loans",
    "Total Borrowed (Rs)",
    "Total Paid (Rs)",
    "Pending Balance (Rs)",
    "Registration Date"
  ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = customers.map(c => [
    escapeCell(c.id ? `CUST-${c.id}` : '-'),
    escapeCell(c.name || ''),
    escapeCell(c.phone || ''),
    escapeCell(c.area || ''),
    escapeCell(c.address || ''),
    escapeCell(c.active_loans_count || 0),
    escapeCell(c.completed_loans_count || 0),
    escapeCell(c.total_borrowed || 0),
    escapeCell(c.total_paid || 0),
    escapeCell(c.pending_balance || 0),
    escapeCell(c.created_at ? c.created_at.split(' ')[0] : '')
  ]);

  const totalBorrowed = customers.reduce((sum, c) => sum + (Number(c.total_borrowed) || 0), 0);
  const totalPaid = customers.reduce((sum, c) => sum + (Number(c.total_paid) || 0), 0);
  const totalPending = customers.reduce((sum, c) => sum + (Number(c.pending_balance) || 0), 0);

  const summaryRow = [
    escapeCell("TOTAL CUSTOMERS:"),
    escapeCell(customers.length),
    escapeCell(""),
    escapeCell(""),
    escapeCell("PORTFOLIO TOTALS:"),
    escapeCell(""),
    escapeCell(""),
    escapeCell(totalBorrowed),
    escapeCell(totalPaid),
    escapeCell(totalPending),
    escapeCell("")
  ];

  const csvContent = "\uFEFF" + [
    headers.map(h => `"${h}"`).join(","),
    ...rows.map(r => r.join(",")),
    summaryRow.join(",")
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `customers-directory-${customDate}.csv`);
  return true;
}

/**
 * 4. EXPORT DATE-WISE COLLECTIONS REPORT (CSV)
 * Filters by targetDate (e.g. '2026-10-29' or 'all')
 */
export function exportDateCollectionsCsv(targetDate, collections = []) {
  const isAll = !targetDate || targetDate === 'all';
  const filtered = isAll ? collections : collections.filter(c => c.collection_date === targetDate);
  const labelDate = isAll ? 'all-dates' : targetDate;

  const headers = [
    "Receipt ID",
    "Collection Date",
    "Customer Name",
    "Phone",
    "Route / Area",
    "Loan ID",
    "Amount Collected (Rs)",
    "Remaining Balance (Rs)",
    "Week No",
    "Notes"
  ];

  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = filtered.map(c => [
    escapeCell(c.id ? `REC-${c.id}` : '-'),
    escapeCell(c.collection_date || ''),
    escapeCell(c.customer_name || ''),
    escapeCell(c.customer_phone || ''),
    escapeCell(c.customer_area || ''),
    escapeCell(c.loan_id ? `LN-${c.loan_id}` : '-'),
    escapeCell(c.amount || 0),
    escapeCell(c.loan_balance !== undefined ? c.loan_balance : (c.current_loan_balance || 0)),
    escapeCell(c.week_number ? `Week ${c.week_number}` : '-'),
    escapeCell(c.notes || '')
  ]);

  const totalAmount = filtered.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const summaryRow = [
    escapeCell("TOTAL FOR DATE:"),
    escapeCell(targetDate),
    escapeCell(`${filtered.length} Collections`),
    escapeCell(""),
    escapeCell(""),
    escapeCell("TOTAL RS:"),
    escapeCell(totalAmount),
    escapeCell(""),
    escapeCell(""),
    escapeCell("")
  ];

  const csvContent = "\uFEFF" + [
    headers.map(h => `"${h}"`).join(","),
    ...rows.map(r => r.join(",")),
    summaryRow.join(",")
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `collections-${labelDate}-report.csv`);
  return { success: true, count: filtered.length, total: totalAmount };
}

/**
 * Fetch full database export from backend API with fallback
 */
export async function fetchFullExportData(token, fallbackStatsData) {
  try {
    const res = await fetch(apiEndpoint('/dashboard/export-all'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('Backend /export-all failed, falling back to client cache:', e);
  }

  // Fallback to client state
  return {
    success: true,
    appName: 'Weekly Finance',
    exportedAt: new Date().toISOString(),
    customers: fallbackStatsData?.customers || [],
    loans: fallbackStatsData?.loans || [],
    collections: fallbackStatsData?.collections || []
  };
}
