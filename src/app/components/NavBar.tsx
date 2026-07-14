"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import ExploreEye from './ExploreEye';
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
      {/* 🚀 TOP SECONDARY UTILITY BAR */}
      <div className="top-utility-bar desktop-only">

        <Link href="/shorts" title="Shorts">
          <span className="icon-wrapper" style={{ fontSize: '1.1rem', marginRight: '4px', color: '#ff4d4d' }}>📱</span> Shorts
        </Link>
        <Link href="/blog" title="Vyoma Insights Blog">
          <span className="icon-wrapper" style={{ fontSize: '1.1rem', marginRight: '4px' }}>📝</span> Blog
        </Link>
        <Link href="/testimonials" title="Community Testimonials">
          <span className="icon-wrapper" style={{ fontSize: '1.1rem', marginRight: '4px', color: '#ffb300' }}>🌟</span> Testimonials
        </Link>
        <Link href="/faq" title="Help / FAQ">
          <span className="icon-wrapper" style={{ fontSize: '1.1rem', marginRight: '4px', color: '#00d2ff' }}>❓</span> Help
        </Link>
        <Link href="/gift" title="Gift Wisdom">
          <span className="icon-wrapper" style={{ fontSize: '1.1rem', marginRight: '4px' }}>🎁</span> Gift
        </Link>
        <Link href="/progress" title="Progress">
          <span className="icon-wrapper" style={{ fontSize: '1.1rem', marginRight: '4px' }}>📈</span> Progress
        </Link>
      </div>

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
        
        <div className="nav-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          {/* Explore Hub 'Live Eye' */}
          <div className="desktop-only" style={{ marginRight: '5px' }}>
            <ExploreEye />
          </div>

          {/* Main Search Bar */}
          <div className="desktop-only" style={{ marginRight: '10px' }}>
            <SearchBar />
          </div>

          <div className="desktop-only" title="Notifications" style={{ marginRight: '10px' }}>
            <NotificationBell />
          </div>

          {isLoggedIn ? (
            <Link href="/profile" title="Profile" className="profile-link desktop-only nav-icon-link">
               <span className="icon-emoji" style={{fontSize: '1.2rem'}}>👤</span> <span className="profile-text">Profile</span>
            </Link>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/login" className="login-btn">
                Login
              </Link>
              <Link href="/register" className="btn btn-primary join-btn premium-glow-btn">
                FREE REGISTER
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
