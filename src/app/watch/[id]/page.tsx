import Link from 'next/link';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { incrementView } from '@/app/actions/analytics';
import DownloadButton from '@/app/components/DownloadButton';
import AdaptivePlayer from '@/app/components/AdaptivePlayer';
import CourseEngagement from '@/app/components/CourseEngagement';
import ReviewSystem from '@/app/components/ReviewSystem';
import AssessmentGate from '@/app/components/AssessmentGate';
import CinematicPlayer from '@/app/components/CinematicPlayer';
import WatchNotesManager from '@/app/components/WatchNotesManager';
import CohortIndicator from '@/app/components/CohortIndicator';
import EpisodeListExpander from '@/app/components/EpisodeListExpander';
import TrailerPlayer from '@/app/components/TrailerPlayer';
import WatchlistButton from '@/app/components/WatchlistButton';
import LikeDislikeSystem from '@/app/components/LikeDislikeSystem';
import { getWatchlistStatus, getCourseLikeStatus, getCourseLikesCount } from '@/app/actions/ott';
import { getCurrentUser } from '@/lib/auth';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const courseId = params.id;
  
  let course = null;
  try {
    course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course && courseId.includes('%')) {
      course = await prisma.course.findUnique({
        where: { id: decodeURIComponent(courseId) }
      });
    }
  } catch (e) {}

  if (!course) {
    return {
      title: 'Watch Course | Vyoma OTT',
      description: 'Stream premium educational content on Vyoma OTT.'
    };
  }

  const title = (course as any).metaTitle || `${course.title} | Vyoma OTT`;
  const description = (course as any).metaDescription || course.description || 'Stream premium educational content on Vyoma OTT.';
  const keywords = (course as any).seoKeywords ? (course as any).seoKeywords.split(',').map((k: string) => k.trim()) : undefined;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: [
        {
          url: course.thumbnailUrl || '/assets/Balakanda.jpg',
          alt: (course as any).imageAlt || course.title || 'Course banner'
        }
      ]
    }
  };
}

export default async function WatchPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ ep?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const courseId = params.id;
  const currentEpId = searchParams.ep;
  const room = (searchParams as any).room || null;

  // Fetch authentic user context for tier checks
  const user = await getCurrentUser();

  // Increment ML tracking passively
  incrementView(courseId).catch(e => {});

  // Check custom engagement telemetry & Fetch REAL course
  const [initialCourse, isBookmarked, isLiked, likesCount] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: { 
        episodes: { orderBy: { order: 'asc' } },
        reviews: { where: { approved: true }, include: { user: true }, orderBy: { createdAt: 'desc' } }
      }
    }),
    getWatchlistStatus(courseId),
    getCourseLikeStatus(courseId),
    getCourseLikesCount(courseId)
  ]);

  let course = initialCourse;

  // Adaptive Encoding Fallback Gate
  if (!course && courseId.includes('%')) {
    try {
      course = await prisma.course.findUnique({
        where: { id: decodeURIComponent(courseId) },
        include: { 
          episodes: { orderBy: { order: 'asc' } },
          reviews: { where: { approved: true }, include: { user: true }, orderBy: { createdAt: 'desc' } }
        }
      });
    } catch (e) {}
  }

  // Graceful fallback mock in case db lookup fails/empty
  if (!course) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: '#fff' }}>
         <h2>Course Payload Not Located.</h2>
         <Link href="/" style={{ color: 'red' }}>Return Home</Link>
      </div>
    );
  }

  // Identify currently selected episode (defaults to last watched episode, falling back to first episode if none watched yet)
  let activeEpisode: any = null;
  let initialPosition = 0;

  if (course.episodes.length > 0) {
    if (currentEpId) {
      activeEpisode = course.episodes.find((e: any) => e.id === currentEpId) || course.episodes[0];
    } else if (user) {
      // Passive lookup of the most recently watched/updated episode of this course for this user
      const lastWatchedProgress = await prisma.progress.findFirst({
        where: {
          userId: user.id,
          episode: { courseId: course.id }
        },
        orderBy: { updatedAt: 'desc' },
        include: { episode: true }
      });
      activeEpisode = lastWatchedProgress?.episode || course.episodes[0];
    } else {
      activeEpisode = course.episodes[0];
    }

    // Determine saving playback seconds if user has started watching this active episode
    if (user && activeEpisode) {
      const activeProgress = await prisma.progress.findUnique({
        where: {
          userId_episodeId: {
            userId: user.id,
            episodeId: activeEpisode.id
          }
        }
      });
      if (activeProgress && !activeProgress.completed) {
        initialPosition = activeProgress.position || 0;
      }
    }
  }

