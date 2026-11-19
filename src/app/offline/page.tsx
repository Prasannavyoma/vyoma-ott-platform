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
  HardDrive
} from 'lucide-react';

function OfflinePlayerContent() {
  const searchParams = useSearchParams();
  const playParam = searchParams.get('play');

  const [downloads, setDownloads] = useState<OfflineItemMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<OfflineItemMeta | null>(null);
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

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

      // Auto play if query param is set
      if (playParam) {
        const decoded = decodeURIComponent(playParam);
        const match = items.find(i => i.url === decoded);
        if (match) {
          playItem(match);
        }
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

  const playItem = async (item: OfflineItemMeta) => {
    setActiveItem(item);

    try {
      if ('caches' in window) {
        const cache = await caches.open('vyoma-offline-video-v1');
        const cachedResponse = await cache.match(item.url);
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          if (activeBlobUrl) {
            URL.revokeObjectURL(activeBlobUrl);
          }
          const blobUrl = URL.createObjectURL(blob);
          setActiveBlobUrl(blobUrl);

          if (videoRef.current) {
            videoRef.current.src = blobUrl;
            videoRef.current.play().catch(e => console.log('Autoplay deferred:', e));
          }

          playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }

      // Fallback direct URL if cache access direct
      if (videoRef.current) {
        videoRef.current.src = item.url;
        videoRef.current.play().catch(e => console.log('Autoplay deferred:', e));
      }
      playerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err: any) {
      alert('Could not stream cached video file: ' + err.message);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleDelete = async (url: string, title: string) => {
    if (confirm(`Delete offline download for "${title}"?`)) {
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
    }
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to delete ALL offline downloads stored on this browser?')) {
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
    }
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
              onClick={() => window.location.reload()}
              style={{
                background: isOnline ? '#22c55e' : '#ffffff',
                color: isOnline ? '#ffffff' : '#000000',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
            >
              <RefreshCw size={14} /> Refresh / Reconnect
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
                  controls
                  playsInline
                  controlsList="nodownload"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
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
                    {activeItem.episodeTitle ? `${activeItem.courseTitle} - ${activeItem.episodeTitle}` : activeItem.courseTitle}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                    Streaming locally from offline device storage &bull; Zero data usage
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
                        {item.episodeTitle ? `${item.courseTitle} - ${item.episodeTitle}` : item.courseTitle}
                      </h4>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '14px' }}>
                        {item.episodeTitle ? item.courseTitle : 'Full Video Media'}
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
