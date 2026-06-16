import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AdminSidebar from './components/AdminSidebar';
import '../globals.css';

/**
 * Advanced Production-Grade Administrative Gatekeeper.
 * Operates entirely Server-Side to prevent layout leaking or client-side spoofing.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Retrieve absolute target pathname forwarded from Next.js Middleware
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '/admin';

  // 2. Isolate the administrative login screen from enforcement layers
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 3. Execute Secure Session Audit & DB Identity Validation
  const user = await getCurrentUser();

  // 4. Block all non-elevated or unauthenticated access vectors instantly
  const ACCEPTED_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE'];
  if (!user || !ACCEPTED_ROLES.includes(user.role)) {
    redirect('/admin/login');
  }

  // 5. Enforce strict server-side RBAC routing path guards
  const role = user.role;
  const isSuperOrAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  if (!isSuperOrAdmin) {
    if (role === 'MANAGER') {
      // Managers CANNOT touch Identity or Financial layers, except user import
      const forbidden = ['/users', '/reports', '/subscriptions', '/vouchers', '/invoices', '/orders'];
      if (forbidden.some(route => pathname.includes(route) && !pathname.includes('/users/import'))) {
        redirect('/admin?error=AccessDeniedContentOnly');
      }
    } else if (role === 'FINANCE') {
      // Finance CANNOT touch Curriculum, Layouts, or Identity
      const forbidden = ['/courses', '/episodes', '/pages', '/layout-settings', '/navigation', '/users', '/bundles', '/sponsors'];
      if (forbidden.some(route => pathname.includes(route))) {
        redirect('/admin?error=AccessDeniedFinanceOnly');
      }
    }
  }

  // 6. Render hyper-secure Dashboard Shell
  return (
    <div className="admin-layout">
      {/* Client Sidebar dynamically highlights active modules */}
      <AdminSidebar userRole={user.role} />
      
      <main className="admin-content">
        {/* Admin Context Banner (Optional helper info) */}
        <div className="admin-context-banner">
          <span>🌐 Operational Context: <strong>Production Master</strong></span>
          <span>Active Session: <strong style={{color: 'var(--primary)'}}>{user.email}</strong></span>
        </div>

        {children}
      </main>
    </div>
  );
}