// Identify the next episode in the sequence for AutoPlay Countdown
  let nextEpUrl = undefined;
  let nextEpTitle = undefined;
  if (course.episodes.length > 0 && activeEpisode) {
    const activeIdx = course.episodes.findIndex((e: any) => e.id === activeEpisode.id);
    if (activeIdx !== -1 && activeIdx < course.episodes.length - 1) {
      const nextEp = course.episodes[activeIdx + 1];
      nextEpUrl = `/watch/${course.id}?ep=${nextEp.id}`;
      nextEpTitle = nextEp.title;
    }
  }

  // AUTHENTIC ACCESS LEVEL AUDITING (Supports dual course/episode granularity and explicit intervals)
  function checkAccess(required: string | null | undefined): boolean {
    if (!required || required === 'FREE') return true;
    
    const tier = user?.plan || 'FREE';
    const interval = user?.planInterval || 'YEARLY';

    // Gold Base Verification (Matches Gold or Platinum users)
    if (required === 'GOLD' || required === 'GOLD_MONTHLY') {
      return tier === 'GOLD' || tier === 'PLATINUM';
    }
    if (required === 'GOLD_YEARLY') {
      if (tier === 'PLATINUM') return true; // Platinum overrides Gold Year
      return tier === 'GOLD' && interval === 'YEARLY';
    }

    // Platinum Base Verification (Matches Platinum users only)
    if (required === 'PLATINUM' || required === 'PLATINUM_MONTHLY') {
      return tier === 'PLATINUM';
    }
    if (required === 'PLATINUM_YEARLY') {
      return tier === 'PLATINUM' && interval === 'YEARLY';
    }

    // Individual Course Checkout Verification
    if (required === 'PAID') {
      return user?.purchases?.some(p => p.courseId === course?.id) || false;
    }
    
    return false;
  }

  // DUAL COMPONENT LEVEL GATING
  const isCourseLocked = !checkAccess(course.accessLevel);
  const isEpisodeLocked = activeEpisode ? !checkAccess(activeEpisode.accessLevel) : false;
  const isLocked = isCourseLocked || isEpisodeLocked;

  // Determine active thumbnail to display (Episode priority if it has distinct art, satisfying USER requirement 3)
  const activePosterUrl = activeEpisode?.thumbnailUrl || course.thumbnailUrl || '/assets/Ayodhyakanda.jpg';
  
  // Determine textual lock label (Prioritizes episode restriction context)
  const displayRequiredLevel = isEpisodeLocked ? activeEpisode?.accessLevel : course.accessLevel;

  // Fetch note if exists for active user
  let noteContent = "";
  try {
    if (user) {
      const note = await prisma.userNote.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.id } } });
      noteContent = note?.content || "";
    }
  } catch(e) {}

  // Final playback determination
  const playUrl = activeEpisode?.videoUrl || "https://digitalsanskrit.b-cdn.net/Videos/Raghuveera_Gadyam_Chanting/01_Balakanda.mp4"; // Fallback
  const displayTitle = activeEpisode ? `${course.title} - ${activeEpisode.title}` : course.title;

  // Fetch interactive markers for WOW features
  let markers: any[] = [];
  if (activeEpisode?.id) {
    markers = await prisma.videoMarker.findMany({
      where: { episodeId: activeEpisode.id }
    });
  }

  return (
    <div style={{ 
      background: '#030b17', 
      minHeight: '100vh', 
      color: '#fff', 
      fontFamily: 'Outfit, system-ui, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* IMMERSIVE BACKGROUND BLUR EFFECT */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '90vh',
        background: `url('${activePosterUrl}') center/cover no-repeat`,
        opacity: 0.25,
        filter: 'blur(80px) saturate(150%)',
        zIndex: 0,
        pointerEvents: 'none',
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
      }} />

      <div style={{ position: 'relative', zIndex: 10 }}>
        <header style={{ padding: '25px 4%', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px', width: '100%' }}>
          <Link href="/" className="back-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '30px', textDecoration: 'none', color: '#fff', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', backdropFilter: 'blur(12px)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: '1.2rem' }}>←</span> <span style={{ opacity: 0.9 }}>Browse</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
             <span style={{ background: 'linear-gradient(135deg, rgba(242,100,34,0.2), rgba(242,100,34,0.05))', color: '#f26422', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1.5px', border: '1px solid rgba(242,100,34,0.3)', boxShadow: '0 0 15px rgba(242,100,34,0.2)' }}>
               NOW PLAYING
             </span>
             <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
               {course.title ? course.title.replace(/&amp;/g, '&') : ''}
             </h1>
          </div>
        </header>

        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '10px 4% 60px' }}>
          
          <div className="watch-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>
           
           {/* MAIN PLAYER AREA / OTT LOCK GATEWAY */}
           <div>
             
             {isLocked ? (
                /* PREMIUM OTT DYNAMIC LOCK OVERLAY WITH EPISODE POSTER REVEAL */
                <div style={{ 
                  position: 'relative', 
                  aspectRatio: '16/9',
                  minHeight: '400px',
                  width: '100%', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  background: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.55)), url('${activePosterUrl}') center/cover no-repeat`
                }}>
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    backdropFilter: 'blur(1px)', display: 'flex', flexDirection: 'column', 
                    justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px' 
                  }}>
                    
                    {/* GLOWING LOCK CLUSTER */}
                    <div style={{ position: 'relative', marginBottom: '20px' }}>
                       <div style={{ 
                         width: '90px', height: '90px', background: 'rgba(255, 255, 255, 0.08)', 
                         borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', 
                         display: 'flex', alignItems: 'center', justifyContent: 'center', 
                         boxShadow: '0 10px 40px rgba(0,0,0,0.5)' 
                       }}>
                          <span style={{ fontSize: '3rem' }}>🔒</span>
                       </div>
                       <div style={{ 
                         position: 'absolute', bottom: '-5px', right: '-5px', 
                         background: '#f26422', color: '#fff', fontSize: '0.65rem', 
                         fontWeight: 900, padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase' 
                       }}>
                         {displayRequiredLevel?.replace('_', ' ')}
                       </div>
                    </div>

                    <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px', color: '#fff', textShadow: '0 4px 15px rgba(0,0,0,0.9)' }}>
                      Premium Access Required
                    </h3>
                    
                    <p style={{ maxWidth: '450px', color: '#eee', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '25px', fontWeight: 500, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                      This content is restricted to <strong style={{ color: 'var(--primary)' }}>{displayRequiredLevel?.replace('_', ' ')}</strong> Tier Members. 
                      {displayRequiredLevel === 'PAID' ? ' You can purchase absolute individual lifetime access below.' : ' Upgrade your plan instantly to unlock access.'}
                    </p>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
                       <Link href="/subscribe" style={{ 
                         background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', 
                         color: '#fff', textDecoration: 'none', padding: '14px 30px', 
                         borderRadius: '30px', fontWeight: 900, fontSize: '0.9rem', 
                         letterSpacing: '1px', boxShadow: '0 10px 30px rgba(242,100,34,0.3)',
                         transition: 'transform 0.2s'
                       }}>
                         🚀 UPGRADE PLAN NOW
                       </Link>
                       
                       <Link href={`/checkout/${courseId}`} style={{ 
                         background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                         color: '#fff', textDecoration: 'none', padding: '14px 30px', 
                         borderRadius: '30px', fontWeight: 900, fontSize: '0.9rem', 
                         letterSpacing: '1px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                         transition: 'transform 0.2s'
                       }}>
                         🏷️ BUY SEPARATELY (₹{course.price || 299})
                       </Link>
                        {(course as any).trailerUrl && (
                          <TrailerPlayer trailerUrl={(course as any).trailerUrl} title={course.title} />
                        )}
                    </div>

                  </div>
                </div>
              ) : (
               /* ULTRA PREMIUM CINEMATIC PLAYER WITH AMBILIGHT AND OVERLAYS */
               <CinematicPlayer 
                 url={playUrl} 
                 poster={activeEpisode?.thumbnailUrl || course.thumbnailUrl || undefined} 
                 episodeId={activeEpisode?.id}
                 courseId={course.id}
                 markers={markers}
                 nextEpisodeUrl={nextEpUrl}
                 nextEpisodeTitle={nextEpTitle}
                 initialPosition={initialPosition}
                 subtitleUrl={(activeEpisode as any)?.subtitleUrl || undefined}
                />
             )}
             
             {/* CONTENT METADATA & ACTIONS (GLASSMORPHIC) */}
             <div style={{ 
               marginTop: '30px', 
               background: 'rgba(255,255,255,0.02)', 
               borderRadius: '16px', 
               padding: '30px', 
               border: '1px solid rgba(255,255,255,0.05)', 
               boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
             }}>
                {/* CINEMATIC DOT-SEPARATED METADATA (JioCinema / Hotstar style) */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap',
                  alignItems: 'center', 
                  gap: '10px', 
                  fontSize: '0.95rem', 
                  fontWeight: 700, 
                  color: '#aaa', 
                  marginBottom: '15px',
                  letterSpacing: '0.5px' 
                }}>
                   <span style={{ color: '#46d369' }}>99% Match</span>
                   <span style={{ color: '#444', fontSize: '0.7rem' }}>●</span>
                   <span>HD</span>
                   <span style={{ color: '#444', fontSize: '0.7rem' }}>●</span>
                   <span style={{ 
                     background: 'var(--primary)', 
                     color: '#fff', 
                     padding: '2px 8px', 
                     borderRadius: '4px', 
                     fontSize: '0.75rem', 
                     fontWeight: 900,
                     letterSpacing: '0.5px' 
                   }}>
                     {course.accessLevel?.replace('_', ' ')}
                   </span>
                   {course.category && (
                     <>
                       <span style={{ color: '#444', fontSize: '0.7rem' }}>●</span>
                       <span style={{ color: '#888' }}>{course.category ? course.category.replace(/&amp;/g, '&') : ''}</span>
                     </>
                   )}
                </div>

                {/* MAIN COURSE TITLE - GRADIENT WOW EFFECT */}
                <h1 className="watch-title" style={{
                  fontSize: '3.2rem',
                  fontWeight: 900,
                  letterSpacing: '-1.5px',
                  lineHeight: 1.1,
                  marginBottom: '15px',
                  background: 'linear-gradient(to right, #ffffff, #b0b8c7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  {course.title ? course.title.replace(/&amp;/g, '&') : ''}
                </h1>

                {/* ACTIVE EPISODE SUBTITLE (If viewing specific sequence) */}
                {activeEpisode && activeEpisode.title !== course.title && (
                  <h3 className="active-episode-title" style={{ 
                    fontSize: '1.6rem', 
                    fontWeight: 800, 
                    color: 'var(--primary)', 
                    margin: '0 0 20px 0', 
                    letterSpacing: '-0.5px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ 
                      fontSize: '0.85rem', 
                      background: 'rgba(242,100,34,0.15)', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      border: '1px solid rgba(242,100,34,0.3)',
                      color: '#fff',
                      textShadow: 'none',
                      boxShadow: '0 4px 10px rgba(242,100,34,0.2)'
                    }}>EPISODE</span>
                    {activeEpisode.title ? activeEpisode.title.replace(/&amp;/g, '&') : ''}
                  </h3>
                )}

                <p className="watch-description" style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  lineHeight: '1.7', 
                  maxWidth: '850px', 
                  fontSize: '1.12rem',
                  fontWeight: 500,
                  marginTop: '20px',
                  marginBottom: '30px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}>
                  {course.description ? course.description.replace(/&amp;/g, '&') : ''}
                </p>
                
                <CourseEngagement courseId={course.id} initialNote={noteContent}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                     
                     {/* DYNAMIC BOOKMARK TOGGLE */}
                     <WatchlistButton courseId={course.id} initialStatus={isBookmarked} />

                     {/* DYNAMIC SENTIMENT TRACKING */}
                     <LikeDislikeSystem courseId={course.id} initialStatus={isLiked} initialLikesCount={likesCount} />

                     {/* CINEMATIC PLAYBACK TEASER */}
                     {(course as any).trailerUrl && (
                       <TrailerPlayer trailerUrl={(course as any).trailerUrl} title={course.title} />
                     )}

                     {/* COMPILING DOWNSTREAM TRIGGERS */}
                     {!isLocked && (
                       <div style={{ marginLeft: 'auto' }}>
                         <DownloadButton videoUrl={playUrl} courseTitle={displayTitle} />
                       </div>
                     )}
                  </div>
                </CourseEngagement>

                {/* HOTSTAR STYLE EPISODES DISPLAY - ONLY RENDERS FOR MULTI-EPISODE SERIES AS PER USER REQUEST */}
                {course.episodes.length > 1 && (() => {
                  const processedEpisodes = course.episodes.map((ep) => ({
                    ...ep,
                    isActive: activeEpisode?.id === ep.id,
                    isLocked: !checkAccess(ep.accessLevel) || isCourseLocked,
                    durationStr: ep.duration ? `${Math.floor(ep.duration / 60)}m ${ep.duration % 60}s` : ''
                  }));

                  return (
                    <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginBottom: '40px' }}>
                       <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '25px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>📺</span> Episodes ({course.episodes.length})
                       </h3>
                       
                       <EpisodeListExpander 
                         episodes={processedEpisodes} 
                         courseId={courseId} 
                         courseThumbnail={course.thumbnailUrl} 
                         room={room}
                       />
                    </div>
                  );
                })()}
                
                 <ReviewSystem courseId={course.id} reviews={course.reviews || []} />
             </div>
           </div>

           {/* STICKY NOTE SIDEBAR INTEGRATION (GLASSMORPHIC TWEAKS) */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ position: 'sticky', top: '20px' }}>
                <CohortIndicator episodeId={activeEpisode?.id || ''} />
                <WatchNotesManager courseId={course.id} initialNote={noteContent} />

                {/* RESPONSIVE UNLOCK GATEWAY */}
                <div style={{ marginTop: '25px' }}>
                  <AssessmentGate courseId={course.id} />
                </div>
              </div>
           </div>

        </div>

        </div>
      </div>
    </div>
  );
}
