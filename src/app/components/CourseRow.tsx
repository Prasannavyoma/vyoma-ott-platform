"use client";

import { useRef } from 'react';
import Link from 'next/link';
import HoverVideoPlayer from './HoverVideoPlayer';

interface CourseRowProps {
  title: string;
  courses: any[];
  icon?: React.ReactNode;
  viewAllHref?: string;
  sectionId?: string;
}

function resolveViewAllHref(title: string, customHref?: string): string {
  if (customHref) return customHref;
  const t = (title || '').toLowerCase().trim();

  // 1. Continue Watching
  if (t.includes('continue watching') || t.includes('watch history')) {
    return '/progress';
  }

  // 2. My List / Favorites
  if (t.includes('my list') || t.includes('favorite') || t.includes('watchlist')) {
    return '/watchlist';
  }

  // 3. Inspired by your Interests
  if (t.includes('interest') || t.includes('inspired')) {
    return '/interests';
  }

  // 4. Must Read E-Books
  if (t.includes('e-book') || t.includes('ebook')) {
    return '/ebook';
  }

  // 5. Evergreen Epics & Puranas
  if (t.includes('epic') || t.includes('purana')) {
    return '/genre/Evergreen-Epics-&-Puranas';
  }

  // 6. Featured Podcasts / Audiobooks
  if (t.includes('podcast')) {
    return '/podcast';
  }
  if (t.includes('audiobook')) {
    return '/audiobook';
  }

  // 7. Popular Videos / Video Library
  if (t.includes('video')) {
    return '/video';
  }

  // 8. Interactive Games
  if (t.includes('game')) {
    return '/game';
  }

  // 9. Kids Academy
  if (t.includes('kid')) {
    return '/genre/Kids';
  }

  // 10. Flagship Courses
  if (t.includes('flagship') || t.includes('paid')) {
    return '/explore?access=PAID';
  }

  // 11. Trending Now
  if (t.includes('trending')) {
    return '/explore?sort=Most+Viewed';
  }

  // Default to genre or explore
  const cleanSlug = title.replace(/📖|🌟|🎙️|📽️|🎮|👶|🌸/g, '').trim().replace(/\s+/g, '-');
  return `/genre/${encodeURIComponent(cleanSlug)}`;
}

