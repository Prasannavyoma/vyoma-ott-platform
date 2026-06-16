import React from 'react';
import NavBar from '@/app/components/NavBar';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAllFlashcards } from '@/app/actions/learning-ott';
import Link from 'next/link';
import FlashcardDeckClient from './FlashcardDeckClient';

export default async function FlashcardsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const allCards = await getAllFlashcards();
  
  // Sort due cards
  const now = new Date();
  const dueCards = allCards.filter(c => new Date(c.nextReviewAt) <= now);
  const futureCards = allCards.filter(c => new Date(c.nextReviewAt) > now);

  return (
    <div style={{ minHeight: '100vh', background: '#07090e', color: '#fff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <NavBar />
      
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/profile" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>
            👤 Profile
          </Link>
          <span style={{ color: '#444' }}>/</span>
          <span style={{ color: 'var(--primary, #f26422)', fontSize: '0.9rem', fontWeight: 700 }}>🎴 Flashcard Mastery</span>
        </div>

        {/* Header Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(242, 100, 34, 0.1) 0%, rgba(15, 22, 36, 0.4) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Decorative background glow */}
          <div style={{
            position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px',
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(242, 100, 34, 0.15) 0%, transparent 70%)',
            filter: 'blur(50px)', pointerEvents: 'none'
          }} />

          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '15px', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            🎴 Vocabulary Mastery Center
          </h1>
          <p style={{ color: '#aaa', fontSize: '1rem', lineHeight: '1.6', maxWidth: '650px', margin: 0 }}>
            Reinforce terms and phrases saved during your course sessions. Our Leitner System queues difficult concepts more frequently to maximize long-term memory retrieval.
          </p>
        </div>

        <FlashcardDeckClient initialAllCards={allCards} initialDueCards={dueCards} initialFutureCards={futureCards} />

      </main>
    </div>
  );
}
