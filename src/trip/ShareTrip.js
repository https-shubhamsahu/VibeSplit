import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";

export default function ShareTrip({ trip, isGuest, type = "trip" }) {
  const [copied, setCopied] = useState(false);
  const [shareCode, setShareCode] = useState(trip.joinCode || null);
  const { showSuccess, showInfo } = useToast();

  useEffect(() => {
    const generateAndSetJoinCode = async () => {
      if (trip.joinCode) {
        setShareCode(trip.joinCode);
        return;
      }
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      if (!isGuest) {
        await updateDoc(doc(db, type + "s", trip.id), {
          joinCode: code,
        });
      }
      setShareCode(code);
    };

    generateAndSetJoinCode();
  }, [trip.joinCode, isGuest, trip.id, type]);

  const shareUrl = shareCode ? `${window.location.origin}${window.location.pathname}#/join/${shareCode}` : "";

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSuccess(`${type === 'code' ? 'Join code' : 'Share link'} copied to clipboard!`);
  };

  return (
    <div className="share-trip-section">
      <h3>Share Trip</h3>
      {isGuest ? (
        <p className="share-notice" onClick={() => showInfo("Please log in to share this trip with others.")}>Sharing is only available for logged-in users</p>
      ) : (
        <div className="share-content">
          <div className="share-code-box">
            <span>Join Code:</span>
            <code>{shareCode}</code>
            <button 
              onClick={() => copyToClipboard(shareCode, 'code')}
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
              onClick={() => copyToClipboard(shareUrl, 'link')}
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