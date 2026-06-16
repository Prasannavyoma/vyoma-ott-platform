"use client";
import { useState, useEffect } from 'react';

export default function DownloadButton({ videoUrl, courseTitle }: { videoUrl: string, courseTitle: string }) {
  const [status, setStatus] = useState<'IDLE' | 'DOWNLOADING' | 'CACHED' | 'ERROR'>('IDLE');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if already cached on mount
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.open('vyoma-offline-video-v1').then(cache => {
        cache.match(videoUrl).then(match => {
          if (match) setStatus('CACHED');
        });
      });
    }
  }, [videoUrl]);

  const handleDownload = async () => {
    if (!videoUrl) return;
    setStatus('DOWNLOADING');
    setProgress(10); // Start indication

    try {
      const cache = await caches.open('vyoma-offline-video-v1');
      
      // Start official background fetch or simple cache injection
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error('Network failed');
      
      // Cache is a standard KV storage, key is URL, value is the Response stream cloned
      await cache.put(videoUrl, response.clone());
      
      setStatus('CACHED');
      alert(`✓ Saved Offline: ${courseTitle} is now available without internet!`);
    } catch (err) {
      console.error(err);
      setStatus('ERROR');
    }
  };

  if (status === 'CACHED') {
    return (
      <button disabled style={{ background: '#46d369', color: 'black', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
        ✓ Available Offline
      </button>
    );
  }

  return (
    <button 
      onClick={handleDownload} 
      disabled={status === 'DOWNLOADING'}
      style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
    >
      {status === 'DOWNLOADING' ? '⬇ Downloading...' : '⬇ Download Offline'}
    </button>
  );
}
