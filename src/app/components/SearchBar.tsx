"use client";

import { useState, useEffect, useRef } from 'react';
import { searchContent } from '@/app/actions/analytics';
import Link from 'next/link';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [engine, setEngine] = useState('');

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length > 1) {
        const res = await searchContent(query);
        setResults(res.hits || []);
        setEngine(res.engine || 'postgres');
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} style={{ position: 'relative' }}>
      <div className={`search-container ${isOpen ? 'active' : ''}`} style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: isOpen ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)', 
        border: `1px solid ${isOpen ? 'rgba(242, 100, 34, 0.5)' : 'rgba(255,255,255,0.15)'}`, 
        boxShadow: isOpen ? '0 0 15px rgba(242, 100, 34, 0.2)' : 'none',
        borderRadius: '24px', 
        padding: '6px 16px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: isOpen ? '250px' : '180px'
      }}>
        <svg style={{ width: '16px', height: '16px', color: isOpen ? '#f26422' : '#aaa', marginRight: '8px', transition: 'color 0.3s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <input 
          type="text" 
          className="search-input"
          placeholder="Titles, genres..." 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '110%', 
          right: 0, 
          width: '380px', 
          background: 'linear-gradient(180deg, #161920 0%, #0d0f12 100%)', 
          border: '1px solid rgba(255,255,255,0.08)', 
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)', 
          borderRadius: '12px', 
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', fontSize: '0.7rem', color: '#666', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
             🎯 Deep Content Matches
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {results.map((item: any) => (
              <Link 
                key={`${item.badge}-${item.id}`} 
                href={item.url}
                onClick={() => setIsOpen(false)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px', 
                  padding: '12px', 
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  transition: 'all 0.2s',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <img 
                  src={item.thumbnail || 'https://placehold.co/60x35'} 
                  alt={item.title}
                  style={{ width: '70px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }} 
                />
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    {item.title ? item.title.replace(/&amp;/g, '&') : ''}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ 
                      fontSize: '0.6rem', 
                      color: item.badgeColor, 
                      background: `${item.badgeColor}15`, // Added 15% opacity for bg
                      border: `1px solid ${item.badgeColor}50`, 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontWeight: 900,
                      textTransform: 'uppercase'
                    }}>
                      {item.badge}
                    </span>
                    
                    <div style={{ fontSize: '0.75rem', color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                      {item.subTitle ? item.subTitle.replace(/&amp;/g, '&') : ''}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {engine === 'meilisearch' && (
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '6px 12px', textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: '#888' }}>
              ⚡ Powered by <span style={{ color: '#ff4c9f', fontWeight: 800 }}>Meilisearch</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
