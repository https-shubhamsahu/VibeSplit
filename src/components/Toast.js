import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-content">
        {type === 'success' && <span className="toast-icon">✓</span>}
        {type === 'error' && <span className="toast-icon">✗</span>}
        {type === 'info' && <span className="toast-icon">ℹ</span>}
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={() => {
        setVisible(false);
        if (onClose) onClose();
      }}>
        ×
      </button>
    </div>
  );
};

export default Toast;