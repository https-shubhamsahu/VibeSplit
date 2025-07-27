import React from "react";
import "./AboutPage.css";

const AboutPage = () => (
  <div className="about-page">
    {/* Profile photo - update path if needed */}
    <img src={require("../assets/shubham-photo.png")} alt="Shubham Sahu" className="about-photo" />

    {/* App name with gradient */}
    <h1 className="about-app-title">VibeSplit</h1>
    <div className="about-divider"></div>

    {/* Origin story */}
    <h2 className="about-heading">Who Made This?</h2>
    <p className="about-origin">
      Made in the TSEC canteen with chai, friends, and big dreams 🍟☕️✨<br/>
      Born from many snack breaks and tech chats at Thakur Shyamnarayan Engineering College.
    </p>

    {/* Personal intro */}
    <div className="about-bio">
      <p>
        Hi, I’m <span className="about-name">Shubham Sahu</span>!<br/>
        <span className="about-role">
          Student @ Thakur Shyamnarayan Engineering College<br/>
          <span style={{whiteSpace: "nowrap"}}>
            Electronics and Computer Engineering
          </span>
        </span>
        <br /><br />
        Enthusiastic about <span className="about-key">technology</span>, <span className="about-key">programming</span>, <span className="about-key">AI</span>, and exploring new gadgets & ideas.<br/>
        I build to connect students, spark fun, and solve real problems from our everyday campus life!
      </p>
    </div>

    {/* Beacon socials link */}
    <a
      className="social-link"
      href="https://beacons.ai/shubhamsahu"
      target="_blank"
      rel="noopener noreferrer"
    >
      🌐 Connect & Share My Socials
    </a>

    {/* Help button (links to README on GitHub) */}
    <a
      className="help-btn"
      href="https://github.com/shubhamsahu/VibeSplit/blob/main/README.md"
      target="_blank"
      rel="noopener noreferrer"
    >
      ❔ Help & Guide
    </a>
  </div>
);

export default AboutPage;
