"use client";
import React, { useEffect, useRef, useState } from 'react';

interface Short {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
}

export default function ShortsFeedClient({ shorts }: { shorts: Short[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          const video = videoRefs.current[index];
          if (entry.isIntersecting) {
            setActiveIdx(index);
            if (video) {
              video.currentTime = 0;
              video.play().catch(e => console.log("Autoplay prevented", e));
            }
          } else {
            if (video) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.6 }
    );

    const container = containerRef.current;
    if (container) {
      Array.from(container.children).forEach((child) => observer.observe(child));
    }

    return () => observer.disconnect();
  }, [shorts]);

  return (
    <div 
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        maxWidth: '450px', // Mobile aspect ratio constraint
        margin: '0 auto',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none'  // IE
      }}
      className="hide-scrollbar"
    >
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .short-container {
          position: relative;
          height: 100%;
          width: 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .short-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .short-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          color: white;
        }
        .short-details {
          flex: 1;
          padding-right: 20px;
        }
        .short-actions {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }
        .action-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 50%;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: white;
          cursor: pointer;
          backdrop-filter: blur(5px);
          transition: background 0.2s;
        }
        .action-btn:hover {
          background: rgba(255,255,255,0.2);
        }
      `}} />

      {shorts.map((short, idx) => (
        <div key={short.id} data-index={idx} className="short-container">
          <video
            ref={(el) => { videoRefs.current[idx] = el; }}
            src={short.videoUrl}
            className="short-video"
            poster={short.thumbnailUrl}
            loop
            playsInline
            muted={idx !== activeIdx} // Mute inactive to satisfy browser policies
            onClick={(e) => {
              const v = e.currentTarget;
              if (v.paused) v.play();
              else v.pause();
            }}
          />
          
          <div className="short-overlay">
            <div className="short-details">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px', textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                {short.title}
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#ccc', textShadow: '1px 1px 3px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {short.description}
              </p>
            </div>
            <div className="short-actions">
              <button className="action-btn" onClick={() => alert("Liked!")}>❤️</button>
              <button className="action-btn" onClick={() => alert("Share!")}>📤</button>
              <button className="action-btn" onClick={() => alert("Save!")}>🔖</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
