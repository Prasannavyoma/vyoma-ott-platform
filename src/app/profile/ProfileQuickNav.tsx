"use client";

import { useEffect, useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Identity & Plan', icon: '👤' },
  { id: 'streaks', label: 'Streaks & Rewards', icon: '🔥' },
  { id: 'offline', label: 'Offline Library', icon: '📥' },
  { id: 'referrals', label: 'Referral Center', icon: '🎁' },
  { id: 'matrix', label: 'Academic Matrix', icon: '📊' },
  { id: 'dossier', label: 'Bio & Settings', icon: '⚙️' },
  { id: 'wallet', label: 'Vyoma Wallet', icon: '💰' },
  { id: 'certificates', label: 'Certificates', icon: '🎓' },
  { id: 'invoices', label: 'Invoices', icon: '🧾' },
];

export default function ProfileQuickNav() {
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;

      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -120; // Account for fixed Navbar + QuickNav bar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: '70px',
        zIndex: 90,
        background: 'rgba(5, 5, 10, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        padding: '12px 20px',
        margin: '0 -20px 30px -20px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: 'var(--primary, #f26422)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
            marginRight: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>⚡ QUICK JUMP:</span>
        </span>

        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: isActive
                  ? '1px solid #f26422'
                  : '1px solid rgba(255,255,255,0.08)',
                color: isActive ? '#fff' : '#aaa',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 15px rgba(242,100,34,0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = '#aaa';
                }
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
