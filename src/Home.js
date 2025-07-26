import React from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="homepage">
      <img src="/mylogo.png" alt="App Logo" className="logo-img" />
      <h2>Master your money—vibe with your crew, not your spends.</h2>
      <button className="main-btn" onClick={handleJoinSquad}>👥 Join the Squad</button>
      <button className="secondary-btn" onClick={handleSneakPeek}>😉 Sneak Peek</button>
      <button className="about-btn" onClick={handleAbout}>🤔 Who Made This?</button>
      <p className="footer">
        Made in the TSEC canteen with chai, friends, and big dreams 🍟☕️✨
      </p>
    </div>
  );
} 