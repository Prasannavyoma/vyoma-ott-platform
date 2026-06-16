"use client";

import { useState } from 'react';
import { toggleCourseLike } from '@/app/actions/ott';

interface LikeDislikeSystemProps {
  courseId: string;
  initialStatus: boolean | null; // true=Like, false=Dislike, null=None
  initialLikesCount: number;
}

export default function LikeDislikeSystem({ courseId, initialStatus, initialLikesCount }: LikeDislikeSystemProps) {
  const [activeStatus, setActiveStatus] = useState<boolean | null>(initialStatus);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [isPending, setIsPending] = useState(false);

  async function handleRate(isLike: boolean) {
    if (isPending) return;
    setIsPending(true);

    const prevStatus = activeStatus;
    
    // Optimistic rating change
    setActiveStatus(prev => {
      if (prev === isLike) return null; // clicking same thing removes rating
      return isLike;
    });

    // Optimistic likes count update
    setLikesCount(prev => {
      if (prevStatus === true) {
        // Transition from Liked to Disliked or Unrated decreases count
        return prev - 1;
      }
      if (isLike === true) {
        // Transition from Disliked or Unrated to Liked increases count
        return prev + 1;
      }
      return prev;
    });

    try {
      const res = await toggleCourseLike(courseId, isLike);
      if (res && res.success) {
        // Use exact backend synchronized state
        setActiveStatus(res.activeStatus === undefined ? null : res.activeStatus);
        if (res.likesCount !== undefined) {
          setLikesCount(res.likesCount);
        }
      }
    } catch (e) {
      // Revert on error
      setActiveStatus(prevStatus);
      setLikesCount(initialLikesCount);
    } finally {
      setIsPending(false);
    }
  }

  const btnBaseStyle = {
    height: '40px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
      
      {/* 👍 LIKE BUTTON PILL */}
      <button
        onClick={() => handleRate(true)}
        disabled={isPending}
        style={{
          ...btnBaseStyle,
          padding: '0 16px',
          borderRadius: '20px',
          background: activeStatus === true ? 'rgba(70, 211, 105, 0.25)' : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${activeStatus === true ? '#46d369' : 'rgba(255, 255, 255, 0.15)'}`,
          color: '#fff',
          gap: '6px',
          fontSize: '1rem'
        }}
        onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="I like this"
      >
        <span>👍</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: activeStatus === true ? '#46d369' : '#ccc' }}>
          {likesCount}
        </span>
      </button>

      {/* 👎 DISLIKE BUTTON CIRCLE */}
      <button
        onClick={() => handleRate(false)}
        disabled={isPending}
        style={{
          ...btnBaseStyle,
          width: '40px',
          borderRadius: '50%',
          background: activeStatus === false ? 'rgba(255, 77, 79, 0.25)' : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${activeStatus === false ? '#ff4d4f' : 'rgba(255, 255, 255, 0.15)'}`,
          color: '#fff',
          fontSize: '1rem'
        }}
        onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.transform = 'scale(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        title="Not for me"
      >
        👎
      </button>

    </div>
  );
}
