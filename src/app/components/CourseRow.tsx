"use client";

import { useRef } from 'react';
import Link from 'next/link';
import HoverVideoPlayer from './HoverVideoPlayer';

interface CourseRowProps {
  title: string;
  courses: any[];
}

export default function CourseRow({ title, courses }: CourseRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div className="row" style={{ position: 'relative', overflow: 'visible' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', paddingRight: '20px' }}>
        <h2 className="row-title" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', zIndex: 1, margin: 0 }}>{title ? title.replace(/&amp;/g, '&') : ''}</h2>
        <Link href={`/explore?filter=${encodeURIComponent(title)}`} style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold', textDecoration: 'none' }}>
          View All →
        </Link>
      </div>
      
      <div style={{ position: 'relative', overflow: 'visible' }} className="group-hover-controls">
        {/* Modernized Scroll Arrows */}
        <button 
          onClick={() => scroll('left')} 
          className="scroll-arrow scroll-arrow-left"
          aria-label="Scroll Left"
        >
          ❮
        </button>
        
        <button 
          onClick={() => scroll('right')} 
          className="scroll-arrow scroll-arrow-right"
          aria-label="Scroll Right"
        >
          ❯
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
              <Link href={watchUrl} key={i} className="poster" style={{ position: 'relative' }}>
                <HoverVideoPlayer 
                  posterUrl={course.image} 
                  videoUrl={course.trailerUrl} 
                  altText={course.imageAlt || (course.title ? course.title.replace(/&amp;/g, '&') : '')} 
                />
                
                {/* NEWLY ADDED RIBBON */}
                {course.showRibbon && (
                   <div className="new-ribbon">Newly Added</div>
                )}
                
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
                       <span className="poster-tag">{course.tag}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <button 
          onClick={() => scroll('right')} 
          style={{
            position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)',
            zIndex: 60, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
            width: '40px', height: '60px', cursor: 'pointer', borderRadius: '4px',
            opacity: 0.7, transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
        >
          ❯
        </button>
      </div>
    </div>
  );
}
