"use client";

import { useState } from 'react';
import { generateAiBlog } from '@/app/actions/marketing';
import { Loader } from 'lucide-react';

export default function AiMarketingClient({ courses }: { courses: any[] }) {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setResult('');
    try {
      const res = await generateAiBlog(selectedCourse);
      if (res.error) setResult('Error: ' + res.error);
      else setResult('Success! Generated blog post: ' + res.slug);
    } catch (e: any) {
      setResult('Error generating blog');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', color: 'white' }}>
      <h1>AI Auto-Blogger</h1>
      <p style={{ color: '#aaa', marginBottom: '24px' }}>
        Select a course below. Our AI (Google Gemini) will read the course metadata and automatically write a 1,500+ word highly SEO-optimized blog post to attract Google traffic.
      </p>

      <div style={{ background: '#1a1a1a', padding: '24px', borderRadius: '8px', border: '1px solid #333' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Target Course</label>
        <select 
          value={selectedCourse} 
          onChange={e => setSelectedCourse(e.target.value)}
          style={{ width: '100%', padding: '12px', background: '#0a0a0a', color: 'white', border: '1px solid #444', borderRadius: '4px', marginBottom: '16px' }}
        >
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>

        <button 
          onClick={handleGenerate}
          disabled={loading || !selectedCourse}
          style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {loading ? <Loader className="spin" size={18} /> : null}
          {loading ? 'Writing Blog (takes 30s)...' : 'Generate & Publish SEO Blog'}
        </button>

        {result && (
          <div style={{ marginTop: '16px', padding: '12px', background: result.startsWith('Success') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: result.startsWith('Success') ? '#4ade80' : '#f43f5e', borderRadius: '4px' }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
