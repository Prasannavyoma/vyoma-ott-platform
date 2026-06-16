"use client";

import { useState, useEffect, useRef } from 'react';

export default function CourseEngagement({ courseId, children }: { courseId: string, initialNote?: string, children?: React.ReactNode }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShareUrl(window.location.href);

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const shareTitle = "Check out this awesome Vedic lesson on Vyoma!";
  
  // Handle standard native sharing pipeline
  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Vyoma Sanskrit OTT',
          text: shareTitle,
          url: shareUrl,
        });
      } catch (e) {}
    } else {
      alert("Direct device sharing not supported on this browser. Use listed channels!");
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link Copied successfully!');
      setShowDropdown(false);
    });
  }

  return (
    <div style={{ marginTop: '30px', borderTop: '1px solid #222', paddingTop: '25px' }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px', alignItems: 'center' }}>
         {/* 1. Like/Favorite Toggle */}
         <button 
           onClick={() => setLiked(!liked)} 
           style={{ 
             background: liked ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.03)', 
             color: liked ? '#ff3b30' : '#fff', 
             border: liked ? '1px solid rgba(255,59,48,0.4)' : '1px solid rgba(255,255,255,0.08)', 
             padding: '12px 20px', 
             borderRadius: '30px', 
             cursor: 'pointer', 
             fontWeight: 800,
             fontSize: '0.9rem',
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             transition: 'all 0.2s'
           }}
         >
            <span style={{ fontSize: '1.1rem' }}>{liked ? '❤️' : '🤍'}</span> 
            {liked ? 'Favorited' : 'Favorite'}
         </button>
         
         {/* 2. Watchlist Toggle (Requested replacement for Bookmark) */}
         <button 
           onClick={() => setBookmarked(!bookmarked)} 
           style={{ 
             background: bookmarked ? 'rgba(242,100,34,0.12)' : 'rgba(255,255,255,0.04)', 
             color: bookmarked ? 'var(--primary)' : '#fff', 
             border: bookmarked ? '1px solid rgba(242,100,34,0.4)' : '1px solid rgba(255,255,255,0.08)', 
             padding: '12px 24px', 
             borderRadius: '30px', 
             cursor: 'pointer', 
             fontWeight: 800,
             fontSize: '0.9rem',
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             transition: 'all 0.2s',
             boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
           }}
         >
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{bookmarked ? '✓' : '＋'}</span> 
            {bookmarked ? 'In Watchlist' : 'Watchlist'}
         </button>

         <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} className="engagement-divider"></div>

         {/* 3. Unified Dropdown Share Control */}
         <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: showDropdown ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '12px 22px',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: 900,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.25s ease',
                boxShadow: showDropdown ? '0 8px 20px rgba(242,100,34,0.3)' : 'none'
              }}
            >
               <span style={{ fontSize: '1.1rem' }}>🔗</span>
               Share
               <span style={{ 
                 display: 'inline-block', 
                 fontSize: '0.7rem', 
                 transition: 'transform 0.2s', 
                 transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)' 
               }}>▼</span>
            </button>

            {/* Dropdown Flyout Drawer */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '260px',
                maxWidth: 'calc(100vw - 40px)',
                background: 'rgba(20, 20, 20, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '16px',
                padding: '10px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                animation: 'fadeInUp 0.2s ease-out forwards'
              }}>
                 
                 <h5 style={{ margin: '8px 12px', color: '#666', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>
                   Broadcasting Channels
                 </h5>

                 {/* WhatsApp Button */}
                 <a 
                   href={`https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}`} 
                   target="_blank"
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff', 
                     padding: '12px', borderRadius: '10px', background: 'transparent', transition: 'background 0.2s' 
                   }}
                   className="share-item-hover"
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                 >
                    <div style={{ background: '#25D366', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>💬</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>WhatsApp</span>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>Direct to chat or group</span>
                    </div>
                 </a>

                 {/* Facebook */}
                 <a 
                   href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} 
                   target="_blank"
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff', 
                     padding: '12px', borderRadius: '10px', background: 'transparent', transition: 'background 0.2s' 
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(24, 119, 242, 0.15)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                 >
                    <div style={{ background: '#1877F2', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📘</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Facebook</span>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>Share to news feed</span>
                    </div>
                 </a>

                 {/* Twitter / X */}
                 <a 
                   href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`} 
                   target="_blank"
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff', 
                     padding: '12px', borderRadius: '10px', background: 'transparent', transition: 'background 0.2s' 
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                 >
                    <div style={{ background: '#000', border: '1px solid #333', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>𝕏</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Twitter / X</span>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>Broadcast to network</span>
                    </div>
                 </a>

                 {/* LinkedIn */}
                 <a 
                   href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} 
                   target="_blank"
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff', 
                     padding: '12px', borderRadius: '10px', background: 'transparent', transition: 'background 0.2s' 
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(10, 102, 194, 0.15)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                 >
                    <div style={{ background: '#0A66C2', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>💼</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>LinkedIn</span>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>Share professional post</span>
                    </div>
                 </a>

                 {/* Telegram (NEW requested by 'other also add') */}
                 <a 
                   href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} 
                   target="_blank"
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#fff', 
                     padding: '12px', borderRadius: '10px', background: 'transparent', transition: 'background 0.2s' 
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 136, 204, 0.15)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                 >
                    <div style={{ background: '#0088cc', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>✈️</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Telegram</span>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>Send to channel/contact</span>
                    </div>
                 </a>

                 <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '6px 8px' }}></div>

                 {/* Copy Link Utilities */}
                 <button 
                   onClick={handleCopy}
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: '#fff', 
                     padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.2s'
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                 >
                    <span style={{ fontSize: '1.1rem', width: '32px', textAlign: 'center' }}>📎</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Copy Direct URL</span>
                 </button>

                 {/* Native device utilities */}
                 <button 
                   onClick={handleNativeShare}
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', color: 'var(--primary)', 
                     padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.2s'
                   }}
                   onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(242,100,34,0.1)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                 >
                    <span style={{ fontSize: '1.1rem', width: '32px', textAlign: 'center' }}>⚡</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Other Apps / Airdrop</span>
                 </button>

              </div>
            )}
          </div>
          {children}
       </div>



    </div>
  );
}
