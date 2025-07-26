import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

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

  useEffect(() => {
    if (isAuthMode) {
      setLoading(true);
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [isAuthMode]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign-in error:", error);
      if (error.code === 'auth/popup-blocked') {
        alert('Please allow popups for this website to sign in with Google');
      } else if (error.code === 'auth/third-party-cookies-blocked') {
        alert('Please enable third-party cookies or try in regular browsing mode');
      }
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (isAuthMode && loading) {
    return <div className="dashboard"><div>Loading...</div></div>;
  }

  if (isAuthMode && !user) {
    return (
      <div className="dashboard">
        <h2 className="dashboard-title">Sign in to Join the Squad</h2>
        <button className="main-btn" onClick={handleGoogleLogin}>Sign in with Google</button>
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
        <div style={{ marginBottom: "1.2rem", color: "#78909c", fontSize: "1rem" }}>
          Welcome, {user.displayName}! <button className="about-btn" style={{ marginLeft: 8 }} onClick={handleLogout}>Log out</button>
        </div>
      )}
      <h2 className="dashboard-title">Welcome to Your Money Squad</h2>
      <div className="option-cards">
        {options.map((opt) => (
          <div
            className="option-card"
            key={opt.title}
            onClick={() => {
              if (opt.title === "Plan a Trip") {
                navigate("/trip/new", { state: { mode: isGuest ? "guest" : "auth" } });
              }
              // You can add navigation for other cards here later
            }}
            style={opt.title === "Plan a Trip" ? { cursor: "pointer" } : {}}
          >
            <div className="option-emoji">{opt.emoji}</div>
            <div className="option-title">{opt.title}</div>
            <div className="option-subtitle">{opt.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}