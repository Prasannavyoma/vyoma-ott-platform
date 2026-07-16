"use client";

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user already accepted/rejected
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show the banner with a slight delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      // Auto-hide after 15 seconds if no action is taken
      const autoCloseTimer = setTimeout(() => {
        setIsVisible(false);
      }, 16000); // 1s delay + 15s display

      return () => {
        clearTimeout(timer);
        clearTimeout(autoCloseTimer);
      };
    }
  }, []);

  const handleConsent = (action: 'accept' | 'reject') => {
    localStorage.setItem('cookieConsent', action);
    setIsVisible(false);
    
    if (action === 'accept') {
      // Optional: Initialize analytics or tracking scripts here
      console.log('Cookies accepted');
    } else {
      console.log('Cookies rejected');
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '650px',
      background: 'rgba(11, 13, 20, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(242, 100, 34, 0.1)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      color: '#fff'
    }}>
      <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#ccc' }}>
        This website uses cookies and other tracking tools to provide you with the best experience. 
        By using our site, you acknowledge that you understand this and are willing to comply with 
        the terms in our privacy policy and cookies policy.
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => handleConsent('reject')}
          style={{
            padding: '8px 20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          Reject
        </button>
        <button 
          onClick={() => handleConsent('accept')}
          className="premium-glow-btn"
          style={{
            padding: '8px 20px',
            border: 'none',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
