"use client";

import React, { useState } from 'react';
import { useGlobalPlayer } from './GlobalPlayerProvider';
import { Chapter, seekToTimestamp } from '@/lib/timestamps';

interface VideoChaptersListProps {
  chapters: Chapter[];
  courseTitle?: string;
}

export default function VideoChaptersList({ chapters, courseTitle }: VideoChaptersListProps) {
  const { currentTime } = useGlobalPlayer();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!chapters || chapters.length === 0) {
    return null;
  }

  // Find currently active chapter based on playhead position
  let activeIndex = -1;
  for (let i = 0; i < chapters.length; i++) {
    if (currentTime >= chapters[i].timestamp) {
      activeIndex = i;
    } else {
      break;
    }
  }

  const handleCopyChapterLink = (e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('t', String(chapter.timestamp));
    navigator.clipboard.writeText(url.toString());
    setCopiedId(chapter.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div style={{
      marginTop: '25px',
      marginBottom: '25px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* HEADER */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>📑</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Key Moments & Chapters</span>
              <span style={{
                background: 'rgba(242, 100, 34, 0.2)',
                color: '#f26422',
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 900
              }}>
                {chapters.length}
              </span>
            </h4>
            {activeIndex >= 0 && (
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '3px' }}>
                Now: <span style={{ color: '#f26422', fontWeight: 700 }}>{chapters[activeIndex].title}</span> ({chapters[activeIndex].timeStr})
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#777', fontWeight: 600 }}>
            {isCollapsed ? 'Show all' : 'Collapse'}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#888', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </div>
      </div>

      {/* CHAPTERS ACCORDION BODY */}
      {!isCollapsed && (
        <div style={{
          maxHeight: '380px',
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {chapters.map((ch, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={ch.id}
                onClick={() => seekToTimestamp(ch.timestamp)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: isActive 
                    ? 'linear-gradient(90deg, rgba(242, 100, 34, 0.15), rgba(242, 100, 34, 0.05))' 
                    : 'rgba(255, 255, 255, 0.015)',
                  border: isActive 
                    ? '1px solid rgba(242, 100, 34, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, paddingRight: '10px' }}>
                  {/* PLAYING OR TIME BADGE */}
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    background: isActive ? '#f26422' : 'rgba(255, 255, 255, 0.06)',
                    color: isActive ? '#fff' : '#aaa',
                    border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}>
                    {isActive ? '▶' : '⏱'} {ch.timeStr}
                  </span>

                  {/* CHAPTER TITLE */}
                  <span style={{
                    fontSize: '0.92rem',
                    fontWeight: isActive ? 800 : 500,
                    color: isActive ? '#fff' : '#ccc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {ch.title}
                  </span>
                </div>

                {/* COPY LINK AT THIS TIMESTAMP BUTTON */}
                <button
                  onClick={(e) => handleCopyChapterLink(e, ch)}
                  title={`Copy link at ${ch.timeStr}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedId === ch.id ? '#46d369' : '#666',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    transition: 'color 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (copiedId !== ch.id) e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    if (copiedId !== ch.id) e.currentTarget.style.color = '#666';
                  }}
                >
                  {copiedId === ch.id ? (
                    <>
                      <span>✓</span>
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <span>🔗</span>
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
