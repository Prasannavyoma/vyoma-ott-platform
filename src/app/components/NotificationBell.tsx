"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'COURSE_COMPLETE' | 'CERTIFICATE_ISSUED' | 'NEW_COURSE' | 'COIN_EARNED';
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
  COURSE_COMPLETE: '🎓',
  CERTIFICATE_ISSUED: '📜',
  NEW_COURSE: '🆕',
  COIN_EARNED: '🪙',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data.notifications && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      /* silent */
    }
  }, []);

  // Fetch on mount + poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click or touch outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  async function handleMarkAllRead() {
    setIsLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }

  function handleNotificationClick(link: string) {
    setIsOpen(false);
    window.location.href = link;
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes notifBadgePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
        @keyframes notifPanelIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notif-item:hover {
          background: rgba(255, 255, 255, 0.06) !important;
        }
        .notif-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .notif-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .notif-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .notif-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .notif-mark-btn:hover {
          background: rgba(242, 100, 34, 0.15) !important;
          color: #f26422 !important;
        }
        .notif-btn {
          border-radius: 50% !important;
          width: 38px !important;
          height: 38px !important;
        }
        .notif-btn:hover .icon-emoji {
          animation: icon-bounce 0.6s cubic-bezier(0.25, 1, 0.5, 1);
          display: inline-block;
        }

        /* 📱 Mobile & Tablet Responsive Compact View */
        @media (max-width: 640px) {
          .notif-dropdown-panel {
            position: fixed !important;
            top: 64px !important;
            right: 10px !important;
            left: auto !important;
            width: calc(100vw - 20px) !important;
            max-width: 300px !important;
            max-height: min(340px, calc(100vh - 80px)) !important;
            border-radius: 14px !important;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
          }
          .notif-header {
            padding: 10px 14px 8px !important;
          }
          .notif-header-title {
            font-size: 0.88rem !important;
          }
          .notif-close-btn {
            width: 26px !important;
            height: 26px !important;
          }
          .notif-mark-btn {
            padding: 3px 8px !important;
            font-size: 0.68rem !important;
          }
          .notif-empty-state {
            padding: 24px 14px !important;
            gap: 8px !important;
          }
          .notif-empty-icon {
            font-size: 1.8rem !important;
          }
          .notif-empty-title {
            font-size: 0.82rem !important;
          }
          .notif-empty-desc {
            font-size: 0.72rem !important;
            line-height: 1.35 !important;
          }
          .notif-item {
            padding: 10px 12px !important;
            gap: 10px !important;
          }
          .notif-item-icon {
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            font-size: 1rem !important;
          }
          .notif-item-title {
            font-size: 0.78rem !important;
          }
          .notif-item-msg {
            font-size: 0.7rem !important;
            line-height: 1.3 !important;
          }
        }

        /* 📱 Ultra-compact for small phones <= 340px (e.g. 320px) */
        @media (max-width: 340px) {
          .notif-dropdown-panel {
            right: 6px !important;
            width: calc(100vw - 12px) !important;
            max-width: 290px !important;
            top: 60px !important;
          }
          .notif-empty-state {
            padding: 18px 10px !important;
          }
        }
      `}} />

      {/* Bell Button */}
      <button
        className="notif-btn circle-btn"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: isOpen ? 'rgba(242, 100, 34, 0.12)' : 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${isOpen ? 'rgba(242, 100, 34, 0.3)' : 'rgba(255, 255, 255, 0.12)'}`,
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(242, 100, 34, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(242, 100, 34, 0.3)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span className="icon-emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isOpen ? '#f26422' : '#ccc'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transition: 'stroke 0.2s' }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 900,
            fontFamily: 'Outfit, sans-serif',
            minWidth: '20px',
            height: '20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            border: '2px solid #030b17',
            animation: 'notifBadgePulse 2s infinite',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="notif-dropdown-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '380px',
            maxHeight: '400px',
            background: 'linear-gradient(180deg, rgba(22, 25, 35, 0.97) 0%, rgba(13, 15, 20, 0.99) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255,255,255,0.1)',
            backdropFilter: 'blur(40px)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'notifPanelIn 0.2s ease-out',
            fontFamily: 'Outfit, sans-serif',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div 
            className="notif-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div 
              className="notif-header-title"
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.01em',
              }}
            >
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#f26422',
                  background: 'rgba(242, 100, 34, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '8px',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  className="notif-mark-btn"
                  onClick={handleMarkAllRead}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#8f98a9',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '5px 10px',
                    cursor: isLoading ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Outfit, sans-serif',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? '...' : 'Mark All Read'}
                </button>
              )}

              {/* Close (X) button */}
              <button
                type="button"
                id="close-notifications-btn"
                className="notif-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close notifications"
                title="Close"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8f98a9',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(242, 100, 34, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(242, 100, 34, 0.4)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#8f98a9';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div
            className="notif-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {notifications.length === 0 ? (
              /* Empty State */
              <div 
                className="notif-empty-state"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '50px 20px',
                  gap: '12px',
                }}
              >
                <span className="notif-empty-icon" style={{ fontSize: '2.5rem', opacity: 0.4 }}>🔔</span>
                <span 
                  className="notif-empty-title"
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#555e6d',
                    textAlign: 'center',
                  }}
                >
                  No notifications yet
                </span>
                <span 
                  className="notif-empty-desc"
                  style={{
                    fontSize: '0.75rem',
                    color: '#3d4452',
                    textAlign: 'center',
                  }}
                >
                  We&apos;ll notify you about course updates, certificates, and rewards
                </span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="notif-item"
                  onClick={() => handleNotificationClick(notif.link)}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '14px 18px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    background: notif.read ? 'transparent' : 'rgba(242, 100, 34, 0.03)',
                    position: 'relative',
                  }}
                >
                  {/* Unread Indicator Dot */}
                  {!notif.read && (
                    <div style={{
                      position: 'absolute',
                      top: '18px',
                      left: '8px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#f26422',
                      boxShadow: '0 0 8px rgba(242, 100, 34, 0.5)',
                    }} />
                  )}

                  {/* Type Icon */}
                  <div 
                    className="notif-item-icon"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      flexShrink: 0,
                    }}
                  >
                    {TYPE_ICONS[notif.type] || '🔔'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}>
                      <span 
                        className="notif-item-title"
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: notif.read ? 600 : 800,
                          color: notif.read ? '#b0b8c7' : '#fff',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {notif.title}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#555e6d',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <div 
                      className="notif-item-msg"
                      style={{
                        fontSize: '0.76rem',
                        color: notif.read ? '#555e6d' : '#8f98a9',
                        marginTop: '3px',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {notif.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
