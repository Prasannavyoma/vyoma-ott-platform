'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export const DEFAULT_FOOTER_MENUS = [
  {
    id: 'footer-account',
    label: 'Account & Plans',
    children: [
      { id: 'f-sub', label: 'Subscribe / Gold', url: '/subscribe' },
      { id: 'f-gift', label: 'Referral Rewards', url: '/gift' },
      { id: 'f-pwd', label: 'Change Password', url: '/change-password' }
    ]
  },
  {
    id: 'footer-legal',
    label: 'Legal & Guidelines',
    children: [
      { id: 'f-privacy', label: 'Privacy Policy', url: '#' },
      { id: 'f-terms', label: 'Terms of Service', url: '#' },
      { id: 'f-refund', label: 'Refund Policy', url: '#' }
    ]
  }
];

interface FooterProps {
  initialMenus?: any[];
}

export default function Footer({ initialMenus }: FooterProps) {
  const [footerMenus, setFooterMenus] = useState<any[]>(() => {
    if (
      initialMenus &&
      Array.isArray(initialMenus) &&
      initialMenus.length > 0 &&
      initialMenus.some(m => m.children && m.children.length > 0)
    ) {
      return initialMenus;
    }
    return DEFAULT_FOOTER_MENUS;
  });

  useEffect(() => {
    fetch('/api/navigation?type=footer')
      .then(res => res.json())
      .then(data => {
        if (
          Array.isArray(data) &&
          data.length > 0 &&
          data.some((m: any) => m.children && m.children.length > 0)
        ) {
          setFooterMenus(data);
        }
      })
      .catch(() => {
        // Gracefully use default footer links
      });
  }, []);

  return (
    <footer 
      className="vyoma-unified-footer"
      style={{ 
        marginTop: '80px', 
        borderTop: '1px solid rgba(255,255,255,0.06)', 
        paddingTop: '60px', 
        paddingBottom: '30px', 
        color: '#8f98a9',
        fontFamily: 'inherit',
        background: 'transparent'
      }}
    >
      <div className="container" style={{ marginBottom: '50px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }}>
          {/* Branding Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Link href="/" style={{ display: 'inline-block' }}>
              <img 
                src="/assets/logo-200-x-70-px.png" 
                alt="Vyoma Logo" 
                style={{ height: '45px', width: 'fit-content', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(242, 100, 34, 0.15))' }} 
              />
            </Link>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0, color: '#687387', maxWidth: '340px' }}>
              Vyoma Linguistic Labs Foundation is a non-profit organization pioneering digital Sanskrit education globally.
            </p>
          </div>

          {/* Dynamic Columns */}
          {footerMenus.map(menu => (
            <div key={menu.id}>
              <h3 style={{ 
                color: 'white', 
                fontSize: '1.05rem', 
                fontWeight: 800, 
                marginBottom: '20px', 
                position: 'relative',
                paddingBottom: '8px',
                borderBottom: '2px solid rgba(242,100,34,0.3)',
                display: 'inline-block'
              }}>
                {menu.label}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                {menu.children && menu.children.map((child: any) => (
                  <Link 
                    key={child.id}
                    href={child.url || '#'} 
                    style={{ 
                      color: '#8f98a9', 
                      textDecoration: 'none', 
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      display: 'block'
                    }} 
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#8f98a9';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom copyright segment */}
      <div className="container">
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.04)', 
          paddingTop: '30px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '20px',
          fontSize: '0.85rem',
          color: '#687387'
        }}>
          <div>
            © 2026 Vyoma Sanskrit OTT. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Link 
              href="#" 
              style={{ color: '#687387', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = '#cbd5e1'}
              onMouseLeave={e => e.currentTarget.style.color = '#687387'}
            >
              Privacy Policy
            </Link>
            <Link 
              href="#" 
              style={{ color: '#687387', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = '#cbd5e1'}
              onMouseLeave={e => e.currentTarget.style.color = '#687387'}
            >
              Terms of Use
            </Link>
            <Link 
              href="#" 
              style={{ color: '#687387', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = '#cbd5e1'}
              onMouseLeave={e => e.currentTarget.style.color = '#687387'}
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
