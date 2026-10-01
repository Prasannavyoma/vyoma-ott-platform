"use client";

import { useState } from 'react';
import { generateAiBlog } from '@/app/actions/marketing';
import { Loader } from 'lucide-react';
import Link from 'next/link';

export default function AiMarketingClient({ courses }: { courses: any[] }) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ error?: string; slug?: string; title?: string } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await generateAiBlog(selectedCourse);
      setResult(res);
    } catch (e: any) {
      setResult({ error: 'Failed to execute blog generation script.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', color: 'white', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Outfit, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>🤖 AI Auto-Blogger</h1>
        <span style={{ background: 'rgba(242,100,34,0.15)', color: '#f26422', border: '1px solid rgba(242,100,34,0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
          SEO Content Engine
        </span>
      </div>
      
      <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '0.95rem', lineHeight: '1.6' }}>
        Select a target course below. Our AI Marketing Engine reads the course syllabus, structures key Sanskrit concepts, and automatically writes and publishes a 1,500+ word SEO-optimized blog post to drive Google search traffic.
      </p>

      <div style={{ background: '#0a0a0c', padding: '30px', borderRadius: '20px', border: '1px solid #1c1c24', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '0.85rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Select Target Course
        </label>
        
        <select 
          value={selectedCourse} 
          onChange={e => setSelectedCourse(e.target.value)}
          style={{ width: '100%', padding: '14px', background: '#000', color: 'white', border: '1px solid #222', borderRadius: '10px', marginBottom: '24px', fontSize: '0.95rem', outline: 'none' }}
        >
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>

        <button 
          onClick={handleGenerate}
          disabled={loading || !selectedCourse}
          style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 900, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem', boxShadow: '0 10px 25px rgba(242,100,34,0.3)' }}
        >
          {loading ? <Loader className="spin" size={20} /> : <span>✨</span>}
          {loading ? 'Generating 1,500+ Word SEO Blog Post...' : '🚀 Generate & Publish SEO Blog Post'}
        </button>

        {result && (
          <div style={{ marginTop: '24px', padding: '20px', background: result.error ? 'rgba(244, 63, 94, 0.1)' : 'rgba(74, 222, 128, 0.1)', border: `1px solid ${result.error ? 'rgba(244, 63, 94, 0.3)' : 'rgba(74, 222, 128, 0.3)'}`, color: result.error ? '#f43f5e' : '#4ade80', borderRadius: '12px' }}>
            {result.error ? (
              <div>
                <strong>⚠ Generation Failed:</strong> {result.error}
              </div>
            ) : (
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>🎉 Blog Post Successfully Published!</h4>
                <p style={{ margin: '0 0 15px 0', color: '#ccc', fontSize: '0.9rem' }}>Title: <strong>{result.title}</strong></p>
                <Link 
                  href={`/blog/${result.slug}`} 
                  target="_blank" 
                  style={{ background: '#4ade80', color: '#000', padding: '8px 18px', borderRadius: '20px', textDecoration: 'none', fontWeight: 900, fontSize: '0.85rem', display: 'inline-block' }}
                >
                  📖 View Published Blog Post →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
