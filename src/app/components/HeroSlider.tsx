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
            {/* --- DESKTOP SLIDER --- */}
            <div className="desktop-only" style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
              <section className="hero" style={{ 
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', minHeight: '100%',
                display: 'flex', alignItems: 'center'
              }}>
                {/* Full-width Cover Image, pushed to the right */}
                <div style={{
                  position: 'absolute',
                  top: 0, bottom: 0, left: 0, right: 0,
                  backgroundImage: `url('${bgImg}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'right top', /* Pin to top so heads are never cropped */
                  backgroundRepeat: 'no-repeat',
                  zIndex: 0
                }} />

                {/* Massive Netflix-style Solid Gradient Overlay */}
                {/* 
                  - Solid #030b17 from 0% to 45% completely ERASES any text built into the left side of the image.
                  - Fades beautifully from 45% to 75% to reveal the artwork on the right.
                  - Bottom gradient to blend smoothly into the page below.
                */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: `
                    linear-gradient(90deg, #030b17 0%, #030b17 45%, rgba(3,11,23,0.8) 60%, transparent 85%),
                    linear-gradient(0deg, #030b17 0%, rgba(3,11,23,0) 25%)
                  `,
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
                  maxWidth: 'min(100%, 600px)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', color: '#c4c4c4', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                    <span style={{ color: '#46d369', fontWeight: 800 }}>98% Match</span>
                    <span>2026</span>
                    <span>{item.contentType || 'Spiritual Series'}</span>
                    <span style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem', color: '#e0e0e0' }}>HD</span>
                  </div>

                  <h1 className="hero-title" style={{ 
                    textShadow: '0 4px 20px rgba(0,0,0,0.8)', 
                    fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', 
                    fontWeight: 800,
                    lineHeight: '1.2',
                    marginBottom: '16px',
                    color: '#ffffff',
                    letterSpacing: '-0.5px'
                  }}>
                    {item.title ? item.title.replace(/&amp;/g, '&') : ''}
                  </h1>

                  <p className="hero-desc" style={{ 
                    fontSize: '1rem', 
                    lineHeight: '1.6', 
                    marginBottom: '30px',
                    color: 'rgba(255, 255, 255, 0.75)',
                    textShadow: '0 2px 10px rgba(0,0,0,0.9)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontWeight: 400
                  }}>
                    {displayDesc ? displayDesc.replace(/&amp;/g, '&') : ''}
                  </p>

                  <div className="hero-buttons" style={{ display: 'flex', gap: '12px' }}>
                    <Link href={`/watch/${item.id}`} style={{ 
                      padding: '8px 24px', 
                      fontSize: '0.95rem', 
                      fontWeight: 700,
                      background: '#ffffff',
                      color: '#000000',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>▶</span> Play
                    </Link>
                    <Link href={`/watch/${item.id}`} style={{ 
                      padding: '8px 24px', 
                      fontSize: '0.95rem', 
                      fontWeight: 700,
                      background: 'rgba(80, 80, 82, 0.65)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.2rem', color: '#ffffff' }}>ℹ</span> More Info
                    </Link>
                  </div>
                </div>
              </section>
            </div>

            {/* --- MOBILE SLIDER (Netflix Poster Style) --- */}
            <div className="mobile-only" style={{ height: '75vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
              {/* Blurred atmospheric background */}
              <div style={{
                position: 'absolute',
                top: '-10%', left: '-10%', right: '-10%', bottom: '-10%',
                backgroundImage: `url('${bgImg}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px) brightness(0.6)',
                zIndex: 0
              }} />
              
              {/* Uncropped sharp foreground image centered in top half */}
              <div style={{
                position: 'absolute',
                top: '12%',
                left: '5%',
                right: '5%',
                height: '40%',
                backgroundImage: `url('${bgImg}')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.8))',
                zIndex: 1
              }} />

              {/* Bottom gradient fade up to text */}
              <div style={{
                position: 'absolute',
                top: '40%', left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to top, #030b17 0%, #030b17 25%, rgba(3,11,23,0.8) 55%, transparent 100%)',
                zIndex: 1
              }} />

              <div style={{
                position: 'absolute',
                bottom: '10%',
                left: 0,
                right: 0,
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '0 20px',
                transform: isActive ? 'translateY(0)' : 'translateY(20px)',
                opacity: isActive ? 1 : 0,
                transition: 'all 1.0s cubic-bezier(0.25, 1, 0.5, 1)',
                transitionDelay: '0.15s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px', color: '#c4c4c4', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span style={{ color: '#46d369', fontWeight: 800 }}>98% Match</span>
                  <span>2026</span>
                  <span>{item.contentType || 'Spiritual'}</span>
                  <span style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '1px 4px', borderRadius: '3px' }}>HD</span>
                </div>

                <h1 style={{ 
                  fontSize: '2.4rem', 
                  fontWeight: 800,
                  lineHeight: '1.1',
                  marginBottom: '20px',
                  color: '#ffffff',
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                }}>
                  {item.title ? item.title.replace(/&amp;/g, '&') : ''}
                </h1>

                <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
                  <Link href={`/watch/${item.id}`} style={{ 
                    flex: 1,
                    padding: '12px 0', 
                    fontSize: '1rem', 
                    fontWeight: 700,
                    background: '#ffffff',
                    color: '#000000',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>▶</span> Play
                  </Link>
                  <Link href={`/watch/${item.id}`} style={{ 
                    flex: 1,
                    padding: '12px 0', 
                    fontSize: '1rem', 
                    fontWeight: 700,
                    background: 'rgba(80, 80, 82, 0.8)',
                    color: '#ffffff',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>ℹ</span> Info
                  </Link>
                </div>
              </div>
            </div>
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
