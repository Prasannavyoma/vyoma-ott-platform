"use client";

import { useState, useRef, useEffect } from 'react';

interface HoverVideoPlayerProps {
  posterUrl: string;
  videoUrl?: string;
  altText: string;
}

export default function HoverVideoPlayer({ posterUrl, videoUrl, altText }: HoverVideoPlayerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isHovered && videoUrl) {
      hoverTimer.current = setTimeout(() => {
        setShowVideo(true);
      }, 600); // 600ms delay before playing video
    } else {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      setShowVideo(false);
    }

    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, [isHovered, videoUrl]);

  return (
    <div 
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={posterUrl} 
        alt={altText} 
        loading="lazy"
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          transition: 'opacity 0.3s',
          opacity: showVideo ? 0 : 1
        }} 
      />
      
      {showVideo && videoUrl && (
        <video 
          src={videoUrl}
          autoPlay 
          muted 
          loop 
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: showVideo ? 1 : 0,
            transition: 'opacity 0.5s ease-in'
          }}
        />
      )}
    </div>
  );
}
