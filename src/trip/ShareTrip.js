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

  // Use the homepage base from package.json for correct GitHub Pages links
const homepage = "https://https-shubhamsahu.github.io/VibeSplit";
const shareUrl = shareCode ? `${homepage}/#/join/${type}/${shareCode}` : "";

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSuccess(`${type === 'code' ? 'Join code' : 'Share link'} copied to clipboard!`);
  };

  return (
    <div className="share-trip-section">
      <h3>Share This {trip.emoji ? `${trip.emoji} ` : ''}{trip.name || 'Trip'}</h3>
      {isGuest ? (
        <p className="share-notice" onClick={() => showInfo("Please log in to share this trip with others.")}>Sharing is only available for logged-in users</p>
      ) : (
        <div className="share-content">
          <p style={{marginBottom: 8}}>Anyone with this code or link can join your group:</p>
          <div className="share-code-box">
            <span>Join Code:</span>
            <input
              type="text"
              value={shareCode || ''}
              readOnly
              className="share-code-input"
              onClick={e => { e.target.select(); copyToClipboard(shareCode, 'code'); }}
              style={{width: 110, fontWeight: 'bold', fontSize: '1.2em', textAlign: 'center', marginRight: 8}}
            />
            <button 
              onClick={() => copyToClipboard(shareCode, 'code')}
              className="copy-btn"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          <hr style={{margin: '18px 0', border: 'none', borderTop: '1px solid #eee'}} />
          <div className="share-link-box">
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className="share-link-input"
              onClick={e => { e.target.select(); copyToClipboard(shareUrl, 'link'); }}
              style={{flex: 1, marginRight: 8}}
            />
            <button 
              onClick={() => copyToClipboard(shareUrl, 'link')}
              className="copy-btn"
            >
              {copied ? '✓' : 'Copy Link'}
            </button>
          </div>
          <p style={{fontSize: '0.95em', color: '#888', marginTop: 8}}>Anyone with this link can join!</p>
        </div>
      )}
    </div>
  );
}