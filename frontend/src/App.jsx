import React, { useState, useEffect } from 'react';
import AuthCard from './components/AuthCard';
import Dashboard from './components/Dashboard';
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

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finance_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('finance_lang', lang);
  }, [lang]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLang = () => {
    setLang(prev => (prev === 'ta' ? 'en' : 'ta'));
  };

  // Check backend server connection
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
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
      {currentUser ? (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout} 
          theme={theme}
          toggleTheme={toggleTheme}
          lang={lang}
          toggleLang={toggleLang}
        />
      ) : (
        <div className="auth-page-container">
          {/* Top subtle status bar */}
          <div className="status-pill-bar">
            <div className="status-badge">
              <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`} />
              <span>
                Backend API: {checkingServer ? 'Checking...' : serverOnline ? 'Online (Port 5000)' : 'Offline'}
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
    </div>
  );
}
