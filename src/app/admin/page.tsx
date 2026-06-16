import prisma from '@/lib/prisma';
import Link from 'next/link';

export default async function AdminDashboard() {
  // 1. Exhaustive Analytical Pipelines targeting financial and retention vectors
  const [
    totalUsers, 
    premiumUsers, 
    totalCourses, 
    recentTransactions, 
    topEngaged, 
    viewStats,
    revenueStats,
    latestUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: { in: ['GOLD', 'PLATINUM'] } } }),
    prisma.course.count(),
    prisma.purchase.findMany({ 
      take: 5, 
      orderBy: { createdAt: 'desc' }, 
      include: { user: true, course: true } 
    }),
    prisma.course.findMany({ take: 5, orderBy: { views: 'desc' } }),
    prisma.course.aggregate({ _sum: { views: true } }),
    prisma.purchase.aggregate({ _sum: { amount: true } }),
    prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
  ]);

  // Fetch referral dispatches & matching profiles
  const rewards = await prisma.referralReward.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const rewardUserIds = Array.from(new Set(rewards.map(r => r.userId)));
  const rewardUsers = await prisma.user.findMany({
    where: { id: { in: rewardUserIds } }
  });

  const totalImpressions = viewStats._sum.views || 0;
  const totalRevenue = revenueStats._sum.amount || 0;
  const avgRevenuePerUser = totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : "0";

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Operational Intelligence</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Unified console anchoring cross-platform telemetry, revenue streams, and audience traction.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href="/admin/orders" style={{ background: 'rgba(242,100,34,0.1)', border: '1px solid rgba(242,100,34,0.3)', color: '#f26422', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Financial Orders
          </Link>
          <Link href="/admin/users/import" style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', color: '#ffd700', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            📥 Bulk Import Users
          </Link>
          <Link href="/admin/bundles" style={{ background: 'rgba(70,211,105,0.1)', border: '1px solid rgba(70,211,105,0.3)', color: '#46d369', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Manage Bundles
          </Link>
          <Link href="/admin/courses/new" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Create Content
          </Link>
          <Link href="/admin/layout-settings" style={{ background: 'var(--primary)', color: '#fff', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Manage Layout
          </Link>
        </div>
      </div>

      {/* MACRO PERFORMANCE GRIDS */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* Revenue Spotlight (WooCommerce Priority 1) */}
        <div className="stat-card" style={{ background: 'linear-gradient(145deg, rgba(70,211,105,0.12) 0%, rgba(0,0,0,0) 100%)', border: '1px solid rgba(70,211,105,0.2)', padding: '25px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '5rem', opacity: 0.03 }}>₹</div>
          <div className="stat-title" style={{ color: '#46d369', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Gross Platform Yield</div>
          <div className="stat-value" style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '10px', color: '#fff', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontSize: '1.2rem', color: '#46d369' }}>₹</span>
            {totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '5px', display: 'flex', gap: '10px' }}>
             <span>Avg/User: ₹{avgRevenuePerUser}</span>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '16px' }}>
          <div className="stat-title" style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Active Audience</div>
          <div className="stat-value" style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '10px', color: '#fff' }}>{totalUsers}</div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
            <span style={{ color: '#f26422', fontWeight: 'bold' }}>{premiumUsers}</span> Premium Subscriptions
          </div>
        </div>
        
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '16px' }}>
          <div className="stat-title" style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Engagement</div>
          <div className="stat-value" style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '10px', color: '#38bdf8' }}>{totalImpressions}</div>
          <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>Total Curriculum Node Impressions</div>
        </div>

        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', borderRadius: '16px' }}>
          <div className="stat-title" style={{ color: '#aaa', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Library Density</div>
          <div className="stat-value" style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '10px', color: '#fff' }}>{totalCourses}</div>
          <div style={{ fontSize: '0.8rem', color: '#46d369', marginTop: '5px' }}>● Serving Assets via Global CDN</div>
        </div>

      </div>

      {/* SECOND ROW OF ANALYTICS - DEEP TABLES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px' }}>
        
        {/* 1. Content Intelligence Performance Leaderboard */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
               <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>📈 Asset Impact Analytics</h2>
               <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>Curriculums ordered by raw visual extraction rate.</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {topEngaged.map((course: any, index: number) => {
              const percentage = totalImpressions > 0 ? Math.floor((course.views / totalImpressions) * 100) : 0;
              return (
                <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900, color: index < 3 ? '#f26422' : '#444' }}>{index+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#eee', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                       <span>{course.title}</span>
                       <span style={{ fontSize: '0.75rem', color: '#555' }}>{percentage}% density</span>
                    </div>
                    <div style={{ height: '6px', background: '#111', borderRadius: '3px', position: 'relative', width: '100%' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'linear-gradient(90deg, #f26422, #ff8c52)', borderRadius: '3px', width: `${Math.max(3, percentage)}%` }}></div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '60px' }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{course.views}</div>
                    <div style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase' }}>impacts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. LIVE TRANSACTION STREAM */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', background: '#46d369', borderRadius: '50%', boxShadow: '0 0 8px #46d369' }}></div>
            Live Financial Conduit
          </h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '15px 0', color: '#555', fontSize: '0.75rem', textTransform: 'uppercase' }}>Entity</th>
                <th style={{ padding: '15px 0', color: '#555', fontSize: '0.75rem', textTransform: 'uppercase' }}>Volume</th>
                <th style={{ padding: '15px 0', color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Asset</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#555', fontSize: '0.9rem' }}>No financial events buffered in memory stream.</td>
                </tr>
              ) : (
                recentTransactions.map((tx: any) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '15px 0' }}>
                       <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>{tx.user?.email?.split('@')[0]}</div>
                       <div style={{ fontSize: '0.7rem', color: '#666' }}>{new Date(tx.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td style={{ padding: '15px 0' }}>
                       <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#46d369' }}>₹{tx.amount}</div>
                    </td>
                    <td style={{ padding: '15px 0', textAlign: 'right' }}>
                       <Link href={`/admin/users/${tx.userId}`} style={{ color: '#888', fontSize: '0.75rem', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', padding: '5px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          Analyze Recipient
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 🎁 REFERRAL MILESTONES & GIFT DELIVERY CONSOLE */}
      <div style={{ marginTop: '35px', backgroundColor: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,215,0,0.15)', marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffd700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🎁</span> Referral Milestone Delivery Panel
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666' }}>
              Track referral achievements (50, 100, 150 tiers) and fulfill gift dispatch notifications.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,215,0,0.1)', color: '#ffd700', padding: '4px 10px', borderRadius: '30px', fontWeight: 'bold', border: '1px solid rgba(255,215,0,0.2)' }}>
            {rewards.filter(r => r.status === 'PENDING').length} Dispatches Pending
          </span>
        </div>

        {rewards.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#555', fontSize: '0.9rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            No referral milestone rewards earned yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rewards.map(reward => {
              const u = rewardUsers.find(user => user.id === reward.userId);
              const isPending = reward.status === 'PENDING';
              return (
                <div 
                  key={reward.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: isPending ? 'rgba(255, 215, 0, 0.03)' : 'rgba(255, 255, 255, 0.01)', 
                    border: isPending ? '1px solid rgba(255, 215, 0, 0.15)' : '1px solid rgba(255,255,255,0.03)',
                    padding: '16px 20px', 
                    borderRadius: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                        {u?.name || u?.email?.split('@')[0] || 'Anonymous'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>
                        ({u?.email})
                      </span>
                      <span style={{ fontSize: '0.7rem', background: '#ffd700', color: '#000', padding: '2px 8px', borderRadius: '4px', fontWeight: 900 }}>
                        {reward.referralCount} REFERRALS REACHED!
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffd700' }}>
                      Reward: {reward.rewardName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                      Earned on {new Date(reward.createdAt).toLocaleDateString()} at {new Date(reward.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div>
                    {isPending ? (
                      <form action={async () => {
                        "use server";
                        const { fulfillReward } = await import('@/app/actions/referrals');
                        await fulfillReward(reward.id);
                      }}>
                        <button 
                          type="submit"
                          style={{
                            background: '#ffd700',
                            color: '#000',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 15px rgba(255,215,0,0.2)'
                          }}
                        >
                          🚚 MARK AS DELIVERED
                        </button>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#46d369', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <span>✅</span> Delivered
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* THIRD ROW: RECENTLY ACQUIRED USERS TRAJECTORY */}
      <div style={{ marginTop: '25px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
         <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '15px' }}>Recently Propagated Profiles</h3>
         <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {latestUsers.map(u => (
              <div key={u.id} style={{ background: '#111', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 200px' }}>
                 <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: u.plan === 'FREE' ? '#444' : '#f26422' }}></div>
                 <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{u.email}</div>
                    <div style={{ fontSize: '0.7rem', color: '#555' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                 </div>
              </div>
            ))}
         </div>
      </div>

    </div>
  );
}
