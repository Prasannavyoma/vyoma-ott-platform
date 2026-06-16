'use client';

import React, { useState } from 'react';

interface ContactSettings {
  widgetEnabled: boolean;
  phoneEnabled: boolean;
  phoneNumber: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  whatsappMessage: string;
  emailEnabled: boolean;
  emailAddress: string;
}

export default function ContactWidget({ settings }: { settings: ContactSettings }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!settings.widgetEnabled) return null;

  const hasChannels = settings.phoneEnabled || settings.whatsappEnabled || settings.emailEnabled;
  if (!hasChannels) return null;

  const phoneUrl = `tel:${settings.phoneNumber}`;
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/\+/g, '').trim()}?text=${encodeURIComponent(settings.whatsappMessage)}`;
  const emailUrl = `mailto:${settings.emailAddress}`;

  return (
    <div className="vyoma-contact-container" style={{
      position: 'fixed',
      right: '24px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 9999,
      fontFamily: 'var(--font-geist-sans), sans-serif',
      width: '54px',
      height: '54px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Styles for dynamic interactions and mobile responsiveness */}
      <style dangerouslySetInnerHTML={{ __html: `
        .vyoma-contact-btn {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s, filter 0.2s !important;
        }
        .vyoma-contact-btn:hover {
          transform: scale(1.12) !important;
          filter: brightness(1.1);
        }
        .vyoma-contact-toggle {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s, background 0.3s !important;
        }
        .vyoma-contact-toggle:hover {
          transform: scale(1.08) !important;
        }
        @media (max-width: 768px) {
          .vyoma-contact-container {
            top: auto !important;
            bottom: 100px !important;
            transform: none !important;
            right: 33px !important;
          }
        }
      `}} />

      {/* Expanded Actions Stack (positioned absolute relative to container) */}
      <div style={{
        position: 'absolute',
        bottom: '66px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        {/* Phone Button */}
        {settings.phoneEnabled && (
          <a
            href={phoneUrl}
            title="Call Support"
            className="vyoma-contact-btn"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.01-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </a>
        )}

        {/* WhatsApp Button */}
        {settings.whatsappEnabled && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp Support"
            className="vyoma-contact-btn"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.475 1.332 4.989L2 22l5.141-1.349a9.92 9.92 0 004.87 1.28c5.506 0 9.988-4.482 9.988-9.988C22 6.482 17.518 2 12.012 2zm6.059 14.156c-.247.696-1.203 1.272-1.657 1.346-.419.068-.962.115-2.822-.615-2.378-.934-3.909-3.344-4.028-3.502-.119-.158-.968-1.286-.968-2.453 0-1.168.614-1.741.832-1.979.217-.238.475-.297.633-.297.158 0 .317.001.455.008.143.007.337-.054.524.396.198.485.673 1.643.732 1.762.059.119.099.257.02.416-.079.158-.119.257-.238.396-.119.139-.247.309-.356.416-.119.119-.244.248-.105.485.139.238.619 1.018 1.327 1.647.91.812 1.674 1.064 1.912 1.182.238.119.376.099.455-.02.079-.119.337-.396.426-.534.09-.139.178-.119.297-.079.119.04.752.356.88.421.129.065.218.099.247.148.03.05.03.287-.069.983z"/>
            </svg>
          </a>
        )}

        {/* Email Button */}
        {settings.emailEnabled && (
          <a
            href={emailUrl}
            title="Email Support"
            className="vyoma-contact-btn"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </a>
        )}
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Support Options" : "Contact Support"}
        className="vyoma-contact-toggle"
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: isOpen 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isOpen
            ? '0 6px 18px rgba(239, 68, 68, 0.4)'
            : '0 6px 18px rgba(242, 100, 34, 0.4)',
          border: 'none',
          outline: 'none'
        }}
      >
        {isOpen ? (
          <span style={{ fontSize: '18px', fontWeight: 700 }}>✕</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
