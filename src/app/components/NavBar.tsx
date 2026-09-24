"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, PlaySquare, FileText, Star, HelpCircle, Gift, TrendingUp } from 'lucide-react';
import SearchBar from './SearchBar';
import ExploreEye from './ExploreEye';
import NotificationBell from './NotificationBell';

import { logoutUser } from '@/app/actions/auth';

const DEFAULT_NAV_MENUS = [
  {
    id: 'genre',
    label: 'Genre',
    url: '#',
    children: [
      { id: 'g-chants', label: 'World of Chants', url: '/genre/World-of-Chants' },
      { id: 'g-bhakti', label: 'Bhakti Bhava Lahari', url: '/genre/Bhakti-Bhava-Lahari' },
      { id: 'g-lang', label: 'Language Learning', url: '/genre/Language-Learning' },
      { id: 'g-grammar', label: 'Grammar Simplified', url: '/genre/Grammar-Simplified' },
      { id: 'g-stories', label: 'Stories & Subhashitas', url: '/genre/Stories-Subhashitas' },
      { id: 'g-lit', label: 'Literature', url: '/genre/Literature' },
      { id: 'g-epics', label: 'Evergreen Epics & Puranas', url: '/genre/Evergreen-Epics-Puranas' },
      { id: 'g-roots', label: 'Roots of Dharma', url: '/genre/Roots-of-Dharma' },
      { id: 'g-iks', label: 'IKS', url: '/genre/IKS' },
      { id: 'g-games', label: 'Games & Activities', url: '/genre/Games-Activities' },
      { id: 'g-kids', label: 'Kids', url: '/genre/Kids' },
      { id: 'g-gita', label: 'Gita', url: '/genre/Gita' },
      { id: 'g-vedanta', label: 'Vedanta', url: '/genre/Vedanta' },
      { id: 'g-shaastra', label: 'Shaastra Studies', url: '/genre/Shaastra-Studies' }
    ]
  },
  {
    id: 'media',
    label: 'Media',
    url: '#',
    children: [
      { id: 'm-audiobooks', label: 'Audiobooks', url: '/genre/Audiobook' },
      { id: 'm-podcasts', label: 'Podcasts', url: '/genre/Podcast' },
      { id: 'm-videos', label: 'Videos', url: '/genre/video' },
      { id: 'm-game-learning', label: 'Game-based Learning', url: '/genre/Game' },
      { id: 'm-learning-prog', label: 'Learning Programs', url: '/genre/learning-program' },
      { id: 'm-ebooks', label: 'E-books', url: '/genre/E-books' },
      { id: 'm-games', label: 'Games', url: '/genre/Games' }
    ]
  },
  {
    id: 'about-us',
    label: 'About Us',
    url: '/about-us',
    children: []
  },
  {
    id: 'sans-hub-menu',
    label: 'Practice Hub',
    url: '#',
    children: [
      { id: 'sans-tool-grammar', label: 'Grammar Analyzer', url: '/tools/grammar-analyzer' },
      { id: 'sans-tool-memorizer', label: 'Shloka Memorizer', url: '/tools/shloka-memorizer' }
    ]
  }
];

