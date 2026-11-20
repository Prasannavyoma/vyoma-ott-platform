"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  getOfflineDownloads, 
  removeOfflineDownload, 
  getRemainingDays, 
  OfflineItemMeta 
} from '@/lib/offlineStorage';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import { 
  ArrowLeft, 
  Play, 
  Trash2, 
  Clock, 
  WifiOff, 
  Wifi, 
  RefreshCw,
  HardDrive,
  Home,
  X,
  AlertTriangle
} from 'lucide-react';

function formatDownloadDate(ts?: number) {
  if (!ts) return 'Recent';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recent';
  }
}

function getCleanTitles(item?: OfflineItemMeta | null) {
  if (!item) return { title: 'Offline Video', subtitle: 'Saved on Device' };
  const rawCourse = item.courseTitle && item.courseTitle !== 'null' && item.courseTitle !== 'undefined' ? item.courseTitle : '';
  const rawEpisode = item.episodeTitle && item.episodeTitle !== 'null' && item.episodeTitle !== 'undefined' ? item.episodeTitle : '';
  
  let title = '';
  let subtitle = '';
  
  if (rawCourse && rawEpisode) {
    title = `${rawCourse} - ${rawEpisode}`;
    subtitle = rawCourse;
  } else if (rawEpisode) {
    title = rawEpisode;
    subtitle = 'Offline Lesson';
  } else if (rawCourse) {
    title = rawCourse;
    subtitle = 'Full Course Media';
  } else {
    title = 'Offline Sanskrit Lesson';
    subtitle = 'Saved on Device';
  }
  return { title, subtitle };
}

