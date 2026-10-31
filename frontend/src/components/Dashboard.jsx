import React, { useState, useEffect } from 'react';
import WalletIcon from './WalletIcon';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  Plus, 
  LogOut, 
  CheckCircle2, 
  DollarSign, 
  RefreshCw,
  Phone,
  MapPin,
  Trash2,
  Search,
  BookOpen,
  MessageCircle,
  Printer,
  AlertTriangle,
  Clock,
  CalendarDays,
  BarChart3,
  XCircle,
  Filter,
  Bell,
  CheckCheck,
  X,
  Sun,
  Moon,
  Globe,
  Palette,
  HardDriveDownload,
  Download,
  FileText
} from 'lucide-react';
import { getTranslation } from '../translations';
import { API_BASE, apiEndpoint } from '../apiConfig';
import SaveFilesModal from './SaveFilesModal';
import BackgroundCustomizerModal from './BackgroundCustomizerModal';
import { getSavedBackground } from '../utils/backgroundManager';
import { exportDateCollectionsCsv, exportFullLedgerCsv, exportCustomersCsv } from '../utils/fileExport';

export default function Dashboard({ 
  user, 
  onLogout, 
  theme, 
  toggleTheme, 
  lang = 'ta', 
  toggleLang,
  bgConfig,
  setBgConfig,
  onOpenBgModal 
}) {
  const t = (key, params) => getTranslation(lang, key, params);
  const [statsData, setStatsData] = useState(null);
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' | 'loans' | 'collections' | 'analytics'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Save to My Files modal state
  const [showSaveFilesModal, setShowSaveFilesModal] = useState(false);
  const [showBgModalLocal, setShowBgModalLocal] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'active' | 'completed'
  const [periodFilter, setPeriodFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_YEAR'

  // Specific Date Search Bar state (தேதி வாரியான வசூல் தேடல்)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [specificDateSearch, setSpecificDateSearch] = useState('');

  // Notification System state (இன்று பணம் கொடுக்க வேண்டியவர்கள்)
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedDueLoanIds, setDismissedDueLoanIds] = useState([]);
  const [allDuesCleared, setAllDuesCleared] = useState(false);

  // Modals state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showRouteSheetModal, setShowRouteSheetModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Customer Statement Data
  const [customerStatement, setCustomerStatement] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Forms
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', area: '', address: '' });
  const [newLoan, setNewLoan] = useState({ 
    customer_id: '', 
    principal: 10000, 
    interest_rate: 10, 
    tenure_weeks: 10, 
    start_date: todayDateStr 
  });
  const [newPayment, setNewPayment] = useState({ 
    loan_id: '', 
    customer_id: '', 
    customer_name: '',
    total_amount: 0,
    amount_paid: 0,
    balance: 0,
    weekly_installment: 0,
    amount: '', 
    week_number: 1, 
    collection_date: todayDateStr,
    notes: 'Weekly cash collection' 
  });

  const token = localStorage.getItem('thunai_ledger_token');

  // Floating Toast Notification System
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'warning' | 'error' | 'info', id }
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(current => (current?.id === toast.id ? null : current));
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Customer Avatar Initials and Gradient Colors
  const getInitials = (name = '') => {
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'CU';
  };

  const getAvatarGradient = (name = '') => {
    const gradients = [
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  // WhatsApp Share Statement
  const handleShareStatementWhatsApp = () => {
    if (!customerStatement?.customer) return;
    const { customer, summary, loans } = customerStatement;
    const activeLoan = loans?.find(l => l.status === 'active') || loans?.[0];
    const msg = lang === 'ta'
      ? `*வாராந்திர நிதி - வாடிக்கையாளர் அறிக்கை*\n\n` +
        `👤 வாடிக்கையாளர்: *${customer.name}*\n` +
        `📞 எண்: ${customer.phone}\n` +
        `📍 பகுதி: ${customer.area}\n\n` +
        `💰 கடன் தொகை: *${formatCurrency(summary.totalBorrowed)}*\n` +
        `✅ செலுத்தியது: *${formatCurrency(summary.totalPaid)}*\n` +
        `⚠️ மீதி பாக்கி: *${formatCurrency(summary.pendingBalance)}*\n` +
        (activeLoan ? `⚡ வார தவணை: *${formatCurrency(activeLoan.weekly_installment)}*\n` : '') +
        `\nநன்றி! - வாராந்திர நிதி மேலாண்மை`
      : `*Weekly Finance - Account Statement*\n\n` +
        `👤 Customer: *${customer.name}*\n` +
        `📞 Phone: ${customer.phone}\n` +
        `📍 Area: ${customer.area}\n\n` +
        `💰 Total Borrowed: *${formatCurrency(summary.totalBorrowed)}*\n` +
        `✅ Amount Paid: *${formatCurrency(summary.totalPaid)}*\n` +
        `⚠️ Pending Balance: *${formatCurrency(summary.pendingBalance)}*\n` +
        (activeLoan ? `⚡ Weekly Due: *${formatCurrency(activeLoan.weekly_installment)}*\n` : '') +
        `\nThank you! - Weekly Finance Management`;
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone ? (cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone) : ''}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Fetch Dashboard Stats & Lists
  const fetchDashboardStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiEndpoint('/dashboard/stats'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = 'Failed to load dashboard data';
        try {
          const errData = JSON.parse(text);
          if (errData.message) msg = errData.message;
        } catch {}
        throw new Error(msg);
      }
      const data = await res.json();
      setStatsData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Format Currency (₹ Indian Rupee)
  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  // Open Quick Collect Modal for a specific Loan
  const openQuickCollect = (loan) => {
    const balance = loan.total_amount - loan.amount_paid;
    setNewPayment({
      loan_id: loan.id || loan.loan_id,
      customer_id: loan.customer_id,
      customer_name: loan.customer_name,
      total_amount: loan.total_amount,
      amount_paid: loan.amount_paid,
      balance: balance,
      weekly_installment: loan.weekly_installment,
      amount: Math.min(balance, loan.weekly_installment),
      week_number: (loan.weeks_paid || 0) + 1,
      collection_date: todayDateStr,
      notes: `Week ${(loan.weeks_paid || 0) + 1} installment`
    });
    setShowRecordPayment(true);
    setShowNotifications(false);
  };

  // View Customer Passbook Statement
  const openCustomerStatement = async (customerId) => {
    setLoadingStatement(true);
    setShowStatementModal(true);
    try {
      const res = await fetch(apiEndpoint(`/dashboard/customers/${customerId}/statement`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setCustomerStatement(data);
    } catch (err) {
      showToast(err.message || 'Error fetching customer statement', 'error');
      setShowStatementModal(false);
    } finally {
      setLoadingStatement(false);
    }
  };

  // Record Payment Submission
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiEndpoint('/dashboard/collections'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPayment)
      });
      const data = await res.json();
      if (res.ok) {
        setShowRecordPayment(false);
        // Automatically dismiss this borrower's notification since they paid today!
        if (newPayment.loan_id) {
          setDismissedDueLoanIds(prev => [...prev, Number(newPayment.loan_id)]);
        }
        fetchDashboardStats();
        if (data.isCompleted) {
          showToast(lang === 'ta' ? '🎉 கடன் முழுமையாக முடிக்கப்பட்டது! (மீதி: ₹0)' : '🎉 Loan fully settled & completed! (Balance: ₹0)', 'success');
        } else {
          showToast(lang === 'ta' ? `₹${newPayment.amount} வசூல் வெற்றிகரமாக பதிவு செய்யப்பட்டது! ✅` : `Payment of ₹${newPayment.amount} recorded successfully! ✅`, 'success');
        }
      } else {
        showToast(data.message || 'Failed to record payment', 'warning');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    }
  };

  // Add Customer Submission
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiEndpoint('/dashboard/customers'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      });
      if (res.ok) {
        setShowAddCustomer(false);
        setNewCustomer({ name: '', phone: '', area: '', address: '' });
        fetchDashboardStats();
        showToast(lang === 'ta' ? 'புதிய வாடிக்கையாளர் வெற்றிகரமாக சேர்க்கப்பட்டார்! 👤' : 'Customer added successfully! 👤', 'success');
      }
    } catch (err) {
      showToast('Failed to add customer: ' + err.message, 'error');
    }
  };

  // Create Loan Submission
  const handleCreateLoan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiEndpoint('/dashboard/loans'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newLoan)
      });
      if (res.ok) {
        setShowAddLoan(false);
        setNewLoan({ 
          customer_id: '', 
          principal: 10000, 
          interest_rate: 10, 
          tenure_weeks: 10, 
          start_date: todayDateStr 
        });
        fetchDashboardStats();
        showToast(lang === 'ta' ? 'கடன் வெற்றிகரமாக வழங்கப்பட்டது! 💼' : 'Loan disbursed successfully! 💼', 'success');
      }
    } catch (err) {
      showToast('Failed to create loan: ' + err.message, 'error');
    }
  };

  // Mark Loan as Completed / Settle Early
  const handleMarkLoanCompleted = async (loanId) => {
    if (!window.confirm(lang === 'ta' ? 'இந்த கடனை முழுமையாக முடித்து வைக்கவா?' : 'Are you sure you want to mark this loan as fully COMPLETED / CLOSED?')) return;
    try {
      const res = await fetch(apiEndpoint(`/dashboard/loans/${loanId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        fetchDashboardStats();
        showToast(lang === 'ta' ? 'கடன் வெற்றிகரமாக முடிக்கப்பட்டது!' : 'Loan marked as completed!', 'info');
      }
    } catch (err) {
      showToast('Failed to update status: ' + err.message, 'error');
    }
  };

  // Execute Delete
  const executeDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    const endpoint = apiEndpoint(`/dashboard/${type}s/${id}`);

    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteConfirm(null);
        fetchDashboardStats();
        showToast(lang === 'ta' ? 'வெற்றிகரமாக நீக்கப்பட்டது! 🗑️' : 'Deleted successfully! 🗑️', 'info');
      } else {
        showToast(data.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Error deleting item: ' + err.message, 'error');
    }
  };

  // Summary figures from backend
  const summary = statsData?.summary || {
    totalCustomers: 0,
    activeLoans: 0,
    completedLoans: 0,
    totalDisbursed: 0,
    totalExpected: 0,
    totalCollected: 0,
    pendingDue: 0,
    weeklyTarget: 0,
    todayCollected: 0,
    todayCount: 0,
    thisWeekCollected: 0,
    thisWeekCount: 0,
    thisMonthCollected: 0,
    thisMonthCount: 0,
    thisYearCollected: 0,
    thisYearCount: 0,
    currentMonthName: 'This Month',
    currentYear: 2026,
    todayDate: todayDateStr
  };

  const currentMonthStr = todayDateStr.slice(0, 7);
  const currentYearStr = String(summary.currentYear || 2026);

  // Helper: Yesterday's date string
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  // Active Today's Due Notifications List (இன்று பணம் கொடுக்க வேண்டியவர்கள்)
  const rawTodayDues = statsData?.todayPendingDues || [];
  const activeTodayDues = allDuesCleared 
    ? [] 
    : rawTodayDues.filter(due => !dismissedDueLoanIds.includes(Number(due.loan_id)));

  const activeNotificationCount = activeTodayDues.length;

  // Clear All Notifications Handler (அனைத்தும் அழிக்கும் வசதி)
  const handleClearAllNotifications = () => {
    setAllDuesCleared(true);
    setDismissedDueLoanIds(rawTodayDues.map(d => Number(d.loan_id)));
  };

  // Dismiss Single Notification Handler
  const handleDismissSingleNotification = (loanId) => {
    setDismissedDueLoanIds(prev => [...prev, Number(loanId)]);
  };

  // Restore/Refresh Notifications
  const handleRestoreNotifications = () => {
    setAllDuesCleared(false);
    setDismissedDueLoanIds([]);
    fetchDashboardStats();
  };

  // Filtered Customers
  const filteredCustomers = (statsData?.customers || []).filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery) || 
                          c.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = selectedArea === 'ALL' || c.area === selectedArea;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'active' && c.active_loans_count > 0) ||
      (statusFilter === 'completed' && c.active_loans_count === 0 && c.completed_loans_count > 0);
    return matchesSearch && matchesArea && matchesStatus;
  });

  // Filtered Loans
  const filteredLoans = (statsData?.loans || []).filter(l => {
    const matchesSearch = l.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.customer_phone.includes(searchQuery) || 
                          l.customer_area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = selectedArea === 'ALL' || l.customer_area === selectedArea;
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesArea && matchesStatus;
  });

  // Filtered Collections with Date Search & Period Filters
  const filteredCollections = (statsData?.recentCollections || []).filter(col => {
    const matchesSearch = col.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          col.customer_phone.includes(searchQuery) ||
                          col.customer_area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = selectedArea === 'ALL' || col.customer_area === selectedArea;

    if (specificDateSearch) {
      return matchesSearch && matchesArea && col.collection_date === specificDateSearch;
    }

    let matchesPeriod = true;
    if (periodFilter === 'TODAY') {
      matchesPeriod = col.collection_date === todayDateStr;
    } else if (periodFilter === 'THIS_MONTH') {
      matchesPeriod = col.collection_date && col.collection_date.startsWith(currentMonthStr);
    } else if (periodFilter === 'THIS_YEAR') {
      matchesPeriod = col.collection_date && col.collection_date.startsWith(currentYearStr);
    }

    return matchesSearch && matchesArea && matchesPeriod;
  });

  // Total amount in currently filtered collections
  const currentFilteredCollectionTotal = filteredCollections.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Live balance preview in payment modal
  const enteredAmount = Number(newPayment.amount) || 0;
  const projectedBalance = Math.max(0, newPayment.balance - enteredAmount);

  return (
    <div className="dashboard-container" style={{ background: 'transparent' }}>
      {/* Top Navigation Bar */}
      <header className="dashboard-nav">
        <div className="brand-wrapper">
          <div className="brand-icon-small">
            <WalletIcon className="wallet-svg" containerBg="var(--primary-emerald-dark)" />
          </div>
          <div className="brand-text">
            <span>{t('brandSubtitle')}</span>
            <h1>{t('brandTitle')}</h1>
          </div>
        </div>

        <div className="nav-actions">
          {/* Quick Language Switcher Button */}
          <button 
            type="button"
            onClick={toggleLang} 
            className="lang-toggle-btn"
            title={lang === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
          >
            <Globe size={15} />
            <span className="lang-toggle-label">{t('langName')}</span>
          </button>

          {/* Quick Theme Switcher Button */}
          <button 
            type="button"
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="theme-toggle-label">{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
          </button>

          {/* Notification Bell with Badge & Dropdown */}
          <div className="notification-wrapper">
            <button 
              className="notification-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
              title={t('duesTitle')}
            >
              <Bell size={18} />
              {activeNotificationCount > 0 && (
                <span className="notification-badge">
                  {activeNotificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <div className="notification-header-title">
                    <Bell size={16} color="var(--primary-emerald)" />
                    <h4>{t('duesTitle')}</h4>
                    {activeNotificationCount > 0 && (
                      <span>{activeNotificationCount} {t('duesCount')}</span>
                    )}
                  </div>

                  {activeNotificationCount > 0 ? (
                    <button 
                      onClick={handleClearAllNotifications}
                      className="btn-clear-all"
                      title={t('clearAll')}
                    >
                      <CheckCheck size={13} />
                      {t('clearAll')}
                    </button>
                  ) : (
                    <button 
                      onClick={handleRestoreNotifications}
                      className="btn-clear-all"
                      style={{ color: 'var(--primary-emerald)', borderColor: 'var(--border-subtle)' }}
                      title={t('checkAgain')}
                    >
                      <RefreshCw size={12} />
                      {t('checkAgain')}
                    </button>
                  )}
                </div>

                <div className="notification-list">
                  {activeTodayDues.map((due) => {
                    const cleanPhone = due.customer_phone ? due.customer_phone.replace(/[^0-9]/g, '') : '';
                    return (
                      <div key={due.loan_id} className="notification-card">
                        <div className="notification-card-top">
                          <div>
                            <div className="notification-card-name">{due.customer_name}</div>
                            <div className="notification-card-meta">
                              <MapPin size={11} /> {due.customer_area}
                              {due.customer_phone && ` • 📞 ${due.customer_phone}`}
                            </div>
                          </div>

                          <div className="notification-card-amount">
                            <div className="notification-due-value">
                              {formatCurrency(due.weekly_installment)}
                            </div>
                            <div className="notification-bal-text">
                              {t('balance')}: {formatCurrency(due.balance_amount)}
                            </div>
                          </div>
                        </div>

                        <div className="notification-card-actions">
                          {cleanPhone && (
                            <a 
                              href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
                                lang === 'ta'
                                  ? `வணக்கம் ${due.customer_name}, Weekly Finance: உங்கள் வாராந்திர தவணை ${formatCurrency(due.weekly_installment)} இன்று செலுத்த வேண்டியுள்ளது. (மீதி பாக்கி: ${formatCurrency(due.balance_amount)}). நன்றி!`
                                  : `Hello ${due.customer_name}, Weekly Finance: Your weekly installment of ${formatCurrency(due.weekly_installment)} is due today. (Pending Balance: ${formatCurrency(due.balance_amount)}). Thank you!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-whatsapp"
                              style={{ padding: '4px 8px', fontSize: '11.5px' }}
                              title={t('whatsappReminder')}
                            >
                              <MessageCircle size={12} /> {t('whatsappReminder')}
                            </a>
                          )}

                          <button 
                            onClick={() => handleDismissSingleNotification(due.loan_id)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}
                            title={t('dismiss')}
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {activeNotificationCount === 0 && (
                    <div className="notification-empty">
                      <div className="notification-empty-icon">
                        <CheckCircle2 size={24} />
                      </div>
                      <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {t('allCaughtUp')}
                      </strong>
                      <p style={{ margin: 0, fontSize: '12.5px' }}>
                        {t('allCaughtUpSub')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="user-badge">
            <span className="status-dot online"></span>
            <span>{user?.email || '1234@gmail.com'}</span>
          </div>

          <div 
            className="user-badge db-pill" 
            title={summary.isPermanentCloud ? "Permanent Turso Cloud Database Active" : "Local SQLite Database (thunai_ledger.db)"}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Database size={13} style={{ color: summary.isPermanentCloud ? 'var(--primary-emerald)' : '#38bdf8' }} />
            <span>{summary.isPermanentCloud ? 'Turso Cloud' : 'Local DB'}</span>
          </div>

          <button 
            onClick={() => {
              if (onOpenBgModal) onOpenBgModal();
              else setShowBgModalLocal(true);
            }} 
            className="btn-secondary nav-action-btn" 
            title={t('bgCustomizerBtn')}
          >
            <Palette size={15} />
            <span>{t('bgCustomizerBtn')}</span>
          </button>

          <button onClick={() => setShowSaveFilesModal(true)} className="btn-secondary nav-action-btn save-files-nav-btn" title={t('saveToFilesBtn')}>
            <HardDriveDownload size={15} />
            <span>{t('saveToFilesBtn')}</span>
          </button>

          <button onClick={() => setShowRouteSheetModal(true)} className="btn-secondary" title={t('routeSheetBtn')}>
            <Printer size={15} />
            {t('routeSheetBtn')}
          </button>

          <button onClick={fetchDashboardStats} className="btn-secondary" title={t('refreshBtn')}>
            <RefreshCw size={15} />
            {t('refreshBtn')}
          </button>

          <button onClick={onLogout} className="logout-btn">
            <LogOut size={15} />
            {t('signOutBtn')}
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="dashboard-body">
        {/* Today's Notification Alert Banner (if dues exist and not cleared) */}
        {activeNotificationCount > 0 && (
          <div className="today-alert-banner">
            <div className="today-alert-left">
              <div className="today-alert-icon">
                <Bell size={20} />
              </div>
              <div className="today-alert-text">
                <h4>
                  {t('dueAlertHeading', { count: activeNotificationCount })}
                </h4>
                <p>
                  {t('dueAlertSub', { amount: formatCurrency(activeTodayDues.reduce((s, d) => s + (d.weekly_installment || 0), 0)) })}
                </p>
              </div>
            </div>

            <div className="today-alert-actions">
              <button 
                onClick={() => setShowNotifications(true)}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '12.5px' }}
              >
                {t('viewList')}
              </button>

              <button 
                onClick={handleClearAllNotifications}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12.5px', color: '#dc2626' }}
                title={t('clearAll')}
              >
                <CheckCheck size={14} /> {t('clearAll')}
              </button>
            </div>
          </div>
        )}

        {/* Top Header & Fast Action Buttons */}
        <div className="dashboard-hero">
          <div className="hero-titles">
            <h2>{t('heroTitle')}</h2>
            <p>{t('heroSub')}</p>
          </div>

          <div className="action-buttons">
            <button onClick={() => setShowAddCustomer(true)} className="btn-secondary">
              <Plus size={16} /> {t('newCustomerBtn')}
            </button>
            <button onClick={() => setShowAddLoan(true)} className="btn-secondary">
              <Plus size={16} /> {t('disburseLoanBtn')}
            </button>
            <button 
              onClick={() => {
                const firstActive = statsData?.loans?.find(l => l.status === 'active');
                if (firstActive) {
                  openQuickCollect(firstActive);
                } else {
                  showToast(lang === 'ta' ? 'வசூல் செய்ய கடன் கணக்குகள் ஏதுமில்லை.' : 'No active loans available to collect.', 'warning');
                }
              }} 
              className="btn-primary"
            >
              <Plus size={16} /> {t('recordPaymentBtn')}
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* KEY FINANCIAL CARDS: TODAY, WEEK, MONTH, YEAR & BALANCE   */}
        {/* ========================================================= */}
        <div className="stats-grid">
          {/* 1. Today's Collection (இன்றைய வசூல்) - PROMINENT */}
          <div 
            className="stat-card stat-card-today" 
            onClick={() => {
              setActiveTab('collections');
              setSpecificDateSearch(todayDateStr);
            }}
            title={t('todayCollectionTitle')}
          >
            <div className="stat-card-glow-bg"></div>
            <div className="stat-label">
              <span className="stat-label-title">{t('todayCollectionTitle')}</span>
              <div className="stat-icon-wrapper mint">
                <Clock size={19} />
              </div>
            </div>
            <div className="stat-value val-emerald">
              {formatCurrency(summary.todayCollected)}
            </div>
            <div className="stat-subtext text-emerald">
              {t('todayCollectedSub', { count: summary.todayCount || 0, date: todayDateStr })}
            </div>
          </div>

          {/* 2. This Week's Collection (இந்த வார வசூல்) */}
          <div 
            className="stat-card stat-card-week clickable"
            onClick={() => {
              setActiveTab('collections');
              setPeriodFilter('THIS_WEEK');
              setSpecificDateSearch('');
            }}
            title={lang === 'ta' ? 'இந்த வார வசூல் விவரங்களை பார்க்க கிளிக் செய்க' : 'Click to view this week\'s collections'}
          >
            <div className="stat-card-glow-bg"></div>
            <div className="stat-label">
              <span className="stat-label-title">{t('weekCollectionTitle')}</span>
              <div className="stat-icon-wrapper emerald">
                <TrendingUp size={19} />
              </div>
            </div>
            <div className="stat-value val-teal">
              {formatCurrency(summary.thisWeekCollected)}
            </div>
            <div className="stat-subtext text-teal">{t('weekTarget', { amount: formatCurrency(summary.weeklyTarget) })}</div>
          </div>

          {/* 3. This Month's Collection (இந்த மாத வசூல்) */}
          <div 
            className="stat-card stat-card-month clickable"
            onClick={() => {
              setActiveTab('collections');
              setPeriodFilter('THIS_MONTH');
              setSpecificDateSearch('');
            }}
            title={lang === 'ta' ? 'இந்த மாத வசூல் விவரங்களை பார்க்க கிளிக் செய்க' : 'Click to view this month\'s collections'}
          >
            <div className="stat-card-glow-bg"></div>
            <div className="stat-label">
              <span className="stat-label-title">{t('monthCollectionTitle')}</span>
              <div className="stat-icon-wrapper teal">
                <CalendarDays size={19} />
              </div>
            </div>
            <div className="stat-value val-cyan">
              {formatCurrency(summary.thisMonthCollected)}
            </div>
            <div className="stat-subtext text-cyan">{t('monthCollectionsCount', { month: summary.currentMonthName || '', count: summary.thisMonthCount || 0 })}</div>
          </div>

          {/* 4. This Year's Collection (இந்த வருட வசூல் - 2026) */}
          <div 
            className="stat-card stat-card-year clickable"
            onClick={() => {
              setActiveTab('analytics');
            }}
            title={lang === 'ta' ? 'முழு நிதி பகுப்பாய்வு பார்க்க கிளிக் செய்க' : 'Click to view full portfolio analytics'}
          >
            <div className="stat-card-glow-bg"></div>
            <div className="stat-label">
              <span className="stat-label-title">{t('yearCollectionTitle', { year: summary.currentYear })}</span>
              <div className="stat-icon-wrapper blue">
                <BarChart3 size={19} />
              </div>
            </div>
            <div className="stat-value val-blue">
              {formatCurrency(summary.thisYearCollected)}
            </div>
            <div className="stat-subtext text-blue">{t('yearTotalSub', { year: summary.currentYear })}</div>
          </div>

          {/* 5. Pending Balance Due (மீதி பாக்கி) */}
          <div 
            className="stat-card stat-card-balance clickable"
            onClick={() => {
              setActiveTab('loans');
              setStatusFilter('active');
            }}
            title={lang === 'ta' ? 'நிலுவை கடன்களை பார்க்க கிளிக் செய்க' : 'Click to view active pending loans'}
          >
            <div className="stat-card-glow-bg"></div>
            <div className="stat-label">
              <span className="stat-label-title">{t('pendingBalanceTitle')}</span>
              <div className="stat-icon-wrapper rose">
                <DollarSign size={19} />
              </div>
            </div>
            <div className="stat-value val-rose">
              {formatCurrency(summary.pendingDue)}
            </div>
            <div className="stat-subtext text-rose">{t('pendingLoansSub', { count: summary.activeLoans })}</div>
          </div>

          {/* 6. Total Collected All Time (மொத்த வசூல்) */}
          <div 
            className="stat-card stat-card-total clickable"
            onClick={() => {
              setActiveTab('customers');
            }}
            title={lang === 'ta' ? 'வாடிக்கையாளர் பட்டியலை பார்க்க கிளிக் செய்க' : 'Click to view all customers'}
          >
            <div className="stat-card-glow-bg"></div>
            <div className="stat-label">
              <span className="stat-label-title">{t('allTimeCollectedTitle')}</span>
              <div className="stat-icon-wrapper jade">
                <CheckCircle2 size={19} />
              </div>
            </div>
            <div className="stat-value val-purple">
              {formatCurrency(summary.totalCollected)}
            </div>
            <div className="stat-subtext text-purple">{t('allTimeCustomersSub', { count: summary.totalCustomers })}</div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DEDICATED DATE SEARCH BAR (தேதி வாரியான வசூல் தேடல்)       */}
        {/* ========================================================= */}
        <div className="date-search-container">
          <div className="date-search-label">
            <Calendar size={18} color="var(--primary-emerald)" />
            <span>{t('searchByDateTitle')}</span>
          </div>

          <div className="date-input-group">
            <input 
              type="date"
              className="date-picker-input"
              value={specificDateSearch}
              onChange={(e) => {
                setSpecificDateSearch(e.target.value);
                setActiveTab('collections');
              }}
              title="Select any date to see collections on that day"
            />

            <button 
              type="button"
              className={`date-quick-btn ${specificDateSearch === todayDateStr ? 'active' : ''}`}
              onClick={() => {
                setSpecificDateSearch(todayDateStr);
                setActiveTab('collections');
              }}
            >
              {t('dateQuickToday')}
            </button>

            <button 
              type="button"
              className={`date-quick-btn ${specificDateSearch === getYesterdayStr() ? 'active' : ''}`}
              onClick={() => {
                setSpecificDateSearch(getYesterdayStr());
                setActiveTab('collections');
              }}
            >
              {t('dateQuickYesterday')}
            </button>

            {specificDateSearch && (
              <button 
                type="button"
                className="date-quick-btn"
                style={{ color: '#dc2626' }}
                onClick={() => setSpecificDateSearch('')}
                title={t('dateQuickClear')}
              >
                <XCircle size={14} /> {t('dateQuickClear')}
              </button>
            )}

            <button 
              type="button"
              className="date-quick-btn save-date-file-btn"
              onClick={() => {
                const targetD = specificDateSearch || todayDateStr;
                const res = exportDateCollectionsCsv(targetD, statsData?.collections || []);
                showToast(
                  lang === 'ta' 
                    ? `${res.count} வசூல்கள் கோப்பாகச் சேமிக்கப்பட்டன!` 
                    : `${res.count} collection receipts for ${targetD} saved to file!`, 
                  'success'
                );
              }}
              title={t('saveDateToFilesBtn')}
            >
              <Download size={14} />
              <span>{t('saveDateToFilesBtn')}</span>
            </button>
          </div>
        </div>

        {/* Specific Date Result Highlight Banner (when a date is searched) */}
        {specificDateSearch && (
          <div className="date-result-banner">
            <div className="date-result-left">
              <h4>
                📅 {t('dateResultHeading', { date: specificDateSearch })} {specificDateSearch === todayDateStr ? t('dateResultTodayBadge') : ''}
              </h4>
              <div className="date-result-amount">
                {formatCurrency(currentFilteredCollectionTotal)}
              </div>
            </div>

            <div className="date-result-right">
              <span className="date-count-pill">
                {t('receiptsFound', { count: filteredCollections.length })}
              </span>

              <button 
                onClick={() => {
                  const res = exportDateCollectionsCsv(specificDateSearch, statsData?.collections || []);
                  showToast(
                    lang === 'ta' 
                      ? `${res.count} வசூல்கள் கோப்பாகச் சேமிக்கப்பட்டன!` 
                      : `${res.count} receipts saved to file!`, 
                    'success'
                  );
                }}
                className="btn-primary"
                style={{ padding: '6px 14px', fontSize: '12.5px', gap: '6px' }}
                title={t('saveDateToFilesBtn')}
              >
                <Download size={14} />
                <span>{lang === 'ta' ? 'இத்தேதியை கோப்பில் சேமி' : 'Save Date to File'}</span>
              </button>

              <button 
                onClick={() => setSpecificDateSearch('')}
                className="btn-clear-date"
              >
                {t('showAllRecords')}
              </button>
            </div>
          </div>
        )}

        {/* Search & Area Filter Bar */}
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input 
              type="text"
              placeholder={t('searchPlaceholder')}
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('routeAreaLabel')}</label>
            <select 
              className="filter-select"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="ALL">{t('allRoutes')}</option>
              {statsData?.areas?.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>

            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{t('statusLabel')}</label>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">{t('allStatus')}</option>
              <option value="active">{t('activeOnly')}</option>
              <option value="completed">{t('completedOnly')}</option>
            </select>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            {t('tabCustomers')} ({filteredCustomers.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'loans' ? 'active' : ''}`}
            onClick={() => setActiveTab('loans')}
          >
            {t('tabLoans')} ({filteredLoans.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveTab('collections')}
          >
            {t('tabCollections')} ({filteredCollections.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            {t('tabAnalytics')}
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: CUSTOMERS DIRECTORY WITH PAID & BALANCE BREAKDOWN  */}
        {/* ========================================================= */}
        {activeTab === 'customers' && (
          <div className="table-card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>{t('colCustomer')}</th>
                    <th>{t('colPhoneArea')}</th>
                    <th>{t('colStartDate')}</th>
                    <th>{t('colTotalBorrowed')}</th>
                    <th>{t('colPaidAmount')}</th>
                    <th>{t('colPendingBalance')}</th>
                    <th>{t('colFinanceStatus')}</th>
                    <th style={{ textAlign: 'center' }}>{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => {
                    const activeLoan = statsData?.loans?.find(l => l.customer_id === cust.id && l.status === 'active');
                    const isFinanceCompleted = cust.active_loans_count === 0 && cust.total_loans_count > 0;
                    const cleanPhone = cust.phone.replace(/[^0-9]/g, '');

                    return (
                      <tr key={cust.id}>
                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar" style={{ background: getAvatarGradient(cust.name) }}>
                              {getInitials(cust.name)}
                            </div>
                            <div className="customer-cell-details">
                              <strong className="customer-name-heading">{cust.name}</strong>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{cust.address || 'No address'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                              <Phone size={12} color="#0f766e" /> {cust.phone}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={11} /> {cust.area}
                          </div>
                        </td>
                        <td>
                          {cust.latest_loan_date ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                              <Calendar size={13} color="#64748b" /> {cust.latest_loan_date}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>No loan yet</span>
                          )}
                        </td>
                        <td>
                          <strong>{formatCurrency(cust.total_borrowed)}</strong>
                        </td>
                        <td style={{ color: '#16a34a', fontWeight: 'bold' }}>
                          {formatCurrency(cust.total_paid)}
                        </td>
                        <td style={{ color: cust.pending_balance > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                          {formatCurrency(cust.pending_balance)}
                        </td>
                        <td>
                          {cust.active_loans_count > 0 ? (
                            <span className="badge active">
                              Active ({cust.active_loans_count})
                            </span>
                          ) : isFinanceCompleted ? (
                            <span className="badge completed" style={{ background: '#dcfce7', color: '#15803d' }}>
                              ✓ Completed / முடிந்தது
                            </span>
                          ) : (
                            <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
                              No Loans
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                            {activeLoan && (
                              <button 
                                onClick={() => openQuickCollect(activeLoan)}
                                className="btn-sm-collect"
                                title="Record Collection Payment"
                              >
                                Collect (வசூல்)
                              </button>
                            )}

                            <button 
                              onClick={() => openCustomerStatement(cust.id)}
                              className="btn-sm-statement"
                              title="View Full Passbook & Statement"
                            >
                              <BookOpen size={13} />
                              Passbook
                            </button>

                            {cleanPhone && (
                              <a 
                                href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
                                  `வணக்கம் ${cust.name}, Weekly Finance: உங்கள் கடன் விவரம் - மொத்த கடன்: ${formatCurrency(cust.total_borrowed)}, செலுத்திய தொகை: ${formatCurrency(cust.total_paid)}, மீதி பாக்கி: ${formatCurrency(cust.pending_balance)}. நன்றி!`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-whatsapp"
                                title="Send WhatsApp Receipt/Reminder"
                              >
                                <MessageCircle size={13} />
                              </a>
                            )}

                            <button 
                              onClick={() => setDeleteConfirm({
                                type: 'customer',
                                id: cust.id,
                                name: cust.name,
                                reason: isFinanceCompleted ? 'Finance completed' : 'Delete customer and all records'
                              })}
                              className="btn-danger"
                              title="Delete customer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        No customers found matching the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LOANS ACCOUNTS WITH START DATE & BALANCE           */}
        {/* ========================================================= */}
        {activeTab === 'loans' && (
          <div className="table-card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>{t('colLoanId')}</th>
                    <th>{t('colCustomer')}</th>
                    <th>{t('colStartDate')}</th>
                    <th>{t('colPrincipalTotal')}</th>
                    <th>{t('colWeeklyInstallment')}</th>
                    <th>{t('colPaidVsBalance')}</th>
                    <th>{t('colRepaymentProgress')}</th>
                    <th>{t('colFinanceStatus')}</th>
                    <th style={{ textAlign: 'center' }}>{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => {
                    const balance = loan.total_amount - loan.amount_paid;
                    const percent = Math.min(100, Math.round((loan.amount_paid / loan.total_amount) * 100));
                    const isCompleted = loan.status === 'completed' || balance <= 0;

                    return (
                      <tr key={loan.id}>
                        <td><strong>#LN-{loan.id}</strong></td>
                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar" style={{ background: getAvatarGradient(loan.customer_name) }}>
                              {getInitials(loan.customer_name)}
                            </div>
                            <div className="customer-cell-details">
                              <strong className="customer-name-heading">{loan.customer_name}</strong>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{loan.customer_area} • {loan.customer_phone}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <Calendar size={13} color="var(--primary-emerald)" /> {loan.start_date}
                          </span>
                        </td>
                        <td>
                          <div>{t('analyticsTotalBorrowed')}: {formatCurrency(loan.principal)}</div>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>Total: {formatCurrency(loan.total_amount)}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({loan.interest_rate}% interest)</div>
                        </td>
                        <td style={{ color: 'var(--primary-emerald)', fontWeight: 800 }}>
                          {formatCurrency(loan.weekly_installment)} / wk
                        </td>
                        <td>
                          <div style={{ color: '#16a34a', fontWeight: 'bold' }}>
                            {t('colPaidAmount')}: {formatCurrency(loan.amount_paid)}
                          </div>
                          <div style={{ color: balance > 0 ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>
                            {t('colPendingBalance')}: {formatCurrency(balance)}
                          </div>
                        </td>
                        <td style={{ minWidth: '180px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                            <span>{t('weekProgress', { week: loan.weeks_paid, total: loan.tenure_weeks })}</span>
                            <span style={{ fontWeight: 700 }}>{percent}%</span>
                          </div>
                          <div style={{ height: '7px', background: 'var(--border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${percent}%`, 
                                height: '100%', 
                                background: percent >= 100 ? '#16a34a' : 'var(--primary-emerald)', 
                                borderRadius: '4px' 
                              }} 
                            />
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${isCompleted ? 'completed' : 'active'}`}>
                            {isCompleted ? t('badgeCompleted') : t('badgeActive')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                            {!isCompleted ? (
                              <>
                                <button 
                                  onClick={() => openQuickCollect(loan)}
                                  className="btn-sm-collect"
                                >
                                  {t('btnCollect')}
                                </button>
                                <button
                                  onClick={() => handleMarkLoanCompleted(loan.id)}
                                  className="btn-sm-statement"
                                  title={t('btnMarkSettled')}
                                >
                                  {t('btnMarkSettled')}
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => setDeleteConfirm({
                                  type: 'loan',
                                  id: loan.id,
                                  name: `Loan #LN-${loan.id} (${loan.customer_name})`,
                                  reason: 'Completed finance'
                                })}
                                className="btn-danger"
                                title={t('btnDelete')}
                              >
                                <Trash2 size={13} /> {t('btnDelete')}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLoans.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        {t('noLoansFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: COLLECTIONS LEDGER WITH PERIOD & DATE SEARCH       */}
        {/* ========================================================= */}
        {activeTab === 'collections' && (
          <div>
            {/* Period Quick Filter Pills */}
            <div className="period-pills-bar">
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-sub)', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Filter size={14} /> {lang === 'ta' ? 'வடிகட்டி:' : 'Filter:'}
              </span>
              <button 
                className={`period-pill ${periodFilter === 'ALL' && !specificDateSearch ? 'active' : ''}`}
                onClick={() => {
                  setPeriodFilter('ALL');
                  setSpecificDateSearch('');
                }}
              >
                {t('periodAll')}
              </button>
              <button 
                className={`period-pill ${periodFilter === 'TODAY' || specificDateSearch === todayDateStr ? 'active' : ''}`}
                onClick={() => {
                  setPeriodFilter('TODAY');
                  setSpecificDateSearch(todayDateStr);
                }}
              >
                ⚡ {t('periodToday')} ({formatCurrency(summary.todayCollected)})
              </button>
              <button 
                className={`period-pill ${periodFilter === 'THIS_WEEK' && !specificDateSearch ? 'active' : ''}`}
                onClick={() => {
                  setPeriodFilter('THIS_WEEK');
                  setSpecificDateSearch('');
                }}
              >
                📅 {t('periodThisWeek')} ({formatCurrency(summary.thisWeekCollected)})
              </button>
              <button 
                className={`period-pill ${periodFilter === 'THIS_MONTH' && !specificDateSearch ? 'active' : ''}`}
                onClick={() => {
                  setPeriodFilter('THIS_MONTH');
                  setSpecificDateSearch('');
                }}
              >
                🗓️ {t('periodThisMonth')} ({formatCurrency(summary.thisMonthCollected)})
              </button>
              <button 
                className={`period-pill ${periodFilter === 'THIS_YEAR' && !specificDateSearch ? 'active' : ''}`}
                onClick={() => {
                  setPeriodFilter('THIS_YEAR');
                  setSpecificDateSearch('');
                }}
              >
                🏆 {t('periodThisYear')} ({formatCurrency(summary.thisYearCollected)})
              </button>
            </div>

            {/* Summary Strip */}
            {!specificDateSearch && (
              <div className="period-summary-strip">
                <div>
                  <div className="period-strip-title">
                    {t('periodSummaryTitle', { 
                      period: periodFilter === 'ALL' 
                        ? t('periodAll') 
                        : periodFilter === 'TODAY' 
                        ? t('periodToday') 
                        : periodFilter === 'THIS_WEEK' 
                        ? t('periodThisWeek') 
                        : periodFilter === 'THIS_MONTH' 
                        ? t('periodThisMonth') 
                        : t('periodThisYear') 
                    })}
                  </div>
                  <div className="period-strip-value">
                    {formatCurrency(currentFilteredCollectionTotal)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => setShowSaveFilesModal(true)} 
                    className="btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title={t('saveToFilesBtn')}
                  >
                    <HardDriveDownload size={14} />
                    <span>{t('saveToFilesBtn')}</span>
                  </button>

                  <div style={{ textAlign: 'right', fontSize: '13px' }}>
                    <div><strong>{filteredCollections.length}</strong> {t('receiptsFound', { count: filteredCollections.length })}</div>
                    <div style={{ opacity: 0.85, marginTop: '2px' }}>
                      {t('weekTarget', { amount: formatCurrency(summary.weeklyTarget) })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="table-card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>{t('colReceiptNo')}</th>
                      <th>{t('colCollectionDate')}</th>
                      <th>{t('colCustomer')}</th>
                      <th>{t('routeAreaLabel')}</th>
                      <th>{t('colWeeklyInstallment')}</th>
                      <th>{t('colPaidAmount')}</th>
                      <th>{t('colPendingBalance')}</th>
                      <th>{t('colCollectorNotes')}</th>
                      <th style={{ textAlign: 'center' }}>{t('colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCollections.map((col) => (
                      <tr key={col.id}>
                        <td><strong>#RC-{col.id}</strong></td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <Calendar size={13} color="var(--primary-emerald)" /> {col.collection_date}
                          </span>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <div className="customer-avatar" style={{ background: getAvatarGradient(col.customer_name) }}>
                              {getInitials(col.customer_name)}
                            </div>
                            <div className="customer-cell-details">
                              <strong className="customer-name-heading">{col.customer_name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{col.customer_phone}</div>
                            </div>
                          </div>
                        </td>
                        <td>{col.customer_area}</td>
                        <td>Week {col.week_number}</td>
                        <td style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '14.5px' }}>
                          {formatCurrency(col.amount)}
                        </td>
                        <td style={{ color: col.loan_balance > 0 ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>
                          {formatCurrency(col.loan_balance)}
                        </td>
                        <td>
                          <div>{col.notes || '-'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>By: {col.collector_name || 'Admin'}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => setDeleteConfirm({
                              type: 'collection',
                              id: col.id,
                              name: `Receipt #RC-${col.id} (${col.customer_name} - ${formatCurrency(col.amount)})`,
                              reason: 'Reverse this payment entry'
                            })}
                            className="btn-danger"
                            title={t('btnReverse')}
                          >
                            <Trash2 size={13} /> {t('btnReverse')}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredCollections.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                          {specificDateSearch ? (
                            <div>
                              <p style={{ fontSize: '15px', color: 'var(--text-sub)', marginBottom: '8px' }}>
                                📅 {t('noCollectionsFound')} ({specificDateSearch})
                              </p>
                              <button 
                                onClick={() => setSpecificDateSearch('')} 
                                className="btn-secondary" 
                                style={{ display: 'inline-flex', margin: '0 auto' }}
                              >
                                {t('showAllRecords')}
                              </button>
                            </div>
                          ) : (
                            t('noCollectionsFound')
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PERIOD COLLECTION ANALYTICS (TODAY, WEEK, MONTH)   */}
        {/* ========================================================= */}
        {activeTab === 'analytics' && (
          <div>
            <div className="analytics-grid">
              {/* Today Analytics Card */}
              <div className="analytics-card" style={{ borderTop: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {t('todayCollectionTitle')}
                  </h3>
                  <Clock size={20} color="#10b981" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
                  {formatCurrency(summary.todayCollected)}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {t('todayCollectedSub', { count: summary.todayCount || 0, date: todayDateStr })}
                </p>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '12.5px', color: 'var(--text-sub)' }}>
                  {t('weekTarget', { amount: formatCurrency(summary.weeklyTarget) })}
                </div>
              </div>

              {/* This Week Analytics Card */}
              <div className="analytics-card" style={{ borderTop: '4px solid #16a34a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {t('weekCollectionTitle')}
                  </h3>
                  <TrendingUp size={20} color="#16a34a" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#2dd4bf', marginBottom: '8px' }}>
                  {formatCurrency(summary.thisWeekCollected)}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {summary.thisWeekCount || 0} receipts
                </p>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '12.5px', color: 'var(--text-sub)' }}>
                  {t('weekTarget', { amount: formatCurrency(summary.weeklyTarget) })}
                </div>
              </div>

              {/* This Month Analytics Card */}
              <div className="analytics-card" style={{ borderTop: '4px solid #0f766e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {t('monthCollectionTitle')} ({summary.currentMonthName})
                  </h3>
                  <CalendarDays size={20} color="#0f766e" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginBottom: '8px' }}>
                  {formatCurrency(summary.thisMonthCollected)}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {t('monthCollectionsCount', { month: summary.currentMonthName || '', count: summary.thisMonthCount || 0 })}
                </p>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '12.5px', color: 'var(--text-sub)' }}>
                  {summary.currentMonthName}
                </div>
              </div>

              {/* This Year Analytics Card */}
              <div className="analytics-card" style={{ borderTop: '4px solid #2563eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {t('yearCollectionTitle', { year: summary.currentYear })}
                  </h3>
                  <BarChart3 size={20} color="#2563eb" />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#60a5fa', marginBottom: '8px' }}>
                  {formatCurrency(summary.thisYearCollected)}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {t('yearTotalSub', { year: summary.currentYear })}
                </p>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '12.5px', color: '#60a5fa' }}>
                  {t('pendingBalanceTitle')}: <strong>{formatCurrency(summary.pendingDue)}</strong>
                </div>
              </div>
            </div>

            {/* Monthly History Table */}
            <div className="table-card" style={{ marginBottom: '24px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {t('tabAnalytics')}
                </h3>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>{t('periodThisMonth')}</th>
                      <th>Year</th>
                      <th>{t('receiptsFound', { count: '' }).replace('{count} ', '')}</th>
                      <th>{t('colAmount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsData?.monthlyBreakdown?.map((m) => (
                      <tr key={m.month_key}>
                        <td><strong>{m.month_key}</strong></td>
                        <td>{m.year}</td>
                        <td>{m.count} payments</td>
                        <td style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '15px' }}>
                          {formatCurrency(m.total)}
                        </td>
                      </tr>
                    ))}
                    {(!statsData?.monthlyBreakdown || statsData.monthlyBreakdown.length === 0) && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          {t('noCollectionsFound')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: RECORD PAYMENT (AMOUNT RECIEVE PANNUM ENTRY)     */}
      {/* ========================================================= */}
      {showRecordPayment && (
        <div className="modal-overlay" onClick={() => setShowRecordPayment(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{t('modalPaymentTitle')}</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {newPayment.customer_name} — Loan #LN-{newPayment.loan_id}
                </p>
              </div>
              <button className="close-btn" onClick={() => setShowRecordPayment(false)}>×</button>
            </div>

            <div className="info-summary-box">
              <div>
                <div className="info-item-label">{t('colTotalBorrowed')}:</div>
                <div className="info-item-value">{formatCurrency(newPayment.total_amount)}</div>
              </div>
              <div>
                <div className="info-item-label">{t('colPaidAmount')}:</div>
                <div className="info-item-value highlight-paid">{formatCurrency(newPayment.amount_paid)}</div>
              </div>
              <div>
                <div className="info-item-label">{t('summaryCurrentBalance')}:</div>
                <div className="info-item-value highlight-balance">{formatCurrency(newPayment.balance)}</div>
              </div>
              <div>
                <div className="info-item-label">{t('colWeeklyInstallment')}:</div>
                <div className="info-item-value">{formatCurrency(newPayment.weekly_installment)}</div>
              </div>
            </div>

            <form onSubmit={handleRecordPayment}>
              {!newPayment.loan_id && (
                <div className="form-group">
                  <label className="form-label">{t('labelSelectLoan')}</label>
                  <select 
                    required 
                    className="form-input"
                    value={newPayment.loan_id}
                    onChange={(e) => {
                      const lId = e.target.value;
                      const selected = statsData?.loans?.find(l => String(l.id) === String(lId));
                      if (selected) {
                        const bal = selected.total_amount - selected.amount_paid;
                        setNewPayment({
                          ...newPayment,
                          loan_id: lId,
                          customer_id: selected.customer_id,
                          customer_name: selected.customer_name,
                          total_amount: selected.total_amount,
                          amount_paid: selected.amount_paid,
                          balance: bal,
                          weekly_installment: selected.weekly_installment,
                          amount: Math.min(bal, selected.weekly_installment),
                          week_number: selected.weeks_paid + 1
                        });
                      }
                    }}
                  >
                    <option value="">{t('selectLoanPrompt')}</option>
                    {statsData?.loans?.filter(l => l.status === 'active').map(l => (
                      <option key={l.id} value={l.id}>
                        {l.customer_name} ({l.customer_area}) — Due: {formatCurrency(l.weekly_installment)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  {t('labelPaymentAmount')}
                </label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  max={newPayment.balance || 999999}
                  className="form-input" 
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  placeholder="e.g. 1100"
                  style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-emerald)' }}
                />

                {/* Quick Amount Chips */}
                {newPayment.weekly_installment > 0 && (
                  <div className="quick-amount-chips-wrap">
                    <span className="chips-hint">⚡ {lang === 'ta' ? 'விரைவு தேர்வு:' : 'Quick Select:'}</span>
                    <div className="quick-amount-chips">
                      <button 
                        type="button" 
                        className="amount-chip"
                        onClick={() => setNewPayment({ ...newPayment, amount: Math.min(newPayment.balance, newPayment.weekly_installment) })}
                      >
                        ⚡ {lang === 'ta' ? '1 தவணை' : '1 Due'}: {formatCurrency(newPayment.weekly_installment)}
                      </button>
                      {newPayment.weekly_installment * 2 <= newPayment.balance && (
                        <button 
                          type="button" 
                          className="amount-chip"
                          onClick={() => setNewPayment({ ...newPayment, amount: newPayment.weekly_installment * 2 })}
                        >
                          2 {lang === 'ta' ? 'தவணை' : 'Dues'}: {formatCurrency(newPayment.weekly_installment * 2)}
                        </button>
                      )}
                      {newPayment.balance > 0 && (
                        <button 
                          type="button" 
                          className="amount-chip chip-full"
                          onClick={() => setNewPayment({ ...newPayment, amount: newPayment.balance })}
                        >
                          🎯 {lang === 'ta' ? 'முழு பாக்கி' : 'Full Balance'}: {formatCurrency(newPayment.balance)}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Live Balance Progress Box */}
              <div className="live-balance-preview-box">
                <div className="preview-top">
                  <span className="preview-label">👉 {t('summaryNewBalance')}</span>
                  <strong className={`preview-amount ${projectedBalance === 0 ? 'cleared' : ''}`}>
                    {formatCurrency(projectedBalance)}
                  </strong>
                </div>

                <div className="preview-progress-track">
                  <div 
                    className={`preview-progress-fill ${projectedBalance === 0 ? 'fill-completed' : ''}`}
                    style={{ 
                      width: `${Math.min(100, Math.round(((newPayment.amount_paid + enteredAmount) / (newPayment.total_amount || 1)) * 100))}%` 
                    }}
                  />
                </div>

                <div className="preview-sub-meta">
                  <span>{lang === 'ta' ? 'செலுத்தியது' : 'Paid'}: {formatCurrency(newPayment.amount_paid + enteredAmount)}</span>
                  <span>{Math.min(100, Math.round(((newPayment.amount_paid + enteredAmount) / (newPayment.total_amount || 1)) * 100))}%</span>
                </div>

                {projectedBalance === 0 && (
                  <div className="loan-cleared-banner">
                    🎉 {lang === 'ta' ? 'முழு தொகையும் செலுத்தப்பட்டது! கடன் நிறைவடையும்!' : 'Full payment! Loan will be closed automatically!'}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('colRepaymentProgress')}</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="form-input" 
                    value={newPayment.week_number}
                    onChange={(e) => setNewPayment({ ...newPayment, week_number: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('labelPaymentDate')}</label>
                  <input 
                    type="date" 
                    required 
                    className="form-input" 
                    value={newPayment.collection_date}
                    onChange={(e) => setNewPayment({ ...newPayment, collection_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('labelPaymentNotes')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder={t('placeholderPaymentNotes')}
                />
              </div>

              <button type="submit" className="submit-button" style={{ marginBottom: 0, marginTop: '12px' }}>
                {t('btnRecordConfirm')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CUSTOMER PASSBOOK & FULL STATEMENT               */}
      {/* ========================================================= */}
      {showStatementModal && (
        <div className="modal-overlay" onClick={() => setShowStatementModal(false)}>
          <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{t('modalPassbookTitle')}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {t('passbookAccountSummary')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => window.print()} 
                  className="btn-secondary" 
                  style={{ padding: '7px 13px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Print Account Statement"
                >
                  <Printer size={14} /> {t('printBtn')}
                </button>
                <button className="close-btn" onClick={() => setShowStatementModal(false)}>×</button>
              </div>
            </div>

            {loadingStatement ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            ) : customerStatement ? (
              <div>
                <div className="passbook-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="customer-avatar large" style={{ background: getAvatarGradient(customerStatement.customer.name) }}>
                        {getInitials(customerStatement.customer.name)}
                      </div>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{customerStatement.customer.name}</h2>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>
                          📞 {customerStatement.customer.phone} • 📍 {customerStatement.customer.area}
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleShareStatementWhatsApp}
                      className="btn-whatsapp"
                      title="Share Statement on WhatsApp"
                    >
                      <MessageCircle size={14} /> {t('whatsappReminder')}
                    </button>
                  </div>

                  <div className="passbook-grid">
                    <div className="passbook-stat">
                      <span>{t('colTotalBorrowed')}</span>
                      <strong>{formatCurrency(customerStatement.summary.totalBorrowed)}</strong>
                    </div>
                    <div className="passbook-stat">
                      <span>{t('colPaidAmount')}</span>
                      <strong>{formatCurrency(customerStatement.summary.totalPaid)}</strong>
                    </div>
                    <div className="passbook-stat">
                      <span>{t('colPendingBalance')}</span>
                      <strong style={{ color: '#fca5a5' }}>{formatCurrency(customerStatement.summary.pendingBalance)}</strong>
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                  {t('tabLoans')}
                </h4>
                <div className="table-responsive" style={{ marginBottom: '20px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>{t('colLoanId')}</th>
                        <th>{t('colStartDate')}</th>
                        <th>{t('analyticsTotalBorrowed')}</th>
                        <th>Total</th>
                        <th>{t('colWeeklyInstallment')}</th>
                        <th>{t('colPaidAmount')}</th>
                        <th>{t('colPendingBalance')}</th>
                        <th>{t('colFinanceStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerStatement.loans.map(l => (
                        <tr key={l.id}>
                          <td>#LN-{l.id}</td>
                          <td><strong>{l.start_date}</strong></td>
                          <td>{formatCurrency(l.principal)}</td>
                          <td><strong>{formatCurrency(l.total_amount)}</strong></td>
                          <td>{formatCurrency(l.weekly_installment)}/wk</td>
                          <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{formatCurrency(l.amount_paid)}</td>
                          <td style={{ color: l.balance_amount > 0 ? '#ef4444' : '#16a34a', fontWeight: 'bold' }}>
                            {formatCurrency(l.balance_amount)}
                          </td>
                          <td>
                            <span className={`badge ${l.status}`}>
                              {l.status === 'completed' ? t('badgeCompleted') : t('badgeActive')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                  {t('passbookHistory')}
                </h4>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('colCollectionDate')}</th>
                        <th>Week #</th>
                        <th>{t('colPaidAmount')}</th>
                        <th>Collector</th>
                        <th>{t('colCollectorNotes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerStatement.collections.map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.collection_date}</strong></td>
                          <td>Week {c.week_number}</td>
                          <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{formatCurrency(c.amount)}</td>
                          <td>{c.collector_name || 'Admin'}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{c.notes}</td>
                        </tr>
                      ))}
                      {customerStatement.collections.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                            {t('passbookNoPayments')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: ROUTE COLLECTION SHEET (PRINTABLE)               */}
      {/* ========================================================= */}
      {showRouteSheetModal && (
        <div className="modal-overlay" onClick={() => setShowRouteSheetModal(false)}>
          <div className="modal-content wide print-area" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{t('modalRouteSheetTitle')}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t('routeSheetSubtitle', { date: todayDateStr })}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Printer size={14} /> {t('printBtn')}
                </button>
                <button className="close-btn" onClick={() => setShowRouteSheetModal(false)}>×</button>
              </div>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>{t('colCustomer')}</th>
                    <th>{t('routeAreaLabel')}</th>
                    <th>{t('colPhoneArea')}</th>
                    <th>{t('colWeeklyInstallment')}</th>
                    <th>{t('colPendingBalance')}</th>
                    <th>✓</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {statsData?.loans?.filter(l => l.status === 'active').map(l => (
                    <tr key={l.id}>
                      <td><strong>{l.customer_name}</strong></td>
                      <td>{l.customer_area}</td>
                      <td>{l.customer_phone}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--primary-emerald)' }}>{formatCurrency(l.weekly_installment)}</td>
                      <td style={{ color: '#ef4444' }}>{formatCurrency(l.balance_amount)}</td>
                      <td style={{ width: '80px', border: '1px dashed var(--border-light)' }}></td>
                      <td style={{ width: '120px', border: '1px dashed var(--border-light)' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION                              */}
      {/* ========================================================= */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                {t('modalDeleteTitle')}
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
                {t('modalDeleteMsg', { name: deleteConfirm.name })}
                <br />
                {deleteConfirm.reason && <span style={{ color: '#ef4444', fontSize: '12px' }}>Reason: {deleteConfirm.reason}</span>}
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary" 
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {t('btnCancel')}
                </button>
                <button 
                  onClick={executeDelete}
                  className="btn-danger" 
                  style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '13px' }}
                >
                  {t('btnConfirmDelete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: ADD NEW CUSTOMER                                 */}
      {/* ========================================================= */}
      {showAddCustomer && (
        <div className="modal-overlay" onClick={() => setShowAddCustomer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('modalNewCustomerTitle')}</h3>
              <button className="close-btn" onClick={() => setShowAddCustomer(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label className="form-label">{t('labelFullName')}</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={newCustomer.name} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder={t('placeholderFullName')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('labelPhone')}</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={newCustomer.phone} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder={t('placeholderPhone')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('labelArea')}</label>
                <input 
                  type="text" 
                  required 
                  className="form-input" 
                  value={newCustomer.area} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, area: e.target.value })}
                  placeholder={t('placeholderArea')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('labelAddress')}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newCustomer.address} 
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder={t('placeholderAddress')}
                />
              </div>
              <button type="submit" className="submit-button" style={{ marginBottom: 0, marginTop: '12px' }}>
                {t('btnSaveCustomer')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: DISBURSE LOAN                                    */}
      {/* ========================================================= */}
      {showAddLoan && (
        <div className="modal-overlay" onClick={() => setShowAddLoan(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('modalDisburseTitle')}</h3>
              <button className="close-btn" onClick={() => setShowAddLoan(false)}>×</button>
            </div>
            <form onSubmit={handleCreateLoan}>
              <div className="form-group">
                <label className="form-label">{t('labelSelectCustomer')}</label>
                <select 
                  required 
                  className="form-input" 
                  value={newLoan.customer_id}
                  onChange={(e) => setNewLoan({ ...newLoan, customer_id: e.target.value })}
                >
                  <option value="">{t('selectCustomerPrompt')}</option>
                  {statsData?.customers?.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.area}) - {c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('labelLoanStartDate')}</label>
                <input 
                  type="date" 
                  required 
                  className="form-input" 
                  value={newLoan.start_date}
                  onChange={(e) => setNewLoan({ ...newLoan, start_date: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('labelPrincipal')}</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={newLoan.principal}
                    onChange={(e) => setNewLoan({ ...newLoan, principal: e.target.value })}
                    placeholder="10000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('labelInterestRate')}</label>
                  <input 
                    type="number" 
                    required 
                    className="form-input" 
                    value={newLoan.interest_rate}
                    onChange={(e) => setNewLoan({ ...newLoan, interest_rate: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('labelTenureWeeks')}</label>
                <input 
                  type="number" 
                  required 
                  className="form-input" 
                  value={newLoan.tenure_weeks}
                  onChange={(e) => setNewLoan({ ...newLoan, tenure_weeks: e.target.value })}
                  placeholder="10"
                />
              </div>

              {newLoan.principal && (() => {
                const princ = Number(newLoan.principal) || 0;
                const rate = Number(newLoan.interest_rate) || 0;
                const weeks = Number(newLoan.tenure_weeks) || 1;
                const interestAmt = Math.round(princ * (rate / 100));
                const totalRepay = princ + interestAmt;
                const weeklyInst = Math.round(totalRepay / (weeks > 0 ? weeks : 1));
                return (
                  <div className="loan-calculator-box">
                    <div className="calc-header">
                      <span>⚡ {lang === 'ta' ? 'கடன் கணக்கீடு நேரலை' : 'Live Loan Calculation'}</span>
                    </div>
                    <div className="calc-row">
                      <span>{t('analyticsTotalBorrowed')}:</span>
                      <strong>{formatCurrency(princ)}</strong>
                    </div>
                    <div className="calc-row">
                      <span>{t('analyticsTotalInterest')} ({rate}%):</span>
                      <strong style={{ color: 'var(--accent-gold)' }}>+{formatCurrency(interestAmt)}</strong>
                    </div>
                    <div className="calc-row highlight">
                      <span>{t('analyticsTotalRepayable')}:</span>
                      <strong style={{ color: 'var(--primary-emerald)', fontSize: '16px' }}>{formatCurrency(totalRepay)}</strong>
                    </div>
                    <div className="calc-installment-banner">
                      ⚡ {t('colWeeklyInstallment')}: <strong>{formatCurrency(weeklyInst)} / {lang === 'ta' ? 'வாரம்' : 'week'}</strong> ({weeks} {lang === 'ta' ? 'வாரங்கள்' : 'weeks'})
                    </div>
                  </div>
                );
              })()}

              <button type="submit" className="submit-button" style={{ marginBottom: 0, marginTop: '8px' }}>
                {t('btnDisburseConfirm')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: SAVE TO MY FILES & FULL DATA EXPORT              */}
      {/* ========================================================= */}
      <SaveFilesModal 
        isOpen={showSaveFilesModal}
        onClose={() => setShowSaveFilesModal(false)}
        statsData={statsData}
        user={user}
        lang={lang}
        onShowToast={showToast}
      />

      {/* Global Background Customizer Modal */}
      <BackgroundCustomizerModal 
        isOpen={showBgModalLocal}
        onClose={() => setShowBgModalLocal(false)}
        bgConfig={bgConfig || getSavedBackground()}
        setBgConfig={setBgConfig}
        lang={lang}
        theme={theme}
        setTheme={toggleTheme ? (newTh) => { if (theme !== newTh) toggleTheme(); } : undefined}
        onShowToast={showToast}
      />

      {/* Floating Executive Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'warning' && <AlertTriangle size={18} />}
            {toast.type === 'error' && <XCircle size={18} />}
            {toast.type === 'info' && <Bell size={18} />}
          </div>
          <div className="toast-message">{toast.message}</div>
          <button className="toast-close-btn" onClick={() => setToast(null)} title="Close">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
