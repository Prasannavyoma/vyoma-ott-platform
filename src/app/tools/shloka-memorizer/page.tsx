'use client';

import React, { useState, useEffect } from 'react';
import NavBar from '@/app/components/NavBar';
import { getSanskritSettings, awardSanskritCoins } from '@/app/actions/sanskrit-settings';

interface ShlokaGameData {
  id: string;
  title: string;
  sanskrit: string;
  translation: string;
  words: string[];
  source: string;
}

const GAME_SHLOKAS: ShlokaGameData[] = [
  {
    id: "ganesha_1",
    title: "Ganesha Dhyana Shloka",
    sanskrit: "शुक्लाम्बरधरं देवं शशिवर्णं चतुर्भुजम् । प्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये ॥",
    translation: "One should meditate on Lord Ganesha, who is clad in white, who is all-pervading, who has the color of the moon, who has four arms, and has a bright/pleasant face, for the removal of all obstacles.",
    source: "Ganesha Stotram",
    words: ["शुक्लाम्बरधरं", "देवं", "शशिवर्णं", "चतुर्भुजम्", "प्रसन्नवदनं", "ध्यायेत्", "सर्वविघ्नोपशान्तये"]
  },
  {
    id: "gita_2_47",
    title: "Gita - Karma Yoga",
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन । मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥",
    translation: "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.",
    source: "Bhagavad Gita 2.47",
    words: ["कर्मण्येवाधिकारस्ते", "मा", "फलेषु", "कदाचन", "मा", "कर्मफलहेतुर्भूर्मा", "ते", "सङ्गोऽस्त्वकर्मणि"]
  },
  {
    id: "gayatri",
    title: "Gayatri Mantra",
    sanskrit: "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥",
    translation: "We meditate on the adorable glory of the radiant sun; may he inspire and stimulate our minds/intellect.",
    source: "Rigveda",
    words: ["ॐ", "भूर्भुवः", "स्वः", "तत्सवितुर्वरेण्यं", "भर्गो", "देवस्य", "धीमहि", "धियो", "यो", "नः", "प्रचोदयात्"]
  },
  {
    id: "saraswati",
    title: "Saraswati Vandana",
    sanskrit: "या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता या वीणावरदण्डमण्डितकरा या श्वेतपद्मासना ।",
    translation: "Salutations to Goddess Saraswati, who is white as the jasmine, moon, and snow; who is clad in white garments; whose hands are adorned with the Veena; and who sits on a white lotus.",
    source: "Saraswati Stotram",
    words: ["या", "कुन्देन्दुतुषारहारधवला", "या", "शुभ्रवस्त्रावृता", "या", "वीणावरदण्डमण्डितकरा", "या", "श्वेतपद्मासना"]
  }
];

