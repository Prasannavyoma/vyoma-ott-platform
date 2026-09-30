"use client";

import { useState, useEffect } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
}

export default function LogoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Logout",
  description = "Are you sure you want to log out of your Digitalsanskrit OTT? You will need to log back in to access your course progress and Course material,Ebooks , etc"
}: LogoutConfirmationModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoggingOut) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoggingOut, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(2, 6, 14, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoggingOut) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(242, 100, 34, 0.15)',
          position: 'relative',
          color: '#fff',
          fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          disabled={isLoggingOut}
          title="Close modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={16} />
        </button>

        {/* LOGOUT ICON BADGE */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(242, 100, 34, 0.25))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
          }}>
            <LogOut size={30} color="#ef4444" />
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
            {title}
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.55' }}>
            {description}
          </p>
        </div>

        {/* ACTIONS BUTTONS */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '12px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isLoggingOut}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 18px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoggingOut ? (
              <span>Logging out...</span>
            ) : (
              <>
                <LogOut size={16} /> Yes, Logout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
