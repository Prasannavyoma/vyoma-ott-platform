"use client";

import { useEffect, useState } from 'react';

interface Sponsor {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
}

const FALLBACK_SPONSORS: Sponsor[] = [
  {
    id: 'f1',
    name: 'Vyoma Linguistic Labs',
    description: 'Pioneering multimedia Sanskrit education globally.',
    logoUrl: '/assets/logo-200-x-70-px.png'
  },
  {
    id: 'f2',
    name: 'Sanskrit Heritage Group',
    description: 'Preserving and cataloging historical manuscripts.',
    logoUrl: 'https://placehold.co/150x80/111/ffd700?text=Heritage+Preservation'
  },
  {
    id: 'f3',
    name: 'Indology Global Trust',
    description: 'Sponsoring research fellowships and grammar learning apps.',
    logoUrl: 'https://placehold.co/150x80/111/ffd700?text=Indology+Trust'
  },
  {
    id: 'f4',
    name: 'Gita Satsang Sansthan',
    description: 'Promoting scriptural wisdom and philosophical discourse.',
    logoUrl: 'https://placehold.co/150x80/111/ffd700?text=Gita+Satsang'
  }
];

export default function SponsorSlider({ 
  dbSponsors, 
  hideDummy = false 
}: { 
  dbSponsors: Sponsor[]; 
  hideDummy?: boolean;
}) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    if (dbSponsors && dbSponsors.length > 0) {
      setSponsors(dbSponsors);
    } else if (hideDummy) {
      setSponsors([]);
    } else {
      setSponsors(FALLBACK_SPONSORS);
    }
  }, [dbSponsors, hideDummy]);

  if (sponsors.length === 0) {
    return null;
  }

  // Duplicate items to ensure seamless infinite looping marquee
  const marqueeItems = [...sponsors, ...sponsors, ...sponsors];

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      position: 'relative',
      padding: '40px 0',
      background: 'radial-gradient(circle at top, rgba(242, 100, 34, 0.03) 0%, rgba(3, 11, 23, 0.4) 100%)',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      margin: '40px 0 20px 0',
      borderRadius: '16px'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scrollMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-260px * ${sponsors.length || 4})); }
        }
        .marquee-container {
          display: flex;
          overflow: hidden;
          width: 100%;
          mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: scrollMarquee 25s linear infinite;
          gap: 25px;
          align-items: center;
          padding: 10px 0;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .sponsor-card {
          width: 230px;
          height: 85px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 10px 20px;
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
        .sponsor-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: rgba(242, 100, 34, 0.5);
          box-shadow: 0 10px 25px rgba(242, 100, 34, 0.15), inset 0 1px 0 rgba(255,255,255,0.1);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%);
        }
        .sponsor-logo-container {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sponsor-logo {
          max-height: 75%;
          max-width: 100%;
          object-fit: contain;
          filter: grayscale(100%) opacity(0.4);
          transition: all 0.4s ease;
        }
        .sponsor-card:hover .sponsor-logo {
          filter: grayscale(0%) opacity(0.9);
        }
        .sponsor-monogram {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.4s ease;
          opacity: 0.5;
        }
        .sponsor-card:hover .sponsor-monogram {
          opacity: 1;
          transform: scale(1.05);
        }
      `}} />

      {/* Marquee Container Header */}
      <div style={{ textAlign: 'center', marginBottom: '25px', padding: '0 20px' }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          color: 'var(--primary)', 
          textTransform: 'uppercase', 
          letterSpacing: '3px',
          fontWeight: 800,
          margin: '0 0 8px 0'
        }}>
          🤝 Academic Partners & Patrons
        </h4>
        <p style={{
          fontSize: '0.85rem',
          color: '#8f98a9',
          margin: 0,
          fontWeight: 500,
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.4'
        }}>
          Collaborating with premier institutes to preserve and digitize timeless Sanskrit wisdom.
        </p>
      </div>

      <div className="marquee-container">
        <div className="marquee-track">
          {marqueeItems.map((item, idx) => {
            const isPlaceholder = item.logoUrl.includes('placehold.co') || !item.logoUrl;
            
            return (
              <div key={`${item.id}-${idx}`} className="sponsor-card" title={`${item.name} - ${item.description}`}>
                <div className="sponsor-logo-container">
                  {isPlaceholder ? (
                    <div className="sponsor-monogram">
                      <span style={{ 
                        fontSize: '1.15rem', 
                        fontWeight: 900, 
                        color: 'var(--primary)', 
                        letterSpacing: '1.5px', 
                        textTransform: 'uppercase',
                        textShadow: '0 0 10px rgba(242, 100, 34, 0.2)' 
                      }}>
                        {item.name.split(' ').slice(0, 3).map(w => w[0]).join('')}
                      </span>
                      <span style={{ 
                        fontSize: '0.62rem', 
                        fontWeight: 700, 
                        color: '#a8b3cf', 
                        marginTop: '4px', 
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '190px'
                      }}>
                        {item.name}
                      </span>
                    </div>
                  ) : (
                    <img 
                      src={item.logoUrl} 
                      alt={item.name} 
                      className="sponsor-logo" 
                      loading="lazy"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
