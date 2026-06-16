import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DeleteUserButton from '@/app/admin/components/DeleteUserButton';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const userId = unwrappedParams.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      purchases: {
        include: {
          course: true
        },
        orderBy: { createdAt: 'desc' }
      },
      bundlePurchases: {
        include: {
          bundle: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) return notFound();

  // Normalize course and bundle purchases into a unified ledger list
  const normalizedPurchases = [
    ...user.purchases.map(p => ({
      id: p.id,
      createdAt: p.createdAt,
      title: p.course.title,
      type: 'COURSE',
      category: p.course.category || 'Sanskrit Course',
      amount: p.amount || 0,
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId
    })),
    ...user.bundlePurchases.map(bp => ({
      id: bp.id,
      createdAt: bp.createdAt,
      title: bp.bundle.title,
      type: 'BUNDLE',
      category: 'Curricular Bundle',
      amount: bp.amount || 0,
      razorpayOrderId: bp.razorpayOrderId,
      razorpayPaymentId: bp.razorpayPaymentId
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalSpent = normalizedPurchases.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div style={{ paddingBottom: '100px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/users" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>
          ← Back to Users List
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Customer Profile: {user.name || user.email}</h1>
          <div style={{ color: '#888', marginTop: '5px' }}>ID: <span style={{ fontFamily: 'monospace', color: '#fff' }}>{user.id}</span> | Registered: {user.createdAt.toLocaleDateString()}</div>
        </div>
        <div style={{ background: 'rgba(70, 211, 105, 0.1)', border: '1px solid #46d369', color: '#46d369', padding: '15px 25px', borderRadius: '8px', textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Lifetime Revenue</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>₹{totalSpent.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
        {/* Left: Orders & Checkout History */}
        <div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '25px' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', fontWeight: 'bold', fontSize: '1.1rem' }}>
              🛒 E-Commerce Order History (WooCommerce Style)
            </div>
            <div style={{ padding: '0' }}>
              {normalizedPurchases.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No checkout orders found for this user.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left', color: '#aaa' }}>
                      <th style={{ padding: '12px 20px' }}>Order Date</th>
                      <th style={{ padding: '12px 20px' }}>Purchased Item</th>
                      <th style={{ padding: '12px 20px' }}>Payment IDs</th>
                      <th style={{ padding: '12px 20px' }}>Amount</th>
                      <th style={{ padding: '12px 20px', textAlign: 'center' }}>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedPurchases.map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '15px 20px' }}>{p.createdAt.toLocaleDateString()}</td>
                        <td style={{ padding: '15px 20px' }}>
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>{p.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#777' }}>
                            Category: {p.category} | <span style={{ background: '#222', padding: '1px 5px', borderRadius: '3px', color: 'var(--primary, #f26422)', fontSize: '0.7rem' }}>{p.type}</span>
                          </div>
                        </td>
                        <td style={{ padding: '15px 20px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          <div>ORD: {p.razorpayOrderId || 'N/A'}</div>
                          <div>PAY: {p.razorpayPaymentId || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#46d369' }}>
                          ₹{p.amount.toFixed(2)}
                        </td>
                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                           <Link href={`/admin/invoices/${p.id}`} target="_blank" style={{ display: 'inline-block', background: 'rgba(70, 211, 105, 0.1)', border: '1px solid rgba(70, 211, 105, 0.2)', color: '#46d369', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none' }}>
                             📄 View Invoice
                           </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: WooCommerce Feature Overlays */}
        <div>
          {/* Subscription Block */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', marginBottom: '25px' }}>
            <div style={{ padding: '20px', background: 'rgba(242, 100, 34, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
              💎 Active Subscription (Read-Only)
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Tier</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                  <span style={{ background: user.plan === 'PLATINUM' ? '#e50914' : (user.plan === 'GOLD' ? '#f26422' : '#444'), padding: '5px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {user.plan}
                  </span>
                  {user.planInterval && <span style={{ color: '#aaa' }}>({user.planInterval} Billing)</span>}
                </div>
                {user.plan !== 'FREE' && (
                  <div style={{ marginTop: '12px' }}>
                     <Link href={`/admin/invoices/virtual/${user.id}`} style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', padding: '6px 15px', borderRadius: '6px', textDecoration: 'none' }}>
                       📄 View/Download Subscription Invoice →
                     </Link>
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Razorpay Subscription ID</label>
                <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>{user.razorpaySubscriptionId || 'No active Gateway link'}</div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '6px', fontSize: '0.8rem', color: '#aaa' }}>
                <div style={{ marginBottom: '10px', color: '#ccc', fontWeight: 'bold' }}>🛠️ Force Administrative Override</div>
                <p style={{ marginBottom: '10px', fontSize: '0.7rem' }}>Manually forcing updates triggers transactional simulation emails (Welcome, Success, Cancellation) confirming SMTP viability.</p>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                   <form action={async () => { "use server"; const { adminUpdateUserPlan } = await import('@/app/actions/plans'); await adminUpdateUserPlan(userId, 'GOLD'); }}>
                     <button type="submit" style={{ background: '#f26422', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>+ GOLD</button>
                   </form>
                   <form action={async () => { "use server"; const { adminUpdateUserPlan } = await import('@/app/actions/plans'); await adminUpdateUserPlan(userId, 'PLATINUM'); }}>
                     <button type="submit" style={{ background: '#e50914', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>+ PLAT</button>
                   </form>
                   <form action={async () => { "use server"; const { adminUpdateUserPlan } = await import('@/app/actions/plans'); await adminUpdateUserPlan(userId, 'FREE'); }}>
                     <button type="submit" style={{ background: '#222', border: '1px solid #444', color: '#888', padding: '5px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>RESET</button>
                   </form>
                </div>
              </div>
            </div>
          </div>

          {/* 🔐 Advanced Role & Access Configuration (RBAC) */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(242, 100, 34, 0.2)', borderRadius: '12px', overflow: 'hidden', marginBottom: '25px' }}>
            <div style={{ padding: '20px', background: 'rgba(242, 100, 34, 0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔐 RBAC Internal Permissions</span>
            </div>
            <div style={{ padding: '20px' }}>
               <div style={{ marginBottom: '15px' }}>
                 <label style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Designation</label>
                 <div style={{ marginTop: '5px' }}>
                    <span style={{ 
                       background: user.role.includes('ADMIN') ? '#e50914' : (user.role === 'USER' ? '#333' : '#f26422'), 
                       padding: '6px 15px', borderRadius: '30px', fontWeight: 800, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                       🛡️ {user.role}
                    </span>
                 </div>
               </div>

               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Escalate / Mutate Authority</label>
                  
                  <form action={async (formData: FormData) => {
                    "use server";
                    const targetRole = formData.get('newRole') as string;
                    const { adminUpdateUserRole } = await import('@/app/actions/users');
                    await adminUpdateUserRole(userId, targetRole);
                  }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <select name="newRole" defaultValue={user.role} style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px', fontWeight: 700 }}>
                        <option value="USER">🧑‍🎓 USER (Standard Learner)</option>
                        <option value="FINANCE">💰 FINANCE (Fiscal Reports & Invoices)</option>
                        <option value="MANAGER">📝 MANAGER (Content Editor & Courses)</option>
                        <option value="ADMIN">🎖️ ADMIN (General Administrator)</option>
                        <option value="SUPER_ADMIN">👑 SUPER_ADMIN (All Capabilities)</option>
                     </select>
                     
                     <button type="submit" style={{ background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(242,100,34,0.2)' }}>
                        COMMIT DESIGATIONS
                     </button>
                  </form>
               </div>
               
               <p style={{ fontSize: '0.65rem', color: '#666', marginTop: '10px', lineHeight: '1.3' }}>
                 ⚠️ Designation adjustments instantly restructure the target user's navigation visibility and database access privileges upon their next layout render.
               </p>
            </div>
          </div>

          {/* Billing General Address block mirroring WC */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
             <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
              📍 Billing Address & Meta
            </div>
            <div style={{ padding: '20px', lineHeight: '1.6' }}>
               <div style={{ marginBottom: '15px' }}>
                 <label style={{ fontSize: '0.75rem', color: '#888' }}>Email Addr</label>
                 <div>{user.email}</div>
               </div>
               <div>
                 <label style={{ fontSize: '0.75rem', color: '#888' }}>Static Billing Details</label>
                 {user.address ? (
                   <div style={{ marginTop: '5px' }}>
                     {user.address}<br/>
                     {user.city}, {user.state} {user.zipCode}<br/>
                     <strong>{user.country === 'IN' ? 'India' : user.country}</strong>
                   </div>
                 ) : (
                   <div style={{ fontStyle: 'italic', color: '#666', marginTop: '5px' }}>No static address on profile file.</div>
                 )}
               </div>
            </div>
          </div>

          {/* 💥 DANGER ZONE: Account Revocation & Erasure */}
          <div style={{ 
            marginTop: '25px',
            background: 'var(--card-bg)', 
            border: '1px solid rgba(255, 77, 79, 0.3)', 
            borderRadius: '12px', 
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(255,77,79,0.05)'
          }}>
             <div style={{ 
               padding: '15px 20px', 
               background: 'rgba(255, 77, 79, 0.08)', 
               borderBottom: '1px solid rgba(255, 77, 79, 0.1)', 
               fontWeight: 900,
               color: '#ff4d4f',
               fontSize: '0.85rem',
               letterSpacing: '1px',
               textTransform: 'uppercase'
             }}>
              ☢️ High Severity Danger Zone
            </div>
            <div style={{ padding: '20px' }}>
               <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '15px', lineHeight: '1.4' }}>
                 Purging user accounts from the production mainframe removes all active subscriptions, course metrics, watch telemetry, certificates, and access. This cannot be undone.
               </p>
               
               {/* Master Two-Stage Confirmation Control */}
               <DeleteUserButton 
                 userId={userId}
                 userEmail={user.email} 
               />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
