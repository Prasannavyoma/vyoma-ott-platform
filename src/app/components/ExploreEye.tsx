"use client";

import Link from 'next/link';

export default function ExploreEye() {
  return (
    <>
      <Link href="/explore" title="Explore Hub" className="explore-eye-link desktop-only">
        <svg viewBox="0 0 100 100" className="live-eye-svg">
          {/* Eye Outline */}
          <path 
            className="eye-outline" 
            d="M 10 50 Q 50 10 90 50 Q 50 90 10 50 Z" 
            fill="rgba(242, 100, 34, 0.1)" 
            stroke="#f26422" 
            strokeWidth="6" 
            strokeLinejoin="round" 
          />
          {/* Pupil */}
          <circle 
            className="eye-pupil" 
            cx="50" 
            cy="50" 
            r="16" 
            fill="#f26422" 
          />
          {/* Little Pupil Highlight for 3D effect */}
          <circle 
            className="eye-pupil-highlight" 
            cx="44" 
            cy="44" 
            r="4" 
            fill="#ffffff" 
          />
        </svg>
        <span className="explore-text">Explore</span>
      </Link>

      <style dangerouslySetInnerHTML={{__html: `
        .explore-eye-link {
          display: flex;
          align-items: center;
          gap: 6px;
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

        .explore-eye-link:hover .eye-outline {
          fill: rgba(242, 100, 34, 0.2);
        }

        .live-eye-svg {
          width: 22px;
          height: 22px;
          overflow: visible;
        }

        .eye-outline {
          transform-origin: center;
          animation: blink 4.5s infinite;
          transition: fill 0.3s;
        }

        .eye-pupil, .eye-pupil-highlight {
          transform-origin: center;
          animation: lookAround 4.5s infinite;
        }

        /* The pupil highlight needs to follow the pupil */
        .eye-pupil-highlight {
          animation: lookAround 4.5s infinite;
        }

        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }

        @keyframes lookAround {
          0%, 100% { transform: translate(0, 0); }
          15% { transform: translate(-12px, 0); } /* Look sharp left */
          25% { transform: translate(-12px, 0); } 
          40% { transform: translate(12px, -8px); } /* Look up right */
          50% { transform: translate(12px, -8px); } 
          65% { transform: translate(0, 0); } /* Center */
          80% { transform: translate(8px, 8px); } /* Look bottom right */
          85% { transform: translate(8px, 8px); } 
        }
      `}} />
    </>
  );
}