export default function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menus, setMenus] = useState<any[]>(DEFAULT_NAV_MENUS);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [features, setFeatures] = useState({ shortsEnabled: true, blogEnabled: true });
  
  // Hover grace period manager to prevent premature dropdown dismissal during diagonal mouse movement
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDropdownEnter = (id: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setActiveDropdown(id || null);
  };

  const handleDropdownLeave = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  // 📱 Mobile responsive state managers
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/navigation')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMenus(data);
        }
      })
      .catch(e => console.error("Failed to fetch dynamic menu system."));
      
    fetch('/api/auth/status')
      .then(res => res.json())
      .then(data => setIsLoggedIn(data.isLoggedIn))
      .catch(e => console.error("Failed to fetch auth status."));

    fetch('/api/features')
      .then(res => res.json())
      .then(data => setFeatures(data))
      .catch(e => console.error("Failed to fetch features."));

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 🚀 TOP SECONDARY UTILITY BAR */}
      <div className="top-utility-bar desktop-only">

        {features.shortsEnabled && (
          <Link href="/shorts" title="Shorts">
            <span className="icon-wrapper" style={{ marginRight: '4px', color: '#ff4d4d', verticalAlign: 'text-bottom' }}><PlaySquare size={16} /></span> Shorts
          </Link>
        )}
        {features.blogEnabled && (
          <Link href="/blog" title="Vyoma Insights Blog">
            <span className="icon-wrapper" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><FileText size={16} /></span> Blog
          </Link>
        )}
        <Link href="/testimonials" title="Community Testimonials">
          <span className="icon-wrapper" style={{ marginRight: '4px', color: '#ffb300', verticalAlign: 'text-bottom' }}><Star size={16} /></span> Testimonials
        </Link>
        <Link href="/faq" title="Help / FAQ">
          <span className="icon-wrapper" style={{ marginRight: '4px', color: '#00d2ff', verticalAlign: 'text-bottom' }}><HelpCircle size={16} /></span> Help
        </Link>
        <Link href="/gift" title="Gift Wisdom">
          <span className="icon-wrapper" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><Gift size={16} /></span> Gift
        </Link>
        <Link href="/progress" title="Progress">
          <span className="icon-wrapper" style={{ marginRight: '4px', verticalAlign: 'text-bottom' }}><TrendingUp size={16} /></span> Progress
        </Link>
      </div>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-left-group" style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <div className="nav-brand">
            <Link href="/">
              <img 
                src="/assets/logo-200-x-70-px.png" 
                alt="Vyoma Logo" 
                style={{ height: '55px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} 
              />
            </Link>
          </div>

          <div 
            className="nav-links desktop-only" 
            style={{ display: 'flex', gap: '20px', alignItems: 'center' }}
            onMouseLeave={handleDropdownLeave}
          >
            {menus.map((menu, index) => (
              menu.children && menu.children.length > 0 ? (
                <div 
                  className={`dropdown ${activeDropdown === menu.id ? 'active-dropdown' : ''} ${index >= menus.length - 2 ? 'dropdown-right' : ''}`} 
                  key={menu.id}
                  onMouseEnter={() => handleDropdownEnter(menu.id)}
                  onMouseLeave={handleDropdownLeave}
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
                <Link key={menu.id} href={menu.url || '#'} onMouseEnter={() => handleDropdownEnter('')}>{menu.label}</Link>
              )
            ))}
          </div>
        </div>
        
        <div className="nav-actions">
          
          {/* Explore Hub 'Live Eye' (Desktop only - on tablet/mobile it lives inside the hamburger menu) */}
          <div className="nav-action-item desktop-only">
            <ExploreEye />
          </div>

          {/* Main Search Bar */}
          <div className="nav-action-item">
            <SearchBar />
          </div>

          <div title="Notifications" className="nav-action-item">
            <NotificationBell />
          </div>

          {isLoggedIn ? (
            <div className="desktop-only" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <Link href="/profile" title="Profile" className="profile-link nav-icon-link">
                 <User size={18} color="var(--primary)" /> <span className="profile-text" style={{ marginLeft: '6px' }}>Profile</span>
              </Link>
              <button 
                onClick={async () => await logoutUser()} 
                className="logout-btn" 
                style={{ background: 'rgba(255,100,100,0.1)', color: '#ff6b6b', border: '1px solid rgba(255,100,100,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,100,100,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,100,100,0.1)'}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/login" className="login-btn">
                Login
              </Link>
              <Link href="/register" className="premium-glow-btn" style={{ marginLeft: '10px' }}>
                FREE REGISTER
              </Link>
            </div>
          )}

          {/* 📱 Mobile Hamburger Menu Toggle */}
          <button 
            className={`hamburger-toggle circle-btn ${mobileMenuOpen ? 'active' : ''}`}
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
          
          {/* Mobile Drawer Top Header with Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Menu</span>
            <button 
              type="button"
              className="circle-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close mobile menu"
              title="Close menu"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(242,100,34,0.2)';
                e.currentTarget.style.borderColor = 'rgba(242,100,34,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              ✕
            </button>
          </div>

          {/* Quick-Action profile / auth blocks (Login & Register side-by-side) */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '18px', marginBottom: '5px' }}>
            {isLoggedIn ? (
              <>
                <Link 
                  href="/profile" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none' }}
                >
                  <User size={16} /> Profile
                </Link>
                <button 
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logoutUser();
                  }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,100,100,0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,100,100,0.2)', color: '#ff6b6b', cursor: 'pointer' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '11px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none' }}
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, #0071BE 0%, #0095ff 100%)', padding: '11px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, border: 'none', color: '#fff', textDecoration: 'none', boxShadow: '0 4px 15px rgba(0, 113, 190, 0.4)' }}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Secondary Header Links (Shorts, Blog, Testimonials, Help, Gift Wisdom, Progress) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '5px' }}>
            {features.shortsEnabled && (
              <Link href="/shorts" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>
                <PlaySquare size={18} color="#ff4d4d" /> Shorts
              </Link>
            )}
            {features.blogEnabled && (
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>
                <FileText size={18} /> Vyoma Blog
              </Link>
            )}
            <Link href="/testimonials" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>
              <Star size={18} color="#ffb300" /> Testimonials
            </Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>
              <HelpCircle size={18} color="#00d2ff" /> Help / FAQ
            </Link>
            <Link href="/gift" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>
              <Gift size={18} /> Gift Wisdom
            </Link>
            <Link href="/progress" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', textDecoration: 'none', fontSize: '1rem', fontWeight: 500 }}>
              <TrendingUp size={18} color="#46d369" /> Progress
            </Link>
            <ExploreEye variant="drawer" onClick={() => setMobileMenuOpen(false)} />
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
        </div>
      </div>
    </>
  );
}
