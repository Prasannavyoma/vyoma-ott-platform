"use client";

import { use } from 'react';
import Link from 'next/link';

const REAL_COURSES = [
  { id: 1, title: 'Srimad-Valmiki-Ramayanam Balakandah', image: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Balakanda.jpg', match: '99% Match', tag: 'PLATINUM' },
  { id: 2, title: 'Srimad-Valmiki-Ramayanam Ayodhyakandah', image: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Ayodhyakanda.jpg', match: '98% Match', tag: 'GOLD' },
  { id: 3, title: 'Srimad-Valmiki-Ramayanam Aranyakandah', image: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Aranyakanda.jpg', match: '97% Match', tag: 'GOLD' },
  { id: 4, title: 'Srimad-Valmiki-Ramayanam Kishkindhakandah', image: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Kishkindhakanda.jpg', match: '99% Match', tag: 'PLATINUM' },
  { id: 5, title: 'Srimad-Valmiki-Ramayanam Sundarakandah', image: 'https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2026/03/Sundarakanda.jpg', match: '100% Match', tag: 'PAID' },
];

export default function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = use(params);
  // Safely unwrap parameter with explicit fallback to prevent undefined replace error
  const slug = unwrappedParams?.slug || '';
  const categoryName = slug 
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Category';

  return (
    <div style={{ padding: '120px 5% 50px', minHeight: '100vh', background: '#0f1014' }}>
      <Link href="/" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '30px' }}>
        ← Back to Home
      </Link>
      
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>Category: {categoryName}</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '30px' 
      }}>
        {/* Rendering extracted clone items into the grid format for the category page */}
        {[...REAL_COURSES, ...REAL_COURSES].map((course, i) => (
          <Link href={`/watch/${course.id}`} key={i} className="poster" style={{ width: '100%', height: '180px' }}>
            <img src={course.image} alt={course.title} />
            <div className="middle-play-btn">
              <svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div className="poster-overlay" style={{ opacity: 1, background: 'rgba(0,0,0,0.4)' }}>
              <div className="poster-title">{course.title}</div>
              <div className="poster-meta">
                <span style={{color: '#46d369', fontWeight: 'bold'}}>{course.match}</span>
                <span className="poster-tag">{course.tag}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
