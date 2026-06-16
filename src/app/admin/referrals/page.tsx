import prisma from '@/lib/prisma';
import Link from 'next/link';
import ReferralTierManager from './ReferralTierManager';
import { toggleRewardStatusAction } from './actions';

export default async function ReferralPanelPage() {
  // 1. Auto-seed default tiers if empty
  const tiersCount = await prisma.referralTier.count();
  if (tiersCount === 0) {
    const defaultTiers = [
      { referralsRequired: 50, rewardName: 'Vyoma Diaries' },
      { referralsRequired: 100, rewardName: '200rs Voucher for product purchase in digitalsanskritguru.com' },
      { referralsRequired: 150, rewardName: 'Vyoma T-shirt as reward' },
      { referralsRequired: 200, rewardName: 'Sanskrit Copper Water Bottle' },
      { referralsRequired: 250, rewardName: 'Vyoma Premium Leather Satchel' },
      { referralsRequired: 500, rewardName: 'Lifetime Free Gold Access Voucher' }
    ];
    for (const t of defaultTiers) {
      await prisma.referralTier.create({ data: t });
    }
  }

  // Fetch all tiers
  const tiers = await prisma.referralTier.findMany({
    orderBy: { referralsRequired: 'asc' }
  });

  // Fetch all earned referral rewards with user details
  const rewards = await prisma.referralReward.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Fetch all user accounts to match IDs
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true }
  });

  const userMap = new Map(users.map(u => [u.id, u]));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🤝</span> Referral Milestones & Deliveries
          </h1>
          <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
            Manage dynamic rewards tiers and audit delivery fulfillment for user referral achievements.
          </p>
        </div>
        <Link href="/admin" style={{ background: 'rgba(255,255,255,0.05)', color: '#bbb', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)' }}>
          ← Back
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: INTERACTIVE TIER MANAGER */}
        <ReferralTierManager tiers={tiers} />

        {/* RIGHT COLUMN: REWARD DELIVERIES AUDIT */}
        <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '30px', borderRadius: '20px', minHeight: '500px' }}>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>📦 Milestone Deliveries Fulfillment</h3>
          <p style={{ margin: '0 0 25px 0', fontSize: '0.85rem', color: '#666' }}>
            Fulfill and ship pending user milestones. Click on the status badges to toggle fulfillment state.
          </p>

          {rewards.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#555' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '15px' }}>📭</span>
              No users have achieved any referral milestones yet. Share campaign codes to start tracking!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1c1c24', color: '#aaa', fontWeight: 800 }}>
                    <th style={{ padding: '12px 8px' }}>User Details</th>
                    <th style={{ padding: '12px 8px' }}>Milestone Reached</th>
                    <th style={{ padding: '12px 8px' }}>Gifts Earned</th>
                    <th style={{ padding: '12px 8px' }}>Earned Date</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map(r => {
                    const u = userMap.get(r.userId);
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1c1c24', color: '#fff' }}>
                        <td style={{ padding: '15px 8px' }}>
                          <div style={{ fontWeight: 'bold' }}>{u?.name || 'Unknown User'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{u?.email || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '15px 8px', fontWeight: 'bold', color: '#ff8a50' }}>
                          🏆 {r.referralCount} Ref
                        </td>
                        <td style={{ padding: '15px 8px', color: '#ccc' }}>
                          {r.rewardName}
                        </td>
                        <td style={{ padding: '15px 8px', color: '#666' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '15px 8px', textAlign: 'center' }}>
                          <form action={async () => { "use server"; await toggleRewardStatusAction(r.id, r.status); }}>
                            <button type="submit" style={{
                              background: r.status === "PENDING" ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                              border: `1px solid ${r.status === "PENDING" ? '#ef4444' : '#22c55e'}`,
                              color: r.status === "PENDING" ? '#ef4444' : '#22c55e',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'inline-block'
                            }}>
                              {r.status === "PENDING" ? '⏳ PENDING' : '🟢 DELIVERED'}
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
