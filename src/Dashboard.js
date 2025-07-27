import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "./components/LoadingSpinner";
import UserHistory from "./components/UserHistory";
import authService from "./services/authService";
import analyticsService from "./services/analyticsService";

const options = [
  {
    emoji: "🧳",
    title: "Plan a Trip",
    subtitle: "Split travel expenses with friends and track who owes what."
  },
  {
    emoji: "🍔",
    title: "Canteen Tracker",
    subtitle: "Log and manage daily group spending in the college canteen or cafe."
  },
  {
    emoji: "🎉",
    title: "Outing Split",
    subtitle: "Share bills for random hangouts and impromptu plans."
  },
  {
    emoji: "📚",
    title: "Project Pool",
    subtitle: "Collect and manage contributions for college projects."
  }
];

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = location.state?.mode === "guest";
  const isAuthMode = location.state?.mode === "auth";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isAuthMode);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsService.trackPageView('Dashboard');
    
    if (isAuthMode) {
      setLoading(true);
      const unsubscribe = authService.onAuthStateChange((u) => {
        setUser(u);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isAuthMode]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.signInWithGoogle();
      analyticsService.trackUserAction('google_login_success');
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      analyticsService.trackError(error, { context: 'google_login' });
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      analyticsService.trackUserAction('logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleOptionClick = (option) => {
    analyticsService.trackUserAction('select_option', { option: option.title });
    
    const routes = {
      "Plan a Trip": "/trip/new",
      "Canteen Tracker": "/canteen/new",
      "Outing Split": "/outing/new",
      "Project Pool": "/project/new"
    };
    
    const route = routes[option.title];
    if (route) {
      navigate(route, { state: { mode: isGuest ? "guest" : "auth" } });
    }
  };

  if (isAuthMode && loading) {
    return <div className="dashboard"><LoadingSpinner /></div>;
  }

  if (isAuthMode && !user) {
    return (
      <div className="dashboard">
        <div className="auth-container">
          <h2 className="dashboard-title">Sign in to Join the Squad</h2>
          {error && <div className="error-message">{error}</div>}
          <button 
            className="main-btn" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {isGuest && (
        <div className="guest-banner">
          Your data is only saved on this device. Sign up to keep it across devices.
        </div>
      )}
      {isAuthMode && user && (
        <div className="user-header">
          <div className="welcome-message">
            Welcome, {user.displayName}!
          </div>
          <div className="header-actions">
            <button 
              className="history-btn" 
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? '📊 Dashboard' : '📋 History'}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      )}
      {!showHistory ? (
        <>
          <h2 className="dashboard-title">Welcome to Your Money Squad</h2>
          <div className="option-cards">
            {options.map((opt) => (
              <div
                className="option-card"
                key={opt.title}
                onClick={() => handleOptionClick(opt)}
              >
                <div className="option-emoji">{opt.emoji}</div>
                <div className="option-title">{opt.title}</div>
                <div className="option-subtitle">{opt.subtitle}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <UserHistory isGuest={isGuest} />
      )}
    </div>
  );
}