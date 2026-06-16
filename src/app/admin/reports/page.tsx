import prisma from '@/lib/prisma';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ start?: string, end?: string, plan?: string }> }) {
  const sp = await searchParams;
  
  const startDateStr = sp.start || '';
  const endDateStr = sp.end || '';
  const selectedPlan = sp.plan || '';

  // Define recursive prisma criteria
  let whereClause: any = {};

  if (startDateStr || endDateStr) {
    whereClause.createdAt = {};
    if (startDateStr) {
      whereClause.createdAt.gte = new Date(`${startDateStr}T00:00:00Z`);
    }
    if (endDateStr) {
      whereClause.createdAt.lte = new Date(`${endDateStr}T23:59:59Z`);
    }
  }

  if (selectedPlan) {
    whereClause.course = {
      accessLevel: selectedPlan
    };
  }

  // 1. Fetch Fully Filtered Database Transaction Vectors
  const transactions = await prisma.purchase.findMany({
    where: whereClause,
    include: { user: true, course: true },
    orderBy: { createdAt: 'desc' }
  });

  // 2. Fetch Comprehensive Platform Engagement Vectors (ML/Usage Metrics)
  const allProgress = await prisma.progress.findMany({
    include: { 
      user: true, 
      episode: { include: { course: true } } 
    }
  });

  // 3. Aggregate Financial Telemetry
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const count = transactions.length;

  // 4. Aggregate Platorm Utilization Metrics
  const totalSecondsStreamed = allProgress.reduce((sum, p) => sum + (p.position || 0), 0);
  const totalHoursStreamed = (totalSecondsStreamed / 3600).toFixed(1);
  const globalCompletions = allProgress.filter(p => p.completed).length;

  // 5. Build Real-time Student Engagement Leaderboard
  const userCohort = new Map<string, any>();
  allProgress.forEach(p => {
    if (!p.user) return;
    const uid = p.userId;
    const current = userCohort.get(uid) || {
      email: p.user.email,
      name: p.user.name || 'Learner',
      plan: p.user.plan || 'FREE',
      seconds: 0,
      completedCount: 0,
      distinctCourses: new Set<string>()
    };
    current.seconds += (p.position || 0);
    if (p.completed) current.completedCount++;
    if (p.episode?.courseId) current.distinctCourses.add(p.episode.courseId);
    userCohort.set(uid, current);
  });

  const sortedLeaderboard = Array.from(userCohort.values())
    .map(item => ({
      email: item.email,
      name: item.name,
      plan: item.plan,
      hours: (item.seconds / 3600).toFixed(1),
      rawHours: item.seconds / 3600,
      completed: item.completedCount,
      courses: item.distinctCourses.size
    }))
    .sort((a, b) => b.rawHours - a.rawHours)
    .slice(0, 10);

  // Reference anchor for dynamic cohort percentage bars
  const cohortMaxHours = Math.max(...sortedLeaderboard.map(u => u.rawHours), 0.1);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#fff', paddingBottom: '100px' }}>
      
      {/* HEADER PANEL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
         <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900 }}>Intelligence Command Center</h1>
            <p style={{ color: '#888', marginTop: '5px' }}>Correlate financial penetrations against real-time user engagement analytics.</p>
         </div>
         <a 
           href={`data:text/csv;charset=utf-8,ID,Date,Client,Plan,Amount\n${transactions.map(t => `"${t.id}","${new Date(t.createdAt).toLocaleDateString()}","${t.user.email}","${t.course.title}",${t.amount||0}`).join('\n')}`}
           download="Vyoma_Fiscal_Report.csv"
           style={{ background: '#fff', color: '#000', padding: '12px 25px', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 10px 30px rgba(255,255,255,0.1)' }}>
            ⬇️ EXPORT FISCAL CSV
         </a>
      </div>

      {/* FILTERS */}
      <div style={{ background: 'var(--card-bg)', padding: '20px 30px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '30px' }}>
         <form method="GET" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
            <div>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>From Date</label>
               <input type="date" name="start" defaultValue={startDateStr} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '6px', outline: 'none' }} />
            </div>
            <div>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>To Date</label>
               <input type="date" name="end" defaultValue={endDateStr} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '6px', outline: 'none' }} />
            </div>
            <div>
               <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Pricing Tier</label>
               <select name="plan" defaultValue={selectedPlan} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '10px 15px', borderRadius: '6px', outline: 'none', minWidth: '140px' }}>
                  <option value="">-- All Tiers --</option>
                  <option value="FREE">FREE</option>
                  <option value="GOLD">GOLD</option>
                  <option value="PLATINUM">PLATINUM</option>
                  <option value="ABROAD">ABROAD</option>
               </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
               <button type="submit" style={{ background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  🔍 Apply Filter
               </button>
               {(startDateStr || endDateStr || selectedPlan) && (
                  <a href="/admin/reports" style={{ background: '#222', color: '#aaa', padding: '10px 15px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block' }}>
                     Clear
                  </a>
               )}
            </div>
         </form>
      </div>

      {/* FISCAL RIBBONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
         <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#666', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Total Processed Revenue</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '5px', color: '#46d369' }}>₹{totalRevenue.toFixed(2)}</div>
         </div>
         <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#666', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Aggregate Order Volume</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '5px' }}>{count}</div>
         </div>
         <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#666', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Average Transaction Net</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '5px' }}>₹{(totalRevenue / (count || 1)).toFixed(2)}</div>
         </div>
      </div>

      {/* DETAILED TRANSACTION LOG */}
      <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '50px' }}>
         <h3 style={{ marginBottom: '20px', fontWeight: 800 }}>📝 Recent Transactions</h3>
         
         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
               <tr style={{ borderBottom: '1px solid #333', color: '#777', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>TRANSACTION ID</th>
                  <th style={{ padding: '12px' }}>DATE</th>
                  <th style={{ padding: '12px' }}>USER ACCOUNT</th>
                  <th style={{ padding: '12px' }}>ACTIVATED ITEM</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>GROSS TOTAL</th>
               </tr>
            </thead>
            <tbody>
               {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                     <td style={{ padding: '15px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#aaa' }}>{t.id}</td>
                     <td style={{ padding: '15px 12px' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                     <td style={{ padding: '15px 12px', fontWeight: 600 }}>{t.user.email}</td>
                     <td style={{ padding: '15px 12px' }}>{t.course.title}</td>
                     <td style={{ padding: '15px 12px', textAlign: 'right', fontWeight: 900 }}>₹{t.amount || 0}</td>
                  </tr>
               ))}
               {transactions.length === 0 && <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No relational transactions found.</td></tr>}
            </tbody>
         </table>
      </div>

      {/* ============================================================== */}
      {/* 🧠 PLATFORM ENGAGEMENT & PLAYTIME INTELLIGENCE (NEW SECTION)   */}
      {/* ============================================================== */}
      <div style={{ borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '40px' }}>
         
         <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffd700', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <span>🧠</span> Platform Engagement & Playtime Intelligence
            </h2>
            <p style={{ color: '#888', marginTop: '5px' }}>Audit who is fully active, which users stream the most content, and absolute cumulative learning hours.</p>
         </div>

         {/* ENGAGEMENT KIP DASHES */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: 'linear-gradient(135deg, #111, #0b140c)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(70,211,105,0.1)' }}>
               <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Platform Stream Time</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '5px', color: '#46d369' }}>{totalHoursStreamed} <span style={{ fontSize: '1.2rem', color: '#777' }}>Hrs</span></div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #111, #18120c)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,140,0,0.1)' }}>
               <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Modules Fully Completed</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '5px', color: '#ffa500' }}>{globalCompletions} <span style={{ fontSize: '1.2rem', color: '#777' }}>Assets</span></div>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #111, #0c1014)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(30,144,255,0.1)' }}>
               <div style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Engagement Density Index</div>
               <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '5px', color: '#1e90ff' }}>{userCohort.size} <span style={{ fontSize: '1.2rem', color: '#777' }}>Active users</span></div>
            </div>
         </div>

         {/* 👑 STUDENT ENGAGEMENT LEADERBOARD */}
         <div style={{ background: '#0d0f12', border: '1px solid #1f232c', padding: '35px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
               <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>🏆 Top 10 Super-Scholars (Activity Leaderboard)</h3>
                  <p style={{ color: '#555', fontSize: '0.85rem', marginTop: '4px' }}>Ranked strictly by cumulative active study hours tracked via media timeline heartbeats.</p>
               </div>
               <div style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', fontSize: '0.7rem', fontWeight: 900, padding: '5px 12px', borderRadius: '30px' }}>
                  LIVE TELEMETRY FEED
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {sortedLeaderboard.map((student, index) => {
                  const rawPct = (student.rawHours / cohortMaxHours) * 100;
                  const pct = Math.max(3, isNaN(rawPct) ? 0 : rawPct); // Floor at 3% for visibility

                  return (
                     <div key={student.email} style={{ 
                       background: '#15181f', border: '1px solid #22262f', borderRadius: '12px', padding: '15px 20px',
                       display: 'grid', gridTemplateColumns: '40px 2.5fr 1.2fr 1.5fr', alignItems: 'center', gap: '20px'
                     }}>
                        {/* Rank */}
                        <div style={{ 
                          fontSize: '1.2rem', fontWeight: 900, color: index < 3 ? '#ffd700' : '#444',
                          textAlign: 'center', fontStyle: 'italic'
                        }}>
                           #{index + 1}
                        </div>

                        {/* Profile */}
                        <div>
                           <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {student.name} 
                              <span style={{ fontSize: '0.65rem', background: '#000', padding: '2px 6px', borderRadius: '4px', color: student.plan === 'PLATINUM' ? '#e50914' : student.plan === 'GOLD' ? '#ffa500' : '#666' }}>
                                 {student.plan}
                              </span>
                           </div>
                           <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>{student.email}</div>
                        </div>

                        {/* Micro-stats */}
                        <div>
                           <div style={{ fontSize: '0.75rem', color: '#777' }}>Tracks Mastered</div>
                           <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem', marginTop: '2px' }}>
                              🔥 {student.completed} <span style={{ color: '#444', fontWeight: 400 }}>/ {student.courses} Courses</span>
                           </div>
                        </div>

                        {/* Glowing Activity Slider Meter */}
                        <div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.7rem', color: '#555', fontWeight: 800 }}>CUMULATIVE PLATFORM TIME</span>
                              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffd700' }}>{student.hours} Hrs</span>
                           </div>
                           <div style={{ width: '100%', height: '8px', background: '#000', borderRadius: '4px', overflow: 'hidden', border: '1px solid #222' }}>
                              <div style={{ 
                                width: `${pct}%`, height: '100%', 
                                background: 'linear-gradient(90deg, #ffd700, #ff8c00)',
                                boxShadow: '0 0 10px rgba(255,215,0,0.3)',
                                transition: 'width 1s cubic-bezier(0.1, 0.8, 0.2, 1)'
                              }}></div>
                           </div>
                        </div>
                     </div>
                  );
               })}

               {sortedLeaderboard.length === 0 && (
                  <div style={{ padding: '50px', textAlign: 'center', border: '1px dashed #333', borderRadius: '12px', color: '#555' }}>
                     Waiting for students to commence streaming to populate telemetry leaderboard...
                  </div>
               )}
            </div>

         </div>
      </div>

    </div>
  );
}


