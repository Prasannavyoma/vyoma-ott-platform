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
      const scrollPos = window.scrollY + 250;

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
      const yOffset = -180; // Clearance for navbar + quicknav bar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      <style jsx>{`
        .profile-quick-nav-container {
          position: sticky;
          top: 115px;
          z-index: 800;
          background: rgba(10, 10, 16, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(242, 100, 34, 0.3);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(242, 100, 34, 0.15);
          padding: 10px 16px;
          margin-bottom: 35px;
          transition: top 0.3s ease;
        }

        @media (max-width: 900px) {
          .profile-quick-nav-container {
            top: 65px;
            margin-bottom: 25px;
          }
        }

        .profile-quick-nav-scroll {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 2px 0;
        }

        .profile-quick-nav-scroll::-webkit-scrollbar {
          display: none;
        }

        .quick-nav-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #bbb;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .quick-nav-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          transform: translateY(-1px);
        }

        .quick-nav-btn.active {
          background: linear-gradient(135deg, #f26422 0%, #ff8c53 100%);
          border-color: #f26422;
          color: #fff;
          font-weight: 800;
          box-shadow: 0 5px 15px rgba(242, 100, 34, 0.4);
        }
      `}</style>

      <div className="profile-quick-nav-container">
        <div className="profile-quick-nav-scroll">
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 900,
              color: 'var(--primary, #f26422)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              whiteSpace: 'nowrap',
              marginRight: '6px',
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
                className={`quick-nav-btn ${isActive ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
