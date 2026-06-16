"use client";

import { useState } from 'react';

export default function ReviewSystem({ courseId, reviews }: { courseId: string, reviews: any[] }) {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [localReviews, setLocalReviews] = useState(reviews);

  async function submitReview() {
    if(!comment.trim()) return;
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, comment, rating })
      });
      // Refresh simulate locally
      setLocalReviews([{ comment, rating, createdAt: new Date(), user: { name: 'You' } }, ...localReviews]);
      setComment('');
    } catch(e) {}
  }

  return (
    <div style={{ marginTop: '50px', borderTop: '1px solid #222', paddingTop: '30px', paddingBottom: '100px' }}>
       <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>👥 Community Feedback ({localReviews.length})</h3>

       {/* Add Review Input */}
       <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
             {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setRating(i)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', opacity: rating >= i ? 1 : 0.3 }}>⭐</button>
             ))}
          </div>
          <textarea 
            value={comment} 
            onChange={e => setComment(e.target.value)} 
            placeholder="Add a respectful comment or review..." 
            style={{ width: '100%', minHeight: '80px', background: '#000', border: '1px solid #444', color: '#fff', padding: '12px', borderRadius: '6px', fontFamily: 'inherit', resize: 'none' }}
          ></textarea>
          <button onClick={submitReview} style={{ marginTop: '10px', background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>
             Post Review
          </button>
       </div>

       {/* Review List */}
       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {localReviews.map((r, idx) => (
             <div key={idx} style={{ borderBottom: '1px solid #222', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                   <span style={{ fontWeight: 'bold', color: '#fff' }}>{r.user?.name || 'Verified Learner'}</span>
                   <span style={{ color: '#f26422', fontSize: '0.8rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p style={{ color: '#aaa', margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{r.comment}</p>
                <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '5px' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
             </div>
          ))}
          {localReviews.length === 0 && <div style={{ color: '#555', textAlign: 'center', padding: '20px' }}>Be the first to share knowledge feedback.</div>}
       </div>
    </div>
  );
}
