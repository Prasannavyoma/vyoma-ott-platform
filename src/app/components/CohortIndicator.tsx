"use client";

import { useEffect, useState } from 'react';

interface ActiveUser {
  name: string;
  avatarUrl: string;
}

export default function CohortIndicator({ episodeId }: { episodeId: string }) {
  const [activeCount, setActiveCount] = useState(1);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);

  useEffect(() => {
    if (!episodeId) return;

    const fetchCohort = async () => {
      try {
        const res = await fetch(`/api/cohort?episodeId=${episodeId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setActiveCount(data.count);
          setActiveUsers(data.users || []);
        }
      } catch (e) {}
    };

    fetchCohort(); // Initial query
    const interval = setInterval(fetchCohort, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [episodeId]);

  // Color generator for dynamic user names if no avatarUrl
  const colors = ['#f26422', '#ffd700', '#46d369', '#00e5ff', '#9d4edd', '#ff007f'];
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  // Remove fake fallbacks so the count matches reality exactly
  const displayAvatars = [...activeUsers];

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(10px)',
      width: '100%',
      marginBottom: '20px',
      animation: 'cohortPulse 3s infinite alternate'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cohortPulse {
          from { border-color: rgba(255,255,255,0.06); box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
          to { border-color: rgba(242,100,34,0.15); box-shadow: 0 8px 32px rgba(242,100,34,0.05); }
        }
        .avatar-bubble {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: #000;
          border: 2px solid #030b17;
          margin-left: -8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          position: relative;
        }
        .avatar-bubble:first-child {
          margin-left: 0;
        }
        .online-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 8px;
          height: 8px;
          background: #46d369;
          border-radius: 50%;
          border: 1px solid #030b17;
          box-shadow: 0 0 8px #46d369;
        }
      `}} />

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {displayAvatars.slice(0, 3).map((av, idx) => {
          const initials = av.name.slice(0, 1).toUpperCase();
          const bg = getAvatarColor(av.name);
          return (
            <div key={idx} className="avatar-bubble" style={{ background: bg }} title={av.name}>
              {initials}
              <div className="online-dot" />
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1 }}>
        {activeCount === 1 ? (
          <>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
              🌟 <span style={{ color: '#46d369' }}>You</span> are leading the way!
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8f98a9', marginTop: '2px' }}>
              You're the first one studying this module right now
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
              👥 <span style={{ color: '#46d369' }}>{activeCount - 1}</span> other {activeCount - 1 === 1 ? 'Learner' : 'Learners'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8f98a9', marginTop: '2px' }}>
              studying this module with you right now
            </div>
          </>
        )}
      </div>
    </div>
  );
}
