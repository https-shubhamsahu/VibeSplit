import React from "react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="about-page">
      <h2>Who Made This?</h2>
      <p className="about-story">
        Made in the TSEC canteen with chai, friends, and big dreams 🍟☕️✨
      </p>
      <p className="about-desc">
        This app was brainstormed over endless cups of chai in the canteen at TSEC Mumbai. It was built to help students manage group expenses, plan trips, and make memories—without stressing about money. <br /><br />
        <a href="mailto:your.email@example.com" className="contact-link">Contact the creator</a>
      </p>
      <button className="about-btn" onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
} 