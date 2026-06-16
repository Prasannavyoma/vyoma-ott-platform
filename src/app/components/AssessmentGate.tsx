"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AssessmentGate({ courseId }: { courseId: string }) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const listener = () => setUnlocked(true);
    window.addEventListener('video-finished', listener);
    return () => window.removeEventListener('video-finished', listener);
  }, []);

  if (!unlocked) {
    return (
      <div style={{ 
         display: 'block', marginTop: '20px', background: '#111', 
         border: '1px dashed #555', borderRadius: '12px', padding: '20px', color: '#fff',
         cursor: 'not-allowed', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
         <div style={{ fontSize: '0.7rem', color: '#ffb84d', fontWeight: 900, letterSpacing: '1px', marginBottom: '10px' }}>🔒 ACADEMY VALIDATION (LOCKED)</div>
         <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px', color: '#fff' }}>Certification Unavailable</div>
         <div style={{ fontSize: '0.8rem', color: '#bbb', lineHeight: '1.4' }}>Finish watching entire video completely to unlock mandatory competency validation module.</div>
         <div style={{ marginTop: '15px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 900, border: '1px solid #333', color: '#aaa', letterSpacing: '1px' }}>
            WATCH VIDEO FULLY TO UNLOCK
         </div>
      </div>
    );
  }

  return (
    <Link href={`/quiz/${courseId}`} style={{ 
       display: 'block', marginTop: '20px', background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', 
       border: '1px solid var(--primary)', borderRadius: '12px', padding: '20px', textDecoration: 'none', color: '#fff',
       boxShadow: '0 10px 30px rgba(242,100,34,0.2)', animation: 'pulseGlow 1s alternate infinite', transition: 'all 0.5s ease'
    }}>
       <style dangerouslySetInnerHTML={{ __html: `
         @keyframes pulseGlow { 0% { box-shadow: 0 0 10px rgba(242,100,34,0.2); } 100% { box-shadow: 0 0 25px rgba(242,100,34,0.5); } }
       ` }} />
       <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px' }}>✨ UNLOCKED & READY</div>
       <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px' }}>Unlock Certification Now</div>
       <div style={{ fontSize: '0.75rem', color: '#aaa', lineHeight: '1.4' }}>Congratulations. You have consumed required learning duration. Detach automated serial certificate + 💰 50 Coins.</div>
       <div style={{ marginTop: '15px', background: 'var(--primary)', color: '#fff', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
          ATTEMPT ASSESSMENT NOW →
       </div>
    </Link>
  );
}
