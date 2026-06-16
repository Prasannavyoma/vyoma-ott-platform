"use client";

import React, { useState } from 'react';
import { reviewFlashcard } from '@/app/actions/learning-ott';

interface Flashcard {
  id: string;
  word: string;
  definition: string;
  box: number;
  nextReviewAt: any;
  createdAt: any;
}

export default function FlashcardDeckClient({
  initialAllCards,
  initialDueCards,
  initialFutureCards
}: {
  initialAllCards: Flashcard[];
  initialDueCards: Flashcard[];
  initialFutureCards: Flashcard[];
}) {
  const [allCards, setAllCards] = useState<Flashcard[]>(initialAllCards);
  const [dueCards, setDueCards] = useState<Flashcard[]>(initialDueCards);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const currentCard = dueCards[currentIdx];

  const handleReview = async (remembered: boolean) => {
    if (!currentCard) return;

    try {
      const res = await reviewFlashcard(currentCard.id, remembered);
      
      // Update local flashcard list state
      const updatedAll = allCards.map(c => {
        if (c.id === currentCard.id) {
          const nextDate = new Date();
          const intervals = [1, 3, 7, 14, 30];
          nextDate.setDate(nextDate.getDate() + intervals[res.nextBox - 1]);
          return { ...c, box: res.nextBox, nextReviewAt: nextDate };
        }
        return c;
      });

      setAllCards(updatedAll);

      // Transition animation
      setIsFlipped(false);
      setTimeout(() => {
        // Remove completed card from due list
        setDueCards(prev => prev.filter(c => c.id !== currentCard.id));
      }, 300);

    } catch (err) {
      console.error(err);
    }
  };

  // Compute stats
  const totalMastered = allCards.filter(c => c.box === 5).length;
  const learningCount = allCards.filter(c => c.box < 5).length;

  const filteredCards = allCards.filter(card => 
    card.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
    card.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* 📊 Stats Overview Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={statCardStyle}>
          <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Deck Size</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', marginTop: '5px' }}>{allCards.length}</span>
        </div>
        <div style={{ ...statCardStyle, border: '1px solid rgba(242, 100, 34, 0.2)', background: 'rgba(242, 100, 34, 0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: '#ff8c53', fontWeight: 'bold', textTransform: 'uppercase' }}>Due Reviews</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#f26422', marginTop: '5px' }}>{dueCards.length}</span>
        </div>
        <div style={{ ...statCardStyle, border: '1px solid rgba(70, 211, 105, 0.2)', background: 'rgba(70, 211, 105, 0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: '#46d369', fontWeight: 'bold', textTransform: 'uppercase' }}>Mastered (Box 5)</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#46d369', marginTop: '5px' }}>{totalMastered}</span>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Learning</span>
          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#aaa', marginTop: '5px' }}>{learningCount}</span>
        </div>
      </div>

      {/* 🎯 MAIN ACTIVE RECALL ZONE */}
      <div style={{ background: '#0e121f', border: '1px solid #1a2238', borderRadius: '24px', padding: '40px', marginBottom: '50px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎯</span> Active Recall Queue
        </h2>

        {dueCards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🎉</div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff', marginBottom: '10px' }}>All caught up!</h3>
            <p style={{ color: '#888', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
              Your memory retrieval queue is completely clear. Words in your deck will reappear as they become due for review.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Card Counter Progress Bar */}
            <div style={{ width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#aaa', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px' }}>
              <span>PROGRESS</span>
              <span>1 / {dueCards.length} DUE</span>
            </div>
            <div style={{ width: '100%', maxWidth: '480px', height: '6px', background: '#1c253d', borderRadius: '3px', overflow: 'hidden', marginBottom: '40px' }}>
              <div style={{ width: `${(1 / dueCards.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #f26422 0%, #ff8c53 100%)' }} />
            </div>

            {/* 3D Flipping Card Container */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                width: '100%',
                maxWidth: '480px',
                height: '280px',
                perspective: '1000px',
                cursor: 'pointer',
                marginBottom: '35px'
              }}
            >
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                textAlign: 'center',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'none',
                borderRadius: '20px',
                boxShadow: isFlipped ? '0 10px 40px rgba(242,100,34,0.15)' : '0 10px 40px rgba(0,0,0,0.5)'
              }}>
                
                {/* Front Side */}
                <div style={{
                  ...cardFaceStyle,
                  background: 'linear-gradient(135deg, #1c2438 0%, #131826 100%)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#888', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>TERM</span>
                  <h3 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '20px 0 10px 0' }}>{currentCard.word}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary, #f26422)', fontWeight: 'bold', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🔄</span> Click card to flip
                  </p>
                </div>

                {/* Back Side */}
                <div style={{
                  ...cardFaceStyle,
                  background: 'linear-gradient(135deg, #152238 0%, #0d1626 100%)',
                  border: '1px solid rgba(242,100,34,0.3)',
                  transform: 'rotateY(180deg)'
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#ff8c53', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>DEFINITION / TRANSLATION</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <p style={{ fontSize: '1.2rem', color: '#eee', lineHeight: '1.6', fontWeight: 600, margin: 0 }}>{currentCard.definition}</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold' }}>Box {currentCard.box} • Leitner Leitner-Box</span>
                </div>

              </div>
            </div>

            {/* Answer feedback buttons (Shown only when card is flipped) */}
            <div style={{ height: '60px', width: '100%', maxWidth: '480px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
              {isFlipped ? (
                <>
                  <button 
                    onClick={() => handleReview(false)} 
                    style={{
                      flex: 1,
                      padding: '15px',
                      background: 'linear-gradient(135deg, #df2222 0%, #b21414 100%)',
                      border: 'none', color: '#fff',
                      borderRadius: '12px', cursor: 'pointer',
                      fontWeight: 800, fontSize: '0.9rem',
                      boxShadow: '0 4px 15px rgba(223,34,34,0.2)',
                      transition: 'transform 0.1s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ✕ I Forgot
                  </button>
                  <button 
                    onClick={() => handleReview(true)} 
                    style={{
                      flex: 1.2,
                      padding: '15px',
                      background: 'linear-gradient(135deg, #46d369 0%, #2e9f4c 100%)',
                      border: 'none', color: '#fff',
                      borderRadius: '12px', cursor: 'pointer',
                      fontWeight: 900, fontSize: '0.9rem',
                      boxShadow: '0 4px 15px rgba(70,211,105,0.2)',
                      transition: 'transform 0.1s'
                    }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    ✓ I Remembered
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsFlipped(true)}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  👁️ REVEAL ANSWER
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* 📚 DECK VOCABULARY DATABASE TABLE */}
      <div style={{ background: '#0a0a0d', border: '1px solid #14141a', borderRadius: '24px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>📚 Vocabulary Repository</h2>
            <p style={{ color: '#666', fontSize: '0.75rem', margin: '5px 0 0 0' }}>Search and track all concepts in your study profile.</p>
          </div>
          <input 
            type="text"
            placeholder="Search deck terminology..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 15px',
              background: '#111',
              border: '1px solid #222',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              width: '100%',
              maxWidth: '280px'
            }}
          />
        </div>

        {filteredCards.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#555', fontSize: '0.85rem', border: '1px dashed #222', borderRadius: '12px' }}>
            No vocabulary matches found in your repository.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222', color: '#888' }}>
                  <th style={{ padding: '12px 15px' }}>WORD / PHRASE</th>
                  <th style={{ padding: '12px 15px' }}>DEFINITION</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center' }}>INTERVAL TIER</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right' }}>NEXT REVIEW</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((card) => {
                  const isCardDue = new Date(card.nextReviewAt) <= new Date();
                  
                  return (
                    <tr key={card.id} style={{ borderBottom: '1px solid #14141a', transition: 'background 0.2s' }} className="deck-row">
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#fff' }}>{card.word}</td>
                      <td style={{ padding: '15px', color: '#ccc' }}>{card.definition}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold',
                          background: card.box === 5 ? 'rgba(70,211,105,0.1)' : 'rgba(242,100,34,0.1)',
                          color: card.box === 5 ? '#46d369' : '#f26422',
                          border: `1px solid ${card.box === 5 ? 'rgba(70,211,105,0.2)' : 'rgba(242,100,34,0.2)'}`
                        }}>
                          Box {card.box} {card.box === 5 ? '🏆 Mastered' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: 600, color: isCardDue ? '#ff8c53' : '#666' }}>
                        {isCardDue ? '🔴 DUE NOW' : new Date(card.nextReviewAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline Styles
const statCardStyle: React.CSSProperties = {
  background: '#0e121f',
  border: '1px solid #141b2d',
  borderRadius: '16px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

const cardFaceStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  backfaceVisibility: 'hidden',
  borderRadius: '20px',
  padding: '30px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};
