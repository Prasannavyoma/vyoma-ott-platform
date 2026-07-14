"use client";

import { useState, useEffect, useRef } from 'react';
import { searchContent } from '@/app/actions/analytics';
import Link from 'next/link';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [contentSearch, setContentSearch] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Ebooks', 'Courses', 'Audios', 'Videos', 'Podcasts'];

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsSearching(true);
        const res = await searchContent(query, category, contentSearch);
        setResults(res.hits || []);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, category, contentSearch]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Open modal if user hits cmd+k or ctrl+k
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* TRIGGER BUTTON (in NavBar) */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '24px',
          padding: '6px 16px',
          color: '#aaa',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          width: '180px',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      >
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <span style={{ fontSize: '0.9rem' }}>Search...</span>
      </button>

      {/* FULL SCREEN MODAL */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(6, 8, 12, 0.95)', // Deep OTT 2.0 background with slight transparency
          backdropFilter: 'blur(20px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '60px 40px',
          overflowY: 'auto'
        }}>
          {/* CLOSE BUTTON */}
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: '40px',
              right: '60px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f26422';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '4vh' }}>
            
            {/* HERO SEARCH INPUT */}
            <div style={{ width: '100%', maxWidth: '800px', position: 'relative', marginBottom: '40px' }}>
              <input 
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What are you looking for?"
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  borderBottom: '2px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '20px 0',
                  fontSize: '3rem',
                  fontWeight: 800,
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  textAlign: 'center'
                }}
                onFocus={(e) => e.currentTarget.style.borderBottomColor = '#f26422'}
                onBlur={(e) => e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.2)'}
              />
              {isSearching && (
                 <div style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '30px', border: '3px solid rgba(242, 100, 34, 0.2)', borderTopColor: '#f26422', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              )}
            </div>

            {/* PILL FILTERS (Replaces Dropdown) */}
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '30px' }}>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    background: category === c ? 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)' : 'rgba(255,255,255,0.05)',
                    color: category === c ? '#fff' : '#aaa',
                    border: '1px solid',
                    borderColor: category === c ? 'transparent' : 'rgba(255,255,255,0.1)',
                    padding: '10px 24px',
                    borderRadius: '30px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: category === c ? '0 10px 20px rgba(242, 100, 34, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (category !== c) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (category !== c) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = '#aaa';
                    }
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* OPTIONS BAR */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px', color: contentSearch ? '#fff' : '#888', transition: 'color 0.3s' }}>
                <input 
                  type="checkbox" 
                  checked={contentSearch}
                  onChange={(e) => setContentSearch(e.target.checked)}
                  style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#f26422' }}
                />
                <span style={{ fontSize: '0.95rem', fontWeight: contentSearch ? 700 : 500 }}>Deep Content Search (Inside Books & Courses)</span>
              </label>
            </div>

            {/* RESULTS METADATA */}
            {query.length > 1 && !isSearching && (
              <div style={{ width: '100%', textAlign: 'left', color: '#888', fontSize: '1rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                Found <strong style={{ color: '#fff' }}>{results.length}</strong> results for "{query}"
              </div>
            )}

            {/* RESULTS GRID */}
            {results.length > 0 && (
              <div style={{ 
                width: '100%',
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: '30px'
              }}>
                {results.map((item: any) => (
                  <Link 
                    key={`${item.type}-${item.id}`} 
                    href={item.url}
                    onClick={() => setIsOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '16px',
                      height: '340px',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      cursor: 'pointer',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(242, 100, 34, 0.5)';
                      e.currentTarget.style.background = 'rgba(242, 100, 34, 0.05)';
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(242, 100, 34, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      {/* CARD HEADER WITH THUMBNAIL & BADGE */}
                      <div style={{ position: 'relative', height: '160px', flexShrink: 0, overflow: 'hidden' }}>
                        <img 
                          src={item.thumbnail || 'https://placehold.co/400x150/1a1f2e/ffffff?text=Vyoma'} 
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: 'scale(1.02)' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0), #06080c)' }} />
                        
                        <div style={{
                          position: 'absolute',
                          bottom: '15px',
                          left: '20px',
                          background: 'rgba(242, 100, 34, 0.9)',
                          backdropFilter: 'blur(5px)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          letterSpacing: '1px'
                        }}>
                          {item.badge}
                        </div>
                      </div>

                      {/* CARD CONTENT */}
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 2 }}>
                        {/* TITLE WITH HIGHLIGHTS */}
                        <h3 
                          style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 700, marginBottom: '10px', lineHeight: '1.3' }}
                          dangerouslySetInnerHTML={{ __html: item.title }}
                        />

                        {/* DESCRIPTION WITH HIGHLIGHTS */}
                        <div 
                          className="search-desc-scroll"
                          style={{ 
                            flex: 1, 
                            overflowY: 'auto', 
                            fontSize: '0.9rem', 
                            lineHeight: '1.6', 
                            color: '#a0a5b5',
                            paddingRight: '10px'
                          }}
                          dangerouslySetInnerHTML={{ __html: item.description || 'No description available for this content.' }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* GLOBAL CSS FOR HIGHLIGHTS */}
      <style dangerouslySetInnerHTML={{__html: `
        mark {
          background-color: transparent !important;
          color: #f26422 !important;
          font-weight: 900;
          text-decoration: underline;
          text-decoration-color: rgba(242, 100, 34, 0.4);
          text-decoration-thickness: 3px;
          text-underline-offset: 3px;
        }
        
        .search-desc-scroll::-webkit-scrollbar {
          width: 0px; /* Hidden scrollbar for sleek look */
        }
        
        @keyframes spin {
          to { transform: translateY(-50%) rotate(360deg); }
        }
      `}} />
    </>
  );
}
