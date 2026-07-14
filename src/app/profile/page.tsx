import prisma from '@/lib/prisma';
import NavBar from '@/app/components/NavBar';
import AvatarUploader from '@/app/components/AvatarUploader';
import ReferralLinkBox from '@/app/components/ReferralLinkBox';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, clearSession } from '@/lib/auth';
import SkillConstellation from './SkillConstellation';

export default async function ProfilePage() {
  // 1. Secure Context Validation
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch gamification configurations for UI
  let uiCoinsNameReward = 1;
  let uiCoinsProfileReward = 10;
  let roadmapEnabled = true; // Default true
  try {
    const nSetting = await prisma.systemSetting.findUnique({ where: { key: 'COINS_NAME_REWARD' } });
    if (nSetting) uiCoinsNameReward = parseInt(nSetting.value) || 0;

    const pSetting = await prisma.systemSetting.findUnique({ where: { key: 'COINS_PROFILE_REWARD' } });
    if (pSetting) uiCoinsProfileReward = parseInt(pSetting.value) || 0;

    const rSetting = await prisma.systemSetting.findUnique({ where: { key: 'FEATURE_KNOWLEDGE_ROADMAP' } });
    if (rSetting) roadmapEnabled = rSetting.value === 'true';
  } catch (e) {}

  // 2. Subscription Lifetime Tracker
  function getDaysRemaining() {
    if (!user || user.plan === 'FREE') return 'N/A (Free Tier)';
    
    let end: Date;
    if (user.planExpiresAt) {
      end = new Date(user.planExpiresAt);
    } else {
      const referenceDate = user.planStartedAt || user.createdAt;
      const start = new Date(referenceDate);
      const totalDays = user.planInterval === 'YEARLY' ? 365 : 30;
      end = new Date(start.getTime() + totalDays * 24 * 60 * 60 * 1000);
    }
    
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? 'Expired' : `${diffDays} Days Remaining`;
  }

  // 🎁 REFERRAL ENGAGEMENT TELEMETRY
  const referralsCount = await prisma.referral.count({
    where: { referrerId: user.id }
  });

  const earnedRewards = await prisma.referralReward.findMany({
    where: { userId: user.id }
  });

  let tiers = await prisma.referralTier.findMany({
    orderBy: { referralsRequired: 'asc' }
  });
  if (tiers.length === 0) {
    tiers = [
      { referralsRequired: 50, rewardName: 'Vyoma Diaries' },
      { referralsRequired: 100, rewardName: '200rs Voucher for product purchase in digitalsanskritguru.com' },
      { referralsRequired: 150, rewardName: 'Vyoma T-shirt as reward' },
      { referralsRequired: 200, rewardName: 'Sanskrit Copper Water Bottle' },
      { referralsRequired: 250, rewardName: 'Vyoma Premium Leather Satchel' },
      { referralsRequired: 500, rewardName: 'Lifetime Free Gold Access Voucher' }
    ] as any[];
  }

  // 3. ACADEMIC ANALYTICS & ACTIVE PROGRESS AGGREGATOR
  // Fetches detailed watch telemetry to assemble a real-time syllabus dashboard
  const userProgress = await prisma.progress.findMany({
    where: { userId: user.id },
    include: {
      episode: {
        include: { course: true }
      }
    }
  });

  // Construct hash-map grouping watched items by parent courses
  const activeMap: Record<string, {
    course: any;
    watchedCount: number;
    completedCount: number;
    lastEpId: string;
  }> = {};

  for (const prog of userProgress) {
    if (!prog.episode?.course) continue;
    const cId = prog.episode.course.id;
    if (!activeMap[cId]) {
      activeMap[cId] = {
        course: prog.episode.course,
        watchedCount: 0,
        completedCount: 0,
        lastEpId: prog.episodeId
      };
    }
    activeMap[cId].watchedCount++;
    if (prog.completed) {
      activeMap[cId].completedCount++;
    }
  }

  const rawActive = Object.values(activeMap);
  const activeIds = rawActive.map(ra => ra.course.id);

  // Query standard curriculum sizes to compute true completions
  const dbCourseVolume = await prisma.course.findMany({
    where: { id: { in: activeIds } },
    include: {
      _count: { select: { episodes: true } }
    }
  });

  // Enrich active syllabi with accurate visual tracks and states
  const activeSyllabi = rawActive.map(ra => {
    const meta = dbCourseVolume.find(db => db.id === ra.course.id);
    const total = meta?._count?.episodes || 1;
    const percent = Math.min(100, Math.round((ra.completedCount / total) * 100));
    return { ...ra, totalEpisodes: total, percent };
  });

  activeSyllabi.sort((a, b) => (a.course.roadmapOrder || 0) - (b.course.roadmapOrder || 0));

  // Dynamic Global Counters for Analytics Strip
  const totalUnitsCompleted = userProgress.filter(p => p.completed).length;
  const completedCoursesCount = activeSyllabi.filter(c => c.percent >= 95).length;

  async function downgradePlan() {
    "use server";
    const freshUser = await getCurrentUser();
    if (!freshUser || freshUser.plan === 'FREE') return;
    
    const nextPlan = freshUser.plan === 'PLATINUM' ? 'GOLD' : 'FREE';
    await prisma.user.update({
      where: { id: freshUser.id },
      data: { plan: nextPlan }
    });
    revalidatePath('/profile');
  }

  // 4. SERVER ACTIONS
  async function updateProfile(fd: FormData) {
    "use server";
    const name = fd.get('name') as string;
    const address = fd.get('address') as string;
    const gender = fd.get('gender') as string;
    const age = parseInt(fd.get('age') as string) || null;
    const interests = fd.get('interests') as string;
    const avatarUrl = fd.get('avatarUrl') as string;

    const freshUser = await prisma.user.findUnique({ where: { id: user!.id } });
    if (!freshUser) return;

    let coinsToAdd = 0;
    let nameRewardGiven = freshUser.nameRewardGiven;
    let profileRewardGiven = freshUser.profileRewardGiven;

    let coinsNameReward = 1;
    let coinsProfileReward = 10;
    try {
      const nSetting = await prisma.systemSetting.findUnique({ where: { key: 'COINS_NAME_REWARD' } });
      if (nSetting) coinsNameReward = parseInt(nSetting.value) || 0;

      const pSetting = await prisma.systemSetting.findUnique({ where: { key: 'COINS_PROFILE_REWARD' } });
      if (pSetting) coinsProfileReward = parseInt(pSetting.value) || 0;
    } catch (e) {}

    if (name && name.trim() !== '' && !nameRewardGiven) {
      coinsToAdd += coinsNameReward;
      nameRewardGiven = true;
    }

    const isProfileFull = !!(
      name && name.trim() !== '' &&
      address && address.trim() !== '' &&
      gender && gender.trim() !== '' &&
      age !== null &&
      interests && interests.trim() !== '' &&
      avatarUrl && avatarUrl.trim() !== ''
    );

    if (isProfileFull && !profileRewardGiven) {
      coinsToAdd += coinsProfileReward;
      profileRewardGiven = true;
    }

    await prisma.user.update({
      where: { id: user!.id },
      data: { 
        name, 
        address, 
        gender, 
        age, 
        interests, 
        avatarUrl,
        coins: { increment: coinsToAdd },
        nameRewardGiven,
        profileRewardGiven
      }
    });
    revalidatePath('/profile');
  }

  async function redeemCoins() {
    "use server";
    const freshUser = await getCurrentUser();
    if (!freshUser || freshUser.coins < 1000) return;
    await prisma.user.update({
      where: { id: freshUser.id },
      data: {
        coins: { decrement: 1000 },
        plan: 'GOLD',
        planInterval: 'YEARLY',
        planStartedAt: new Date()
      }
    });
    revalidatePath('/profile');
  }

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      <NavBar />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px' }}>
         
         {/* 1. BIOMETRIC IDENTITY STRIP */}
         <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: '30px', marginBottom: '40px' }}>
            
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '40px', display: 'flex', alignItems: 'center', gap: '30px' }}>
               <div style={{ position: 'relative' }}>
                  <img src={user.avatarUrl || defaultAvatar} alt="Avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #222' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#46d369', width: '25px', height: '25px', borderRadius: '50%', border: '4px solid #111' }}></div>
               </div>
               <div>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{user.name || "Learner"}</h1>
                  <p style={{ color: '#777', margin: '5px 0 15px 0', fontSize: '1.1rem' }}>{user.email}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                     <span style={{ background: 'var(--primary)', padding: '6px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>{user.plan} ACCESS</span>
                     <span style={{ background: '#222', padding: '6px 15px', borderRadius: '20px', fontSize: '0.8rem', color: '#aaa' }}>{user.gender || 'UNSPECIFIED'}</span>
                     <span style={{ background: 'rgba(70,211,105,0.15)', color: '#46d369', border: '1px solid rgba(70,211,105,0.3)', padding: '6px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                       ⏱️ {(user.totalWatchSeconds / 3600).toFixed(2)} Total Hours Spent
                     </span>
                  </div>
               </div>
            </div>

            {/* ⏳ DYNAMIC PLAN MANAGEMENT CONSOLE */}
            <div style={{ background: 'linear-gradient(145deg, #151515, #090909)', border: '1px solid rgba(255,255,255,0.06)', padding: '25px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
               
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#777', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Active Tier</span>
                  <span style={{ 
                    background: user.plan === 'PLATINUM' ? '#e50914' : user.plan === 'GOLD' ? '#f26422' : '#333',
                    color: '#fff', fontSize: '0.7rem', fontWeight: 900, padding: '3px 8px', borderRadius: '4px'
                  }}>{user.plan} PLAN</span>
               </div>

               <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', margin: '5px 0 10px 0' }}>
                  {getDaysRemaining()}
               </div>
               
               <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* 1. UPGRADE TRIGGERS */}
                  {user.plan === 'FREE' && (
                     <a href="/subscribe" style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: '#fff', padding: '12px', textAlign: 'center', borderRadius: '8px', fontWeight: 900, textDecoration: 'none', fontSize: '0.85rem', boxShadow: '0 5px 15px rgba(242,100,34,0.2)' }}>
                        ⚡ UPGRADE TO PREMIUM
                     </a>
                  )}

                  {user.plan === 'GOLD' && (
                     <>
                        <a href="/subscribe" style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg, #e50914 0%, #ff4d4f 100%)', color: '#fff', padding: '12px', textAlign: 'center', borderRadius: '8px', fontWeight: 900, textDecoration: 'none', fontSize: '0.85rem', boxShadow: '0 5px 15px rgba(229,9,20,0.2)' }}>
                           🔥 UPGRADE TO PLATINUM
                        </a>
                        <form action={downgradePlan}>
                           <button type="submit" style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#777', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              ⬇️ Downgrade to Free Tier
                           </button>
                        </form>
                     </>
                  )}

                  {user.plan === 'PLATINUM' && (
                     <>
                        <div style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', color: '#ff4d4f', padding: '10px', textAlign: 'center', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem' }}>
                           🏆 PLATINUM MASTER ACCESS
                        </div>
                        <form action={downgradePlan}>
                           <button type="submit" style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#777', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                              ⬇️ Switch back to Gold Tier
                           </button>
                        </form>
                     </>
                  )}
               </div>

               {/* 🔑 USER REDEMPTION ANCHOR */}
               <a href="/redeem" style={{ display: 'block', marginTop: '15px', textAlign: 'center', fontSize: '0.75rem', color: '#777', textDecoration: 'none', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', fontWeight: 600 }}>
                  🔑 Have a Gift Code? Activate Here →
               </a>
          </div>
       </div>

          {/* 🎁 VYOMA REFERRAL & REWARD CENTER */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(242,100,34,0.05) 0%, rgba(15,22,36,0.6) 100%)', 
            border: '1px solid rgba(242,100,34,0.2)', 
            borderRadius: '24px', 
            padding: '30px', 
            marginBottom: '40px',
            boxShadow: '0 15px 40px rgba(0,0,0,0.5)'
          }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                <div>
                   <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#ffd700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>🎁</span> Vyoma Referral & Reward Center
                   </h2>
                   <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '0.9rem' }}>
                      Invite your friends to Vyoma! Earn <strong style={{ color: '#ffd700' }}>+10 Vyoma Coins</strong> on registration, and unlock exclusive physical and digital rewards!
                   </p>
                </div>
                
                <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', padding: '10px 20px', borderRadius: '15px', textAlign: 'center' }}>
                   <div style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 800, textTransform: 'uppercase' }}>Successful Referrals</div>
                   <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>{referralsCount}</div>
                </div>
             </div>

             {/* Tiers Progress Dashboard */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '25px' }}>
                
                {tiers.map((tier, idx) => {
                  const reward = earnedRewards.find(r => r.referralCount === tier.referralsRequired);
                  const isUnlocked = referralsCount >= tier.referralsRequired;
                  return (
                    <div key={tier.id || idx} style={{ 
                      background: isUnlocked ? 'rgba(70,211,105,0.03)' : 'rgba(255,255,255,0.01)', 
                      border: isUnlocked ? '1px solid rgba(70,211,105,0.2)' : '1px solid rgba(255,255,255,0.03)', 
                      padding: '20px', 
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.7rem', background: '#333', color: '#bbb', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>TIER {idx + 1} ({tier.referralsRequired} REFS)</span>
                            {isUnlocked ? (
                              <span style={{ fontSize: '0.75rem', color: reward?.status === 'DELIVERED' ? '#46d369' : '#ffd700', fontWeight: 'bold' }}>
                                 {reward?.status === 'DELIVERED' ? '✅ CLAIMED / SENT' : '🚚 DISPATCH PENDING'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#777' }}>🔒 {tier.referralsRequired - referralsCount} more to unlock</span>
                            )}
                         </div>
                         <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: 800, color: isUnlocked ? '#fff' : '#666' }}>{tier.rewardName}</h4>
                      </div>
                      <div style={{ marginTop: '15px', width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                         <div style={{ width: `${Math.min(100, (referralsCount / tier.referralsRequired) * 100)}%`, height: '100%', background: isUnlocked ? '#46d369' : '#f26422' }} />
                      </div>
                    </div>
                  );
                })}

             </div>

             {/* Interactive Link Copy component */}
             <ReferralLinkBox userId={user.id} />
          </div>

          {/* 2. ADVANCED ACADEMY ANALYTICS MATRIX */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               📊 Academic Engagement Matrix
            </h2>

            {/* Metric Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
               <div style={metricCard}>
                  <span style={{fontSize: '1.5rem'}}>📚</span>
                  <div>
                     <div style={metricVal}>{activeSyllabi.length}</div>
                     <div style={metricLbl}>View/open</div>
                  </div>
               </div>
               <div style={metricCard}>
                  <span style={{fontSize: '1.5rem'}}>🎯</span>
                  <div>
                     <div style={metricVal}>{totalUnitsCompleted}</div>
                     <div style={metricLbl}>Units Mastered</div>
                  </div>
               </div>
               <div style={metricCard}>
                  <span style={{fontSize: '1.5rem'}}>🎓</span>
                  <div>
                     <div style={metricVal}>{user.certificates.length}</div>
                     <div style={metricLbl}>Certificates Minted</div>
                  </div>
               </div>
               <div style={metricCard}>
                  <span style={{fontSize: '1.5rem'}}>🌟</span>
                  <div>
                     <div style={metricVal}>{completedCoursesCount}</div>
                     <div style={metricLbl}>Fully Completed</div>
                  </div>
               </div>
            </div>

            {/* Constellation Profile (WOW Feature) - Toggleable from backend */}
            {roadmapEnabled && (
              <SkillConstellation syllabi={activeSyllabi} />
            )}

            {/* 3. CINEMATIC "CONTINUE WATCHING & STUDYING" SHELF */}
            <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '24px', padding: '30px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                  <div>
                     <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>▶ Active Curriculum & Learning Tracks</h3>
                     <p style={{ color: '#666', fontSize: '0.85rem', margin: '5px 0 0 0' }}>Pick up right where you left off to continue earning Vyoma Coins.</p>
                  </div>
               </div>

               {activeSyllabi.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #222', borderRadius: '16px' }}>
                     <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🎬</span>
                     <h4 style={{ margin: '0 0 10px 0', color: '#888' }}>Your curriculum queue is empty!</h4>
                     <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '20px' }}>Start streaming any Vyoma course to begin tracking your academic progress here.</p>
                     <Link href="/" style={{ background: 'var(--primary)', color: '#fff', padding: '10px 25px', borderRadius: '30px', textDecoration: 'none', fontWeight: 900, fontSize: '0.9rem' }}>EXPLORE CATALOG</Link>
                  </div>
               ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                     {activeSyllabi.map(item => (
                        <div key={item.course.id} style={{
                           background: '#111', border: '1px solid #222', borderRadius: '16px', overflow: 'hidden',
                           display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease'
                        }}>
                           {/* Thumbnail Strip with overlay */}
                           <div style={{ position: 'relative', paddingTop: '50%', background: '#000' }}>
                              {item.course.thumbnailUrl && (
                                 <img src={item.course.thumbnailUrl} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                              )}
                              <div style={{ position: 'absolute', top: '10px', right: '10px', background: item.percent === 100 ? '#46d369' : '#f26422', color: '#fff', fontSize: '0.7rem', fontWeight: 900, padding: '4px 8px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                 {item.percent}% DONE
                              </div>
                           </div>

                           {/* Course Metrics Block */}
                           <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4em', lineHeight: '1.2' }}>
                                 {item.course.title}
                              </h4>
                              
                              <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
                                 {/* Dynamic Glowing Progress bar */}
                                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777', marginBottom: '5px', fontWeight: 700 }}>
                                    <span>{item.completedCount} / {item.totalEpisodes} Units Mastered</span>
                                 </div>
                                 <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${item.percent}%`, height: '100%', background: 'linear-gradient(to right, #f26422, #ff8c53)', boxShadow: '0 0 8px rgba(242,100,34,0.4)' }}></div>
                                 </div>

                                 {/* Responsive Action Handle */}
                                 <Link 
                                    href={`/watch/${item.course.id}`} 
                                    style={{
                                       marginTop: '20px', display: 'block', textAlign: 'center',
                                       background: item.percent === 100 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                                       color: item.percent === 100 ? '#fff' : '#fff',
                                       padding: '12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 900,
                                       textDecoration: 'none', border: item.percent === 100 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                       boxShadow: item.percent === 100 ? 'none' : '0 10px 25px rgba(242,100,34,0.3)',
                                       transition: 'transform 0.2s'
                                    }}
                                 >
                                    {item.percent === 100 ? '🔄 REVIEW COURSE CURRICULUM' : '▶ CONTINUE WATCHING NOW'}
                                 </Link>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* 4. SECONDARY BODY MATRIX SPLIT */}
         <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '40px' }}>
            
            {/* EDITABLE BIO SETTINGS */}
            <div style={{ background: '#0d0d0d', borderRadius: '20px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
               <div style={{ borderBottom: '1px solid #1a1a1a', padding: '20px 30px', background: '#111' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>⚙️ Personal Dossier Settings</h3>
               </div>
               
               <form action={updateProfile} style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ gridColumn: 'span 2', background: 'rgba(242, 100, 34, 0.05)', border: '1px solid rgba(242, 100, 34, 0.15)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.4rem' }}>🏆</span>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Profile Gamification Quests</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.8rem', marginTop: '5px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ color: '#aaa' }}>✏️ Add Display Name</span>
                        <strong style={{ color: user.nameRewardGiven ? '#46d369' : '#ffd700' }}>
                          {user.nameRewardGiven ? `✅ Earned +${uiCoinsNameReward}` : `💰 +${uiCoinsNameReward} Coin`}
                        </strong>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ color: '#aaa' }}>📋 Complete Full Profile</span>
                        <strong style={{ color: user.profileRewardGiven ? '#46d369' : '#ffd700' }}>
                          {user.profileRewardGiven ? `✅ Earned +${uiCoinsProfileReward}` : `💰 +${uiCoinsProfileReward} Coins`}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                     <label style={labelStyle}>Personal Identity Photo</label>
                     <AvatarUploader currentUrl={user.avatarUrl || ''} />
                  </div>
                  <div>
                     <label style={labelStyle}>Display Name</label>
                     <input required type="text" name="name" defaultValue={user.name || ''} style={inputStyle} />
                  </div>
                  <div>
                     <label style={labelStyle}>Geographic Address</label>
                     <input type="text" name="address" defaultValue={user.address || ''} placeholder="City, State" style={inputStyle} />
                  </div>
                  <div>
                     <label style={labelStyle}>Gender Identity</label>
                     <select name="gender" defaultValue={user.gender || ''} style={inputStyle}>
                        <option value="">Select...</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Prefer not to say</option>
                     </select>
                  </div>
                  <div>
                     <label style={labelStyle}>Current Age <span style={{color: '#f26422'}}>*</span></label>
                     <input required type="number" name="age" defaultValue={user.age || ''} min="1" max="120" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                     <label style={labelStyle}>Personal Interests / Focus Areas</label>
                     <textarea name="interests" defaultValue={user.interests || ''} rows={2} placeholder="Veda, Sanskrit Grammar, Historical Epics..." style={{ ...inputStyle, fontFamily: 'inherit', resize: 'none' }}></textarea>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px' }}>
                     <input type="checkbox" id="consent" name="consent" required style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px', accentColor: '#f26422' }} />
                     <label htmlFor="consent" style={{ color: '#999', fontSize: '0.85rem', cursor: 'pointer', lineHeight: '1.4' }}>
                        I consent to saving my profile information and acknowledge that my details will be stored securely in accordance with the platform's terms of service and privacy policy.
                     </label>
                  </div>
                  <div style={{ gridColumn: 'span 2', borderTop: '1px solid #1a1a1a', paddingTop: '20px', textAlign: 'right' }}>
                     <button type="submit" style={{ background: '#fff', color: '#000', padding: '12px 30px', borderRadius: '8px', fontWeight: 900, border: 'none', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(255,255,255,0.1)' }}>
                        SAVE PROFILE MODIFICATIONS
                     </button>
                  </div>
               </form>
            </div>

            {/* ASSET DRAWER COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               
               {/* WALLET CARTRIDGE */}
               <div style={{ background: 'linear-gradient(135deg, #f26422 0%, #8a3b14 100%)', padding: '25px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(242,100,34,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                     <div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 800 }}>💰 WALLET BALANCE</div>
                        <div style={{ fontSize: '3rem', fontWeight: 900, margin: '5px 0' }}>{user.coins}</div>
                        <div style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.2)', display: 'inline-block', padding: '3px 8px', borderRadius: '4px' }}>VYOMA COINS</div>
                     </div>
                     <div style={{ fontSize: '2.5rem' }}>💎</div>
                  </div>
                  
                  <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px' }}>
                     <form action={redeemCoins}>
                        <button 
                          type="submit" 
                          disabled={user.coins < 1000}
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 900, background: '#fff', color: '#f26422', cursor: user.coins < 1000 ? 'not-allowed' : 'pointer', opacity: user.coins < 1000 ? 0.6 : 1 }}>
                           REDEEM FOR 30 DAYS GOLD
                        </button>
                     </form>
                  </div>
               </div>

               {/* ACADEMY CERTIFICATES */}
               <div style={{ background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '25px' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', fontWeight: 800 }}>🎓 Validated Certificates ({user.certificates.length})</h4>
                  {user.certificates.length === 0 ? (
                     <div style={{ color: '#555', fontSize: '0.8rem', padding: '20px', border: '1px dashed #333', borderRadius: '8px', textAlign: 'center' }}>No credentials earned.</div>
                  ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {user.certificates.slice(0, 3).map(c => (
                           <div key={c.id} style={{ background: '#000', padding: '12px', borderRadius: '8px', border: '1px solid #222', fontSize: '0.8rem' }}>
                              <div style={{ fontWeight: 'bold' }}>{c.course.title}</div>
                              <div style={{ color: '#f26422', fontFamily: 'monospace', fontSize: '0.75rem', marginTop: '3px', fontWeight: 800 }}>SERIAL: {c.code}</div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* RECENT INVOICES */}
               <div style={{ background: '#111', border: '1px solid #222', borderRadius: '20px', padding: '25px' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', fontWeight: 800 }}>🧾 Payment history</h4>
                  {(user.purchases as any[]).length === 0 ? (
                     <div style={{ color: '#555', fontSize: '0.8rem', padding: '20px', border: '1px dashed #333', borderRadius: '8px', textAlign: 'center' }}>No purchases found.</div>
                  ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(user.purchases as any[]).slice(0, 3).map(p => (
                           <Link key={p.id} href={`/invoices/${p.id}`} style={{ textDecoration: 'none', background: '#000', padding: '12px', borderRadius: '8px', border: '1px solid #222', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                 <div style={{ fontWeight: 'bold', color: '#fff' }}>{p.course.title}</div>
                                 <div style={{ color: '#555', fontSize: '0.7rem', marginTop: '2px' }}>Invoice →</div>
                              </div>
                              <div style={{ fontWeight: 900, color: '#fff' }}>₹{p.amount || 0}</div>
                           </Link>
                        ))}
                     </div>
                  )}
               </div>

               {/* LOCKOUT CONTAINER */}
               <div style={{ marginTop: 'auto' }}>
                  <form action={async () => { "use server"; await clearSession(); redirect('/login'); }}>
                     <button type="submit" style={{ width: '100%', border: '1px solid rgba(255,0,0,0.2)', background: 'rgba(255,0,0,0.1)', color: '#ff4444', textAlign: 'center', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                        🔐 SECURE LOG OUT
                     </button>
                  </form>
               </div>

            </div>
         </div>

      </div>
    </main>
  );
}

// Reusable aesthetic UI elements
const labelStyle: React.CSSProperties = {
  display: 'block', color: '#666', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase'
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none'
};

const metricCard: React.CSSProperties = {
  background: '#0d0d0d',
  border: '1px solid #1a1a1a',
  padding: '20px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '15px'
};

const metricVal: React.CSSProperties = {
  fontSize: '1.5rem', fontWeight: 900, color: '#fff'
};

const metricLbl: React.CSSProperties = {
  fontSize: '0.7rem', color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px'
};
