"use client";

import { useState, useEffect } from 'react';
import { 
  saveOfflineDownloadMeta, 
  getOfflineDownloads, 
  removeOfflineDownload,
  getRemainingDays,
  OfflineItemMeta
} from '@/lib/offlineStorage';
import { isNonDownloadableMedia } from '@/lib/mediaTypes';
import OfflineClearModal, { singleClearMessage } from '@/app/components/OfflineClearModal';

interface DownloadButtonProps {
  videoUrl: string | null | undefined;
  courseTitle: string;
  episodeTitle?: string;
  courseId?: string;
  episodeId?: string;
  thumbnailUrl?: string;
  compact?: boolean;
  isLoggedIn?: boolean;
}

export default function DownloadButton({
  videoUrl,
  courseTitle,
  episodeTitle,
  courseId,
  episodeId,
  thumbnailUrl,
  compact = false,
  isLoggedIn = true,
}: DownloadButtonProps) {
  const [status, setStatus] = useState<'IDLE' | 'DOWNLOADING' | 'CACHED' | 'ERROR'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    if (!videoUrl || typeof window === 'undefined' || !('caches' in window) || isLoggedIn === false || isNonDownloadableMedia(videoUrl)) return;

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
  }, [videoUrl, isLoggedIn]);

  // NEVER show or render download button if user is not authenticated OR media is an interactive game/iframe
  if (isLoggedIn === false || isNonDownloadableMedia(videoUrl)) {
    return null;
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!videoUrl || isNonDownloadableMedia(videoUrl)) {
      alert('Interactive games and HTML5 modules are played live in the browser and cannot be downloaded as offline video files.');
      return;
    }

    if (status === 'DOWNLOADING') return;

    setStatus('DOWNLOADING');
    setProgress(5);

    try {
      const cache = await caches.open('vyoma-offline-video-v1');

      // 1. Audit telemetry in background via lightweight JSON POST
      fetch('/api/offline-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoUrl,
          courseId: courseId || '',
          episodeId: episodeId || '',
          courseTitle: courseTitle || '',
          episodeTitle: episodeTitle || '',
        })
      }).catch((e) => console.warn('Telemetry audit warning:', e));

      setProgress(15);

      // 2. High-speed Direct CDN download (avoids Vercel's 4.5MB serverless response limit and enables full streaming)
      let response: Response;
      try {
        response = await fetch(videoUrl);
        if (!response.ok) throw new Error(`Direct CDN fetch status ${response.status}`);
      } catch (directErr) {
        console.warn('Direct fetch failed, falling back to offline proxy:', directErr);
        const queryParams = new URLSearchParams({
          url: videoUrl,
          courseId: courseId || '',
          episodeId: episodeId || '',
          courseTitle: courseTitle || '',
          episodeTitle: episodeTitle || '',
        });
        response = await fetch(`/api/offline-proxy?${queryParams.toString()}`);
      }
      
      if (response.status === 401) {
        alert('Authentication required: Please log in to download videos for offline viewing.');
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        setStatus('IDLE');
        setProgress(0);
        return;
      }

      if (!response.ok) throw new Error('Video download request failed: HTTP ' + response.status);

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      let blob: Blob;

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

        const mimeType = response.headers.get('content-type') || (videoUrl.endsWith('.m4a') ? 'audio/mp4' : 'video/mp4');
        blob = new Blob(chunks, { type: mimeType });
      } else {
        // Fallback progress for unannounced content length
        setProgress(35);
        await new Promise(r => setTimeout(r, 200));
        setProgress(70);
        const rawBlob = await response.blob();
        const mimeType = response.headers.get('content-type') || rawBlob.type || (videoUrl.endsWith('.m4a') ? 'audio/mp4' : 'video/mp4');
        blob = new Blob([rawBlob], { type: mimeType });
        setProgress(95);
      }

      // Verify that the downloaded file is a valid non-empty media file
      if (blob.size < 50000) {
        throw new Error(`Downloaded media is incomplete (${blob.size} bytes). Please verify your connection.`);
      }

      const mimeType = videoUrl.endsWith('.m4a') ? 'audio/mp4' : 'video/mp4';
      const cacheHeaders = new Headers(response.headers);
      cacheHeaders.set('Content-Type', mimeType);
      cacheHeaders.set('Content-Length', String(blob.size));
      cacheHeaders.set('Accept-Ranges', 'bytes');

      const responseToCache = new Response(blob, {
        status: 200,
        statusText: 'OK',
        headers: cacheHeaders,
      });

      // Save under multiple key representations (raw, decoded, encoded) so matching is 100% resilient
      const decodedUrl = decodeURIComponent(videoUrl);
      const encodedUrl = encodeURI(decodedUrl);

      await cache.put(videoUrl, responseToCache.clone());
      if (decodedUrl !== videoUrl) {
        await cache.put(decodedUrl, responseToCache.clone());
      }
      if (encodedUrl !== videoUrl && encodedUrl !== decodedUrl) {
        await cache.put(encodedUrl, responseToCache);
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

  const confirmClear = async () => {
    if (videoUrl) {
      await removeOfflineDownload(videoUrl);
      setStatus('IDLE');
      setProgress(0);
      setRemainingDays(null);
    }
    setShowClearModal(false);
  };

  const cancelClear = () => {
    setShowClearModal(false);
  };

  if (!videoUrl) return null;

  const titleForModal = episodeTitle || courseTitle;

  return (
    <>
      {/* CLEAR OFFLINE DOWNLOAD CONFIRMATION MODAL */}
      <OfflineClearModal
        open={showClearModal}
        title="Clear Offline Download?"
        message={singleClearMessage(titleForModal)}
        onConfirm={confirmClear}
        onCancel={cancelClear}
      />

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
