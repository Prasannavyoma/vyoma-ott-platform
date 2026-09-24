import prisma from '@/lib/prisma';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Zap, BookOpen, Target, Clock, Gem, Award, GraduationCap } from 'lucide-react';

export default async function ProgressTrackerPage() {
  // 1. Secure Context Validation
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch Detailed Progress Telemetry
  const userProgress = await prisma.progress.findMany({
    where: { userId: user.id },
    include: {
      episode: {
        include: { course: true }
      }
    }
  });

  // Construct course progression mapping
  const activeMap: Record<string, {
    course: any;
    watchedCount: number;
    completedCount: number;
    lastEpId: string;
    lastEpTitle: string;
    lastWatchedAt: Date;
  }> = {};

  for (const prog of userProgress) {
    if (!prog.episode?.course) continue;
    const cId = prog.episode.course.id;
    if (!activeMap[cId]) {
      activeMap[cId] = {
        course: prog.episode.course,
        watchedCount: 0,
        completedCount: 0,
        lastEpId: prog.episodeId,
        lastEpTitle: prog.episode.title || 'Untitled Lesson',
        lastWatchedAt: (prog as any).updatedAt || new Date()
      };
    }
    activeMap[cId].watchedCount++;
    if (prog.completed) {
      activeMap[cId].completedCount++;
    }
  }

  const rawActive = Object.values(activeMap);
  const activeIds = rawActive.map(ra => ra.course.id);

  // Query standard course episode counts to compute true percentages
  const dbCourseVolume = await prisma.course.findMany({
    where: { id: { in: activeIds } },
    include: {
      _count: { select: { episodes: true } }
    }
  });

  // Enrich active courses with progress percentages
  const activeSyllabi = rawActive.map(ra => {
    const meta = dbCourseVolume.find(db => db.id === ra.course.id);
    const total = meta?._count?.episodes || 1;
    const percent = Math.min(100, Math.round((ra.completedCount / total) * 100));
    return { ...ra, totalEpisodes: total, percent };
  });

  // Dynamic Global TelemetryCounters
  const totalUnitsCompleted = userProgress.filter(p => p.completed).length;
  const completedCoursesCount = activeSyllabi.filter(c => c.percent >= 95).length;
  const totalHoursSpent = (user.totalWatchSeconds / 3600);

  // Fetch all courses to build dynamic visual learning path roadmap
  const allCourses = await prisma.course.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const roadmapNodes = allCourses.map((c) => {
    const active = activeSyllabi.find(a => a.course.id === c.id);
    let status: 'locked' | 'active' | 'completed' = 'locked';
    let percent = 0;
    if (active) {
      percent = active.percent;
      status = percent >= 95 ? 'completed' : 'active';
    }
    return {
      id: c.id,
      title: c.title,
      status,
      percent,
      thumbnailUrl: c.thumbnailUrl || ''
    };
  });

  // Gamified Badges System
  const badges = [
    {
      id: 'first_step',
      name: 'Sanskrit Initiate',
      desc: 'Completed your first learning module.',
      emoji: '📜',
      unlocked: totalUnitsCompleted >= 1,
      color: '#ffd700'
    },
    {
      id: 'dedicated',
      name: 'Grammar Aspirant',
      desc: 'Mastered at least 5 curriculum units.',
      emoji: '🎯',
      unlocked: totalUnitsCompleted >= 5,
      color: '#f26422'
    },
    {
      id: 'scholar',
      name: 'Sanskrit Scholar',
      desc: 'Fully completed at least 1 premium course.',
      emoji: '🎓',
      unlocked: completedCoursesCount >= 1,
      color: '#00e5ff'
    },
    {
      id: 'time_master',
      name: 'Veda Guardian',
      desc: 'Spent more than 3 hours on courses.',
      emoji: '⏱️',
      unlocked: totalHoursSpent >= 3,
      color: '#9d4edd'
    },
    {
      id: 'coin_hoarder',
      name: 'Gita Devotee',
      desc: 'Accumulated over 1000 Vyoma Coins.',
      emoji: '💎',
      unlocked: user.coins >= 1000,
      color: '#ff007f'
    }
  ];

  const activeTracks = activeSyllabi.filter(item => item.percent < 100);
  const completedTracks = activeSyllabi.filter(item => item.percent === 100);

  return (
    <main style={{ minHeight: '100vh', background: '#030b17', color: '#fff', fontFamily: 'Outfit, system-ui, sans-serif' }}>
      <NavBar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 60px 20px' }}>
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, margin: 0, background: 'linear-gradient(to right, #ffffff, #8f98a9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
              Academic Progress Tracker
            </h1>
            <p style={{ color: '#8f98a9', margin: '8px 0 0 0', fontSize: '1.1rem' }}>
              Track your educational journey, review completed courses, and unlock scholarly badges.
            </p>
          </div>
          <Link href="/profile" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '30px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s ease', fontSize: '0.9rem' }}>
            👤 View Profile Settings
          </Link>
        </div>

        {/* METRICS DASHBOARD GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '45px' }}>
          <div style={metricCardStyle}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px rgba(242,100,34,0.4))' }}>📚</span>
            <div>
              <div style={metricValueStyle}>{activeSyllabi.length}</div>
              <div style={metricLabelStyle}>Enrolled Tracks</div>
            </div>
          </div>
          <div style={metricCardStyle}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.4))' }}>🎯</span>
            <div>
              <div style={metricValueStyle}>{totalUnitsCompleted}</div>
              <div style={metricLabelStyle}>Units Mastered</div>
            </div>
          </div>
          <div style={metricCardStyle}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px rgba(157,78,221,0.4))' }}>⏱️</span>
            <div>
              <div style={metricValueStyle}>{totalHoursSpent.toFixed(1)}h</div>
              <div style={metricLabelStyle}>Hours Logged</div>
            </div>
          </div>
          <div style={metricCardStyle}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.4))' }}>💎</span>
            <div>
              <div style={metricValueStyle}>{user.coins}</div>
              <div style={metricLabelStyle}>Vyoma Coins</div>
            </div>
          </div>
        </div>

        {/* 🗺️ INTERACTIVE VISUAL CURRICULUM ROADMAP */}
        <div style={{
          background: 'rgba(15, 22, 36, 0.4)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '45px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🗺️</span> Interactive Learning Path Roadmap
          </h2>
          <p style={{ color: '#8f98a9', margin: '0 0 30px 0', fontSize: '0.9rem' }}>
            Visualize your progress across the syllabus hierarchy. Complete courses to unlock advanced units.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', minHeight: '160px', padding: '0 40px', overflowX: 'auto', gap: '50px' }}>
            {/* SVG Background Connections */}
            <svg style={{ position: 'absolute', top: '50px', left: 0, width: '100%', height: '8px', zIndex: 0, pointerEvents: 'none' }}>
              <line x1="0" y1="4" x2="100%" y2="4" stroke="rgba(255,255,255,0.06)" strokeWidth="4" strokeDasharray="8 8" />
              {/* Highlight active progress line */}
              <line x1="0" y1="4" x2={`${Math.max(10, Math.min(100, (roadmapNodes.filter(n => n.status !== 'locked').length / Math.max(1, roadmapNodes.length)) * 100))}%`} y2="4" stroke="url(#activeRoadmapGradient)" strokeWidth="4" />
              <defs>
                <linearGradient id="activeRoadmapGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#46d369" />
                  <stop offset="70%" stopColor="#f26422" />
                  <stop offset="100%" stopColor="#ff8c53" />
                </linearGradient>
              </defs>
            </svg>
            
            {roadmapNodes.map((node) => (
              <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, minWidth: '160px', textAlign: 'center' }}>
                {/* Node Icon Circle */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: node.status === 'completed' ? '#46d369' : node.status === 'active' ? '#f26422' : '#1f293d',
                  border: node.status === 'active' ? '4px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  boxShadow: node.status === 'active' ? '0 0 20px rgba(242,100,34,0.6)' : node.status === 'completed' ? '0 0 15px rgba(70,211,105,0.4)' : 'none',
                  transition: 'all 0.3s'
                }}>
                  {node.status === 'completed' ? '🏆' : node.status === 'active' ? '⚡' : '🔒'}
                </div>
                
                {/* Node Meta */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '34px', lineHeight: '17px', maxWidth: '140px' }}>
                    {node.title}
                  </div>
                  {node.status !== 'locked' ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: node.status === 'completed' ? '#46d369' : '#ffd700' }}>
                      {node.status === 'completed' ? 'Graduated' : `${node.percent}% Done`}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#8f98a9', fontWeight: 700 }}>
                      Locked Track
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS DETAILS & BADGES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '40px' }}>
          
          {/* LEFT COLUMN: ACTIVE & COMPLETED COURSES */}
          <div>
            
            {/* ACTIVE COURSES */}
            <div style={{ marginBottom: '45px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f26422' }}><Zap size={24} /></span> Active Curriculum Queue
              </h2>

              {activeTracks.length === 0 ? (
                <div style={emptyStateStyle}>
                  <span style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', color: '#8f98a9' }}><BookOpen size={48} /></span>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff' }}>No active courses in progress</h4>
                  <p style={{ color: '#8f98a9', fontSize: '0.95rem', marginBottom: '25px', maxWidth: '380px', margin: '0 auto 25px auto' }}>
                    Start streaming any Sanskrit course or Audiobook from our catalog to track your progress here.
                  </p>
                  <Link href="/" style={actionButtonStyle}>
                    Explore Course Catalog
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {activeTracks.map(item => (
                    <div key={item.course.id} style={courseProgressCardStyle}>
                      <div style={{ width: '180px', height: '102px', position: 'relative', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#000' }}>
                        {item.course.thumbnailUrl && (
                          <img src={item.course.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
                        )}
                        <div style={badgeFloatStyle}>
                          {item.percent}%
                        </div>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#fff', lineHeight: '1.3' }}>
                            {item.course.title}
                          </h3>
                          <p style={{ color: '#8f98a9', fontSize: '0.85rem', margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📍 Resuming: <strong>{item.lastEpTitle}</strong></span>
                          </p>
                        </div>

                        <div style={{ marginTop: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8f98a9', marginBottom: '6px', fontWeight: 600 }}>
                            <span>{item.completedCount} / {item.totalEpisodes} Lessons Completed</span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${item.percent}%`, height: '100%', background: 'linear-gradient(to right, #f26422, #ff8c53)', borderRadius: '3px', boxShadow: '0 0 8px rgba(242,100,34,0.4)' }} />
                            </div>
                            
                            <Link href={`/watch/${item.course.id}?ep=${item.lastEpId}`} style={resumeButtonStyle}>
                              ▶ Resume
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMPLETED COURSES */}
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#46d369' }}>🏆</span> Completed & Graduated Courses
              </h2>

              {completedTracks.length === 0 ? (
                <div style={{ ...emptyStateStyle, padding: '40px 20px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                  <p style={{ color: '#8f98a9', fontSize: '0.95rem', margin: 0 }}>
                    Courses you completely finish will appear here, fully unlocked with graduation certificates.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {completedTracks.map(item => (
                    <div key={item.course.id} style={{ ...courseProgressCardStyle, flexDirection: 'column', gap: '15px' }}>
                      <div style={{ width: '100%', height: '150px', position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                        {item.course.thumbnailUrl && (
                          <img src={item.course.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <div style={{ ...badgeFloatStyle, background: '#46d369', boxShadow: '0 0 10px rgba(70,211,105,0.5)' }}>
                          Completed
                        </div>
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                            {item.course.title}
                          </h3>
                          <div style={{ background: 'rgba(70,211,105,0.1)', color: '#46d369', border: '1px solid rgba(70,211,105,0.2)', padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block', marginTop: '10px' }}>
                             🎓 Certificate Available
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                          <Link href={`/watch/${item.course.id}`} style={{ ...resumeButtonStyle, flex: 1, padding: '10px', textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            🔄 Review Course
                          </Link>
                          <Link href="/profile" style={{ ...resumeButtonStyle, flex: 1, padding: '10px', textAlign: 'center', background: 'linear-gradient(135deg, #46d369 0%, #3bb258 100%)', boxShadow: '0 5px 15px rgba(70,211,105,0.2)' }}>
                            📜 View Certificate
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: GAMIFIED SCHOLAR BADGES */}
          <div>
            <div style={sidebarPanelStyle}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🛡️</span> Scholar Badges & Ranks
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {badges.map(badge => (
                  <div key={badge.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '12px', borderRadius: '12px', background: badge.unlocked ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)', border: badge.unlocked ? `1px solid rgba(255,255,255,0.05)` : '1px dashed rgba(255,255,255,0.04)', opacity: badge.unlocked ? 1 : 0.45 }}>
                    <div style={{ 
                      width: '55px', height: '55px', borderRadius: '50%', 
                      background: badge.unlocked ? `radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)` : 'transparent',
                      border: badge.unlocked ? `2px solid ${badge.color}` : '2px dashed rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                      boxShadow: badge.unlocked ? `0 0 15px ${badge.color}25` : 'none'
                    }}>
                      {badge.emoji}
                    </div>
                    
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: badge.unlocked ? '#fff' : '#8f98a9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {badge.name}
                        {badge.unlocked && <span style={{ color: badge.color, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 900 }}>Active</span>}
                      </div>
                      <div style={{ color: '#8f98a9', fontSize: '0.75rem', marginTop: '3px' }}>
                        {badge.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
      <Footer />
    </main>
  );
}

// Visual Element Styles
const metricCardStyle: React.CSSProperties = {
  background: 'rgba(15, 22, 36, 0.4)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  padding: '24px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

const metricValueStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 900,
  color: '#fff',
  lineHeight: '1'
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#8f98a9',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginTop: '5px'
};

const courseProgressCardStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  background: 'rgba(15, 22, 36, 0.3)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  padding: '20px',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
};

const badgeFloatStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'var(--primary, #f26422)',
  color: '#fff',
  fontSize: '0.7rem',
  fontWeight: 900,
  padding: '3px 8px',
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
};

const resumeButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--primary, #f26422) 0%, #ff8c53 100%)',
  color: '#fff',
  padding: '6px 16px',
  borderRadius: '30px',
  fontWeight: 800,
  fontSize: '0.8rem',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 4px 12px rgba(242,100,34,0.3)',
  transition: 'transform 0.2s',
  flexShrink: 0
};

const actionButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--primary, #f26422) 0%, #ff8c53 100%)',
  color: '#fff',
  padding: '12px 30px',
  borderRadius: '30px',
  fontWeight: 800,
  fontSize: '0.9rem',
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 6px 20px rgba(242,100,34,0.3)'
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 40px',
  border: '2px dashed rgba(255,255,255,0.06)',
  borderRadius: '16px',
  background: 'rgba(15, 22, 36, 0.15)'
};

const sidebarPanelStyle: React.CSSProperties = {
  background: 'rgba(15, 22, 36, 0.4)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  padding: '30px',
  borderRadius: '20px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};