export default function CourseRow({ title, courses, icon, viewAllHref, sectionId }: CourseRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const targetLink = resolveViewAllHref(title, viewAllHref);

  const resolvedSectionId = sectionId || `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  const recordPosition = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vyoma_last_section', resolvedSectionId);
      sessionStorage.setItem('vyoma_scroll_y', window.scrollY.toString());
    }
  };

  const separator = targetLink.includes('?') ? '&' : '?';
  const finalViewAllLink = targetLink.includes('from=') ? targetLink : `${targetLink}${separator}from=${resolvedSectionId}`;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div id={resolvedSectionId} className="row" style={{ position: 'relative', overflow: 'visible', scrollMarginTop: '110px' }}>
      <div className="course-row-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', paddingRight: '20px' }}>
        <h2 className="row-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', zIndex: 1, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {icon && <span style={{ color: 'var(--primary)' }}>{icon}</span>}
          {title ? title.replace(/&amp;/g, '&') : ''}
        </h2>
        <Link 
          href={finalViewAllLink} 
          onClick={recordPosition}
          style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold', textDecoration: 'none' }}
        >
          View All →
        </Link>
      </div>
      
      <div style={{ position: 'relative', overflow: 'visible' }} className="group-hover-controls course-row-track">
        {/* Modernized Scroll Arrows */}
        <button 
          onClick={() => scroll('left')} 
          className="scroll-arrow scroll-arrow-left"
          aria-label="Scroll Left"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        
        <button 
          onClick={() => scroll('right')} 
          className="scroll-arrow scroll-arrow-right"
          aria-label="Scroll Right"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>

        <div 
          ref={scrollRef} 
          className="row-posters" 
          style={{ display: 'flex', gap: '15px', overflowX: 'scroll', scrollBehavior: 'smooth', scrollbarWidth: 'none' }}
        >
          {courses.map((course, i) => {
            const watchUrl = course.episodeId 
              ? `/watch/${course.id}?ep=${course.episodeId}` 
              : `/watch/${course.id}`;

            return (
              <Link 
                href={watchUrl} 
                key={i} 
                className="poster" 
                style={{ position: 'relative' }}
                onClick={recordPosition}
              >
                <HoverVideoPlayer 
                  posterUrl={course.image} 
                  videoUrl={course.trailerUrl} 
                  altText={course.imageAlt || (course.title ? course.title.replace(/&amp;/g, '&') : '')} 
                />
                
                {/* NEWLY ADDED RIBBON */}
                {course.showRibbon && (
                   <div className="new-ribbon">Newly Added</div>
                )}

                {/* ACCESS TIER BADGE ON TOP-RIGHT */}
                {course.tag && (() => {
                  const tagUpper = String(course.tag).toUpperCase();
                  const isPlatinum = tagUpper.startsWith('PLATINUM');
                  const isGold = tagUpper.startsWith('GOLD');
                  const isFree = tagUpper === 'FREE';

                  const badgeBg = isPlatinum
                    ? 'linear-gradient(135deg, #ffffff 0%, #e5e4e2 50%, #b0b0b0 100%)'
                    : isGold
                      ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #b8860b 100%)'
                      : isFree
                        ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)'
                        : 'rgba(70, 211, 105, 0.2)';

                  const badgeBorder = isPlatinum
                    ? '1px solid rgba(255,255,255,0.6)'
                    : isGold
                      ? '1px solid rgba(255,235,100,0.6)'
                      : isFree
                        ? '1px solid rgba(134,239,172,0.7)'
                        : 'none';

                  const icon = isPlatinum ? '💎' : isGold ? '👑' : isFree ? '🔓' : '🏷️';
                  const label = course.tag.replace(/_/g, ' ');

                  return (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: badgeBg,
                      color: (isPlatinum || isGold || isFree) ? '#000' : '#46d369',
                      border: badgeBorder,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontSize: '0.62rem',
                      fontWeight: 900,
                      letterSpacing: '0.4px',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  );
                })()}
                
                {/* GLOWING PROGRESS TRACK FOR IN-PROGRESS VIDEOS */}
                {course.progressPercent !== undefined && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)', zIndex: 5 }}>
                    <div style={{ height: '100%', width: `${course.progressPercent}%`, background: '#f26422', boxShadow: '0 0 8px rgba(242,100,34,0.8)' }} />
                  </div>
                )}

                <div className="middle-play-btn">
                  <svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
                </div>

                <div className="poster-overlay">
                  <div className="poster-actions">
                    <div className="action-pill circle-btn">+</div>
                    <div className="action-pill circle-btn">👍</div>
                  </div>
                  <div className="poster-title">{course.title ? course.title.replace(/&amp;/g, '&') : ''}</div>
                  {course.subTitle && <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '5px', color: 'var(--primary)' }}>{course.subTitle ? course.subTitle.replace(/&amp;/g, '&') : ''}</div>}
                  <div className="poster-meta">
                    <span style={{color: '#46d369', fontWeight: 'bold'}}>{course.match}</span>
                    {course.durationLeftStr ? (
                       <span className="poster-tag" style={{ background: '#f26422' }}>{course.durationLeftStr}</span>
                    ) : (
                       (() => {
                         const tagUpper = String(course.tag || '').toUpperCase();
                         const isPlatinum = tagUpper.startsWith('PLATINUM');
                         const isGold = tagUpper.startsWith('GOLD');
                         const isFree = tagUpper === 'FREE';

                         const bg = isPlatinum 
                           ? 'linear-gradient(135deg, #e5e4e2, #b0b0b0)' 
                           : isGold 
                             ? 'linear-gradient(135deg, #ffd700, #b8860b)' 
                             : isFree 
                               ? 'linear-gradient(135deg, #4ade80, #16a34a)' 
                               : 'var(--primary)';

                         const border = isPlatinum
                           ? '1px solid rgba(255,255,255,0.6)'
                           : isGold
                             ? '1px solid rgba(255,235,100,0.6)'
                             : isFree
                               ? '1px solid rgba(134,239,172,0.7)'
                               : 'none';

                         const icon = isPlatinum ? '💎 ' : isGold ? '👑 ' : isFree ? '🔓 ' : '';
                         const label = course.tag ? course.tag.replace(/_/g, ' ') : '';

                         return (
                           <span className="poster-tag" style={{
                             background: bg,
                             color: (isPlatinum || isGold || isFree) ? '#000' : '#fff',
                             border: border,
                             fontWeight: 800
                           }}>
                             {icon}{label}
                           </span>
                         );
                       })()
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
