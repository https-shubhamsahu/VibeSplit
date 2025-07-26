import React, { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function ShareTrip({ trip, isGuest }) {
  const [copied, setCopied] = useState(false);
  
  // Generate a join code if not exists
  const generateJoinCode = () => {
    if (trip.joinCode) return trip.joinCode;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    if (!isGuest) {
      updateDoc(doc(db, "trips", trip.id), {
        joinCode: code
      });
    }
    return code;
  };

  const shareCode = trip.joinCode || generateJoinCode();
  const shareUrl = `${window.location.origin}/join/${shareCode}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-trip-section">
      <h3>Share Trip</h3>
      {isGuest ? (
        <p className="share-notice">Sharing is only available for logged-in users</p>
      ) : (
        <div className="share-content">
          <div className="share-code-box">
            <span>Join Code:</span>
            <code>{shareCode}</code>
            <button 
              onClick={() => copyToClipboard(shareCode)}
              className="copy-btn"
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          
          <div className="share-link-box">
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
            />
            <button 
              onClick={() => copyToClipboard(shareUrl)}
              className="copy-btn"
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}