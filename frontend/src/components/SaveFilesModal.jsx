import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Database, 
  Users, 
  Calendar, 
  CheckCircle2, 
  X, 
  HardDriveDownload,
  Clock
} from 'lucide-react';
import { 
  exportFullJsonBackup, 
  exportFullLedgerCsv, 
  exportCustomersCsv, 
  exportDateCollectionsCsv, 
  fetchFullExportData,
  getExportDateStr
} from '../utils/fileExport';
import { getTranslation } from '../translations';

export default function SaveFilesModal({ 
  isOpen, 
  onClose, 
  statsData, 
  user, 
  lang = 'ta', 
  onShowToast 
}) {
  const t = (key, params) => getTranslation(lang, key, params);
  const todayStr = getExportDateStr();
  const [targetDate, setTargetDate] = useState(todayStr);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccessCard, setDownloadSuccessCard] = useState(null);

  if (!isOpen) return null;

  const token = localStorage.getItem('thunai_ledger_token');

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const fullData = await fetchFullExportData(token, statsData);
      exportFullJsonBackup(fullData, todayStr);
      setDownloadSuccessCard('json');
      if (onShowToast) onShowToast(t('fileSavedToast'), 'success');
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast(lang === 'ta' ? 'கோப்பு பதிவிறக்கத்தில் பிழை ஏற்பட்டது.' : 'Failed to download file.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadLedgerCsv = async () => {
    setIsExporting(true);
    try {
      const fullData = await fetchFullExportData(token, statsData);
      exportFullLedgerCsv(fullData.collections, fullData.loans, fullData.customers, todayStr);
      setDownloadSuccessCard('ledger');
      if (onShowToast) onShowToast(t('fileSavedToast'), 'success');
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast(lang === 'ta' ? 'கோப்பு பதிவிறக்கத்தில் பிழை ஏற்பட்டது.' : 'Failed to download file.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCustomersCsv = () => {
    try {
      exportCustomersCsv(statsData?.customers || [], todayStr);
      setDownloadSuccessCard('customers');
      if (onShowToast) onShowToast(t('fileSavedToast'), 'success');
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast(lang === 'ta' ? 'கோப்பு பதிவிறக்கத்தில் பிழை ஏற்பட்டது.' : 'Failed to download file.', 'error');
    }
  };

  const handleDownloadDateReport = () => {
    try {
      const result = exportDateCollectionsCsv(targetDate, statsData?.collections || []);
      setDownloadSuccessCard('date');
      if (onShowToast) {
        onShowToast(
          lang === 'ta' 
            ? `${result.count} வசூல்கள் கோப்பாகச் சேமிக்கப்பட்டன!` 
            : `${result.count} collection receipts saved to file!`, 
          'success'
        );
      }
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast(lang === 'ta' ? 'கோப்பு பதிவிறக்கத்தில் பிழை ஏற்பட்டது.' : 'Failed to download file.', 'error');
    }
  };

  const totalCust = statsData?.customers?.length || 0;
  const totalLoans = statsData?.loans?.length || 0;
  const totalColls = statsData?.collections?.length || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide save-files-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <HardDriveDownload size={22} style={{ color: 'var(--primary-emerald)' }} />
              {t('saveModalTitle')}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('saveModalSub')}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Database Status Pills */}
        <div className="save-files-stats-bar">
          <div className="stat-chip">
            <Users size={14} />
            <span><strong>{totalCust}</strong> {lang === 'ta' ? 'வாடிக்கையாளர்கள்' : 'Customers'}</span>
          </div>
          <div className="stat-chip">
            <Database size={14} />
            <span><strong>{totalLoans}</strong> {lang === 'ta' ? 'கடன் கணக்குகள்' : 'Loans'}</span>
          </div>
          <div className="stat-chip">
            <FileText size={14} />
            <span><strong>{totalColls}</strong> {lang === 'ta' ? 'வசூல் ரசீதுகள்' : 'Receipts'}</span>
          </div>
          <div className="stat-chip date-chip">
            <Clock size={14} />
            <span>{todayStr}</span>
          </div>
        </div>

        {/* Export Cards Grid */}
        <div className="save-cards-grid">
          
          {/* CARD 1: Full System Backup (JSON) */}
          <div className={`save-card ${downloadSuccessCard === 'json' ? 'just-downloaded' : ''}`}>
            <div className="save-card-icon json-icon">
              <Database size={24} />
            </div>
            <div className="save-card-body">
              <h4>{t('exportJsonBackup')}</h4>
              <p>{t('exportJsonBackupSub')}</p>
              <div className="save-card-meta">
                <span>.JSON • {lang === 'ta' ? 'முழு பேக்கப்' : 'Full System State'}</span>
              </div>
            </div>
            <div className="save-card-action">
              <button 
                onClick={handleDownloadBackup} 
                className="btn-primary save-btn"
                disabled={isExporting}
              >
                <Download size={15} />
                <span>{lang === 'ta' ? 'JSON பதிவிறக்கு' : 'Download JSON'}</span>
              </button>
            </div>
          </div>

          {/* CARD 2: Complete Accounts Ledger (CSV / Excel) */}
          <div className={`save-card ${downloadSuccessCard === 'ledger' ? 'just-downloaded' : ''}`}>
            <div className="save-card-icon excel-icon">
              <FileText size={24} />
            </div>
            <div className="save-card-body">
              <h4>{t('exportCsvLedger')}</h4>
              <p>{t('exportCsvLedgerSub')}</p>
              <div className="save-card-meta">
                <span>.CSV • Microsoft Excel / Google Sheets</span>
              </div>
            </div>
            <div className="save-card-action">
              <button 
                onClick={handleDownloadLedgerCsv} 
                className="btn-primary save-btn"
                disabled={isExporting}
              >
                <Download size={15} />
                <span>{lang === 'ta' ? 'Excel / CSV ஏடு' : 'Download Excel'}</span>
              </button>
            </div>
          </div>

          {/* CARD 3: Customers Directory (CSV) */}
          <div className={`save-card ${downloadSuccessCard === 'customers' ? 'just-downloaded' : ''}`}>
            <div className="save-card-icon users-icon">
              <Users size={24} />
            </div>
            <div className="save-card-body">
              <h4>{t('exportCustomersCsv')}</h4>
              <p>{t('exportCustomersCsvSub')}</p>
              <div className="save-card-meta">
                <span>.CSV • {totalCust} {lang === 'ta' ? 'பதிவுகள்' : 'Records'}</span>
              </div>
            </div>
            <div className="save-card-action">
              <button 
                onClick={handleDownloadCustomersCsv} 
                className="btn-secondary save-btn"
              >
                <Download size={15} />
                <span>{lang === 'ta' ? 'பட்டியல் CSV' : 'Export CSV'}</span>
              </button>
            </div>
          </div>

          {/* CARD 4: Date-Wise Collections Report (CSV) */}
          <div className={`save-card ${downloadSuccessCard === 'date' ? 'just-downloaded' : ''}`}>
            <div className="save-card-icon date-icon">
              <Calendar size={24} />
            </div>
            <div className="save-card-body">
              <h4>{t('exportDateWiseCsv')}</h4>
              <p>{t('exportDateWiseSub')}</p>
              
              {/* Date selection inline */}
              <div className="date-export-controls">
                <label style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
                  {t('chooseDateForExport')}
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                  <input 
                    type="date" 
                    value={targetDate === 'all' ? '' : targetDate} 
                    onChange={(e) => setTargetDate(e.target.value || 'all')}
                    className="save-date-input"
                  />
                  <button 
                    onClick={() => setTargetDate(todayStr)} 
                    className={`date-quick-btn ${targetDate === todayStr ? 'active' : ''}`}
                  >
                    {lang === 'ta' ? 'இன்று' : 'Today'}
                  </button>
                  <button 
                    onClick={() => setTargetDate('all')} 
                    className={`date-quick-btn ${targetDate === 'all' ? 'active' : ''}`}
                  >
                    {t('allDatesOption')}
                  </button>
                </div>
              </div>
            </div>
            <div className="save-card-action">
              <button 
                onClick={handleDownloadDateReport} 
                className="btn-primary save-btn"
              >
                <Download size={15} />
                <span>{lang === 'ta' ? 'தேதி அறிக்கை' : 'Download Date CSV'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-emerald)', fontSize: '13px', fontWeight: 600 }}>
            <CheckCircle2 size={16} />
            <span>{lang === 'ta' ? 'அனைத்து கோப்புகளும் உங்கள் கணினி / மொபைலில் சேமிக்கப்படும்.' : 'Files download directly to your local storage.'}</span>
          </div>
          <button onClick={onClose} className="btn-secondary">
            {lang === 'ta' ? 'மூடு' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}

