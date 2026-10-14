"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SignupTrend {
  month: string;
  count: number;
}

interface CourseViews {
  title: string;
  views: number;
  category: string | null;
}

interface CourseWatch {
  title: string;
  hours: number;
  rawSeconds: number;
}

interface RatingCounts {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface PlanSummary {
  free: number;
  goldMonthly: number;
  goldYearly: number;
  platinumMonthly: number;
  platinumYearly: number;
}

export interface TimeframeRow {
  period: string;
  free: number;
  goldMonthly: number;
  goldYearly: number;
  platinumMonthly: number;
  platinumYearly: number;
  total: number;
}

export interface TimeframeAnalytics {
  daily: TimeframeRow[];
  weekly: TimeframeRow[];
  monthly: TimeframeRow[];
  yearly: TimeframeRow[];
}

export interface RegionalAnalytics {
  localUsersCount: number;
  intlUsersCount: number;
  localPlanDist: { free: number; goldMonthly: number; goldYearly: number; platinumMonthly: number; platinumYearly: number; totalPaid: number };
  intlPlanDist: { free: number; goldMonthly: number; goldYearly: number; platinumMonthly: number; platinumYearly: number; totalPaid: number };
  topCountries: Array<{ code: string; name: string; count: number; pct: string }>;
}

export interface SubscriptionTelemetry {
  upgradeTransitions: { [path: string]: number };
  upgradeEventsList: Array<{ id: string; path: string; from: string; to: string; email: string; country: string; date: string }>;
  totalUpgrades: number;
  accountCancellationsCount: number;
  accountCancellationsList: Array<{ id: string; email: string; plan: string; country: string; date: string }>;
  subCancellationsCount: number;
  subCancellationTiers: { [tier: string]: number };
  subCancellationsList: Array<{ id: string; email: string; plan: string; reason: string; date: string }>;
  paymentFailuresCount: number;
  failureReasons: { [reason: string]: number };
  paymentFailuresList: Array<{ id: string; email: string; plan: string; error: string; amount: number; date: string }>;
  autoRenewalsCount: number;
  autoRenewalsByDate: { [date: string]: number };
  autoRenewalsList: Array<{ id: string; email: string; plan: string; interval: string; amount: number; date: string }>;
  upcomingRenewals: Array<{ userId: string; email: string; plan: string; interval: string; nextRenewalDate: string; country: string }>;
}

export interface GiftItem {
  id: string;
  code: string;
  plan: string;
  months: number;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  relationship: string;
  occasion: string;
  personalMessage: string;
  amount: number;
  currency: string;
  isRedeemed: boolean;
  redeemedBy: { name?: string; email?: string; date?: string | null } | null;
  createdAt: string;
}

export interface OfflineDownloadRecord {
  id: string;
  email: string;
  name: string;
  plan: string;
  courseTitle: string;
  episodeTitle: string;
  ip: string;
  date: string;
}

export interface GiftAnalytics {
  totalGiftsCount: number;
  totalGiftRevenue: number;
  redeemedGiftsCount: number;
  pendingGiftsCount: number;
  redemptionRate: string;
  goldGiftsCount: number;
  platinumGiftsCount: number;
  giftLedger: GiftItem[];
}

interface AnalyticsClientPageProps {
  totalUsersCount: number;
  totalReferrals: number;
  totalQuizAttempts: number;
  totalCertificates: number;
  signupTrendData: SignupTrend[];
  topSeenCourses: CourseViews[];
  topWatchCourses: CourseWatch[];
  totalHoursOverall: string;
  avgRating: string;
  totalReviews: number;
  ratingCounts: RatingCounts;
  selectedType: string;
  planSummary: PlanSummary;
  timeframeAnalytics: TimeframeAnalytics;
  regionalAnalytics: RegionalAnalytics;
  subscriptionTelemetry: SubscriptionTelemetry;
  giftAnalytics: GiftAnalytics;
  offlineDownloads?: OfflineDownloadRecord[];
}

export default function AnalyticsClientPage({
  totalUsersCount,
  totalReferrals,
  totalQuizAttempts,
  totalCertificates,
  signupTrendData,
  topSeenCourses,
  topWatchCourses,
  totalHoursOverall,
  avgRating,
  totalReviews,
  ratingCounts,
  selectedType,
  planSummary,
  timeframeAnalytics,
  regionalAnalytics,
  subscriptionTelemetry,
  giftAnalytics,
  offlineDownloads = [],
}: AnalyticsClientPageProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'overview' | 'upgrades' | 'renewals' | 'churn_failures' | 'gifts' | 'downloads'>('overview');
  const [timeframeTab, setTimeframeTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [giftSearch, setGiftSearch] = useState('');
  const [giftStatusFilter, setGiftStatusFilter] = useState<'ALL' | 'REDEEMED' | 'PENDING'>('ALL');
  const [downloadSearch, setDownloadSearch] = useState('');

  
  // SVG Chart Dimensions & Computations
  // A. Signup Trend Line SVG (width: 500, height: 200)
  const maxSignups = Math.max(...signupTrendData.map(d => d.count), 5);
  const points = signupTrendData.map((d, index) => {
    const x = 50 + index * 80;
    const y = 170 - (d.count / maxSignups) * 120;
    return `${x},${y}`;
  }).join(' ');

  // B. Rating Distribution Doughnut Chart (radius: 50, center: 70, 70)
  let cumulativePercent = 0;
  const ratingColors = ['#46d369', '#22c55e', '#ffd700', '#f26422', '#e50914'];
  const doughnutSegments = [5, 4, 3, 2, 1].map((star, idx) => {
    const count = ratingCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : idx === 0 ? 100 : 0;
    const startAngle = (cumulativePercent / 100) * 360;
    cumulativePercent += pct;
    const endAngle = (cumulativePercent / 100) * 360;

    // Convert polar coordinates to Cartesian for SVG path
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
      };
    };

    const start = polarToCartesian(70, 70, 45, startAngle);
    const end = polarToCartesian(70, 70, 45, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    const d = [
      'M', start.x, start.y,
      'A', 45, 45, 0, largeArcFlag, 1, end.x, end.y
    ].join(' ');

    return {
      path: d,
      color: ratingColors[idx],
      percent: pct.toFixed(0),
      star,
      count
    };
  });

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff', paddingBottom: '100px' }}>
      
      {/* Styles for print output and animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .print-card { 
            background: #fff !important; 
            border: 1px solid #ddd !important; 
            box-shadow: none !important; 
            color: #000 !important; 
          }
          .metric-num { color: #000 !important; }
          svg text { fill: #000 !important; }
        }
        .trend-card {
          background: var(--card-bg, #0b121e);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        .trend-card:hover {
          transform: translateY(-4px);
          border-color: rgba(242,100,34,0.25);
        }
        .bar-fill {
          transition: height 0.8s ease;
        }
      `}} />

      {/* HEADER PANEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '35px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <span style={{ background: 'rgba(242, 100, 34, 0.1)', color: '#f26422', border: '1px solid rgba(242, 100, 34, 0.2)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            System Analytics
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '8px' }}>Platform Growth & Engagement Analytics</h1>
          <p style={{ color: '#aaa', marginTop: '4px' }}>Real-time student progress telemetry, course views distribution, sharing trends, and system benchmarks.</p>
          
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#8f98a9', fontWeight: 'bold' }}>Format Filter:</span>
            <select
              value={selectedType}
              onChange={(e) => router.push(`/admin/analytics?type=${e.target.value}`)}
              style={{
                background: 'rgba(15, 22, 36, 0.85)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                padding: '6px 12px',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                minWidth: '150px'
              }}
            >
              <option value="ALL">All Formats</option>
              <option value="VIDEO">Videos Only</option>
              <option value="AUDIOBOOK">Audiobooks Only</option>
              <option value="PODCAST">Podcasts Only</option>
              <option value="EBOOK">E-Books Only</option>
              <option value="GAME">Games Only</option>
              <option value="PROGRAM">Programs Only</option>
            </select>
          </div>
        </div>
        
        <div className="no-print" style={{ display: 'flex', gap: '12px' }}>
          <button 
            id="print-btn"
            onClick={() => window.print()}
            style={{ 
              background: '#222', border: '1px solid #333', color: '#fff', padding: '12px 20px', 
              borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            🖨️ Print / Save PDF
          </button>
          <a 
            href={`data:text/csv;charset=utf-8,Category,Metric,Value\nEngagement,Total Users,${totalUsersCount}\nEngagement,Total Watch Hours,${totalHoursOverall}\nGrowth,Referral Shares,${totalReferrals}\nEngagement,Quiz Attempts,${totalQuizAttempts}\nEngagement,Certificates Issued,${totalCertificates}\nEngagement,Average Rating,${avgRating}\n`}
            download="Vyoma_Analytics_Overview.csv"
            style={{ 
              background: 'var(--primary)', color: '#fff', padding: '12px 20px', 
              borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(242,100,34,0.3)'
            }}
          >
            📥 Export CSV Summary
          </a>
        </div>
      </div>

      {/* MAIN NAVIGATION TAB SWITCHER */}
      <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '35px', overflowX: 'auto', paddingBottom: '5px' }}>
        {[
          { id: 'overview', label: '📊 General & Content Engagement' },
          { id: 'upgrades', label: '🚀 Plan Upgrades & Geo Distribution' },
          { id: 'renewals', label: '🔄 Auto-Renewals & Mandates' },
          { id: 'churn_failures', label: '⚠️ Churn, Cancellations & Payment Failures' },
          { id: 'gifts', label: '🎁 Gift Wisdom & Vouchers Ledger' },
          { id: 'downloads', label: `📥 Offline Downloads Audit (${offlineDownloads.length})` },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as any)}
            style={{
              background: activeSection === sec.id ? 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)' : 'rgba(15, 22, 36, 0.85)',
              color: '#fff',
              border: activeSection === sec.id ? '1px solid #f26422' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '12px 22px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: activeSection === sec.id ? '0 6px 20px rgba(242,100,34,0.35)' : 'none',
              transition: 'all 0.25s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: OVERVIEW & CONTENT ENGAGEMENT (Default)                        */}
      {/* ========================================================================= */}
      {activeSection === 'overview' && (
        <>
          {/* CORE KPI CARDS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '45px' }}>
            
            {/* CARD 1: WATCH TIME */}
            <div className="trend-card print-card" style={{ borderLeft: '4px solid #46d369' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Time Spend</div>
              <div className="metric-num" style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#46d369' }}>
                {totalHoursOverall} <span style={{ fontSize: '1rem', color: '#777', fontWeight: 'normal' }}>Hrs</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Across all registered learners</div>
            </div>

            {/* CARD 2: QUIZZES */}
            <div className="trend-card print-card" style={{ borderLeft: '4px solid #ffd700' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quizzes Attended</div>
              <div className="metric-num" style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#ffd700' }}>
                {totalQuizAttempts} <span style={{ fontSize: '1rem', color: '#777', fontWeight: 'normal' }}>Attempts</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Evaluations parsed successfully</div>
            </div>

            {/* CARD 3: REFERRALS */}
            <div className="trend-card print-card" style={{ borderLeft: '4px solid #f26422' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Referral Shares</div>
              <div className="metric-num" style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#f26422' }}>
                {totalReferrals} <span style={{ fontSize: '1rem', color: '#777', fontWeight: 'normal' }}>Invitations</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Social sharing conversions</div>
            </div>

            {/* CARD 4: RATING */}
            <div className="trend-card print-card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg User Rating</div>
              <div className="metric-num" style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#22c55e' }}>
                ★ {avgRating} <span style={{ fontSize: '1rem', color: '#777', fontWeight: 'normal' }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Based on {totalReviews} text reviews</div>
            </div>
          </div>

          {/* SUBSCRIPTION TIER BREAKDOWN SECTION */}
          <div className="trend-card print-card" style={{ marginBottom: '45px', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>💎 Subscription Tier Analytics & Conversion Matrix</h2>
                <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
                  Captured user breakdown across Free, Gold (Monthly/Yearly), and Platinum (Monthly/Yearly) tiers.
                </p>
              </div>
              <a
                href={`data:text/csv;charset=utf-8,Period,Free,Gold Monthly,Gold Yearly,Platinum Monthly,Platinum Yearly,Total\n${(timeframeAnalytics[timeframeTab] || []).map(r => `"${r.period}",${r.free},${r.goldMonthly},${r.goldYearly},${r.platinumMonthly},${r.platinumYearly},${r.total}`).join('\n')}`}
                download={`Subscription_Breakdown_${timeframeTab.toUpperCase()}.csv`}
                style={{
                  background: 'rgba(242, 100, 34, 0.15)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(242, 100, 34, 0.3)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                }}
              >
                📥 Export {timeframeTab.toUpperCase()} CSV
              </a>
            </div>

            {/* TIER TOTALS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
                <div style={{ color: '#888', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>FREE Plan</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '6px', color: '#aaa' }}>{planSummary.free}</div>
              </div>
              <div style={{ background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.2)', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
                <div style={{ color: '#ffd700', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>GOLD Monthly</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '6px', color: '#ffd700' }}>{planSummary.goldMonthly}</div>
              </div>
              <div style={{ background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
                <div style={{ color: '#ffd700', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>GOLD Yearly</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '6px', color: '#ffd700' }}>{planSummary.goldYearly}</div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
                <div style={{ color: '#a855f7', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>PLATINUM Monthly</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '6px', color: '#a855f7' }}>{planSummary.platinumMonthly}</div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
                <div style={{ color: '#a855f7', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>PLATINUM Yearly</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '6px', color: '#a855f7' }}>{planSummary.platinumYearly}</div>
              </div>
            </div>

            {/* TIMEFRAME TABS */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '20px' }}>
              {[
                { id: 'daily', label: '📅 Daily (Day-wise)' },
                { id: 'weekly', label: '🗓️ Weekly (Week-wise)' },
                { id: 'monthly', label: '📆 Monthly (Month-wise)' },
                { id: 'yearly', label: '📊 Yearly (Year-wise)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimeframeTab(tab.id as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                  style={{
                    background: timeframeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: timeframeTab === tab.id ? '#fff' : '#aaa',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TIMEFRAME BREAKDOWN TABLE */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#8f98a9' }}>
                    <th style={{ padding: '10px 12px' }}>Time Period</th>
                    <th style={{ padding: '10px 12px' }}>Free</th>
                    <th style={{ padding: '10px 12px', color: '#ffd700' }}>Gold Monthly</th>
                    <th style={{ padding: '10px 12px', color: '#ffd700' }}>Gold Yearly</th>
                    <th style={{ padding: '10px 12px', color: '#a855f7' }}>Platinum Monthly</th>
                    <th style={{ padding: '10px 12px', color: '#a855f7' }}>Platinum Yearly</th>
                    <th style={{ padding: '10px 12px', fontWeight: 'bold' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(timeframeAnalytics[timeframeTab] || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#555' }}>
                        No subscription events recorded for this timeframe.
                      </td>
                    </tr>
                  ) : (
                    timeframeAnalytics[timeframeTab].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{row.period}</td>
                        <td style={{ padding: '10px 12px', color: '#aaa' }}>{row.free}</td>
                        <td style={{ padding: '10px 12px', color: '#ffd700' }}>{row.goldMonthly}</td>
                        <td style={{ padding: '10px 12px', color: '#ffd700', fontWeight: 'bold' }}>{row.goldYearly}</td>
                        <td style={{ padding: '10px 12px', color: '#a855f7' }}>{row.platinumMonthly}</td>
                        <td style={{ padding: '10px 12px', color: '#a855f7', fontWeight: 'bold' }}>{row.platinumYearly}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 900, color: 'var(--primary)' }}>{row.total}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRAPHIC OVERLAYS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginBottom: '45px', alignItems: 'stretch' }}>
            
            {/* GRAPH 1: MONTHLY REGISTRATION TRENDS */}
            <div className="trend-card print-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>📈 Registration Volume Trends (Last 6 Months)</h3>
                <a 
                  href={`data:text/csv;charset=utf-8,Month,Count\n${signupTrendData.map(d => `"${d.month}",${d.count}`).join('\n')}`} 
                  download="Monthly_Registrations.csv"
                  style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline' }}
                >
                  CSV
                </a>
              </div>

              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px' }}>
                {signupTrendData.length === 0 ? (
                  <div style={{ color: '#555' }}>No registrations recorded yet.</div>
                ) : (
                  <svg width="100%" height="220" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <line x1="50" y1="50" x2="450" y2="50" stroke="#222" strokeDasharray="5,5" />
                    <line x1="50" y1="110" x2="450" y2="110" stroke="#222" strokeDasharray="5,5" />
                    <line x1="50" y1="170" x2="450" y2="170" stroke="#333" />

                    <polyline
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="3.5"
                      points={points}
                      strokeLinecap="round"
                    />

                    {signupTrendData.map((d, index) => {
                      const x = 50 + index * 80;
                      const y = 170 - (d.count / maxSignups) * 120;
                      return (
                        <g key={index}>
                          <circle cx={x} cy={y} r="5" fill="#fff" stroke="var(--primary)" strokeWidth="2" />
                          <text x={x} y={y - 12} fill="#ffd700" fontSize="10" textAnchor="middle" fontWeight="bold">{d.count}</text>
                          <text x={x} y="190" fill="#777" fontSize="10" textAnchor="middle">{d.month}</text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* GRAPH 2: USER RATINGS DISTRIBUTION */}
            <div className="trend-card print-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>★ User Ratings Spread</h3>
                <span style={{ fontSize: '0.75rem', color: '#777' }}>Total: {totalReviews} Reviews</span>
              </div>

              <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="45" fill="none" stroke="#111" strokeWidth="15" />
                    {doughnutSegments.map((seg, idx) => (
                      <path
                        key={idx}
                        d={seg.path}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="15"
                        strokeLinecap="round"
                      />
                    ))}
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900 }}>★{avgRating}</span>
                    <span style={{ fontSize: '0.7rem', color: '#555' }}>Avg Score</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {doughnutSegments.map((seg, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: seg.color }}></span>
                      <span style={{ color: '#aaa', minWidth: '55px' }}>{seg.star} Stars:</span>
                      <strong style={{ color: '#fff' }}>{seg.count}</strong>
                      <span style={{ color: '#555' }}>({seg.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* DOUBLE-DECK COMPARATIVE STATISTICS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'stretch' }}>
            
            {/* TABLE A: TOP SEEN COURSES (BY VISITS) */}
            <div className="trend-card print-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>🎥 Most Viewed Courses</h3>
                <a 
                  href={`data:text/csv;charset=utf-8,Title,Views,Category\n${topSeenCourses.map(c => `"${c.title}",${c.views},"${c.category||'General'}"`).join('\n')}`} 
                  download="Top_Viewed_Courses.csv"
                  style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline' }}
                >
                  CSV
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {topSeenCourses.map((c, index) => (
                  <div key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>Category: {c.category || 'General'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>{c.views.toLocaleString()}</div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>Total Views</div>
                      </div>
                    </div>
                  </div>
                ))}
                {topSeenCourses.length === 0 && (
                  <div style={{ color: '#555', textAlign: 'center', padding: '20px' }}>No viewed course records.</div>
                )}
              </div>
            </div>

            {/* TABLE B: TOP HOURS SPENT COURSES */}
            <div className="trend-card print-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>⏳ Highest Study-Duration Courses</h3>
                <a 
                  href={`data:text/csv;charset=utf-8,Title,WatchHours\n${topWatchCourses.map(c => `"${c.title}",${c.hours}`).join('\n')}`} 
                  download="Top_Watch_Duration_Courses.csv"
                  style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline' }}
                >
                  CSV
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {topWatchCourses.map((c, index) => (
                  <div key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>Active Curriculum Study</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: '#46d369', fontSize: '1.1rem' }}>{c.hours} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#777' }}>Hrs</span></div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>Aggregated Watch</div>
                      </div>
                    </div>
                  </div>
                ))}
                {topWatchCourses.length === 0 && (
                  <div style={{ color: '#555', textAlign: 'center', padding: '20px' }}>No active progress tracks logged yet.</div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PLAN UPGRADES & REGIONAL DISTRIBUTION                         */}
      {/* ========================================================================= */}
      {activeSection === 'upgrades' && (
        <>
          {/* REGIONAL SPLIT & PLAN DISTRIBUTION CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px', marginBottom: '35px' }}>
            
            {/* LOCAL USERS (INDIA) */}
            <div className="trend-card print-card" style={{ borderTop: '4px solid #f26422' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <span style={{ fontSize: '1.3rem' }}>🇮🇳</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '4px 0 0 0' }}>Local Users (India)</h3>
                  <div style={{ fontSize: '0.8rem', color: '#8f98a9' }}>Domestic Accounts (INR Pricing)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f26422' }}>{regionalAnalytics.localUsersCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8f98a9' }}>
                    {((regionalAnalytics.localUsersCount / Math.max(1, totalUsersCount)) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>

              {/* Plan Distribution Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#aaa' }}>Free Tier</span>
                    <strong>{regionalAnalytics.localPlanDist.free.toLocaleString()} ({((regionalAnalytics.localPlanDist.free / Math.max(1, regionalAnalytics.localUsersCount)) * 100).toFixed(1)}%)</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(regionalAnalytics.localPlanDist.free / Math.max(1, regionalAnalytics.localUsersCount)) * 100}%`, height: '100%', background: '#666' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#ffd700' }}>Gold Monthly</span>
                    <strong style={{ color: '#ffd700' }}>{regionalAnalytics.localPlanDist.goldMonthly}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (regionalAnalytics.localPlanDist.goldMonthly / Math.max(1, regionalAnalytics.localUsersCount)) * 1000)}%`, height: '100%', background: '#ffd700' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#ffd700' }}>Gold Yearly</span>
                    <strong style={{ color: '#ffd700' }}>{regionalAnalytics.localPlanDist.goldYearly}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (regionalAnalytics.localPlanDist.goldYearly / Math.max(1, regionalAnalytics.localUsersCount)) * 1000)}%`, height: '100%', background: '#ffae00' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#a855f7' }}>Platinum Monthly</span>
                    <strong style={{ color: '#a855f7' }}>{regionalAnalytics.localPlanDist.platinumMonthly}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (regionalAnalytics.localPlanDist.platinumMonthly / Math.max(1, regionalAnalytics.localUsersCount)) * 1000)}%`, height: '100%', background: '#a855f7' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#a855f7' }}>Platinum Yearly</span>
                    <strong style={{ color: '#a855f7' }}>{regionalAnalytics.localPlanDist.platinumYearly}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (regionalAnalytics.localPlanDist.platinumYearly / Math.max(1, regionalAnalytics.localUsersCount)) * 1000)}%`, height: '100%', background: '#c084fc' }}></div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800 }}>
                  <span style={{ color: '#22c55e' }}>Total Paid Subscribers:</span>
                  <span style={{ color: '#22c55e' }}>{regionalAnalytics.localPlanDist.totalPaid}</span>
                </div>
              </div>
            </div>

            {/* INTERNATIONAL USERS (ABROAD) */}
            <div className="trend-card print-card" style={{ borderTop: '4px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <span style={{ fontSize: '1.3rem' }}>🌍</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '4px 0 0 0' }}>International Users</h3>
                  <div style={{ fontSize: '0.8rem', color: '#8f98a9' }}>Global Accounts (USD Pricing)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6' }}>{regionalAnalytics.intlUsersCount.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8f98a9' }}>
                    {((regionalAnalytics.intlUsersCount / Math.max(1, totalUsersCount)) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>

              {/* Plan Distribution Progress Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#aaa' }}>Free Tier</span>
                    <strong>{regionalAnalytics.intlPlanDist.free.toLocaleString()} ({((regionalAnalytics.intlPlanDist.free / Math.max(1, regionalAnalytics.intlUsersCount)) * 100).toFixed(1)}%)</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(regionalAnalytics.intlPlanDist.free / Math.max(1, regionalAnalytics.intlUsersCount)) * 100}%`, height: '100%', background: '#666' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#ffd700' }}>Gold Monthly</span>
                    <strong style={{ color: '#ffd700' }}>{regionalAnalytics.intlPlanDist.goldMonthly}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (regionalAnalytics.intlPlanDist.goldMonthly / Math.max(1, regionalAnalytics.intlUsersCount)) * 100)}%`, height: '100%', background: '#ffd700' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#ffd700' }}>Gold Yearly</span>
                    <strong style={{ color: '#ffd700' }}>{regionalAnalytics.intlPlanDist.goldYearly}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (regionalAnalytics.intlPlanDist.goldYearly / Math.max(1, regionalAnalytics.intlUsersCount)) * 100)}%`, height: '100%', background: '#ffae00' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#a855f7' }}>Platinum Monthly</span>
                    <strong style={{ color: '#a855f7' }}>{regionalAnalytics.intlPlanDist.platinumMonthly}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (regionalAnalytics.intlPlanDist.platinumMonthly / Math.max(1, regionalAnalytics.intlUsersCount)) * 100)}%`, height: '100%', background: '#a855f7' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                    <span style={{ color: '#a855f7' }}>Platinum Yearly</span>
                    <strong style={{ color: '#a855f7' }}>{regionalAnalytics.intlPlanDist.platinumYearly}</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (regionalAnalytics.intlPlanDist.platinumYearly / Math.max(1, regionalAnalytics.intlUsersCount)) * 100)}%`, height: '100%', background: '#c084fc' }}></div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800 }}>
                  <span style={{ color: '#3b82f6' }}>Total Paid Subscribers:</span>
                  <span style={{ color: '#3b82f6' }}>{regionalAnalytics.intlPlanDist.totalPaid}</span>
                </div>
              </div>
            </div>

            {/* TOP COUNTRY ORIGINS */}
            <div className="trend-card print-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '15px' }}>📍 Top Geographic Origins</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {regionalAnalytics.topCountries.map((c, i) => (
                  <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#f26422', fontWeight: 'bold', fontSize: '0.8rem' }}>#{i + 1}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>({c.code})</span>
                    </div>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{c.count.toLocaleString()}</strong>
                      <span style={{ color: '#888', fontSize: '0.75rem', marginLeft: '6px' }}>({c.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PLAN UPGRADE TRANSITIONS MATRIX */}
          <div className="trend-card print-card" style={{ marginBottom: '35px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>🚀 Plan Upgrade Pathways & Conversions</h3>
                <p style={{ color: '#8f98a9', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Real-time telemetry showing how users move between Free, Gold, and Platinum tiers.
                </p>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                Total Upgrades Tracked: {subscriptionTelemetry.totalUpgrades}
              </div>
            </div>

            {/* UPGRADE PATHWAY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              {[
                { path: 'FREE -> GOLD', label: 'Free to Gold Tier', color: '#ffd700' },
                { path: 'FREE -> PLATINUM', label: 'Free to Platinum Tier', color: '#a855f7' },
                { path: 'GOLD -> PLATINUM', label: 'Gold to Platinum Upgrade', color: '#f26422' },
                { path: 'MONTHLY -> YEARLY', label: 'Monthly to Annual Conversion', color: '#22c55e' },
              ].map((p) => {
                const count = subscriptionTelemetry.upgradeTransitions[p.path] || 0;
                return (
                  <div key={p.path} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 800 }}>{p.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: p.color, margin: '6px 0' }}>{p.path}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{count} <span style={{ fontSize: '0.8rem', color: '#777', fontWeight: 'normal' }}>users</span></div>
                  </div>
                );
              })}
            </div>

            {/* RECENT UPGRADES LEDGER TABLE */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Recent Upgrade Activity Feed
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#8f98a9' }}>
                    <th style={{ padding: '10px' }}>User Email</th>
                    <th style={{ padding: '10px' }}>Transition Pathway</th>
                    <th style={{ padding: '10px' }}>Region</th>
                    <th style={{ padding: '10px' }}>Timestamp</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionTelemetry.upgradeEventsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '25px', textAlign: 'center', color: '#666' }}>
                        No plan upgrade transitions captured yet. Upgrades through the subscription portal will appear here in real-time.
                      </td>
                    </tr>
                  ) : (
                    subscriptionTelemetry.upgradeEventsList.map((ev) => (
                      <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{ev.email}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ background: 'rgba(242,100,34,0.15)', color: '#f26422', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem' }}>
                            {ev.from} → {ev.to}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#aaa' }}>{ev.country}</td>
                        <td style={{ padding: '10px', color: '#777' }}>{ev.date}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#22c55e', fontWeight: 'bold' }}>✓ Completed</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: AUTO-RENEWALS & MANDATE OPERATIONS                             */}
      {/* ========================================================================= */}
      {activeSection === 'renewals' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '35px' }}>
            <div className="trend-card print-card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Auto-Renewals</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#22c55e' }}>
                {subscriptionTelemetry.autoRenewalsCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Successful automated mandate debits</div>
            </div>

            <div className="trend-card print-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Upcoming 30-Day Renewals</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#3b82f6' }}>
                {subscriptionTelemetry.upcomingRenewals.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Scheduled AutoPay cycles next 30 days</div>
            </div>

            <div className="trend-card print-card" style={{ borderLeft: '4px solid #ffd700' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Active Mandates in Database</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#ffd700' }}>
                {regionalAnalytics.localPlanDist.totalPaid + regionalAnalytics.intlPlanDist.totalPaid}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Razorpay linked subscription tokens</div>
            </div>
          </div>

          {/* UPCOMING SCHEDULED AUTO-RENEWALS TABLE */}
          <div className="trend-card print-card" style={{ marginBottom: '35px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>📅 Scheduled Mandate Renewals (Next 30 Days)</h3>
                <p style={{ color: '#8f98a9', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Forecast of active subscriber accounts reaching their auto-debit anniversary date.</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#8f98a9' }}>
                    <th style={{ padding: '10px' }}>Subscriber Email</th>
                    <th style={{ padding: '10px' }}>Current Plan</th>
                    <th style={{ padding: '10px' }}>Billing Cycle</th>
                    <th style={{ padding: '10px' }}>Country</th>
                    <th style={{ padding: '10px', textAlign: 'right', color: '#3b82f6' }}>Next Renewal Date</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionTelemetry.upcomingRenewals.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '25px', textAlign: 'center', color: '#666' }}>
                        No subscribers with active renewal dates falling in the next 30 days.
                      </td>
                    </tr>
                  ) : (
                    subscriptionTelemetry.upcomingRenewals.map((r, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{r.email}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ color: r.plan === 'PLATINUM' ? '#a855f7' : '#ffd700', fontWeight: 'bold' }}>{r.plan}</span>
                        </td>
                        <td style={{ padding: '10px', color: '#aaa' }}>{r.interval}</td>
                        <td style={{ padding: '10px', color: '#888' }}>{r.country}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#3b82f6' }}>{r.nextRenewalDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AUTO-RENEWAL TRANSACTIONS LOG */}
          <div className="trend-card print-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '15px' }}>⚡ Executed Auto-Renewal History (Razorpay Webhook Events)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#8f98a9' }}>
                    <th style={{ padding: '10px' }}>Subscriber Email</th>
                    <th style={{ padding: '10px' }}>Renewed Tier</th>
                    <th style={{ padding: '10px' }}>Interval</th>
                    <th style={{ padding: '10px' }}>Amount Debited</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Executed On</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionTelemetry.autoRenewalsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '25px', textAlign: 'center', color: '#666' }}>
                        No automated renewals captured yet. Razorpay webhook events will populate this ledger upon recurring billing execution.
                      </td>
                    </tr>
                  ) : (
                    subscriptionTelemetry.autoRenewalsList.map((ar) => (
                      <tr key={ar.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{ar.email}</td>
                        <td style={{ padding: '10px', color: '#ffd700', fontWeight: 'bold' }}>{ar.plan}</td>
                        <td style={{ padding: '10px', color: '#aaa' }}>{ar.interval}</td>
                        <td style={{ padding: '10px', color: '#22c55e', fontWeight: 800 }}>{ar.amount > 0 ? `₹${ar.amount}` : 'Mandate Charge'}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#777' }}>{ar.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: CHURN, CANCELLATIONS & PAYMENT FAILURES                        */}
      {/* ========================================================================= */}
      {activeSection === 'churn_failures' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '35px' }}>
            
            {/* ACCOUNT CANCELLATIONS */}
            <div className="trend-card print-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Accounts Cancelled / Deleted</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#ef4444' }}>
                {subscriptionTelemetry.accountCancellationsCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Total user identities completely erased</div>
            </div>

            {/* SUBSCRIPTION CANCELLATIONS */}
            <div className="trend-card print-card" style={{ borderLeft: '4px solid #f97316' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Subscriptions Cancelled (Churn)</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#f97316' }}>
                {subscriptionTelemetry.subCancellationsCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>
                Gold: {subscriptionTelemetry.subCancellationTiers.GOLD || 0} | Platinum: {subscriptionTelemetry.subCancellationTiers.PLATINUM || 0}
              </div>
            </div>

            {/* FAILED SUBSCRIPTION PAYMENTS */}
            <div className="trend-card print-card" style={{ borderLeft: '4px solid #eab308' }}>
              <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Failed Payment Charges</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#eab308' }}>
                {subscriptionTelemetry.paymentFailuresCount}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Mandate / Recurring debit failures</div>
            </div>

          </div>

          {/* DUAL DECK: SUBSCRIPTION CANCELLATIONS & PAYMENT FAILURES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '35px', alignItems: 'stretch' }}>
            
            {/* TABLE 1: SUBSCRIPTION CANCELLATIONS LOG */}
            <div className="trend-card print-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '15px', color: '#f97316' }}>
                📉 Subscription Churn & Cancellations
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#8f98a9' }}>
                      <th style={{ padding: '8px' }}>User</th>
                      <th style={{ padding: '8px' }}>Previous Tier</th>
                      <th style={{ padding: '8px' }}>Reason</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionTelemetry.subCancellationsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          No subscription cancellations on record.
                        </td>
                      </tr>
                    ) : (
                      subscriptionTelemetry.subCancellationsList.map((sc) => (
                        <tr key={sc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{sc.email}</td>
                          <td style={{ padding: '8px', color: '#ffd700' }}>{sc.plan}</td>
                          <td style={{ padding: '8px', color: '#aaa' }}>{sc.reason}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#777' }}>{sc.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABLE 2: PAYMENT FAILURES LOG */}
            <div className="trend-card print-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '15px', color: '#eab308' }}>
                ⚠️ Failed Mandate Debits & Errors
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#8f98a9' }}>
                      <th style={{ padding: '8px' }}>User / ID</th>
                      <th style={{ padding: '8px' }}>Error Reason</th>
                      <th style={{ padding: '8px' }}>Amount</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionTelemetry.paymentFailuresList.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                          Zero payment failures detected.
                        </td>
                      </tr>
                    ) : (
                      subscriptionTelemetry.paymentFailuresList.map((pf) => (
                        <tr key={pf.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{pf.email}</td>
                          <td style={{ padding: '8px', color: '#ef4444' }}>{pf.error}</td>
                          <td style={{ padding: '8px', color: '#aaa' }}>{pf.amount > 0 ? `₹${pf.amount}` : 'N/A'}</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#777' }}>{pf.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* TABLE 3: PERMANENT ACCOUNT DELETIONS */}
          <div className="trend-card print-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '15px', color: '#ef4444' }}>
              🗑️ Permanent Account Deletion Log
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#8f98a9' }}>
                    <th style={{ padding: '10px' }}>Erased User Email</th>
                    <th style={{ padding: '10px' }}>Plan at Termination</th>
                    <th style={{ padding: '10px' }}>Country</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Deletion Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionTelemetry.accountCancellationsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '25px', textAlign: 'center', color: '#666' }}>
                        No account deletion records on file.
                      </td>
                    </tr>
                  ) : (
                    subscriptionTelemetry.accountCancellationsList.map((ac) => (
                      <tr key={ac.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{ac.email}</td>
                        <td style={{ padding: '10px', color: '#aaa' }}>{ac.plan}</td>
                        <td style={{ padding: '10px', color: '#888' }}>{ac.country}</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#777' }}>{ac.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: GIFT WISDOM INTELLIGENCE & FULL AUDIT LEDGER                   */}
      {/* ========================================================================= */}
      {activeSection === 'gifts' && (() => {
        const filteredGifts = giftAnalytics.giftLedger.filter((g) => {
          const matchesStatus =
            giftStatusFilter === 'ALL'
              ? true
              : giftStatusFilter === 'REDEEMED'
              ? g.isRedeemed
              : !g.isRedeemed;

          const query = giftSearch.toLowerCase().trim();
          const matchesSearch =
            !query ||
            g.code.toLowerCase().includes(query) ||
            g.senderName.toLowerCase().includes(query) ||
            g.senderEmail.toLowerCase().includes(query) ||
            g.recipientName.toLowerCase().includes(query) ||
            g.recipientEmail.toLowerCase().includes(query) ||
            g.occasion.toLowerCase().includes(query) ||
            g.relationship.toLowerCase().includes(query);

          return matchesStatus && matchesSearch;
        });

        const csvContent = [
          ['Voucher Code', 'Sender Name', 'Sender Email', 'Recipient Name', 'Recipient Email', 'Relationship', 'Occasion', 'Plan Tier', 'Duration (Months)', 'Amount', 'Currency', 'Status', 'Redeemed By', 'Created Date'].join(','),
          ...filteredGifts.map((g) => [
            `"${g.code}"`,
            `"${g.senderName}"`,
            `"${g.senderEmail}"`,
            `"${g.recipientName}"`,
            `"${g.recipientEmail}"`,
            `"${g.relationship}"`,
            `"${g.occasion}"`,
            `"${g.plan}"`,
            g.months,
            g.amount,
            `"${g.currency}"`,
            `"${g.isRedeemed ? 'Redeemed' : 'Pending'}"`,
            `"${g.redeemedBy ? g.redeemedBy.email : 'N/A'}"`,
            `"${g.createdAt}"`
          ].join(','))
        ].join('\n');

        return (
          <>
            {/* GIFT KPI OVERVIEW CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
              
              {/* CARD 1: TOTAL GIFTS PROCESSED */}
              <div className="trend-card print-card" style={{ borderLeft: '4px solid #ffd700' }}>
                <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Gifts Ordered</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#ffd700' }}>
                  {giftAnalytics.totalGiftsCount}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Distinct Gift Keys Generated</div>
              </div>

              {/* CARD 2: TOTAL GIFT VALUE */}
              <div className="trend-card print-card" style={{ borderLeft: '4px solid #f26422' }}>
                <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Gift Volume</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#f26422' }}>
                  ₹{giftAnalytics.totalGiftRevenue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Gross Value of Shared Wisdom</div>
              </div>

              {/* CARD 3: REDEMPTION RATE */}
              <div className="trend-card print-card" style={{ borderLeft: '4px solid #22c55e' }}>
                <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Redemption Conversion</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#22c55e' }}>
                  {giftAnalytics.redemptionRate}%
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>
                  {giftAnalytics.redeemedGiftsCount} Redeemed / {giftAnalytics.pendingGiftsCount} Pending
                </div>
              </div>

              {/* CARD 4: TIER SPLIT */}
              <div className="trend-card print-card" style={{ borderLeft: '4px solid #a855f7' }}>
                <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Gift Tier Breakdown</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '12px', color: '#fff' }}>
                  <span style={{ color: '#ffd700' }}>{giftAnalytics.goldGiftsCount} Gold</span>
                  <span style={{ color: '#555', margin: '0 8px' }}>/</span>
                  <span style={{ color: '#a855f7' }}>{giftAnalytics.platinumGiftsCount} Plat</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Curated subscription tiers</div>
              </div>

            </div>

            {/* AUDIT SEARCH & FILTER BAR */}
            <div className="trend-card print-card" style={{ marginBottom: '35px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>🎁 Complete Gift Wisdom Transaction Ledger</h3>
                  <p style={{ color: '#8f98a9', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    Full audit history capturing who gifted whom, personal messages, voucher keys, and live redemption status.
                  </p>
                </div>

                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
                  download="Gift_Wisdom_Transactions_Audit.csv"
                  style={{
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)',
                    color: '#000',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(255,215,0,0.2)'
                  }}
                >
                  📥 Export Gift Ledger CSV
                </a>
              </div>

              {/* SEARCH INPUT & FILTER BUTTONS */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by Sender, Recipient, Email, Key Code..."
                  value={giftSearch}
                  onChange={(e) => setGiftSearch(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '260px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'ALL', label: `All (${giftAnalytics.totalGiftsCount})` },
                    { key: 'REDEEMED', label: `✓ Redeemed (${giftAnalytics.redeemedGiftsCount})` },
                    { key: 'PENDING', label: `⏳ Pending (${giftAnalytics.pendingGiftsCount})` },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => setGiftStatusFilter(btn.key as any)}
                      style={{
                        background: giftStatusFilter === btn.key ? '#ffd700' : 'rgba(255,255,255,0.05)',
                        color: giftStatusFilter === btn.key ? '#000' : '#aaa',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AUDIT TABLE */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#8f98a9' }}>
                      <th style={{ padding: '12px 10px' }}>From Whom (Sender)</th>
                      <th style={{ padding: '12px 10px' }}>To Whom (Recipient)</th>
                      <th style={{ padding: '12px 10px' }}>Relationship & Occasion</th>
                      <th style={{ padding: '12px 10px' }}>Gift Plan</th>
                      <th style={{ padding: '12px 10px' }}>Activation Key</th>
                      <th style={{ padding: '12px 10px' }}>Amount</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Redemption Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGifts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                          No gift transactions matching the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredGifts.map((g) => (
                        <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{g.senderName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#888' }}>{g.senderEmail}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 700, color: '#ffd700' }}>{g.recipientName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#888' }}>{g.recipientEmail}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1' }}>
                              {g.relationship}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#f26422', marginTop: '3px' }}>{g.occasion}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ color: g.plan === 'PLATINUM' ? '#a855f7' : '#ffd700', fontWeight: 800 }}>
                              {g.plan} ({g.months}M)
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              {g.code}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: 700, color: '#22c55e' }}>
                            ₹{g.amount}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                            {g.isRedeemed ? (
                              <div>
                                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem' }}>
                                  ✓ REDEEMED
                                </span>
                                {g.redeemedBy && (
                                  <div style={{ fontSize: '0.7rem', color: '#777', marginTop: '3px' }}>
                                    {g.redeemedBy.email} • {g.redeemedBy.date}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', padding: '4px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem' }}>
                                ⏳ PENDING
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}

      {/* ========================================================================= */}
      {/* SECTION 6: OFFLINE DOWNLOADS AUDIT & TELEMETRY                           */}
      {/* ========================================================================= */}
      {activeSection === 'downloads' && (() => {
        const filteredDownloads = (offlineDownloads || []).filter((d) => {
          if (!downloadSearch) return true;
          const q = downloadSearch.toLowerCase();
          return (
            d.email.toLowerCase().includes(q) ||
            d.name.toLowerCase().includes(q) ||
            d.courseTitle.toLowerCase().includes(q) ||
            d.episodeTitle.toLowerCase().includes(q) ||
            d.ip.toLowerCase().includes(q)
          );
        });

        return (
          <div style={{ background: '#0e131f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>📥</span> Offline Video Downloads Audit Log
                </h3>
                <p style={{ margin: '4px 0 0 0', color: '#aaa', fontSize: '0.85rem' }}>
                  Audited records of verified logged-in users who initiated 30-day offline video downloads.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search user, course, IP..."
                  value={downloadSearch}
                  onChange={(e) => setDownloadSearch(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    minWidth: '240px'
                  }}
                />
                <span style={{ background: 'rgba(70,211,105,0.15)', border: '1px solid rgba(70,211,105,0.3)', color: '#46d369', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem' }}>
                  Total: {offlineDownloads.length} Downloads
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#888' }}>
                    <th style={{ padding: '12px 10px' }}>USER ACCOUNT</th>
                    <th style={{ padding: '12px 10px' }}>PLAN</th>
                    <th style={{ padding: '12px 10px' }}>CONTENT DOWNLOADED</th>
                    <th style={{ padding: '12px 10px' }}>IP ADDRESS</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>DATE & TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDownloads.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No offline downloads recorded matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredDownloads.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{d.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>{d.email}</div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{
                            background: d.plan === 'PLATINUM' ? 'rgba(168,85,247,0.15)' : d.plan === 'GOLD' ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.08)',
                            color: d.plan === 'PLATINUM' ? '#a855f7' : d.plan === 'GOLD' ? '#ffd700' : '#aaa',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            {d.plan}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#f26422' }}>{d.courseTitle}</div>
                          {d.episodeTitle && (
                            <div style={{ fontSize: '0.75rem', color: '#bbb' }}>{d.episodeTitle}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#888', fontSize: '0.75rem' }}>
                          {d.ip}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', color: '#aaa', fontSize: '0.78rem' }}>
                          {d.date}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
