"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Video, MessageSquare, Tv, Package, FileText, Star, File, 
  Palette, Settings, Folder, Handshake, Coins, ShoppingCart, BarChart2, 
  TrendingUp, Target, CreditCard, Ticket, Megaphone, Mail, Search, 
  Users, Download, Key, Bot, Flower, Flame, LogOut, Shield, Sparkles
} from 'lucide-react';
import LogoutConfirmationModal from '@/app/components/LogoutConfirmationModal';

function RealisticBadge({ 
  icon: Icon, 
  gradient, 
  glow, 
  size = 14 
}: { 
  icon: any; 
  gradient: string; 
  glow: string; 
  size?: number; 
}) {
  return (
    <span 
      className="realistic-icon-badge"
      style={{
        background: gradient,
        boxShadow: `0 3px 9px ${glow}, inset 0 1px 1px rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.3)`
      }}
    >
      <Icon size={size} strokeWidth={2.4} />
    </span>
  );
}

export default function AdminSidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname() || '';
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Define Access Authority Matrix
  const isSuper = userRole === 'SUPER_ADMIN';
  const isAdmin = userRole === 'ADMIN' || isSuper;
  const isManager = userRole === 'MANAGER' || isAdmin;
  const isFinance = userRole === 'FINANCE' || isAdmin;

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
            boxShadow: '0 4px 14px rgba(242,100,34,0.45), inset 0 1px 1px rgba(255,255,255,0.5)',
            color: '#fff',
            flexShrink: 0
          }}>
            <Shield size={20} strokeWidth={2.5} />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '1px' }}>VYOMA ADMIN</h2>
            <div style={{ fontSize: '0.65rem', color: '#8f9bb3', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
              Mission Control
            </div>
          </div>
        </div>
        <span className="role-badge" style={{ 
          fontSize: '0.65rem', 
          background: 'rgba(255,255,255,0.05)', 
          padding: '4px 10px', 
          borderRadius: '10px', 
          border: '1px solid rgba(255,255,255,0.1)', 
          color: '#888', 
          textTransform: 'uppercase', 
          fontWeight: 'bold',
          width: 'fit-content',
          marginTop: '6px'
        }}>
          Designated: {userRole}
        </span>
      </div>

      <nav className="admin-menu">
        {/* -- SHARED LANDING -- */}
        <Link href="/admin" className={pathname === '/admin' ? 'active' : ''}>
          <RealisticBadge 
            icon={Home} 
            gradient="linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)" 
            glow="rgba(56, 189, 248, 0.4)" 
          />
          Overview
        </Link>
        
        {/* -- CONTENT & LECTURE OPERATIONS (MANAGERS) -- */}
        {isManager && (
          <>
            <div className="sidebar-category-label">Content Matrix</div>
            <Link href="/admin/courses" className={pathname.includes('/admin/courses') && !pathname.includes('/import') && !pathname.includes('/bundles') ? 'active' : ''}>
              <RealisticBadge 
                icon={Video} 
                gradient="linear-gradient(135deg, #fb7185 0%, #e11d48 100%)" 
                glow="rgba(244, 63, 94, 0.4)" 
              />
              Manage Courses
            </Link>

            <Link href="/admin/comments" className={`${pathname.includes('/admin/comments') ? 'active' : ''} sublink`}>
              <RealisticBadge 
                icon={MessageSquare} 
                gradient="linear-gradient(135deg, #fb923c 0%, #ea580c 100%)" 
                glow="rgba(251, 146, 60, 0.4)" 
                size={12}
              />
              Comment Moderation
            </Link>

            <Link href="/admin/episodes" className={`${pathname.includes('/episodes') ? 'active' : ''} sublink`}>
              <RealisticBadge 
                icon={Tv} 
                gradient="linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)" 
                glow="rgba(192, 132, 252, 0.4)" 
                size={12}
              />
              Curriculum Units
            </Link>

            <Link href="/admin/bundles" className={pathname.includes('/admin/bundles') ? 'active' : ''}>
              <RealisticBadge 
                icon={Package} 
                gradient="linear-gradient(135deg, #34d399 0%, #059669 100%)" 
                glow="rgba(52, 211, 153, 0.4)" 
              />
              Course Bundling
            </Link>

            <Link href="/admin/blogs" className={pathname.includes('/admin/blogs') ? 'active' : ''}>
              <RealisticBadge 
                icon={FileText} 
                gradient="linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)" 
                glow="rgba(34, 211, 238, 0.4)" 
              />
              Blog CMS
            </Link>

            <Link href="/admin/testimonials" className={pathname.includes('/admin/testimonials') ? 'active' : ''}>
              <RealisticBadge 
                icon={Star} 
                gradient="linear-gradient(135deg, #fcd34d 0%, #d97706 100%)" 
                glow="rgba(252, 211, 77, 0.4)" 
              />
              Testimonial Approvals
            </Link>

            <Link href="/admin/pages" className={pathname.includes('/pages') ? 'active' : ''}>
              <RealisticBadge 
                icon={File} 
                gradient="linear-gradient(135deg, #818cf8 0%, #4338ca 100%)" 
                glow="rgba(129, 140, 248, 0.4)" 
              />
              Custom CMS Pages
            </Link>

            <Link href="/admin/theme-settings" className={pathname.includes('/theme-settings') ? 'active' : ''}>
              <RealisticBadge 
                icon={Palette} 
                gradient="linear-gradient(135deg, #f472b6 0%, #db2777 100%)" 
                glow="rgba(244, 114, 182, 0.4)" 
              />
              Theme & Customization
            </Link>

            <Link href="/admin/layout-settings" className={pathname.includes('/layout-settings') ? 'active' : ''}>
              <RealisticBadge 
                icon={Settings} 
                gradient="linear-gradient(135deg, #f97316 0%, #c2410c 100%)" 
                glow="rgba(249, 115, 22, 0.4)" 
              />
              Homepage Shelf
            </Link>

            <Link href="/admin/navigation" className={pathname.includes('/navigation') ? 'active' : ''}>
              <RealisticBadge 
                icon={Folder} 
                gradient="linear-gradient(135deg, #94a3b8 0%, #475569 100%)" 
                glow="rgba(148, 163, 184, 0.35)" 
              />
              Nav Configuration
            </Link>

            <Link href="/admin/sponsors" className={pathname.includes('/sponsors') ? 'active' : ''}>
              <RealisticBadge 
                icon={Handshake} 
                gradient="linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" 
                glow="rgba(245, 158, 11, 0.4)" 
              />
              Sponsors & Slider
            </Link>

            <Link href="/admin/gamification" className={pathname.includes('/gamification') ? 'active' : ''}>
              <RealisticBadge 
                icon={Coins} 
                gradient="linear-gradient(135deg, #fbbf24 0%, #b45309 100%)" 
                glow="rgba(251, 191, 36, 0.45)" 
              />
              Gamification Settings
            </Link>
          </>
        )}

        {/* -- FINANCIAL ENGINE & TRANSACTIONS (FINANCE) -- */}
        {isFinance && (
          <>
            <div className="sidebar-category-label">Fiscal & Growth</div>
            <Link href="/admin/orders" className={pathname.includes('/orders') ? 'active' : ''}>
              <RealisticBadge 
                icon={ShoppingCart} 
                gradient="linear-gradient(135deg, #4ade80 0%, #15803d 100%)" 
                glow="rgba(74, 222, 128, 0.4)" 
              />
              Financial Orders
            </Link>

            <Link href="/admin/reports" className={pathname.includes('/reports') ? 'active' : ''}>
              <RealisticBadge 
                icon={BarChart2} 
                gradient="linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)" 
                glow="rgba(45, 212, 191, 0.4)" 
              />
              Fiscal Intelligence
            </Link>

            <Link href="/admin/analytics" className={pathname.includes('/analytics') ? 'active' : ''}>
              <RealisticBadge 
                icon={TrendingUp} 
                gradient="linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)" 
                glow="rgba(167, 139, 250, 0.4)" 
              />
              Platform Analytics
            </Link>

            <Link href="/admin/telemetry" className={pathname.includes('/telemetry') ? 'active' : ''}>
              <RealisticBadge 
                icon={Target} 
                gradient="linear-gradient(135deg, #f87171 0%, #b91c1c 100%)" 
                glow="rgba(248, 113, 113, 0.4)" 
              />
              Telemetry & Hotlinks
            </Link>

            <Link href="/admin/subscriptions" className={pathname.includes('/subscriptions') ? 'active' : ''}>
              <RealisticBadge 
                icon={CreditCard} 
                gradient="linear-gradient(135deg, #c084fc 0%, #9333ea 100%)" 
                glow="rgba(192, 132, 252, 0.4)" 
              />
              Subscriptions
            </Link>

            <Link href="/admin/vouchers" className={pathname.includes('/vouchers') ? 'active' : ''}>
              <RealisticBadge 
                icon={Ticket} 
                gradient="linear-gradient(135deg, #fb7185 0%, #be123c 100%)" 
                glow="rgba(251, 113, 133, 0.4)" 
              />
              Bulk Vouchers
            </Link>

            <Link href="/admin/campaigns" className={pathname.includes('/campaigns') ? 'active' : ''}>
              <RealisticBadge 
                icon={Megaphone} 
                gradient="linear-gradient(135deg, #f97316 0%, #e11d48 100%)" 
                glow="rgba(249, 115, 22, 0.4)" 
              />
              Campaign Forge
            </Link>

            <Link href="/admin/referrals" className={pathname.includes('/referrals') ? 'active' : ''}>
              <RealisticBadge 
                icon={Handshake} 
                gradient="linear-gradient(135deg, #34d399 0%, #047857 100%)" 
                glow="rgba(52, 211, 153, 0.4)" 
              />
              Referral Hub
            </Link>

            <Link href="/admin/email-settings" className={pathname.includes('/email-settings') ? 'active' : ''}>
              <RealisticBadge 
                icon={Mail} 
                gradient="linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)" 
                glow="rgba(56, 189, 248, 0.4)" 
              />
              Email Controls
            </Link>

            <Link href="/admin/whatsapp-settings" className={pathname.includes('/whatsapp-settings') ? 'active' : ''}>
              <RealisticBadge 
                icon={MessageSquare} 
                gradient="linear-gradient(135deg, #22c55e 0%, #166534 100%)" 
                glow="rgba(34, 197, 94, 0.45)" 
              />
              WhatsApp Automation
            </Link>

            {isAdmin && (
              <Link href="/admin/meilisearch-settings" className={pathname.includes('/meilisearch-settings') ? 'active' : ''}>
                <RealisticBadge 
                  icon={Search} 
                  gradient="linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)" 
                  glow="rgba(129, 140, 248, 0.4)" 
                />
                Meilisearch Engine
              </Link>
            )}
          </>
        )}

        {/* -- IDENTITY ORCHESTRATOR -- */}
        {isManager && (
          <>
            <div className="sidebar-category-label">Identity Hub</div>
            {isAdmin && (
              <Link href="/admin/users" className={pathname.includes('/admin/users') && !pathname.includes('/import') ? 'active' : ''}>
                <RealisticBadge 
                  icon={Users} 
                  gradient="linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)" 
                  glow="rgba(96, 165, 250, 0.4)" 
                />
                Users & Authority
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin/users/import" className={`${pathname.includes('/admin/users/import') ? 'active' : ''} sublink`}>
                <RealisticBadge 
                  icon={Download} 
                  gradient="linear-gradient(135deg, #fcd34d 0%, #d97706 100%)" 
                  glow="rgba(252, 211, 77, 0.4)" 
                  size={12}
                />
                Bulk User Import (CSV)
              </Link>
            )}

            <Link href="/admin/auth-settings" className={pathname.includes('/auth-settings') ? 'active' : ''}>
              <RealisticBadge 
                icon={Key} 
                gradient="linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)" 
                glow="rgba(148, 163, 184, 0.35)" 
              />
              Auth Controls
            </Link>

            {isSuper && (
              <Link href="/admin/ai-settings" className={pathname.includes('/ai-settings') ? 'active' : ''}>
                <RealisticBadge 
                  icon={Bot} 
                  gradient="linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)" 
                  glow="rgba(6, 182, 212, 0.45)" 
                />
                AI Chatbot Settings
              </Link>
            )}

            {isSuper && (
              <Link href="/admin/sanskrit-settings" className={pathname === '/admin/sanskrit-settings' ? 'active' : ''}>
                <RealisticBadge 
                  icon={Flower} 
                  gradient="linear-gradient(135deg, #f97316 0%, #ea580c 100%)" 
                  glow="rgba(249, 115, 22, 0.45)" 
                />
                Sanskrit Hub Settings
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin/sanskrit-settings/subhashitas" className={`${pathname.includes('/sanskrit-settings/subhashitas') ? 'active' : ''} sublink`}>
                <RealisticBadge 
                  icon={Flame} 
                  gradient="linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)" 
                  glow="rgba(245, 158, 11, 0.45)" 
                  size={12}
                />
                Manage Subhashitas
              </Link>
            )}
          </>
        )}

        {/* -- AI MARKETING MATRIX -- */}
        {isAdmin && (
          <>
            <div className="sidebar-category-label" style={{ color: '#4ade80' }}>AI Marketing Engine</div>
            <Link href="/admin/ai-marketing" className={pathname.includes('/ai-marketing') ? 'active' : ''}>
              <RealisticBadge 
                icon={Sparkles} 
                gradient="linear-gradient(135deg, #4ade80 0%, #059669 100%)" 
                glow="rgba(74, 222, 128, 0.4)" 
              />
              Auto-Blog Generator
            </Link>
          </>
        )}

        {/* -- SECURITY MATRIX -- */}
        {isAdmin && (
          <>
            <div className="sidebar-category-label" style={{ color: '#ff4d4f' }}>Security Engine</div>
            <Link href="/admin/security" className={pathname.includes('/security') ? 'active' : ''}>
              <RealisticBadge 
                icon={Shield} 
                gradient="linear-gradient(135deg, #ef4444 0%, #991b1b 100%)" 
                glow="rgba(239, 68, 68, 0.45)" 
              />
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
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ← Back to Website
        </Link>
        <button onClick={() => setShowLogoutModal(true)} className="back-to-website-btn" style={{ 
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
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}>
          <RealisticBadge 
            icon={LogOut} 
            gradient="linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)" 
            glow="rgba(239, 68, 68, 0.4)" 
            size={13}
          />
          Logout Session
        </button>
      </nav>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Admin Logout"
        description="Are you sure you want to end your Vyoma Admin session?"
        onConfirm={async () => {
          setShowLogoutModal(false);
          const { logoutAdmin } = await import('@/app/actions/admin-auth');
          await logoutAdmin();
          window.location.href = '/admin/login';
        }}
      />
    </aside>
  );
}
