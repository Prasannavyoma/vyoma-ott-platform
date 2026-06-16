"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface GlobalPlayerContextType {
  activeEpisodeId: string | null;
  activeCourseId: string | null;
  videoUrl: string | null;
  currentTime: number;
  isPlaying: boolean;
  playEpisode: (episodeId: string, courseId: string, url: string, startTime?: number, poster?: string) => void;
  stopEpisode: () => void;
  updateTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  isMinimized: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

const GlobalPlayerContext = createContext<GlobalPlayerContextType | undefined>(undefined);

export function GlobalPlayerProvider({ children }: { children: React.ReactNode }) {
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [poster, setPoster] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const pathname = usePathname();

  useEffect(() => {
    // If the user navigates away from the Watch page while a video is loaded, activate PiP / Mini player
    if (activeEpisodeId) {
      if (pathname.includes(`/watch/${activeCourseId}`)) {
        setIsMinimized(false);
      } else {
        setIsMinimized(true);
      }
    } else {
      setIsMinimized(false);
    }
  }, [pathname, activeEpisodeId, activeCourseId]);

  const playEpisode = (episodeId: string, courseId: string, url: string, startTime: number = 0, episodePoster?: string) => {
    setActiveEpisodeId(episodeId);
    setActiveCourseId(courseId);
    setVideoUrl(url);
    setCurrentTime(startTime);
    setIsPlaying(true);
    setPoster(episodePoster || null);
    
    // Attempt auto-play if video ref exists and it is not a document
    const isDoc = getIsDocument(url);
    if (videoRef.current && !isDoc) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  const stopEpisode = () => {
    setActiveEpisodeId(null);
    setActiveCourseId(null);
    setVideoUrl(null);
    setPoster(null);
    setIsPlaying(false);
    setIsMinimized(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const updateTime = (time: number) => {
    setCurrentTime(time);
  };

  const setPlaying = (playing: boolean) => {
    setIsPlaying(playing);
    if (videoRef.current) {
      if (playing) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  // Format check helper
  const getIsDocument = (urlStr: string | null) => {
    if (!urlStr) return false;
    let cleanUrl = urlStr.trim();
    if (cleanUrl.toLowerCase().includes('<iframe')) {
      const match = cleanUrl.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        cleanUrl = match[1];
      }
    }
    cleanUrl = cleanUrl.replace(/\\"/g, '"').replace(/\\/g, '').replace(/[\r\n]+/g, '').trim();
    const lowerUrl = cleanUrl.toLowerCase();
    const isPdf = lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?');
    const isAudioFormat = lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.wav') || lowerUrl.endsWith('.ogg') || lowerUrl.includes('.mp3?') || lowerUrl.includes('.wav?') || lowerUrl.includes('.ogg?');
    const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
    const isVimeo = lowerUrl.includes('vimeo.com');
    const isEmbedVideo = isYouTube || isVimeo;
    const isVideoFormat = lowerUrl.endsWith('.mp4') || lowerUrl.includes('.mp4?') ||
                          lowerUrl.endsWith('.m3u8') || lowerUrl.includes('.m3u8?') ||
                          lowerUrl.endsWith('.webm') || lowerUrl.includes('.webm?') ||
                          lowerUrl.endsWith('.mov') || lowerUrl.includes('.mov?') ||
                          lowerUrl.endsWith('.ogv') || lowerUrl.includes('.ogv?') ||
                          lowerUrl.endsWith('.m4v') || lowerUrl.includes('.m4v?') ||
                          lowerUrl.endsWith('.mpd') || lowerUrl.includes('.mpd?') ||
                          lowerUrl.endsWith('.avi') || lowerUrl.includes('.avi?');
    const isHtml = lowerUrl.endsWith('.html') || lowerUrl.endsWith('.htm') || lowerUrl.includes('index.html') || lowerUrl.includes('story_html5.html') || lowerUrl.includes('/flipbooks/') || lowerUrl.includes('/flipbook/') || (!isPdf && !isAudioFormat && !isVideoFormat && !isEmbedVideo && (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')));
    return isHtml || isPdf;
  };

  return (
    <GlobalPlayerContext.Provider value={{
      activeEpisodeId, activeCourseId, videoUrl, currentTime, isPlaying, 
      playEpisode, stopEpisode, updateTime, setPlaying, isMinimized, videoRef
    }}>
      {children}

      {/* Floating Global Mini Player */}
      {isMinimized && activeEpisodeId && videoUrl && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '320px',
          background: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease'
        }}>
          {getIsDocument(videoUrl) ? (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {poster ? (
                <img src={poster} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', opacity: 0.2, top: 0, left: 0 }} />
              ) : null}
              <div style={{ zIndex: 1, textAlign: 'center', padding: '15px' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📄</div>
                <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>Interactive Document</div>
                <span style={{ display: 'inline-block', background: 'rgba(242,100,34,0.2)', border: '1px solid rgba(242,100,34,0.4)', color: '#f26422', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', marginTop: '6px', fontWeight: 700 }}>HTML / PDF Mode</span>
              </div>
              <button onClick={stopEpisode} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
                ✕
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#111' }}>
              <video 
                ref={videoRef}
                src={videoUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                autoPlay
              />
              {/* Quick Controls overlay */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', alignItems: 'flex-end', padding: '10px', opacity: 0, transition: 'opacity 0.2s' }}
                   onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                   onMouseLeave={e => e.currentTarget.style.opacity = '0'}
              >
                 <button onClick={() => setPlaying(!isPlaying)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer', marginRight: '10px' }}>
                   {isPlaying ? '⏸' : '▶'}
                 </button>
                 <button onClick={stopEpisode} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', marginLeft: 'auto' }}>
                   ✕
                 </button>
              </div>
            </div>
          )}
          <div style={{ padding: '12px', background: '#0a0a0a' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Now Viewing</div>
            <Link href={`/watch/${activeCourseId}`} style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', textDecoration: 'none' }}>
              Return to Full Player
            </Link>
          </div>
        </div>
      )}
    </GlobalPlayerContext.Provider>
  );
}

export const useGlobalPlayer = () => {
  const context = useContext(GlobalPlayerContext);
  if (!context) throw new Error('useGlobalPlayer must be used within GlobalPlayerProvider');
  return context;
};
