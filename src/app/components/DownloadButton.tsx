"use client";

import { useState, useEffect } from 'react';
import { 
  saveOfflineDownloadMeta, 
  getOfflineDownloads, 
  removeOfflineDownload,
  getRemainingDays,
  OfflineItemMeta
} from '@/lib/offlineStorage';

interface DownloadButtonProps {
  videoUrl: string | null | undefined;
  courseTitle: string;
  episodeTitle?: string;
  courseId?: string;
  episodeId?: string;
  thumbnailUrl?: string;
  compact?: boolean;
}

export default function DownloadButton({
  videoUrl,
  courseTitle,
  episodeTitle,
  courseId,
  episodeId,
  thumbnailUrl,
  compact = false,
}: DownloadButtonProps) {
  const [status, setStatus] = useState<'IDLE' | 'DOWNLOADING' | 'CACHED' | 'ERROR'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    if (!videoUrl || typeof window === 'undefined' || !('caches' in window)) return;

    // Check if cached and valid
    getOfflineDownloads().then((downloads) => {
      const match = downloads.find((d) => d.url === videoUrl);
      if (match) {
        setStatus('CACHED');
        setRemainingDays(getRemainingDays(match.expiresAt));
      } else {
        setStatus('IDLE');
      }
    });
  }, [videoUrl]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!videoUrl) {
      alert('Video source is not available for offline download.');
      return;
    }

    if (status === 'DOWNLOADING') return;

    setStatus('DOWNLOADING');
    setProgress(5);

    try {
      const cache = await caches.open('vyoma-offline-video-v1');

      // Bypass CORS via edge proxy if remote URL
      let fetchUrl = videoUrl;
      if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
        fetchUrl = `/api/offline-proxy?url=${encodeURIComponent(videoUrl)}`;
      }

      setProgress(15);
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Network failed or proxy rejected');

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (response.body && totalBytes > 0) {
        const reader = response.body.getReader();
        let loadedBytes = 0;
        const chunks: BlobPart[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loadedBytes += value.length;
            const pct = Math.min(98, Math.round((loadedBytes / totalBytes) * 100));
            setProgress(pct);
          }
        }

        const blob = new Blob(chunks);
        const responseToCache = new Response(blob, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        await cache.put(videoUrl, responseToCache);
      } else {
        // Simulated progress steps for unannounced stream sizes
        setProgress(35);
        await new Promise(r => setTimeout(r, 300));
        setProgress(70);
        const blob = await response.blob();
        setProgress(90);
        await cache.put(videoUrl, new Response(blob, { headers: response.headers }));
      }

      // Save metadata with 30-day expiration
      const meta = await saveOfflineDownloadMeta({
        url: videoUrl,
        courseTitle,
        episodeTitle,
        courseId,
        episodeId,
        thumbnailUrl,
      });

      setProgress(100);
      setStatus('CACHED');
      setRemainingDays(getRemainingDays(meta.expiresAt));
    } catch (err) {
      console.error('Download error:', err);
      setStatus('ERROR');
      setProgress(0);
      setTimeout(() => setStatus('IDLE'), 3000);
    }
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowClearModal(true);
  };

  const confirmClear = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoUrl) {
      await removeOfflineDownload(videoUrl);
      setStatus('IDLE');
      setProgress(0);
      setRemainingDays(null);
    }
    setShowClearModal(false);
  };

  const cancelClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowClearModal(false);
  };

  if (!videoUrl) return null;

  const titleForModal = episodeTitle || courseTitle;

  return (
    <>
      {/* CLEAR OFFLINE DOWNLOAD CONFIRMATION MODAL */}
      {showClearModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 11, 23, 0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={cancelClear}
        >
          <div
            style={{
              background: '#0b121e',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: '25px 30px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 30px rgba(229,9,20,0.2)',
              textAlign: 'center',
              color: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '10px' }}>
              Clear Offline Download?
            </h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '25px' }}>
              You are about to clear this offline downloaded content{titleForModal ? <strong style={{ color: '#fff' }}> &ldquo;{titleForModal}&rdquo;</strong> : ''}. Are you sure?
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={cancelClear}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'background 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                style={{
                  background: '#e50914',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  flex: 1,
                  boxShadow: '0 4px 15px rgba(229,9,20,0.4)',
                  transition: 'transform 0.1s'
                }}
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT MODE BUTTON */}
      {compact ? (
        status === 'CACHED' ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                background: 'rgba(70,211,105,0.15)',
                border: '1px solid rgba(70,211,105,0.4)',
                color: '#46d369',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ✓ Offline ({remainingDays ?? 30}d left)
            </span>
            <button
              onClick={handleClearClick}
              title="Clear offline download"
              style={{
                background: 'rgba(229,9,20,0.15)',
                border: '1px solid rgba(229,9,20,0.4)',
                color: '#e50914',
                padding: '5px 10px',
                borderRadius: '16px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(229,9,20,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(229,9,20,0.15)')}
            >
              🗑️ Clear
            </button>
          </div>
        ) : (
          <button
            onClick={handleDownload}
            disabled={status === 'DOWNLOADING'}
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.06)',
              border: status === 'DOWNLOADING' ? '1px solid var(--primary, #f26422)' : '1px solid rgba(255,255,255,0.15)',
              color: '#ddd',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: status === 'DOWNLOADING' ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              zIndex: 10,
            }}
          >
            {status === 'DOWNLOADING' && (
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${progress}%`,
                  background: 'rgba(242, 100, 34, 0.4)',
                  transition: 'width 0.2s ease-out',
                  zIndex: 0
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>
              {status === 'DOWNLOADING' && `⏳ Downloading ${progress}%`}
              {status === 'IDLE' && '⬇ Offline Download'}
              {status === 'ERROR' && <span style={{ color: '#ff4d4f' }}>⚠ Failed</span>}
            </span>
          </button>
        )
      ) : (
        /* STANDARD MODE BUTTON */
        status === 'CACHED' ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                background: 'rgba(70,211,105,0.15)',
                border: '1px solid #46d369',
                color: '#46d369',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                boxShadow: '0 0 15px rgba(70,211,105,0.2)',
              }}
            >
              ✓ Available Offline ({remainingDays ?? 30} days left)
            </div>

            <button
              onClick={handleClearClick}
              title="Clear offline download"
              style={{
                background: 'rgba(229, 9, 20, 0.15)',
                border: '1px solid rgba(229, 9, 20, 0.4)',
                color: '#e50914',
                padding: '12px 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(229, 9, 20, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(229, 9, 20, 0.15)')}
            >
              🗑️ Clear
            </button>
          </div>
        ) : (
          <button
            onClick={handleDownload}
            disabled={status === 'DOWNLOADING'}
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.12)',
              border: status === 'DOWNLOADING' ? '1px solid var(--primary, #f26422)' : '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: status === 'DOWNLOADING' ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {status === 'DOWNLOADING' && (
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, rgba(242,100,34,0.6), rgba(255,140,83,0.8))',
                  transition: 'width 0.2s ease-out',
                  zIndex: 0
                }}
              />
            )}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {status === 'DOWNLOADING' ? (
                <>⏳ Downloading Offline... {progress}%</>
              ) : (
                <>⬇ Download Offline (30 Days)</>
              )}
            </span>
          </button>
        )
      )}
    </>
  );
}
