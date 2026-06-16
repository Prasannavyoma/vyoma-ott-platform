"use client";

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
}: AnalyticsClientPageProps) {
  const router = useRouter();
  
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
              <option value="ALL">🌟 All Formats</option>
              <option value="VIDEO">📽️ Videos Only</option>
              <option value="AUDIOBOOK">🎧 Audiobooks Only</option>
              <option value="PODCAST">🎙️ Podcasts Only</option>
              <option value="EBOOK">📖 E-Books Only</option>
              <option value="GAME">🎮 Games Only</option>
              <option value="PROGRAM">🎓 Programs Only</option>
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

      {/* CORE KPI CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '45px' }}>
        
        {/* CARD 1: WATCH TIME */}
        <div className="trend-card print-card" style={{ borderLeft: '4px solid #46d369' }}>
          <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Time Spend</div>
          <div className="metric-num" style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '8px', color: '#46d369' }}>
            {totalHoursOverall} <span style={{ fontSize: '1rem', color: '#777', fontWeight: 'normal' }}>Hrs</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '6px' }}>Across all system subscribers</div>
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
                {/* Grid Lines */}
                <line x1="50" y1="50" x2="450" y2="50" stroke="#222" strokeDasharray="5,5" />
                <line x1="50" y1="110" x2="450" y2="110" stroke="#222" strokeDasharray="5,5" />
                <line x1="50" y1="170" x2="450" y2="170" stroke="#333" />

                {/* SVG Line path connecting points */}
                <polyline
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3.5"
                  points={points}
                  strokeLinecap="round"
                />

                {/* Plot Data Dots and labels */}
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
            {/* Doughnut SVG */}
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

            {/* Labels Legend */}
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

        {/* TABLE B: TOP HOURS SPENT COURSES (BY TIMELINE PROGRESS) */}
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

    </div>
  );
}
