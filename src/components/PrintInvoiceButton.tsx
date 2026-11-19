'use client';

import React from 'react';

interface PrintInvoiceButtonProps {
  label?: string;
  className?: string;
  variant?: 'black' | 'blue';
}

export default function PrintInvoiceButton({ 
  label = '🖨️ Download Invoice PDF', 
  variant = 'black' 
}: PrintInvoiceButtonProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const bg = variant === 'blue' ? '#2563eb' : '#000000';

  return (
    <button
      id="print-trigger"
      onClick={handlePrint}
      style={{
        backgroundColor: bg,
        color: '#ffffff',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '6px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
    >
      {label}
    </button>
  );
}
