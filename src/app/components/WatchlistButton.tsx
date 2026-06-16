"use client";

import { useState } from 'react';
import { toggleWatchlist } from '@/app/actions/ott';

interface WatchlistButtonProps {
  courseId: string;
  initialStatus: boolean;
}

export default function WatchlistButton({ courseId, initialStatus }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialStatus);
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    if (isPending) return;
    setIsPending(true);
    
    // Optimistic UI Update
    setIsInWatchlist(prev => !prev);

    try {
      const res = await toggleWatchlist(courseId);
      if (res && res.success) {
        setIsInWatchlist(res.isAdded || false);
      } else {
        // Revert on fail
        setIsInWatchlist(prev => !prev);
      }
    } catch (e) {
      setIsInWatchlist(prev => !prev);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 25px',
        background: isInWatchlist ? 'rgba(70, 211, 105, 0.15)' : 'rgba(255, 255, 255, 0.08)',
        border: `1px solid ${isInWatchlist ? 'rgba(70, 211, 105, 0.5)' : 'rgba(255, 255, 255, 0.15)'}`,
        borderRadius: '30px',
        color: isInWatchlist ? '#46d369' : '#fff',
        fontWeight: 800,
        fontSize: '0.95rem',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
      }}
      onMouseEnter={(e) => {
        if (!isPending) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.background = isInWatchlist ? 'rgba(70, 211, 105, 0.25)' : 'rgba(255, 255, 255, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = isInWatchlist ? 'rgba(70, 211, 105, 0.15)' : 'rgba(255, 255, 255, 0.08)';
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>
        {isInWatchlist ? '✔' : '＋'}
      </span>
      {isInWatchlist ? 'In My List' : 'My List'}
    </button>
  );
}
