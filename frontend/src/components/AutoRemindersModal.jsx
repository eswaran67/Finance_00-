import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Settings, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  Smartphone,
  Check,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { apiEndpoint, safeFetchJson } from '../apiConfig';
import { getTranslation } from '../translations';

export default function AutoRemindersModal({ 
  token, 
  lang = 'ta', 
  onClose, 
  showToast,
  onRefreshDashboard 
}) {
  const t = (key, params) => getTranslation(lang, key, params);

  const [activeTab, setActiveTab] = useState('dues'); // 'dues' | 'settings' | 'logs'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Data states
  const [borrowers, setBorrowers] = useState([]);
  const [summary, setSummary] = useState({
    totalBorrowers: 0,
    dueTodayCount: 0,
    pendingReminderCount: 0,
    sentTodayCount: 0
  });

  const [settings, setSettings] = useState({
    auto_send_enabled: 1,
    send_time: '09:00',
    send_channel: 'whatsapp',
    provider: 'whatsapp_direct',
    finance_name: 'Weekly Finance',
    tamil_template: 'வணக்கம் {customer_name}, {finance_name}-லிருந்து நினைவூட்டல்: உங்கள் வாரத் தவணை ₹{installment} இன்று ({due_date}) செலுத்த வேண்டியுள்ளது. (மீதி பாக்கி: ₹{balance}). நன்றி!',
    english_template: 'Hello {customer_name}, Reminder from {finance_name}: Your weekly installment of ₹{installment} is due today ({due_date}). (Pending Balance: ₹{balance}). Thank you!',
    api_url: '',
    last_cron_run: null
  });

  const [logs, setLogs] = useState([]);
  const [activePreviewLang, setActivePreviewLang] = useState(lang === 'ta' ? 'ta' : 'en');

  // Fetch Due Borrowers & Settings
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson(apiEndpoint('/reminders/due-today'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data) {
        setBorrowers(data.borrowers || []);
        if (data.summary) setSummary(data.summary);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load reminders data:', err);
      showToast(lang === 'ta' ? 'நினைவூட்டல் விவரங்களை ஏற்றுவதில் பிழை.' : 'Failed to load reminders data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    try {
      const data = await safeFetchJson(apiEndpoint('/reminders/logs?limit=50'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load reminder logs:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  // Send all reminders
  const handleSendAllToday = async () => {
    setActionLoading(true);
    try {
      const res = await safeFetchJson(apiEndpoint('/reminders/send-all-today'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res && res.sentCount !== undefined) {
        showToast(
          res.sentCount > 0
            ? t('broadcastSuccess', { count: res.sentCount })
            : t('noDuesToRemind'),
          res.sentCount > 0 ? 'success' : 'info'
        );
        fetchData();
        if (onRefreshDashboard) onRefreshDashboard();
      }
    } catch (err) {
      showToast(lang === 'ta' ? 'நினைவூட்டல் அனுப்புவதில் பிழை.' : 'Failed to send reminders.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Send single reminder
  const handleSendSingle = async (loanId, customerName) => {
    try {
      const res = await safeFetchJson(apiEndpoint('/reminders/send-single'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ loanId })
      });
      if (res && res.result) {
        showToast(
          lang === 'ta'
            ? `${customerName}-க்கு நினைவூட்டல் பதிவு செய்யப்பட்டது!`
            : `Reminder sent to ${customerName}!`,
          'success'
        );
        fetchData();
        if (onRefreshDashboard) onRefreshDashboard();
      }
    } catch (err) {
      showToast(lang === 'ta' ? 'அனுப்ப முடியவில்லை.' : 'Failed to send reminder.', 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await safeFetchJson(apiEndpoint('/reminders/settings'), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      if (res && res.settings) {
        setSettings(res.settings);
        showToast(t('settingsSavedSuccess'), 'success');
        fetchData();
      }
    } catch (err) {
      showToast(lang === 'ta' ? 'அமைப்புகளைச் சேமிக்க முடியவில்லை.' : 'Failed to save settings.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Live preview formatting
  const getLivePreview = () => {
    const tmpl = activePreviewLang === 'en' ? settings.english_template : settings.tamil_template;
    return (tmpl || '')
      .replace(/\{customer_name\}/g, activePreviewLang === 'en' ? 'Ravi Kumar' : 'ரவி குமார்')
      .replace(/\{installment\}/g, '1,100')
      .replace(/\{balance\}/g, '6,600')
      .replace(/\{due_date\}/g, new Date().toISOString().split('T')[0])
      .replace(/\{collection_day\}/g, lang === 'ta' ? 'வியாழன்' : 'Thursday')
      .replace(/\{finance_name\}/g, settings.finance_name || 'Weekly Finance')
      .replace(/\{area\}/g, 'Market Street');
  };

  const insertPlaceholder = (ph, isEn = false) => {
    if (isEn) {
      setSettings({
        ...settings,
        english_template: (settings.english_template || '') + ' ' + ph
      });
    } else {
      setSettings({
        ...settings,
        tamil_template: (settings.tamil_template || '') + ' ' + ph
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content auto-reminders-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}>
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                {t('remindersModalTitle')}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {t('remindersModalSub')}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 0',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'dues' ? 'active-tab-btn' : ''}`}
            onClick={() => setActiveTab('dues')}
            style={{
              padding: '7px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: activeTab === 'dues' ? 'var(--primary-gradient)' : 'var(--bg-card-subtle)',
              color: activeTab === 'dues' ? '#ffffff' : 'var(--text-main)',
              border: activeTab === 'dues' ? 'none' : '1px solid var(--border-subtle)'
            }}
          >
            <Clock size={15} />
            {t('tabTodayDues')}
            {summary.pendingReminderCount > 0 && (
              <span style={{
                background: activeTab === 'dues' ? 'rgba(255,255,255,0.3)' : '#ef4444',
                color: '#fff',
                fontSize: '11px',
                padding: '1px 7px',
                borderRadius: '999px',
                fontWeight: 800
              }}>
                {summary.pendingReminderCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeTab === 'settings' ? 'active-tab-btn' : ''}`}
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '7px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: activeTab === 'settings' ? 'var(--primary-gradient)' : 'var(--bg-card-subtle)',
              color: activeTab === 'settings' ? '#ffffff' : 'var(--text-main)',
              border: activeTab === 'settings' ? 'none' : '1px solid var(--border-subtle)'
            }}
          >
            <Settings size={15} />
            {t('tabAutoSettings')}
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeTab === 'logs' ? 'active-tab-btn' : ''}`}
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '7px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              background: activeTab === 'logs' ? 'var(--primary-gradient)' : 'var(--bg-card-subtle)',
              color: activeTab === 'logs' ? '#ffffff' : 'var(--text-main)',
              border: activeTab === 'logs' ? 'none' : '1px solid var(--border-subtle)'
            }}
          >
            <History size={15} />
            {t('tabMessageLogs')}
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 4px' }}>
          {/* TAB 1: TODAY'S DUES */}
          {activeTab === 'dues' && (
            <div>
              {/* Stat & Action Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '14px 18px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                      {lang === 'ta' ? 'இன்றைய தவணைகள்' : "Today's Dues"}
                    </span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {summary.dueTodayCount}
                    </h4>
                  </div>
                  <div style={{ width: '1px', height: '30px', background: 'var(--border-subtle)' }}></div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                      {lang === 'ta' ? 'அனுப்ப வேண்டியவை' : 'Ready to Send'}
                    </span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>
                      {summary.pendingReminderCount}
                    </h4>
                  </div>
                  <div style={{ width: '1px', height: '30px', background: 'var(--border-subtle)' }}></div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                      {lang === 'ta' ? 'இன்று அனுப்பியவை' : 'Sent Today'}
                    </span>
                    <h4 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: 'var(--primary-emerald)' }}>
                      {summary.sentTodayCount}
                    </h4>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={fetchData}
                    className="btn-secondary"
                    title={t('refreshBtn')}
                    style={{ padding: '8px 12px' }}
                  >
                    <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSendAllToday}
                    disabled={actionLoading || summary.pendingReminderCount === 0}
                    className="btn-primary"
                    style={{ 
                      padding: '9px 18px', 
                      fontSize: '13px', 
                      fontWeight: 700, 
                      gap: '8px',
                      opacity: summary.pendingReminderCount === 0 ? 0.6 : 1,
                      cursor: summary.pendingReminderCount === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Send size={15} />
                    {actionLoading ? t('sendingReminders') : t('sendRemindersToAll')}
                  </button>
                </div>
              </div>

              {/* Borrowers Queue */}
              {borrowers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="var(--primary-emerald)" style={{ marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                    {t('allCaughtUp')}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {borrowers.map((b) => (
                    <div 
                      key={b.loan_id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: b.isDueToday ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                          color: b.isDueToday ? 'var(--primary-emerald)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '14px'
                        }}>
                          {b.customer_name?.[0] || 'C'}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '14.5px', color: 'var(--text-main)' }}>
                              {b.customer_name}
                            </strong>
                            <span style={{ 
                              fontSize: '11px', 
                              padding: '2px 7px', 
                              borderRadius: '999px',
                              background: b.isDueToday ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                              color: b.isDueToday ? 'var(--primary-emerald)' : 'var(--text-muted)',
                              fontWeight: 700
                            }}>
                              {b.isDueToday ? (lang === 'ta' ? 'இன்று தவணை' : 'Due Today') : `${b.collection_day}`}
                            </span>

                            {b.alreadyRemindedToday && (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 7px',
                                borderRadius: '999px',
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                fontWeight: 700
                              }}>
                                ✓ {t('remindedToday')}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '10px' }}>
                            <span>📞 {b.customer_phone}</span>
                            <span>📍 {b.customer_area}</span>
                            <span>🌐 {b.preferred_lang === 'ta' ? 'தமிழ்' : 'English'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-emerald)' }}>
                          ₹{Number(b.weekly_installment).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 700 }}>
                          {t('balance')}: ₹{Number(b.balance_amount).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {b.waUrl && (
                          <a
                            href={b.waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#22c55e',
                              borderColor: 'rgba(34, 197, 94, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              textDecoration: 'none'
                            }}
                            title={t('openInWhatsApp')}
                          >
                            <ExternalLink size={13} />
                            {t('openInWhatsApp')}
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSendSingle(b.loan_id, b.customer_name)}
                          className="btn-secondary"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            gap: '5px'
                          }}
                          title={t('sendSingleReminder')}
                        >
                          <Send size={13} />
                          {t('sendSingleReminder')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AUTO-MESSAGING SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Daily auto toggle */}
              <div style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800 }}>
                    {t('enableDailyAutoReminders')}
                  </h4>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {lang === 'ta' 
                      ? 'அமைக்கப்பட்ட நேரத்தில் தினமும் கணினி தானாக வாடிக்கையாளர்களுக்கு நினைவூட்டல் அனுப்பும்.'
                      : 'Automatically broadcast reminders to customers on their collection day at scheduled time.'}
                  </p>
                </div>

                <label className="toggle-switch" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.auto_send_enabled)}
                    onChange={(e) => setSettings({ ...settings, auto_send_enabled: e.target.checked ? 1 : 0 })}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary-emerald)', cursor: 'pointer' }}
                  />
                </label>
              </div>

              {/* Time & Channel Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('scheduledSendTime')}</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.send_time || '09:00'}
                    onChange={(e) => setSettings({ ...settings, send_time: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{lang === 'ta' ? 'நிறுவனத்தின் பெயர்' : 'Finance Brand Name'}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.finance_name || 'Weekly Finance'}
                    onChange={(e) => setSettings({ ...settings, finance_name: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{lang === 'ta' ? 'அனுப்பும் முறை (Channel)' : 'Messaging Channel'}</label>
                  <select
                    className="form-input"
                    value={settings.send_channel || 'whatsapp'}
                    onChange={(e) => setSettings({ ...settings, send_channel: e.target.value })}
                  >
                    <option value="whatsapp">{t('channelWhatsApp')}</option>
                    <option value="sms">{t('channelSms')}</option>
                    <option value="both">{lang === 'ta' ? 'இரண்டும் (WhatsApp + SMS)' : 'Both (WhatsApp + SMS)'}</option>
                  </select>
                </div>
              </div>

              {/* Tamil Template */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>{t('tamilTemplate')}</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['{customer_name}', '{installment}', '{balance}', '{due_date}', '{finance_name}'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertPlaceholder(tag, false)}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          color: 'var(--primary-emerald)',
                          cursor: 'pointer'
                        }}
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="form-input"
                  rows={3}
                  value={settings.tamil_template || ''}
                  onChange={(e) => setSettings({ ...settings, tamil_template: e.target.value })}
                />
              </div>

              {/* English Template */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>{t('englishTemplate')}</label>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['{customer_name}', '{installment}', '{balance}', '{due_date}', '{finance_name}'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertPlaceholder(tag, true)}
                        style={{
                          background: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          color: 'var(--primary-emerald)',
                          cursor: 'pointer'
                        }}
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  className="form-input"
                  rows={3}
                  value={settings.english_template || ''}
                  onChange={(e) => setSettings({ ...settings, english_template: e.target.value })}
                />
              </div>

              {/* Live Preview Box */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px dashed var(--primary-emerald)',
                borderRadius: '14px',
                padding: '14px 18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-emerald)', fontWeight: 800, fontSize: '13px' }}>
                    <Smartphone size={15} />
                    {t('liveMessagePreview')}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setActivePreviewLang('ta')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: activePreviewLang === 'ta' ? 'var(--primary-emerald)' : 'transparent',
                        color: activePreviewLang === 'ta' ? '#fff' : 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      தமிழ்
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewLang('en')}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: activePreviewLang === 'en' ? 'var(--primary-emerald)' : 'transparent',
                        color: activePreviewLang === 'en' ? '#fff' : 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      English
                    </button>
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {getLivePreview()}
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontWeight: 700, gap: '8px' }}
                >
                  <Check size={16} />
                  {actionLoading ? 'Saving...' : t('saveSettings')}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MESSAGE HISTORY LOGS */}
          {activeTab === 'logs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  {t('tabMessageLogs')} ({logs.length})
                </h4>
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}
                >
                  <RefreshCw size={13} />
                  {t('refreshBtn')}
                </button>
              </div>

              {logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <History size={36} style={{ marginBottom: '10px', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {lang === 'ta' ? 'அனுப்பப்பட்ட செய்திகள் ஏதுமில்லை.' : 'No reminder messages sent yet.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>
                            {log.customer_name || 'Borrower'}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            📞 {log.phone}
                          </span>
                          <span style={{
                            fontSize: '10.5px',
                            padding: '1px 6px',
                            borderRadius: '999px',
                            background: 'rgba(34, 197, 94, 0.12)',
                            color: '#22c55e',
                            fontWeight: 700
                          }}>
                            {log.channel?.toUpperCase()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {log.sent_at}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: log.status === 'sent' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: log.status === 'sent' ? 'var(--primary-emerald)' : '#ef4444',
                            fontWeight: 800
                          }}>
                            {log.status === 'sent' ? '✓ SENT' : 'FAILED'}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        fontSize: '12.5px',
                        color: 'var(--text-sub)',
                        background: 'var(--bg-card-subtle)',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}>
                        {log.message_body}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
