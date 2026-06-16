'use client';

import { useState, useEffect } from 'react';

export default function ReferralLinkBox({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const [referralUrl, setReferralUrl] = useState('');

  useEffect(() => {
    // Dynamically derive correct origin in browser
    setReferralUrl(`${window.location.origin}/register?ref=${userId}`);
  }, [userId]);

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      padding: '15px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      flexWrap: 'wrap',
      marginTop: '15px'
    }}>
      <div style={{ flex: 1, minWidth: '240px' }}>
        <span style={{ fontSize: '0.7rem', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Your Unique Referral Link
        </span>
        <input 
          type="text" 
          readOnly 
          value={referralUrl || 'Generating link...'} 
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#ffd700',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            outline: 'none',
            marginTop: '4px',
            textOverflow: 'ellipsis'
          }}
        />
      </div>
      
      <button
        onClick={handleCopy}
        style={{
          background: copied ? '#46d369' : 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
          color: '#fff',
          border: 'none',
          padding: '10px 22px',
          borderRadius: '8px',
          fontWeight: 900,
          fontSize: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: copied ? '0 4px 15px rgba(70,211,105,0.2)' : '0 4px 15px rgba(242,100,34,0.2)'
        }}
      >
        {copied ? '✅ COPIED!' : '📋 COPY LINK'}
      </button>
    </div>
  );
}
