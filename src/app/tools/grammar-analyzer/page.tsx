'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { analyzeSanskritGrammar } from '@/app/actions/sanskrit-tools';
import NavBar from '@/app/components/NavBar';
import Footer from '@/app/components/Footer';
import { getSanskritSettings } from '@/app/actions/sanskrit-settings';

interface SandhiSplit {
  word: string;
  split: string[];
  rule: string;
}

interface WordBreakdown {
  word: string;
  root: string;
  pos: string;
  analysis: string;
}

interface AnalysisResult {
  translation: string;
  sandhiSplit: SandhiSplit[];
  wordsBreakdown: WordBreakdown[];
}

export default function GrammarAnalyzerPage() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings states
  const [pageEnabled, setPageEnabled] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSanskritSettings();
        if (!settings.hubEnabled || !settings.grammarEnabled) {
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


  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeSanskritGrammar(inputText);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during grammar analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (text: string) => {
    setInputText(text);
  };

  const examples = [
    "नमामि संस्कृतं नित्यम्",
    "सत्यमेव जयते नानृतम्",
    "योगः कर्मसु कौशलम्"
  ];

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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f26422', marginBottom: '12px' }}>Grammar Analyzer Offline</h2>
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
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '160px 20px 60px 20px' }}>
        
        {/* Back to Home Button */}
        <div style={{ marginBottom: '30px' }}>
          <Link 
            href="/" 
            className="back-btn-pill"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '10px 22px', 
              borderRadius: '30px', 
              background: 'rgba(255, 255, 255, 0.05)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              color: '#e2e8f0', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              textDecoration: 'none', 
              backdropFilter: 'blur(10px)', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.25)' 
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(242, 100, 34, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(242, 100, 34, 0.2)' }}>
            🔌
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>AI Sanskrit Grammar & Sandhi Analyzer</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Analyze Sanskrit sentences, split Sandhis, and identify grammatical case endings instantly.</p>
          </div>
        </div>

        {/* Input Card Form */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          padding: '30px',
          marginBottom: '40px'
        }}>
          <form onSubmit={handleAnalyze}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', marginBottom: '10px' }}>
              Enter Sanskrit Phrase
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g., नमामि संस्कृतं नित्यम् वदामि संस्कृतं सदा ।"
              rows={3}
              required
              style={{
                width: '100%', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px', padding: '16px', color: '#fff', fontSize: '1.1rem', outline: 'none', resize: 'vertical',
                lineHeight: '1.6', fontFamily: 'inherit', marginBottom: '15px'
              }}
              onFocus={e => e.target.style.borderColor = '#f26422'}
              onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
            />

            {/* Examples Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '25px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Try Examples:</span>
              {examples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleExampleClick(ex)}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    padding: '6px 12px', borderRadius: '20px', color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem',
                    cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(242,100,34,0.15)'; e.currentTarget.style.borderColor = 'rgba(242,100,34,0.3)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                >
                  {ex}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                style={{
                  background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)', color: '#fff', border: 'none',
                  padding: '12px 28px', borderRadius: '12px', fontWeight: 700, cursor: (isLoading || !inputText.trim()) ? 'default' : 'pointer',
                  boxShadow: '0 4px 15px rgba(242, 100, 34, 0.25)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem'
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Analyzing Sanskrit...
                  </>
                ) : 'Analyze Grammar'}
              </button>
            </div>
          </form>
        </div>

        {/* CSS Spin Keyframe */}
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />

        {/* Error Feedback */}
        {error && (
          <div style={{
            padding: '16px 20px', borderRadius: '16px', marginBottom: '30px',
            background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444', fontSize: '0.9rem', fontWeight: 600
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results Panels */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.3s ease' }}>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }` }} />
            
            {/* Translation Card */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.25)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '24px'
            }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>English Translation</h4>
              <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6', color: '#ffd700', fontWeight: 600 }}>
                {result.translation}
              </p>
            </div>

            {/* Sandhi Splits */}
            {result.sandhiSplit && result.sandhiSplit.length > 0 && (
              <div style={{
                background: 'rgba(30, 41, 59, 0.25)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '24px'
              }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sandhi Splitting (Compound Words)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.sandhiSplit.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexWrap: 'wrap',
                        justifyContent: 'space-between', alignItems: 'center', gap: '15px'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginRight: '15px' }}>{item.word}</span>
                        <span style={{ color: '#64748b' }}>➔</span>
                        <span style={{ fontWeight: 600, fontSize: '1rem', color: '#10b981', marginLeft: '15px' }}>
                          {item.split.join(' + ')}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                        {item.rule}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Word-by-Word Grammatical Analysis */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.25)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '24px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Word-by-word grammatical breakdown</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {result.wordsBreakdown.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px 20px', background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px',
                      display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px'
                    }}
                  >
                    <div style={{ flex: '1 1 200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#ffd700', fontSize: '1.15rem' }}>{item.word}</span>
                        <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '8px', color: 'rgba(255,255,255,0.6)' }}>
                          Base form: {item.root}
                        </span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {item.analysis}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: '10px',
                      background: item.pos === 'Verb' ? 'rgba(242,100,34,0.1)' : 'rgba(59,130,246,0.1)',
                      border: item.pos === 'Verb' ? '1px solid rgba(242,100,34,0.2)' : '1px solid rgba(59,130,246,0.2)',
                      color: item.pos === 'Verb' ? '#f26422' : '#3b82f6'
                    }}>
                      {item.pos}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
      <Footer />
    </div>
  );
}
