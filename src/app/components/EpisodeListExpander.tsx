"use client";

import { useState } from 'react';
import Link from 'next/link';

interface ExpanderEpisode {
  id: string;
  title: string;
  description: string | null;
  order: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  duration: number | null;
  accessLevel: string;
  isActive: boolean;
  isLocked: boolean;
  durationStr: string;
}

interface EpisodeListExpanderProps {
  episodes: ExpanderEpisode[];
  courseId: string;
  courseThumbnail: string | null;
  room?: string | null;
}

export default function EpisodeListExpander({ episodes, courseId, courseThumbnail, room }: EpisodeListExpanderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Threshold for expanding: show only first 6 episodes initially
  const INITIAL_LIMIT = 6;
  const hasManyEpisodes = episodes.length > INITIAL_LIMIT;
  
  const visibleEpisodes = isExpanded || !hasManyEpisodes 
    ? episodes 
    : episodes.slice(0, INITIAL_LIMIT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Episodes rendering grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {visibleEpisodes.map((ep) => {
          const epThumb = ep.thumbnailUrl || courseThumbnail || '/assets/Ayodhyakanda.jpg';

          return (
            <Link 
              href={ep.isLocked && ep.isActive ? '#' : `/watch/${courseId}?ep=${ep.id}${room ? `&room=${room}` : ''}`} 
              key={ep.id} 
              className={`episode-item ${ep.isActive ? 'active' : ''}`}
            >
              {/* 1. THUMBNAIL WITH STATUS CLUSTER */}
              <div className="episode-thumb-container">
                <img src={epThumb} alt={ep.title ? ep.title.replace(/&amp;/g, '&') : ''} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: ep.isLocked ? 0.4 : 1 }} />
                
                {ep.isLocked ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#000', border: '1px solid #333', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.1rem' }}>🔒</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ep.isActive ? 'rgba(0,0,0,0.3)' : 'transparent' }}>
                    {ep.isActive ? (
                      <div style={{ 
                        background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: '0 0 15px rgba(242,100,34,0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        animation: 'playPulse 1.6s infinite ease-out'
                      }}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ marginLeft: '2px', color: '#fff' }}>
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="episode-play-hover">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.5px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  EPISODE {ep.order}
                </div>
              </div>

              {/* 2. METADATA RENDERER */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                  <h4 style={{ flex: 1, minWidth: '200px', fontSize: '1.2rem', fontWeight: 800, margin: 0, color: ep.isActive ? 'var(--primary)' : '#fff', letterSpacing: '-0.2px', wordBreak: 'break-word' }}>
                    {ep.title ? ep.title.replace(/&amp;/g, '&') : ''}
                  </h4>
                  {ep.durationStr && (
                    <span style={{ color: '#666', fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{ep.durationStr}</span>
                  )}
                </div>
                
                <p style={{ color: '#999', fontSize: '0.92rem', margin: '0 0 15px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                  {ep.description ? ep.description.replace(/&amp;/g, '&') : 'Detailed conceptual module anchored inside the broader curriculum syllabus.'}
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {ep.isLocked ? (
                    <span style={{ background: 'rgba(242, 100, 34, 0.15)', border: '1px solid rgba(242, 100, 34, 0.3)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900', letterSpacing: '0.5px' }}>
                      🔒 {ep.accessLevel?.replace('_', ' ')} PRESCRIBED
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(70, 211, 105, 0.12)', border: '1px solid rgba(70,211,105,0.2)', color: '#46d369', padding: '4px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      ● ACCESS GRANTED
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. SHOW MORE / LESS TOGGLE BUTTON PANEL */}
      {hasManyEpisodes && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '12px 30px',
              borderRadius: '30px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
              boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isExpanded ? (
              <>
                <span>🔼 Show Less</span>
              </>
            ) : (
              <>
                <span>🔽 Show More ({episodes.length - INITIAL_LIMIT} Remaining)</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
