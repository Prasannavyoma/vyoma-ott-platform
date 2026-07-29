"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Video, MessageSquare, Tv, Package, FileText, Star, File, Palette, Settings, Folder, Handshake, Coins, ShoppingCart, BarChart2, TrendingUp, Target, CreditCard, Ticket, Megaphone, Mail, Search, Users, Download, Key, Bot, Flower, Flame, LogOut, Shield } from 'lucide-react';

export default function AdminSidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname() || '';

  // Define Access Authority Matrix
  const isSuper = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN' || isSuper;
  const isManager = userRole === 'MANAGER' || isAdmin;
  const isFinance = userRole === 'FINANCE' || isAdmin;

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <h2>VYOMA ADMIN</h2>
        <span className="role-badge" style={{ 
          fontSize: '0.65rem', 
          background: 'rgba(255,255,255,0.05)', 
          padding: '4px 10px', 
          borderRadius: '10px', 
          border: '1px solid rgba(255,255,255,0.1)', 
          color: '#888', 
          textTransform: 'uppercase', 
          fontWeight: 'bold',
          width: 'fit-content'
        }}>
          Designated: {userRole}
        </span>
      </div>

      <nav className="admin-menu">
        {/* -- SHARED LANDING -- */}
        <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Home size={16} /></span>Overview</Link>
        
        {/* -- CONTENT & LECTURE OPERATIONS (MANAGERS) -- */}
        {isManager && (
          <>
            <div className="sidebar-category-label">Content Matrix</div>
            <Link href="/admin/courses" className={pathname.includes('/admin/courses') && !pathname.includes('/import') && !pathname.includes('/bundles') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Video size={16} /></span>Manage Courses</Link>

            <Link href="/admin/comments" className={`${pathname.includes('/admin/comments') ? 'active' : ''} sublink`}><span className="sidebar-icon" style={{marginRight: "6px"}}><MessageSquare size={16} /></span>Comment Moderation</Link>
            <Link href="/admin/episodes" className={`${pathname.includes('/episodes') ? 'active' : ''} sublink`}><span className="sidebar-icon" style={{marginRight: "6px"}}><Tv size={16} /></span>Curriculum Units</Link>
            <Link href="/admin/bundles" className={pathname.includes('/admin/bundles') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Package size={16} /></span>Course Bundling</Link>
            <Link href="/admin/blogs" className={pathname.includes('/admin/blogs') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><FileText size={16} /></span>Blog CMS</Link>
            <Link href="/admin/testimonials" className={pathname.includes('/admin/testimonials') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Star size={16} /></span>Testimonial Approvals</Link>
            <Link href="/admin/pages" className={pathname.includes('/pages') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><File size={16} /></span>Custom CMS Pages</Link>
            <Link href="/admin/theme-settings" className={pathname.includes('/theme-settings') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Palette size={16} /></span>Theme & Customization</Link>
            <Link href="/admin/layout-settings" className={pathname.includes('/layout-settings') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Settings size={16} /></span>Homepage Shelf</Link>
            <Link href="/admin/navigation" className={pathname.includes('/navigation') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Folder size={16} /></span>Nav Configuration</Link>
            <Link href="/admin/sponsors" className={pathname.includes('/sponsors') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Handshake size={16} /></span>Sponsors & Slider</Link>
            <Link href="/admin/gamification" className={pathname.includes('/gamification') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Coins size={16} /></span>Gamification Settings</Link>
          </>
        )}

        {/* -- FINANCIAL ENGINE & TRANSACTIONS (FINANCE) -- */}
        {isFinance && (
          <>
            <div className="sidebar-category-label">Fiscal & Growth</div>
            <Link href="/admin/orders" className={pathname.includes('/orders') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><ShoppingCart size={16} /></span>Financial Orders</Link>
            <Link href="/admin/reports" className={pathname.includes('/reports') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><BarChart2 size={16} /></span>Fiscal Intelligence</Link>
            <Link href="/admin/analytics" className={pathname.includes('/analytics') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><TrendingUp size={16} /></span>Platform Analytics</Link>
            <Link href="/admin/telemetry" className={pathname.includes('/telemetry') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Target size={16} /></span>Telemetry & Hotlinks</Link>
            <Link href="/admin/subscriptions" className={pathname.includes('/subscriptions') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><CreditCard size={16} /></span>Subscriptions</Link>
            <Link href="/admin/vouchers" className={pathname.includes('/vouchers') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Ticket size={16} /></span>Bulk Vouchers</Link>
            <Link href="/admin/campaigns" className={pathname.includes('/campaigns') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Megaphone size={16} /></span>Campaign Forge</Link>
            <Link href="/admin/referrals" className={pathname.includes('/referrals') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Handshake size={16} /></span>Referral Hub</Link>
            <Link href="/admin/email-settings" className={pathname.includes('/email-settings') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Mail size={16} /></span>Email Controls</Link>
            <Link href="/admin/whatsapp-settings" className={pathname.includes('/whatsapp-settings') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><MessageSquare size={16} /></span>WhatsApp Automation</Link>
            {isAdmin && <Link href="/admin/meilisearch-settings" className={pathname.includes('/meilisearch-settings') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Search size={16} /></span>Meilisearch Engine</Link>}
          </>
        )}

        {/* -- IDENTITY ORCHESTRATOR -- */}
        {isManager && (
          <>
            <div className="sidebar-category-label">Identity Hub</div>
            {isAdmin && <Link href="/admin/users" className={pathname.includes('/admin/users') && !pathname.includes('/import') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Users size={16} /></span>Users & Authority</Link>}
            {isAdmin && <Link href="/admin/users/import" className={`${pathname.includes('/admin/users/import') ? 'active' : ''} sublink`}><span className="sidebar-icon" style={{marginRight: "6px"}}><Download size={16} /></span>Bulk User Import (CSV)</Link>}
            <Link href="/admin/auth-settings" className={pathname.includes('/auth-settings') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Key size={16} /></span>Auth Controls</Link>
            {isSuper && <Link href="/admin/ai-settings" className={pathname.includes('/ai-settings') ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Bot size={16} /></span>AI Chatbot Settings</Link>}
            {isSuper && <Link href="/admin/sanskrit-settings" className={pathname === '/admin/sanskrit-settings' ? 'active' : ''}><span className="sidebar-icon" style={{marginRight: "6px"}}><Flower size={16} /></span>Sanskrit Hub Settings</Link>}
            {isAdmin && <Link href="/admin/sanskrit-settings/subhashitas" className={`${pathname.includes('/sanskrit-settings/subhashitas') ? 'active' : ''} sublink`}><span className="sidebar-icon" style={{marginRight: "6px"}}><Flame size={16} /></span>Manage Subhashitas</Link>}
          </>
        )}

        {/* -- SECURITY MATRIX -- */}
        {isAdmin && (
          <>
            <div className="sidebar-category-label" style={{ color: '#ff4d4f' }}>Security Engine</div>
            <Link href="/admin/security" className={pathname.includes('/security') ? 'active' : ''}>
              <span className="sidebar-icon" style={{marginRight: "6px"}}><Shield size={16} /></span>
              Security & CSPM
            </Link>
          </>
        )}

        {/* -- SYSTEM ESCAPE -- */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '15px 10px 10px' }}></div>
        <Link href="/" className="back-to-website-btn" style={{ 
          marginTop: '10px', 
          color: '#ff4d4f', 
          fontWeight: 800,
          border: '1px dashed rgba(255, 77, 79, 0.2)',
          padding: '10px 15px',
          borderRadius: '8px',
          textAlign: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 77, 79, 0.02)',
          transition: 'all 0.2s'
        }}>
          ← Back to Website
        </Link>
        <button onClick={async () => {
          const { logoutAdmin } = await import('@/app/actions/admin-auth');
          await logoutAdmin();
          window.location.href = '/admin/login';
        }} className="back-to-website-btn" style={{ 
          marginTop: '10px', 
          color: '#ff4d4f', 
          fontWeight: 800,
          border: '1px solid rgba(255, 77, 79, 0.4)',
          padding: '10px 15px',
          borderRadius: '8px',
          textAlign: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 77, 79, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}>
          <span className="sidebar-icon" style={{marginRight: "6px"}}><LogOut size={16} /></span>Logout Session
        </button>
      </nav>
    </aside>
  );
}
