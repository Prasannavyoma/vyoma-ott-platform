"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
        <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>🏠 Overview</Link>
        
        {/* -- CONTENT & LECTURE OPERATIONS (MANAGERS) -- */}
        {isManager && (
          <>
            <div className="sidebar-category-label">Content Matrix</div>
            <Link href="/admin/courses" className={pathname.includes('/admin/courses') && !pathname.includes('/import') && !pathname.includes('/bundles') ? 'active' : ''}>🎥 Manage Courses</Link>

            <Link href="/admin/comments" className={`${pathname.includes('/admin/comments') ? 'active' : ''} sublink`}>💬 Comment Moderation</Link>
            <Link href="/admin/episodes" className={`${pathname.includes('/episodes') ? 'active' : ''} sublink`}>📺 Curriculum Units</Link>
            <Link href="/admin/bundles" className={pathname.includes('/admin/bundles') ? 'active' : ''}>📦 Course Bundling</Link>
            <Link href="/admin/blogs" className={pathname.includes('/admin/blogs') ? 'active' : ''}>📝 Blog CMS</Link>
            <Link href="/admin/testimonials" className={pathname.includes('/admin/testimonials') ? 'active' : ''}>🌟 Testimonial Approvals</Link>
            <Link href="/admin/pages" className={pathname.includes('/pages') ? 'active' : ''}>📄 Custom CMS Pages</Link>
            <Link href="/admin/theme-settings" className={pathname.includes('/theme-settings') ? 'active' : ''}>🎨 Theme & Customization</Link>
            <Link href="/admin/layout-settings" className={pathname.includes('/layout-settings') ? 'active' : ''}>🛠️ Homepage Shelf</Link>
            <Link href="/admin/navigation" className={pathname.includes('/navigation') ? 'active' : ''}>🗂️ Nav Configuration</Link>
            <Link href="/admin/sponsors" className={pathname.includes('/sponsors') ? 'active' : ''}>🤝 Sponsors & Slider</Link>
            <Link href="/admin/gamification" className={pathname.includes('/gamification') ? 'active' : ''}>💰 Gamification Settings</Link>
          </>
        )}

        {/* -- FINANCIAL ENGINE & TRANSACTIONS (FINANCE) -- */}
        {isFinance && (
          <>
            <div className="sidebar-category-label">Fiscal & Growth</div>
            <Link href="/admin/orders" className={pathname.includes('/orders') ? 'active' : ''}>🛒 Financial Orders</Link>
            <Link href="/admin/reports" className={pathname.includes('/reports') ? 'active' : ''}>📊 Fiscal Intelligence</Link>
            <Link href="/admin/analytics" className={pathname.includes('/analytics') ? 'active' : ''}>📈 Platform Analytics</Link>
            <Link href="/admin/telemetry" className={pathname.includes('/telemetry') ? 'active' : ''}>🎯 Telemetry & Hotlinks</Link>
            <Link href="/admin/subscriptions" className={pathname.includes('/subscriptions') ? 'active' : ''}>💳 Subscriptions</Link>
            <Link href="/admin/vouchers" className={pathname.includes('/vouchers') ? 'active' : ''}>🎟️ Bulk Vouchers</Link>
            <Link href="/admin/campaigns" className={pathname.includes('/campaigns') ? 'active' : ''}>📢 Campaign Forge</Link>
            <Link href="/admin/referrals" className={pathname.includes('/referrals') ? 'active' : ''}>🤝 Referral Hub</Link>
            <Link href="/admin/email-settings" className={pathname.includes('/email-settings') ? 'active' : ''}>📧 Email Controls</Link>
            <Link href="/admin/whatsapp-settings" className={pathname.includes('/whatsapp-settings') ? 'active' : ''}>💬 WhatsApp Automation</Link>
            {isAdmin && <Link href="/admin/meilisearch-settings" className={pathname.includes('/meilisearch-settings') ? 'active' : ''}>🔍 Meilisearch Engine</Link>}
          </>
        )}

        {/* -- IDENTITY ORCHESTRATOR -- */}
        {isManager && (
          <>
            <div className="sidebar-category-label">Identity Hub</div>
            {isAdmin && <Link href="/admin/users" className={pathname.includes('/admin/users') && !pathname.includes('/import') ? 'active' : ''}>👥 Users & Authority</Link>}
            {isAdmin && <Link href="/admin/users/import" className={`${pathname.includes('/admin/users/import') ? 'active' : ''} sublink`}>📥 Bulk User Import (CSV)</Link>}
            <Link href="/admin/auth-settings" className={pathname.includes('/auth-settings') ? 'active' : ''}>🔑 Auth Controls</Link>
            {isSuper && <Link href="/admin/ai-settings" className={pathname.includes('/ai-settings') ? 'active' : ''}>🤖 AI Chatbot Settings</Link>}
            {isSuper && <Link href="/admin/sanskrit-settings" className={pathname === '/admin/sanskrit-settings' ? 'active' : ''}>🌸 Sanskrit Hub Settings</Link>}
            {isAdmin && <Link href="/admin/sanskrit-settings/subhashitas" className={`${pathname.includes('/sanskrit-settings/subhashitas') ? 'active' : ''} sublink`}>🪔 Manage Subhashitas</Link>}
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
          🚪 Logout Session
        </button>
      </nav>
    </aside>
  );
}
