import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/mylogo.png";

export default function Home() {
  const navigate = useNavigate();

  const handleJoinSquad = () => {
    navigate("/dashboard", { state: { mode: "auth" } });
  };

  const handleSneakPeek = () => {
    navigate("/dashboard", { state: { mode: "guest" } });
  };

  const handleAbout = () => {
    navigate("/about");
  };

  return (
    <div className="home-page">
      <div className="content-container">
        <img 
          src={logo} 
          alt="VibeSplit Logo" 
          className="app-logo"
        />
        <h2 className="home-heading">Master your money—vibe with your crew, not your spends.</h2>
        <div className="button-group">
          <button className="main-btn" onClick={handleJoinSquad}>
            👥 Join the Squad
          </button>
          <button className="main-btn secondary" onClick={handleSneakPeek}>
            😉 Sneak Peek
          </button>
          <button className="main-btn tertiary" onClick={handleAbout}>
            🤔 Who Made This?
          </button>
        </div>
        <p className="footer-text">
          Made in the TSEC canteen with chai, friends, and big dreams 🍟☕️✨
        </p>
      </div>
    </div>
  );
}