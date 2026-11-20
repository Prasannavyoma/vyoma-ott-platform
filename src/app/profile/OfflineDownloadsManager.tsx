"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  getOfflineDownloads, 
  removeOfflineDownload, 
  getRemainingDays, 
  OfflineItemMeta 
} from '@/lib/offlineStorage';
import { Trash2, X } from 'lucide-react';

export default function OfflineDownloadsManager() {
  const [downloads, setDownloads] = useState<OfflineItemMeta[]>([]);
  const [loading, setLoading] = useState(true);
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

  const refreshDownloads = async () => {
    setLoading(true);
    try {
      const items = await getOfflineDownloads();
      setDownloads(items);
    } catch (e) {
      console.error('Failed to load offline downloads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDownloads();
  }, []);

  const handleDelete = (url: string, title: string) => {
    setConfirmModal({
      open: true,
      title: 'Delete Offline Lesson?',
      description: `Are you sure you want to delete "${title}" from offline storage? You will need an internet connection to re-download it.`,
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
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
        for (const item of downloads) {
          await removeOfflineDownload(item.url);
        }
        await refreshDownloads();
        setConfirmModal(prev => ({ ...prev, open: false }));
      }
    });
  };

  if (loading) {
    return (
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '24px', padding: '30px', marginBottom: '40px', color: '#888', textAlign: 'center' }}>
        Loading offline library...
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, rgba(15,22,36,0.9) 0%, rgba(10,10,12,0.95) 100%)', 
      border: '1px solid rgba(70,211,105,0.2)', 
      borderRadius: '24px', 
      padding: '30px', 
      marginBottom: '40px',
      boxShadow: '0 15px 40px rgba(0,0,0,0.5)'
    }}>
      {/* HEADER BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#46d369' }}>📥</span> Offline Downloads (YouTube-Style 30-Day Storage)
          </h2>
          <p style={{ margin: '6px 0 0 0', color: '#aaa', fontSize: '0.88rem', lineHeight: '1.4' }}>
            Watch saved videos offline without internet access. Items automatically expire and clear after <strong>30 days (1 month)</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/offline"
            prefetch={false}
            onClick={(e) => {
              if (typeof navigator !== 'undefined' && !navigator.onLine) {
                e.preventDefault();
                window.location.href = '/offline.html';
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>▶</span> Open Offline Player Hub
          </Link>

          {downloads.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: 'rgba(255,77,79,0.15)',
                border: '1px solid rgba(255,77,79,0.3)',
                color: '#ff4d4f',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🗑 Clear All ({downloads.length})
            </button>
          )}
        </div>
      </div>

      {/* DOWNLOADS LIST / GRID */}
      {downloads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '45px 20px', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(0,0,0,0.2)' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>📲</span>
          <h4 style={{ margin: '0 0 8px 0', color: '#ddd', fontSize: '1.1rem', fontWeight: 800 }}>No offline downloads stored</h4>
          <p style={{ color: '#777', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 20px', lineHeight: '1.5' }}>
            Click the <strong style={{ color: '#46d369' }}>"⬇ Download Offline"</strong> button on any course or episode watch page to save content for 30-day offline viewing.
          </p>
          <Link 
            href="/explore" 
            style={{ 
              background: 'var(--primary, #f26422)', 
              color: '#fff', 
              padding: '10px 24px', 
              borderRadius: '30px', 
              textDecoration: 'none', 
              fontWeight: 900, 
              fontSize: '0.85rem' 
            }}
          >
            BROWSE COURSES & DOWNLOAD
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {downloads.map((item) => {
            const daysLeft = getRemainingDays(item.expiresAt);
            const downloadedDateStr = new Date(item.downloadedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const watchHref = `/offline?play=${encodeURIComponent(item.url)}`;

            return (
              <div
                key={item.url}
                style={{
                  background: '#111116',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {/* THUMBNAIL BAR */}
                <div style={{ position: 'relative', height: '150px', background: '#000' }}>
                  <img
                    src={item.thumbnailUrl || '/assets/Ayodhyakanda.jpg'}
                    alt={item.episodeTitle || item.courseTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(70,211,105,0.9)',
                      color: '#000',
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      padding: '4px 10px',
                      borderRadius: '12px',
                    }}
                  >
                    ✓ OFFLINE READY
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: 'rgba(0,0,0,0.85)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    Downloaded: {downloadedDateStr}
                  </div>
                </div>

                {/* CONTENT METADATA */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#fff',
                      lineHeight: '1.3',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.episodeTitle ? `${item.courseTitle} - ${item.episodeTitle}` : item.courseTitle}
                  </h4>

                  {/* 30-DAY AUTO-EXPIRY BADGE & PROGRESS */}
                  <div style={{ marginTop: '10px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaa', fontWeight: 700, marginBottom: '4px' }}>
                      <span>YouTube Offline Expiry:</span>
                      <span style={{ color: daysLeft <= 5 ? '#ff4d4f' : '#46d369' }}>
                        ⏱ {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (daysLeft / 30) * 100)}%`,
                          height: '100%',
                          background: daysLeft <= 5 ? '#ff4d4f' : 'linear-gradient(to right, #46d369, #00ff87)',
                        }}
                      />
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                    <Link
                      href={watchHref}
                      prefetch={false}
                      onClick={(e) => {
                        if (typeof navigator !== 'undefined' && !navigator.onLine) {
                          e.preventDefault();
                          window.location.href = `/offline.html?play=${encodeURIComponent(item.url)}`;
                        }
                      }}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                        color: '#fff',
                        textAlign: 'center',
                        padding: '10px',
                        borderRadius: '8px',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>▶ PLAY OFFLINE</span>
                    </Link>

                    <button
                      onClick={() => handleDelete(item.url, item.episodeTitle || item.courseTitle)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#aaa',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s',
                      }}
                      title="Delete download"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
