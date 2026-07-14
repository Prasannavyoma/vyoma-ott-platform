"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';

export default function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menus, setMenus] = useState<any[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 📱 Mobile responsive state managers
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/navigation')
      .then(res => res.json())
      .then(data => setMenus(data))
      .catch(e => console.error("Failed to fetch dynamic menu system."));
      
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setIsLoggedIn(data.isLoggedIn))
      .catch(e => console.error("Failed to fetch auth status."));

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-left-group" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="nav-brand">
            <Link href="/">
              <img 
                src="/assets/logo-200-x-70-px.png" 
                alt="Vyoma Logo" 
                style={{ height: '50px', objectFit: 'contain' }} 
              />
            </Link>
          </div>

          <div className="nav-links desktop-only" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {menus.map((menu, index) => (
              menu.children && menu.children.length > 0 ? (
                <div 
                  className={`dropdown ${activeDropdown === menu.id ? 'active-dropdown' : ''} ${index >= menus.length - 2 ? 'dropdown-right' : ''}`} 
                  key={menu.id}
                  onMouseEnter={() => setActiveDropdown(menu.id)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link 
                    href={menu.url && menu.url !== '#' ? menu.url : '#'} 
                    onClick={(e) => {
                      if (!menu.url || menu.url === '#') {
                        e.preventDefault();
                        setActiveDropdown(prev => prev === menu.id ? null : menu.id);
                      }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    {menu.label}
                    <svg width="11" height="7" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8, transition: 'transform 0.3s', transform: activeDropdown === menu.id ? 'rotate(180deg)' : 'translateY(1px)' }}>
                      <path d="M1 1L6 6L11 1"/>
                    </svg>
                  </Link>
                  <div className="dropdown-content">
                    {menu.children.map((child: any) => (
                      <Link 
                        key={child.id} 
                        href={child.url || '#'}
                        onClick={() => setActiveDropdown(null)} // Close on select
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={menu.id} href={menu.url || '#'}>{menu.label}</Link>
              )
            ))}
          </div>
        </div>
        
        <div className="nav-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Dynamic Search Bar Core - Hidden on homepage to declutter */}
          {pathname !== '/' && (
            <div className="desktop-only">
              <SearchBar />
            </div>
          )}

          <div className="desktop-only" title="Notifications">
            <NotificationBell />
          </div>

          {/* ❓ High-Visibility Help/FAQ Entry */}
          <Link 
            href="/faq" 
            className="desktop-only nav-icon-link"
            title="Help / FAQ"
            style={{ 
              color: '#00d2ff', 
              background: 'rgba(0, 210, 255, 0.1)', 
              border: '1px solid rgba(0, 210, 255, 0.3)',
              padding: '6px 12px',
              borderRadius: '20px'
            }}
          >
             <span className="icon-emoji" style={{fontSize: '1.1rem'}}>❓</span> <span className="faq-text">Help / FAQ</span>
          </Link>

          {/* 📱 Shorts / Reels Gateway */}
          <Link 
            href="/shorts" 
            className="nav-icon-link"
            title="Shorts"
            style={{ 
              color: '#ff4d4d', 
              background: 'rgba(255, 77, 77, 0.1)', 
              border: '1px solid rgba(255, 77, 77, 0.3)',
              padding: '6px 12px',
              borderRadius: '20px',
              marginRight: '10px'
            }}
          >
             <span className="icon-emoji" style={{fontSize: '1.2rem'}}>📱</span> <span className="gift-text">Shorts</span>
          </Link>

          {/* 🎁 High-Discovery Gifting Gateway Entry */}
          <Link 
            href="/gift" 
            className="desktop-only nav-icon-link"
            title="Gift Wisdom"
            style={{ 
              color: '#ffd700', 
              background: 'rgba(255,215,0,0.1)', 
              border: '1px solid rgba(255,215,0,0.3)',
              padding: '6px 12px',
              borderRadius: '20px'
            }}
          >
             <span className="icon-emoji" style={{fontSize: '1.1rem'}}>🎁</span> <span className="gift-text">Gift Wisdom</span>
          </Link>

          <Link href="/progress" title="Progress" className="progress-link desktop-only nav-icon-link">
             <span className="icon-emoji" style={{fontSize: '1.2rem'}}>📈</span> <span className="progress-text">Progress</span>
          </Link>

          {isLoggedIn ? (
            <Link href="/profile" title="Profile" className="profile-link desktop-only nav-icon-link">
               <span className="icon-emoji" style={{fontSize: '1.2rem'}}>👤</span> <span className="profile-text">Profile</span>
            </Link>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Link href="/login" style={{ padding: '8px 16px', fontSize: '0.9rem', fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
                Login
              </Link>
              <Link href="/register" className="btn btn-primary join-btn" style={{ padding: '8px 16px', fontSize: '0.9rem', fontWeight: 800 }}>
                Free Register
              </Link>
            </div>
          )}

          {/* 📱 Mobile Hamburger Menu Toggle */}
          <button 
            className={`hamburger-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* 📱 Mobile Dropdown Drawer Backdrop */}
      <div 
        className={`mobile-menu-drawer-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* 📱 Stateful Sliding Mobile Menu Drawer */}
      <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Quick-Action progress & profile blocks */}
          <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '18px', marginBottom: '5px' }}>
            <Link 
              href="/progress" 
              onClick={() => setMobileMenuOpen(false)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none' }}
            >
              📈 Progress
            </Link>
            {isLoggedIn ? (
              <Link 
                href="/profile" 
                onClick={() => setMobileMenuOpen(false)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none' }}
              >
                👤 Profile
              </Link>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none' }}
              >
                Login
              </Link>
            )}
          </div>

          {/* Dynamic dynamic navigation links list */}
          {menus.map(menu => {
            const hasChildren = menu.children && menu.children.length > 0;
            const isSubmenuOpen = activeMobileSubmenu === menu.id;

            return (
              <div key={menu.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                  className={`mobile-nav-link ${isSubmenuOpen ? 'active' : ''}`}
                  onClick={() => {
                    if (hasChildren) {
                      setActiveMobileSubmenu(isSubmenuOpen ? null : menu.id);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                >
                  {hasChildren ? (
                    <span>{menu.label}</span>
                  ) : (
                    <Link href={menu.url || '#'} style={{ color: 'inherit', textDecoration: 'none', width: '100%', display: 'block' }}>
                      {menu.label}
                    </Link>
                  )}

                  {hasChildren && (
                    <svg width="10" height="6" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s', transform: isSubmenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                      <path d="M1 1L6 6L11 1"/>
                    </svg>
                  )}
                </div>

                {hasChildren && isSubmenuOpen && (
                  <div className="mobile-submenu">
                    {menu.children.map((child: any) => (
                      <Link 
                        key={child.id} 
                        href={child.url || '#'}
                        className="mobile-submenu-link"
                        onClick={() => setMobileMenuOpen(false)}
                        style={{ textDecoration: 'none' }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Primary Join Free target */}
          {!isLoggedIn && (
            <Link 
              href="/register" 
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-primary" 
              style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '14px', fontSize: '0.95rem', fontWeight: 800, marginTop: '10px' }}
            >
              Free Register
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
