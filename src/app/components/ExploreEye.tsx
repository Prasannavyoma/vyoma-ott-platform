"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface ExploreEyeProps {
  variant?: 'navbar' | 'drawer';
  onClick?: () => void;
}

export default function ExploreEye({ variant = 'navbar', onClick }: ExploreEyeProps = {}) {
  const eyeRef = useRef<HTMLAnchorElement>(null);
  const pupilRef = useRef<SVGGElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current || !pupilRef.current) return;

      const eye = eyeRef.current.getBoundingClientRect();
      const eyeCenterX = eye.left + eye.width / 2;
      const eyeCenterY = eye.top + eye.height / 2;

      // Calculate angle and distance
      const deltaX = e.clientX - eyeCenterX;
      const deltaY = e.clientY - eyeCenterY;
      const angle = Math.atan2(deltaY, deltaX);
      
      // Limit the pupil movement radius so it stays inside the eye
      const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY) / 10, 12);

      const pupilX = Math.cos(angle) * distance;
      const pupilY = Math.sin(angle) * distance;

      pupilRef.current.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Realistic random blinking logic
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150); // fast blink down/up
      
      // Schedule next blink randomly between 2 and 6 seconds
      const nextBlink = Math.random() * 4000 + 2000;
      setTimeout(blink, nextBlink);
    };
    
    const timeout = setTimeout(blink, 3000);
    return () => clearTimeout(timeout);
  }, []);

  const clipId = `eyeClip-${variant}`;
  const gradId = `irisGrad-${variant}`;

  const renderEyeSvg = () => (
    <svg viewBox="0 0 100 100" className="live-eye-svg">
      <defs>
        <clipPath id={clipId}>
          <path 
            className={`eye-lid ${isBlinking ? 'blink-closed' : ''}`}
            d="M 5 50 Q 50 10 95 50 Q 50 90 5 50 Z" 
          />
        </clipPath>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#f26422" />
          <stop offset="100%" stopColor="#9e3708" />
        </radialGradient>
      </defs>

      {/* Sclera (White part) */}
      <path 
        className={`eye-lid ${isBlinking ? 'blink-closed' : ''}`}
        d="M 5 50 Q 50 10 95 50 Q 50 90 5 50 Z" 
        fill="rgba(255, 255, 255, 0.9)" 
        stroke="rgba(242, 100, 34, 0.5)" 
        strokeWidth="3" 
      />

      {/* Everything inside the eye (Pupil/Iris) is clipped to the eyelid shape */}
      <g clipPath={`url(#${clipId})`}>
        <g ref={pupilRef} className="pupil-group">
          {/* Iris */}
          <circle cx="50" cy="50" r="22" fill={`url(#${gradId})`} />
          {/* Inner Pupil (Black) */}
          <circle cx="50" cy="50" r="10" fill="#111" />
          {/* Highlights (3D glass reflection) */}
          <circle cx="43" cy="43" r="4" fill="#ffffff" opacity="0.8" />
          <circle cx="57" cy="54" r="1.5" fill="#ffffff" opacity="0.5" />
        </g>
      </g>

      {/* Upper Eyelid Crease (Adds depth) */}
      <path 
        className={`eye-crease ${isBlinking ? 'blink-closed-crease' : ''}`}
        d="M 15 42 Q 50 15 85 42" 
        fill="none" 
        stroke="rgba(255,255,255,0.2)" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );

  if (variant === 'drawer') {
    return (
      <>
        <Link 
          href="/explore" 
          title="Explore Hub" 
          onClick={onClick}
          className="drawer-explore-eye-link" 
          ref={eyeRef}
        >
          <div className="eye-container" style={{ width: '22px', height: '22px', flexShrink: 0 }}>
            {renderEyeSvg()}
          </div>
          <span>Explore Hub</span>
        </Link>

        <style dangerouslySetInnerHTML={{__html: `
          .drawer-explore-eye-link {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #fff;
            text-decoration: none;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.25s ease;
            padding: 2px 0;
          }
          .drawer-explore-eye-link:hover {
            color: #f26422 !important;
            transform: translateX(4px);
          }
        `}} />
      </>
    );
  }

  return (
    <>
      <Link href="/explore" title="Explore Hub" className="explore-eye-link" ref={eyeRef} onClick={onClick}>
        <div className="eye-container">
          {renderEyeSvg()}
        </div>
        <span className="explore-text">Explore</span>
      </Link>

      <style dangerouslySetInnerHTML={{__html: `
        .explore-eye-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #fff;
          font-weight: 700;
          font-size: 0.88rem;
          height: 38px;
          padding: 0 14px;
          border-radius: 20px !important;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          box-sizing: border-box;
          flex-shrink: 0;
        }
        
        .explore-eye-link:hover {
          background: rgba(242, 100, 34, 0.15);
          border-color: rgba(242, 100, 34, 0.4);
          color: #f26422;
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(242, 100, 34, 0.25);
        }

        @media (max-width: 640px) {
          .explore-eye-link {
            padding: 0 !important;
            width: 38px !important;
            height: 38px !important;
            justify-content: center !important;
            border-radius: 50% !important;
            flex-shrink: 0;
          }
          .explore-eye-link .explore-text {
            display: none !important;
          }
        }

        .eye-container {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .live-eye-svg {
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 0 4px rgba(242, 100, 34, 0.4));
        }

        .pupil-group {
          transition: transform 0.1s ease-out; /* Smooth tracking */
          transform-origin: center;
        }

        .eye-lid {
          transition: d 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .eye-crease {
          transition: d 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* The 'Closed' path state for blinking */
        .blink-closed {
          d: path("M 5 50 Q 50 50 95 50 Q 50 50 5 50 Z");
        }
        .blink-closed-crease {
          d: path("M 15 50 Q 50 50 85 50");
          opacity: 0;
        }
      `}} />
    </>
  );
}
