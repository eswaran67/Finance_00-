import React, { useState, useEffect } from 'react';
import AuthCard from './components/AuthCard';
import Dashboard from './components/Dashboard';
import BackgroundCustomizerModal from './components/BackgroundCustomizerModal';
import { getSavedBackground, applyBackgroundToDOM } from './utils/backgroundManager';
import { apiEndpoint, API_BASE } from './apiConfig';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [checkingServer, setCheckingServer] = useState(true);
  
  // Theme state: defaults to modern luxury dark theme, with instant toggle
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('finance_theme') || 'dark';
  });

  // Language state: 'ta' (Tamil) or 'en' (English)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('finance_lang') || 'ta';
  });

  // Background customization state
  const [bgConfig, setBgConfig] = useState(() => getSavedBackground());
  const [showBgModal, setShowBgModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finance_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('finance_lang', lang);
  }, [lang]);

  // Apply custom background on mount & config changes
  useEffect(() => {
    applyBackgroundToDOM(bgConfig);
  }, [bgConfig]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      return next;
    });
  };

  const toggleLang = () => {
    setLang(prev => (prev === 'ta' ? 'en' : 'ta'));
  };

  // Check backend server connection
  const checkHealth = async () => {
    try {
      const res = await fetch(apiEndpoint('/health'));
      if (res.ok) {
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setCheckingServer(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Check if user is already logged in
    const storedUser = localStorage.getItem('thunai_ledger_user');
    const storedToken = localStorage.getItem('thunai_ledger_token');
    if (storedUser && storedToken) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('thunai_ledger_user');
        localStorage.removeItem('thunai_ledger_token');
      }
    }
  }, []);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('thunai_ledger_token');
    localStorage.removeItem('thunai_ledger_user');
    setCurrentUser(null);
  };

  return (
    <div className="app-root" data-theme={theme}>
      {/* Dynamic Custom Background Image Layer if image mode is active */}
      {bgConfig.mode === 'image' && bgConfig.imageUrl && (
        <div 
          className="app-custom-image-bg" 
          style={{
            backgroundImage: `url(${bgConfig.imageUrl})`,
            filter: bgConfig.blur ? `blur(${bgConfig.blur}px)` : 'none'
          }}
        >
          <div 
            className="app-custom-image-overlay" 
            style={{
              backgroundColor: `rgba(0, 0, 0, ${bgConfig.overlayDarkness !== undefined ? bgConfig.overlayDarkness : 0.82})`
            }}
          />
        </div>
      )}

      {currentUser ? (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout} 
          theme={theme}
          toggleTheme={toggleTheme}
          lang={lang}
          toggleLang={toggleLang}
          bgConfig={bgConfig}
          setBgConfig={setBgConfig}
          onOpenBgModal={() => setShowBgModal(true)}
        />
      ) : (
        <div className="auth-page-container">
          {/* Top subtle status bar */}
          <div className="status-pill-bar">
            <div className="status-badge" title={`API Target: ${API_BASE}`}>
              <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`} />
              <span>
                Backend API: {checkingServer 
                  ? 'Checking...' 
                  : serverOnline 
                  ? (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'Online (Local 5000)' : 'Online (Render Cloud)') 
                  : 'Offline'}
              </span>
            </div>

            <button onClick={checkHealth} className="simulate-btn" title="Ping backend API">
              Check Connection
            </button>

            <button 
              onClick={toggleTheme} 
              className="simulate-btn theme-btn" 
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            <button 
              onClick={() => setShowBgModal(true)} 
              className="simulate-btn"
              title="Customize Website Background / பின்னணி மாற்ற"
            >
              🎨 {lang === 'ta' ? 'பின்னணி' : 'Background'}
            </button>

            <button 
              onClick={toggleLang} 
              className="simulate-btn lang-btn" 
              title="Change Language / மொழியை மாற்ற"
            >
              🌐 {lang === 'ta' ? 'English' : 'தமிழ்'}
            </button>
          </div>

          {/* Exact design matching user's image */}
          <AuthCard 
            onAuthSuccess={handleAuthSuccess} 
            serverOnline={serverOnline}
            theme={theme}
            toggleTheme={toggleTheme}
            lang={lang}
            toggleLang={toggleLang}
          />
        </div>
      )}

      {/* Global Background Customizer Modal */}
      <BackgroundCustomizerModal 
        isOpen={showBgModal}
        onClose={() => setShowBgModal(false)}
        bgConfig={bgConfig}
        setBgConfig={setBgConfig}
        lang={lang}
      />
    </div>
  );
}