function OfflinePlayerContent() {
  const searchParams = useSearchParams();
  const playParam = searchParams.get('play');

  const [downloads, setDownloads] = useState<OfflineItemMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<OfflineItemMeta | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoDurationStr, setVideoDurationStr] = useState<string>('');
  const [videoError, setVideoError] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    confirmText: 'Delete',
    onConfirm: () => {},
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const handleReconnect = async () => {
    setReconnecting(true);
    // If online, go directly to homepage
    if (isOnline || (typeof navigator !== 'undefined' && navigator.onLine)) {
      window.location.href = '/?reconnect=true';
      return;
    }

    // Active probe
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch('/api/auth/status?probe=' + Date.now(), {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok || res.status < 500) {
        window.location.href = '/?reconnect=true';
        return;
      }
    } catch {
      // Still offline
    }
    setReconnecting(false);
  };

  // Monitor online / offline status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshDownloads = async () => {
    setLoading(true);
    try {
      const items = await getOfflineDownloads();
      setDownloads(items);

      // Auto play if query param is set, or pre-load first download if available
      if (playParam) {
        const decoded = decodeURIComponent(playParam);
        const match = items.find(i => i.url === decoded);
        if (match) {
          playItem(match);
        }
      } else if (items.length > 0 && !activeItem) {
        // Pre-load the first downloaded item so the player is ready immediately
        playItem(items[0]);
      }
    } catch (e) {
      console.error('Failed to load offline downloads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDownloads();
  }, [playParam]);

  // Synchronize activeBlobUrl with video element whenever source changes
  useEffect(() => {
    if (activeBlobUrl && videoRef.current) {
      videoRef.current.src = activeBlobUrl;
      videoRef.current.load();
      videoRef.current.playbackRate = playbackRate;
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [activeBlobUrl]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn('Play error:', e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playItem = async (item: OfflineItemMeta) => {
    setActiveItem(item);
    setVideoError(false);
    setIsPlaying(false);

    try {
      if ('caches' in window) {
        let cachedResponse: Response | undefined = undefined;
        const cacheNames = await caches.keys();
        const decodedTarget = decodeURIComponent(item.url);
        const encodedTarget = encodeURI(decodedTarget);
        const targetFilename = decodedTarget.split('/').pop()?.split('?')[0] || '';

        const searchOrder = cacheNames.includes('vyoma-offline-video-v1')
          ? ['vyoma-offline-video-v1', ...cacheNames.filter(c => c !== 'vyoma-offline-video-v1')]
          : cacheNames;

        for (const cName of searchOrder) {
          try {
            const cache = await caches.open(cName);
            // 1. Direct match
            cachedResponse = (await cache.match(item.url)) || 
                             (await cache.match(decodedTarget)) || 
                             (await cache.match(encodedTarget));
            if (cachedResponse) break;

            // 2. Deep scan
            const keys = await cache.keys();
            const matchKey = keys.find(k => {
              const kUrl = k.url;
              if (kUrl === item.url || kUrl === decodedTarget || kUrl === encodedTarget) return true;
              if (decodeURIComponent(kUrl) === decodedTarget) return true;
              if (targetFilename && targetFilename.length > 3 && decodeURIComponent(kUrl).includes(targetFilename)) return true;
              return false;
            });
            if (matchKey) {
              cachedResponse = await cache.match(matchKey);
              if (cachedResponse) break;
            }
          } catch (e) {
            console.warn('Cache lookup warning:', e);
          }
        }

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const isAudio = item.url.endsWith('.m4a') || item.url.endsWith('.mp3');
          const mimeType = isAudio ? 'audio/mp4' : 'video/mp4';
          // Enforce video/mp4 MIME type on Blob so HTML5 player decodes without error
          const playableBlob = new Blob([blob], { type: mimeType });

          if (activeBlobUrl && activeBlobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(activeBlobUrl);
          }
          const blobUrl = URL.createObjectURL(playableBlob);
          setActiveBlobUrl(blobUrl);

          playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }

      // Fallback: direct URL if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        if (activeBlobUrl && activeBlobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(activeBlobUrl);
        }
        setActiveBlobUrl(item.url);
        playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setVideoError(true);
      }
    } catch (err: any) {
      console.error('Could not stream cached video file:', err);
      setVideoError(true);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleDelete = (url: string, title: string) => {
    setConfirmModal({
      open: true,
      title: 'Delete Offline Lesson?',
      description: `Are you sure you want to delete "${title}" from offline storage? You will need an internet connection to re-download it.`,
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        if (activeItem?.url === url) {
          setActiveItem(null);
          if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
          setActiveBlobUrl(null);
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.src = '';
          }
        }
        await removeOfflineDownload(url);
        await refreshDownloads();
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      open: true,
      title: 'Clear All Offline Downloads?',
      description: `Are you sure you want to delete ALL ${downloads.length} downloaded lessons stored on this device? This action cannot be undone.`,
      confirmText: 'Clear All Lessons',
      onConfirm: async () => {
        setActiveItem(null);
        if (activeBlobUrl) URL.revokeObjectURL(activeBlobUrl);
        setActiveBlobUrl(null);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.src = '';
        }
        for (const item of downloads) {
          await removeOfflineDownload(item.url);
        }
        await refreshDownloads();
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  return (
    <>
      <NavBar />
      <main style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #141f36 0%, #080c16 80%)',
        color: '#e2e8f0',
        paddingTop: '130px',
        paddingBottom: '80px',
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

          {/* Offline Status Alert Banner - Cleanly fitted inside container */}
          <div style={{
            background: isOnline 
              ? 'linear-gradient(135deg, rgba(21, 128, 61, 0.25) 0%, rgba(34, 197, 94, 0.15) 100%)' 
              : 'linear-gradient(135deg, rgba(185, 28, 28, 0.3) 0%, rgba(220, 38, 38, 0.18) 100%)',
            border: isOnline ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '16px',
            color: '#fff',
            padding: '14px 20px',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: isOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: isOnline ? '#4ade80' : '#ef4444',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
              <span style={{ lineHeight: 1.4 }}>
                {isOnline 
                  ? '🟢 Internet Connected — Offline Library ready for zero-network playback anytime.' 
                  : '📶 Offline Mode Active — Live server is unreachable. Playing downloaded lessons stored on this device.'}
              </span>
            </div>

            <button
              onClick={handleReconnect}
              disabled={reconnecting}
              style={{
                background: isOnline ? '#22c55e' : '#ffffff',
                color: isOnline ? '#ffffff' : '#000000',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: reconnecting ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                opacity: reconnecting ? 0.8 : 1
              }}
            >
              {reconnecting ? (
                <>
                  <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Checking Connection...
                </>
              ) : isOnline ? (
                <>
                  <Home size={14} /> Return to Homepage
                </>
              ) : (
                <>
                  <RefreshCw size={14} /> Try Reconnecting
                </>
              )}
            </button>
          </div>
          
          {/* Back Nav & Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <Link 
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '30px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '0.88rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={16} /> Return to Home
            </Link>

            {downloads.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '7px 16px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Clear All Offline Downloads ({downloads.length})
              </button>
            )}
          </div>

          {/* EMBEDDED OFFLINE VIDEO PLAYER */}
          {activeItem && (
            <div 
              ref={playerContainerRef}
              style={{
                background: '#000',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(242, 100, 34, 0.4)',
                boxShadow: '0 15px 50px rgba(0, 0, 0, 0.8)',
                marginBottom: '36px'
              }}
            >
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                <video
                  ref={videoRef}
                  src={activeBlobUrl || undefined}
                  controls
                  playsInline
                  preload="auto"
                  controlsList="nodownload"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration;
                    if (!isNaN(dur) && dur > 0) {
                      const mins = Math.floor(dur / 60);
                      const secs = Math.floor(dur % 60);
                      setVideoDurationStr(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
                    }
                  }}
                  onError={(e) => {
                    console.error('Offline player playback error:', e);
                    setVideoError(true);
                  }}
                />

                {/* Big Center Play Button Overlay */}
                {!isPlaying && !videoError && (
                  <button
                    onClick={togglePlayPause}
                    aria-label="Play Lesson"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(242, 100, 34, 0.95) 0%, rgba(255, 126, 66, 0.9) 100%)',
                      border: '3px solid rgba(255, 255, 255, 0.4)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 35px rgba(242, 100, 34, 0.6)',
                      zIndex: 5,
                      paddingLeft: '4px'
                    }}
                  >
                    <Play size={32} fill="#fff" />
                  </button>
                )}

                {/* Offline Video Not Found Error Overlay */}
                {videoError && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(10, 14, 26, 0.94)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    textAlign: 'center',
                    zIndex: 10
                  }}>
                    <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '12px' }} />
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                      Offline Video File Not Found
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '400px', marginBottom: '18px', lineHeight: 1.5 }}>
                      This lesson could not be loaded from offline storage. Please check your internet connection to stream or re-download.
                    </div>
                    <button
                      onClick={handleReconnect}
                      style={{
                        background: '#ffffff',
                        color: '#000000',
                        border: 'none',
                        padding: '8px 18px',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={14} /> Check Connection
                    </button>
                  </div>
                )}
              </div>

              <div style={{
                padding: '18px 24px',
                background: '#0d1322',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                    {getCleanTitles(activeItem).title}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                    📅 Downloaded: <strong style={{ color: '#fff' }}>{formatDownloadDate(activeItem.downloadedAt)}</strong> &bull; ⏱️ <strong style={{ color: '#22c55e' }}>{getRemainingDays(activeItem.expiresAt)} days left</strong> &bull; Stored locally{videoDurationStr ? ` • ⏱️ Duration: ${videoDurationStr}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700 }}>Playback Speed:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      style={{
                        background: playbackRate === rate ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)',
                        border: `1px solid ${playbackRate === rate ? 'var(--primary)' : 'rgba(255, 255, 255, 0.15)'}`,
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section Heading */}
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <HardDrive size={24} color="#f26422" /> Downloaded Courses &amp; Lessons ({downloads.length})
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px' }}>
              Saved directly on your device. Watch offline for up to 30 days without internet access or cellular data.
            </p>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div style={{ background: '#0d1322', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              Loading your offline library...
            </div>
          ) : downloads.length === 0 ? (
            /* Empty State */
            <div style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: '#0d1322',
              borderRadius: '20px',
              border: '2px dashed rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📲</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                No Offline Downloads Stored
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                You have not downloaded any courses on this device yet. When connected to the internet, open any course or episode and click the <strong style={{ color: '#4ade80' }}>&ldquo;⬇ Download Offline&rdquo;</strong> button to save it for 30-day offline study.
              </p>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                  color: '#fff',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textDecoration: 'none'
                }}
              >
                Browse Live Courses &rarr;
              </Link>
            </div>
          ) : (
            /* Downloads Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {downloads.map((item) => {
                const daysLeft = getRemainingDays(item.expiresAt);
                const progressWidth = Math.min(100, (daysLeft / 30) * 100);
                const isCurrentlyPlaying = activeItem?.url === item.url;

                return (
                  <div
                    key={item.url}
                    style={{
                      background: '#101726',
                      border: `1px solid ${isCurrentlyPlaying ? '#f26422' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '18px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: isCurrentlyPlaying ? '0 0 25px rgba(242, 100, 34, 0.3)' : 'none',
                      transition: 'transform 0.2s ease, border-color 0.2s ease'
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', width: '100%', height: '165px', background: '#000' }}>
                      <img
                        src={item.thumbnailUrl || '/assets/Ayodhyakanda.jpg'}
                        alt={item.courseTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
                        color: '#000',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(134, 239, 172, 0.7)'
                      }}>
                        ✓ OFFLINE READY
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 style={{
                        margin: '0 0 6px 0',
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: '#fff',
                        lineHeight: 1.35
                      }}>
                        {getCleanTitles(item).title}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                        {getCleanTitles(item).subtitle}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>📅</span> Downloaded: <strong style={{ color: '#fff' }}>{formatDownloadDate(item.downloadedAt)}</strong>
                      </div>

                      {/* Expiry Bar */}
                      <div style={{ marginTop: 'auto', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '5px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Offline Expiry:
                          </span>
                          <span style={{ color: daysLeft <= 5 ? '#ef4444' : '#22c55e' }}>
                            {daysLeft} days left
                          </span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${progressWidth}%`,
                            background: daysLeft <= 5 ? '#ef4444' : 'linear-gradient(90deg, #4ade80, #22c55e)'
                          }} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => playItem(item)}
                          style={{
                            flex: 1,
                            background: isCurrentlyPlaying 
                              ? '#22c55e' 
                              : 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                            color: '#fff',
                            border: 'none',
                            padding: '11px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.84rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Play size={14} fill="#fff" />
                          {isCurrentlyPlaying ? 'NOW PLAYING' : 'PLAY LESSON'}
                        </button>

                        <button
                          onClick={() => handleDelete(item.url, item.episodeTitle || item.courseTitle)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            padding: '11px 14px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          title="Delete downloaded lesson"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* NETFLIX-STYLE CONFIRMATION MODAL */}
        {confirmModal.open && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmModal(prev => ({ ...prev, open: false }));
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.82)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div style={{
              position: 'relative',
              background: 'linear-gradient(155deg, #161e31 0%, #0d1322 100%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '24px',
              maxWidth: '440px',
              width: '100%',
              padding: '34px 28px 28px',
              textAlign: 'center',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 45px rgba(239, 68, 68, 0.15)'
            }}>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.05) 70%)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                margin: '0 auto 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)'
              }}>
                <Trash2 size={30} color="#ef4444" />
              </div>

              <h3 style={{
                fontSize: '1.35rem',
                fontWeight: 900,
                color: '#fff',
                margin: '0 0 8px 0',
                letterSpacing: '-0.3px'
              }}>
                {confirmModal.title}
              </h3>

              <p style={{
                fontSize: '0.92rem',
                color: '#94a3b8',
                lineHeight: 1.5,
                margin: '0 0 24px 0'
              }}>
                {confirmModal.description}
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={confirmModal.onConfirm}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(239, 68, 68, 0.35)'
                  }}
                >
                  {confirmModal.confirmText}
                </button>

                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#f1f5f9',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function OfflinePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#080c16', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading Offline Library...
      </div>
    }>
      <OfflinePlayerContent />
    </Suspense>
  );
}
