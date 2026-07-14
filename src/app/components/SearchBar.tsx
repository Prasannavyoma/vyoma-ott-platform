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
          background: '#0a0d14', // Very dark navy/black matching OTT 1.0
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 20px',
          overflowY: 'auto'
        }}>
          {/* CLOSE BUTTON */}
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '10px'
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div style={{ width: '100%', maxWidth: '900px' }}>
            
            {/* SEARCH INPUT GROUP */}
            <div style={{
              display: 'flex',
              background: '#1a1f2e',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              {/* CATEGORY SELECTOR */}
              <div style={{ position: 'relative' }}>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    appearance: 'none',
                    background: '#1f2436',
                    color: '#fff',
                    border: 'none',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    padding: '15px 35px 15px 20px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    outline: 'none',
                    height: '100%'
                  }}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* TEXT INPUT */}
              <input 
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Titles, genres..."
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  padding: '15px 20px',
                  fontSize: '1.1rem',
                  outline: 'none'
                }}
              />

              {/* SEARCH ICON */}
              <div style={{ padding: '15px 20px', color: '#aaa', display: 'flex', alignItems: 'center' }}>
                {isSearching ? (
                   <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                ) : (
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                )}
              </div>
            </div>

            {/* OPTIONS BAR */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              marginTop: '15px',
              fontSize: '0.85rem',
              color: '#ddd'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                <span>To search inside book &rarr;</span>
                <input 
                  type="checkbox" 
                  checked={contentSearch}
                  onChange={(e) => setContentSearch(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <span style={{ fontWeight: 600 }}>Content Search</span>
              </label>
            </div>

            {/* RESULTS METADATA */}
            {query.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', marginBottom: '15px', color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>
                {results.length} results found
              </div>
            )}

            {/* RESULTS GRID */}
            {results.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
                gap: '24px',
                marginTop: '15px'
              }}>
                {results.map((item: any) => (
                  <Link 
                    key={`${item.type}-${item.id}`} 
                    href={item.url}
                    onClick={() => setIsOpen(false)}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '16px',
                      height: '310px',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(242, 100, 34, 0.5)';
                      e.currentTarget.style.background = 'rgba(242, 100, 34, 0.05)';
                      e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(242, 100, 34, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                    }}
                    >
                      {/* CARD HEADER WITH THUMBNAIL & BADGE */}
                      <div style={{ position: 'relative', height: '120px', flexShrink: 0, overflow: 'hidden' }}>
                        <img 
                          src={item.thumbnail || 'https://placehold.co/400x150/1a1f2e/ffffff?text=Vyoma'} 
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: 'scale(1.05)' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0), #06080c)' }} />
                        
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: 'linear-gradient(135deg, #f26422 0%, #ff8c00 100%)',
                          color: '#fff',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '20px',
                          letterSpacing: '0.5px',
                          boxShadow: '0 4px 12px rgba(242, 100, 34, 0.4)'
                        }}>
                          {item.badge}
                        </div>
                      </div>

                      {/* CARD CONTENT */}
                      <div style={{ padding: '5px 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 2 }}>
                        {/* TITLE WITH HIGHLIGHTS */}
                        <h3 
                          style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700, marginBottom: '8px', lineHeight: '1.4' }}
                          dangerouslySetInnerHTML={{ __html: item.title }}
                        />

                        {/* DESCRIPTION WITH CUSTOM SCROLLBAR & HIGHLIGHTS */}
                        <div 
                          className="search-desc-scroll"
                          style={{ 
                            flex: 1, 
                            overflowY: 'auto', 
                            fontSize: '0.85rem', 
                            lineHeight: '1.6', 
                            color: '#a0a5b5',
                            paddingRight: '12px'
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

      {/* GLOBAL CSS FOR HIGHLIGHTS AND CUSTOM SCROLLBAR */}
      <style dangerouslySetInnerHTML={{__html: `
        mark {
          background-color: rgba(255, 215, 0, 0.3) !important;
          color: #ffd700 !important;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 800;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
        }
        
        .search-desc-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .search-desc-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02); 
          border-radius: 8px;
        }
        .search-desc-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2); 
          border-radius: 8px;
        }
        .search-desc-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.4); 
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </>
  );
}
