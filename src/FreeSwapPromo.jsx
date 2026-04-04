import React, { useState, useEffect } from 'react';

export default function FreeSwapPromo({ currentUser, showPromo, onClose }) {
  const [visible, setVisible] = useState(showPromo);
  const [timerActive, setTimerActive] = useState(true);

  useEffect(() => {
    if (!visible) return;

    if (timerActive) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible, timerActive, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #0a9396 0%, #00a8a0 100%)',
        color: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        maxWidth: '320px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
            Your first swap is free!
          </div>
          <div style={{ fontSize: '14px', opacity: 0.95 }}>
            Use your free swap to exchange skills with anyone on SkillSwap.
          </div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onClose();
            setTimerActive(false);
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#ffffff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            marginLeft: '12px',
            flexShrink: 0,
          }}
          aria-label="Close promo"
        >
          ×
        </button>
      </div>

      <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.8 }}>
        Closing in 5 seconds...
      </div>
    </div>
  );
}
