"use client";

import { useState, useEffect } from 'react';

interface TrailerPlayerProps {
  trailerUrl: string;
  title: string;
}

export default function TrailerPlayer({ trailerUrl, title }: TrailerPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    // Block body scroll
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!trailerUrl) return null;

  // Helper to extract YouTube Video ID
  function getYouTubeEmbedUrl(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    return null;
  }

  const ytEmbedUrl = getYouTubeEmbedUrl(trailerUrl);

  return (
    <>
      {/* Elegant Trailer Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 25px',
          background: 'rgba(255, 255, 255, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '30px',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.95rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(10px)',
          letterSpacing: '0.5px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.borderColor = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🎬</span> Watch Trailer
      </button>

      {/* Fullscreen Cinema Overlay Modal */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 11, 23, 0.95)', // Matching Midnight Blue theme
            backdropFilter: 'blur(20px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Styling keyframes inline for self-containment */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(30px) scale(0.95); opacity: 0; }
              to { transform: translateY(0) scale(1); opacity: 1; }
            }
          `}</style>

          <div 
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '1000px',
              background: '#000',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              animation: 'slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '15px 25px', 
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10
            }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                 📽️ Trailer: {title}
              </h4>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  width: '36px',
                  height: '36px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,77,79,0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                ✕
              </button>
            </div>

            {/* Cinematic Player Envelope */}
            <div style={{ position: 'relative', paddingTop: '56.25%', width: '100%' }}>
              {ytEmbedUrl ? (
                <iframe
                  src={ytEmbedUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={trailerUrl}
                  controls
                  autoPlay
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
