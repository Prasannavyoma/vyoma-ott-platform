"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SliderItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  accessLevel: string | null;
  contentType?: string;
}

export default function HeroSlider({ items }: { items: SliderItem[] }) {
  const [index, setIndex] = useState(0);

  // Auto-advance the hero banner every 7 seconds
  useEffect(() => {
    if (!items || items.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <section className="hero" style={{ backgroundImage: `url('/assets/Bala-new.jpg')` }}>
        <div className="hero-content">
          <h1 className="hero-title">Srimad Valmiki Ramayana</h1>
          <p className="hero-desc">Embark on the eternal epic narrative of standard values and righteous living.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="hero-slider-wrapper" style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#000' }}>
      {items.map((item, i) => {
        const isActive = i === index;
        const bgImg = item.thumbnailUrl || '/assets/Bala-new.jpg';
        const cleanDesc = (item.description || '').replace(/<[^>]*>/g, ''); // Strip HTML if any
        const displayDesc = cleanDesc.length > 180 ? cleanDesc.substring(0, 180) + "..." : cleanDesc;

        return (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: isActive ? 1 : 0,
              transition: 'opacity 1.0s ease-in-out',
              zIndex: isActive ? 2 : 1,
              pointerEvents: isActive ? 'all' : 'none'
            }}
          >
            {/* Reusing authentic CSS .hero structure that has cinematic vignettes */}
            <section className="hero" style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', minHeight: '100%',
              display: 'flex', alignItems: 'center'
            }}>
              {/* Image Layer with Ken Burns */}
              <div className="hero-bg-image" style={{ backgroundImage: `url('${bgImg}')` }} />
              
              {/* Elegant Cinematic Gradient Overlay */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, rgba(10,12,20,0.95) 0%, rgba(10,12,20,0.5) 45%, rgba(0,0,0,0) 100%), linear-gradient(0deg, rgba(10,12,20,0.9) 0%, rgba(0,0,0,0) 30%)',
                zIndex: 1
              }} />

              <div className="hero-content" style={{
                position: 'relative',
                zIndex: 2,
                transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                opacity: isActive ? 1 : 0,
                transition: 'all 1.0s cubic-bezier(0.25, 1, 0.5, 1)',
                transitionDelay: '0.15s',
                padding: '0 4%', 
                maxWidth: 'min(100%, 600px)',  // Fluid constraint
                minWidth: 'min(100%, 300px)'
              }}>

                {/* Refined Metadata Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', color: '#c4c4c4', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                  <span style={{ color: '#46d369', fontWeight: 800 }}>98% Match</span>
                  <span>2026</span>
                  <span>{item.contentType || 'Spiritual Series'}</span>
                  <span style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', color: '#e0e0e0' }}>HD</span>
                </div>

                <h1 className="hero-title" style={{ 
                  textShadow: '0 4px 20px rgba(0,0,0,0.8)', 
                  fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', // Much smaller, elegant scaling
                  fontWeight: 800,
                  lineHeight: '1.2',
                  marginBottom: '16px',
                  color: '#ffffff',
                  letterSpacing: '-0.5px'
                }}>
                  {item.title ? item.title.replace(/&amp;/g, '&') : ''}
                </h1>

                <p className="hero-desc" style={{ 
                  fontSize: '1rem', // Smaller text
                  lineHeight: '1.6', 
                  marginBottom: '30px',
                  color: 'rgba(255, 255, 255, 0.75)',
                  textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontWeight: 400,
                  paddingRight: '10%' // So it doesn't hit the absolute edge
                }}>
                  {displayDesc ? displayDesc.replace(/&amp;/g, '&') : ''}
                </p>

                <div className="hero-buttons" style={{ display: 'flex', gap: '12px' }}>
                  <Link href={`/watch/${item.id}`} style={{ 
                    padding: '8px 24px', // Smaller buttons
                    fontSize: '0.95rem', 
                    fontWeight: 700,
                    background: '#ffffff',
                    color: '#000000',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.background = 'rgba(255,255,255,0.85)' }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#ffffff' }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>▶</span> Play
                  </Link>
                  
                  <Link href={`/watch/${item.id}`} style={{ 
                    padding: '8px 24px', // Smaller buttons
                    fontSize: '0.95rem', 
                    fontWeight: 700,
                    background: 'rgba(80, 80, 82, 0.65)',
                    color: '#ffffff',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.background = 'rgba(80, 80, 82, 0.4)' }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(80, 80, 82, 0.65)' }}
                  >
                    <span style={{ fontSize: '1.2rem', color: '#ffffff' }}>ⓘ</span> More Info
                  </Link>
                </div>
              </div>
            </section>
          </div>
        );
      })}

      {/* PAGINATION DOTS NAVIGATION OVERLAY */}
      {items.length > 1 && (
        <div style={{
          position: 'absolute',
          bottom: '8%',
          right: '6%',
          zIndex: 20,
          display: 'flex',
          gap: '10px'
        }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: i === index ? '35px' : '12px',
                height: '12px',
                borderRadius: '6px',
                background: i === index ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
