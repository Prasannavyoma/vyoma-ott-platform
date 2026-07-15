"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function ExploreEye() {
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

  return (
    <>
      <Link href="/explore" title="Explore Hub" className="explore-eye-link desktop-only" ref={eyeRef}>
        <div className="eye-container">
          <svg viewBox="0 0 100 100" className="live-eye-svg">
            
            <defs>
              <clipPath id="eyeClip">
                <path 
                  className={`eye-lid ${isBlinking ? 'blink-closed' : ''}`}
                  d="M 5 50 Q 50 10 95 50 Q 50 90 5 50 Z" 
                />
              </clipPath>
              <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
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
            <g clipPath="url(#eyeClip)">
              <g ref={pupilRef} className="pupil-group">
                {/* Iris */}
                <circle cx="50" cy="50" r="22" fill="url(#irisGrad)" />
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
        </div>
        <span className="explore-text">Explore</span>
      </Link>

      <style dangerouslySetInnerHTML={{__html: `
        .explore-eye-link {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #fff;
          font-weight: 700;
          font-size: 0.9rem;
          padding: 6px 14px;
          border-radius: 24px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .explore-eye-link:hover {
          background: rgba(242, 100, 34, 0.15);
          border-color: rgba(242, 100, 34, 0.5);
          color: #f26422;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(242, 100, 34, 0.2);
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
