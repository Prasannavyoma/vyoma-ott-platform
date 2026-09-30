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

    // Toggle delete if already cached
    if (status === 'CACHED') {
      if (confirm(`Remove "${episodeTitle || courseTitle}" from offline storage?`)) {
        await removeOfflineDownload(videoUrl);
        setStatus('IDLE');
        setRemainingDays(null);
      }
      return;
    }

    setStatus('DOWNLOADING');
    setProgress(10);

    try {
      const cache = await caches.open('vyoma-offline-video-v1');

      // Determine if we need to bypass CORS using our secure edge proxy
      let fetchUrl = videoUrl;
      if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
        fetchUrl = `/api/offline-proxy?url=${encodeURIComponent(videoUrl)}`;
      }

      setProgress(40);
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Network failed or proxy rejected');

      setProgress(80);
      await cache.put(videoUrl, response.clone());

      // Save metadata with 30-day auto-clear expiration date
      const meta = await saveOfflineDownloadMeta({
        url: videoUrl,
        courseTitle,
        episodeTitle,
        courseId,
        episodeId,
        thumbnailUrl,
      });

      setStatus('CACHED');
      setProgress(100);
      setRemainingDays(getRemainingDays(meta.expiresAt));
    } catch (err) {
      console.error('Download error:', err);
      setStatus('ERROR');
      setTimeout(() => setStatus('IDLE'), 3000);
    }
  };

  if (!videoUrl) return null;

  if (compact) {
    return (
      <button
        onClick={handleDownload}
        disabled={status === 'DOWNLOADING'}
        title={
          status === 'CACHED'
            ? `Available Offline (Expires in ${remainingDays ?? 30} days). Click to remove.`
            : status === 'DOWNLOADING'
            ? 'Downloading video...'
            : 'Download for offline viewing (30-day offline storage)'
        }
        style={{
          background: status === 'CACHED' ? 'rgba(70,211,105,0.15)' : 'rgba(255,255,255,0.06)',
          border: status === 'CACHED' ? '1px solid rgba(70,211,105,0.4)' : '1px solid rgba(255,255,255,0.15)',
          color: status === 'CACHED' ? '#46d369' : '#ddd',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          if (status !== 'CACHED') e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
        }}
        onMouseLeave={(e) => {
          if (status !== 'CACHED') e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }}
      >
        {status === 'DOWNLOADING' && <span>⏳ Downloading...</span>}
        {status === 'CACHED' && <span>✓ Offline ({remainingDays ?? 30}d left)</span>}
        {status === 'IDLE' && <span>⬇ Offline Download</span>}
        {status === 'ERROR' && <span style={{ color: '#ff4d4f' }}>⚠ Failed</span>}
      </button>
    );
  }

  if (status === 'CACHED') {
    return (
      <button
        onClick={handleDownload}
        style={{
          background: 'rgba(70,211,105,0.15)',
          border: '1px solid #46d369',
          color: '#46d369',
          padding: '12px 24px',
          borderRadius: '8px',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          boxShadow: '0 0 15px rgba(70,211,105,0.2)',
        }}
      >
        ✓ Available Offline ({remainingDays ?? 30} days left)
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'DOWNLOADING'}
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
    >
      {status === 'DOWNLOADING' ? '⬇ Downloading for Offline...' : '⬇ Download Offline (30 Days)'}
    </button>
  );
}