export default function ShlokaMemorizerPage() {
  const [selectedShloka, setSelectedShloka] = useState<ShlokaGameData>(GAME_SHLOKAS[0]);
  const [shuffledWords, setShuffledWords] = useState<{ id: string; text: string }[]>([]);
  const [guessedWords, setGuessedWords] = useState<string[]>([]);
  const [incorrectIndex, setIncorrectIndex] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [coinsAwarded, setCoinsAwarded] = useState<number | null>(null);
  const [isAwarding, setIsAwarding] = useState(false);

  // Settings states
  const [pageEnabled, setPageEnabled] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSanskritSettings();
        if (!settings.hubEnabled || !settings.memorizerEnabled) {
          setPageEnabled(false);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setPageLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Initialize game when selected shloka changes
  useEffect(() => {
    if (pageEnabled && !pageLoading) {
      resetGame(selectedShloka);
    }
  }, [selectedShloka, pageEnabled, pageLoading]);

  // Handle timer ticks
  useEffect(() => {
    let interval: any = null;
    if (timerActive && !isCompleted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, isCompleted]);

  const resetGame = (shloka: ShlokaGameData) => {
    setGuessedWords([]);
    setIsCompleted(false);
    setMistakesCount(0);
    setTimer(0);
    setTimerActive(true);
    setCoinsAwarded(null);
    setIsAwarding(false);

    // Shuffle words with unique IDs to handle duplicate words (e.g. "या" or "मा")
    const wordsWithIds = shloka.words.map((w, idx) => ({
      id: `${shloka.id}_${idx}_${w}`,
      text: w
    }));

    // Perform Knuth shuffle
    const shuffled = [...wordsWithIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setShuffledWords(shuffled);
  };

  const handleWordClick = (wordObj: { id: string; text: string }, index: number) => {
    const nextExpectedIndex = guessedWords.length;
    const expectedWord = selectedShloka.words[nextExpectedIndex];

    if (wordObj.text === expectedWord) {
      // Correct guess
      setGuessedWords(prev => [...prev, wordObj.text]);
      setShuffledWords(prev => prev.filter(item => item.id !== wordObj.id));

      // Check if finished
      if (guessedWords.length + 1 === selectedShloka.words.length) {
        setIsCompleted(true);
        setTimerActive(false);

        // Award coins securely
        if (!isAwarding && !coinsAwarded) {
          setIsAwarding(true);
          awardSanskritCoins('memorizer')
            .then(res => {
              if (res.success && res.coinsAwarded) {
                setCoinsAwarded(res.coinsAwarded);
              }
            })
            .catch(err => console.error("Error awarding memorizer coins:", err))
            .finally(() => setIsAwarding(false));
        }
      }
    } else {
      // Incorrect guess - trigger animation
      setIncorrectIndex(index);
      setMistakesCount(prev => prev + 1);
      setTimeout(() => setIncorrectIndex(null), 500);
    }
  };

  if (pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(242, 100, 34, 0.1)', borderTopColor: '#f26422', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (!pageEnabled) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#fff', fontFamily: 'var(--font-geist-sans), sans-serif' }}>
        <NavBar />
        <div style={{ maxWidth: '600px', margin: '120px auto 40px auto', padding: '40px', background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '20px' }}>🔒</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f26422', marginBottom: '12px' }}>Memorizer Game Offline</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '25px' }}>
            This practice tool is currently disabled by the platform administrators. Please check back later or explore other courses in the meantime!
          </p>
          <a href="/" style={{ background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)', color: '#fff', textDecoration: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: 700, display: 'inline-block' }}>
            Return to Browse
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#fff', fontFamily: 'var(--font-geist-sans), sans-serif' }}>
      <NavBar />

      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '80px 20px 40px 20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '35px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(242, 100, 34, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(242, 100, 34, 0.2)' }}>
              🎮
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>Shloka Memorizer Game</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Train your memory by assembling shuffled Sanskrit verses in the correct order.</p>
            </div>
          </div>

          {/* Shloka Selector */}
          <select
            value={selectedShloka.id}
            onChange={(e) => {
              const found = GAME_SHLOKAS.find(s => s.id === e.target.value);
              if (found) setSelectedShloka(found);
            }}
            style={{
              background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px', padding: '10px 16px', color: '#fff', fontSize: '0.9rem', outline: 'none',
              cursor: 'pointer'
            }}
          >
            {GAME_SHLOKAS.map(s => (
              <option key={s.id} value={s.id} style={{ background: '#0f172a' }}>{s.title}</option>
            ))}
          </select>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '150px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Timer</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffd700' }}>{Math.floor(timer / 60)}m {timer % 60}s</div>
          </div>
          <div style={{ flex: 1, minWidth: '150px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Mistakes</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: mistakesCount > 0 ? '#ef4444' : '#10b981' }}>{mistakesCount}</div>
          </div>
          <div style={{ flex: 1, minWidth: '150px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Stotram Source</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedShloka.source}</div>
          </div>
        </div>

        {/* Shloka Assembly Arena */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '35px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          marginBottom: '35px'
        }}>
          {/* Target Slots Block */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '10px 14px', justifyContent: 'center',
            minHeight: '120px', padding: '20px', background: 'rgba(0,0,0,0.15)', borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '35px'
          }}>
            {selectedShloka.words.map((word, index) => {
              const isGuessed = index < guessedWords.length;
              return (
                <div
                  key={index}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    minWidth: '80px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 700,
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    background: isGuessed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.02)',
                    border: isGuessed ? 'none' : '2px dashed rgba(255,255,255,0.1)',
                    color: isGuessed ? '#fff' : 'rgba(255,255,255,0.15)',
                    boxShadow: isGuessed ? '0 4px 10px rgba(16, 185, 129, 0.25)' : 'none',
                    transform: isGuessed ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {isGuessed ? word : '???'}
                </div>
              );
            })}
          </div>

          {/* Shuffled Word Pills */}
          {!isCompleted ? (
            <div>
              <div style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', fontWeight: 700 }}>
                Click words in correct sequence:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
                {shuffledWords.map((wordObj, index) => {
                  const isIncorrect = incorrectIndex === index;
                  return (
                    <button
                      key={wordObj.id}
                      onClick={() => handleWordClick(wordObj, index)}
                      style={{
                        padding: '10px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700,
                        background: isIncorrect ? '#ef4444' : 'rgba(255,255,255,0.05)',
                        border: isIncorrect ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                        color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: isIncorrect ? '0 4px 15px rgba(239, 68, 68, 0.4)' : 'none',
                        animation: isIncorrect ? 'shake 0.4s' : 'none',
                        outline: 'none'
                      }}
                      className="shloka-pills"
                    >
                      {wordObj.text}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Celebration Screen */
            <div style={{ textAlign: 'center', padding: '10px 0', animation: 'celebrate 0.5s ease' }}>
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes celebrate {
                  0% { transform: scale(0.9); opacity: 0; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes shake {
                  0%, 100% { transform: translateX(0); }
                  20%, 60% { transform: translateX(-6px); }
                  40%, 80% { transform: translateX(6px); }
                }
                .shloka-pills:hover {
                  transform: scale(1.05) translateY(-2px);
                  background: rgba(242, 100, 34, 0.1);
                  border-color: rgba(242, 100, 34, 0.3);
                }
              `}} />
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '15px' }}>🎉</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', margin: '0 0 10px 0' }}>Stotram Memorized Successfully!</h3>
              
              {coinsAwarded !== null && (
                <div style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '15px'
                }}>
                  🪙 Earned {coinsAwarded} Vyoma Coins!
                </div>
              )}

              <p style={{ margin: '0 auto 25px auto', maxWidth: '500px', fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Outstanding! You assembled the verse in <strong>{Math.floor(timer / 60)}m {timer % 60}s</strong> with only <strong>{mistakesCount}</strong> mistakes.
              </p>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>

                <button
                  onClick={() => resetGame(selectedShloka)}
                  style={{
                    background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)', border: 'none',
                    color: '#fff', padding: '10px 24px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(242, 100, 34, 0.25)'
                  }}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Translation Hint Panel */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.2)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '24px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Verse Meaning (Translation Hint)</h4>
          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
            "{selectedShloka.translation}"
          </p>
        </div>

      </div>
    </div>
  );
}
