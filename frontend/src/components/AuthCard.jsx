import React, { useState } from 'react';
import WalletIcon from './WalletIcon';
import { Eye, EyeOff } from 'lucide-react';
import { getTranslation } from '../translations';
import { apiEndpoint, safeFetchJson } from '../apiConfig';

export default function AuthCard({ onAuthSuccess, serverOnline, theme, toggleTheme, lang, toggleLang }) {
  // Mode: 'register' (matching screenshot "Create account") or 'login' ("Sign in")
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  
  // Default values matching the user's screenshot: 1234@gmail.com
  const [email, setEmail] = useState('1234@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  
  // Notice alert matching screenshot ("Failed to fetch")
  // Initialized to 'Failed to fetch' by default to replicate the exact initial screenshot view!
  const [alertMessage, setAlertMessage] = useState('Failed to fetch');
  const [alertType, setAlertType] = useState('warning'); // 'warning' | 'success'
  const [isLoading, setIsLoading] = useState(false);

  const t = (key, params) => getTranslation(lang || 'ta', key, params);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const endpoint = isRegisterMode ? apiEndpoint('/auth/register') : apiEndpoint('/auth/login');

    try {
      const { response, data, ok } = await safeFetchJson(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!ok) {
        setAlertType('warning');
        setAlertMessage(data?.message || (lang === 'ta' ? 'அங்கீகாரம் தோல்வியுற்றது' : 'Authentication failed'));
        setIsLoading(false);
        return;
      }

      // Success
      setAlertType('success');
      setAlertMessage(isRegisterMode 
        ? (lang === 'ta' ? 'கணக்கு உருவாக்கப்பட்டது! உள்ளே நுழைகிறது...' : 'Account created! Entering ledger...') 
        : (lang === 'ta' ? 'வரவேற்கிறோம்!' : 'Welcome back!')
      );
      
      if (data?.token) {
        localStorage.setItem('thunai_ledger_token', data.token);
        localStorage.setItem('thunai_ledger_user', JSON.stringify(data.user));
      }

      setTimeout(() => {
        onAuthSuccess(data?.user);
      }, 700);

    } catch (err) {
      console.error('Auth request error:', err);
      // Exact error message displayed in screenshot
      setAlertType('warning');
      setAlertMessage('Failed to fetch');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setAlertMessage('');
  };

  return (
    <div className="card-container">
      {/* Top Wallet Icon */}
      <div className="icon-container">
        <WalletIcon containerBg="var(--primary-emerald-dark)" />
      </div>

      {/* Subtitle */}
      <div className="card-subtitle">
        {t('authSubtitle')}
      </div>

      {/* Heading Title */}
      <h1 className="card-title">
        {t('authTitle')}
      </h1>

      {/* Subtext description */}
      <p className="card-description">
        {t('authDesc')}
      </p>

      {/* Alert / Notice Banner (Exact match to screenshot) */}
      {alertMessage && (
        <div className={`alert-box ${alertType === 'success' ? 'success' : ''}`}>
          <span>{alertMessage}</span>
          <button 
            type="button" 
            className="alert-dismiss"
            onClick={() => setAlertMessage('')}
            title={t('dismiss')}
          >
            ×
          </button>
        </div>
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            {t('authEmail')}
          </label>
          <input
            id="email"
            type="email"
            required
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="1234@gmail.com"
            autoComplete="email"
          />
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            {t('authPassword')}
          </label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="spinner" />
          ) : isRegisterMode ? (
            t('btnCreateAccount')
          ) : (
            t('btnSignIn')
          )}
        </button>

        {/* Toggle Mode Link */}
        <div 
          className="toggle-mode-container"
          onClick={toggleMode}
        >
          {isRegisterMode ? (
            <span>{t('toggleToSignIn')}</span>
          ) : (
            <span>{t('toggleToCreate')}</span>
          )}
        </div>
      </form>
    </div>
  );
}
