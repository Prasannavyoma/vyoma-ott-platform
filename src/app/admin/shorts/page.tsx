"use client";
import { useState } from 'react';
import { createShort } from '../../shorts/actions';

export default function AdminShortsPage() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage('');
    
    try {
      const formData = new FormData(event.currentTarget);
      await createShort(formData);
      setMessage('Short successfully uploaded!');
      (event.target as HTMLFormElement).reset();
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
    
    setIsPending(false);
  }

  return (
    <div style={{ maxWidth: '800px', padding: '40px', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Upload a Short (Reel)</h1>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>Publish vertical 9:16 videos directly to the Shorts feed.</p>
      
      {message && (
        <div style={{ padding: '15px', background: message.includes('Error') ? '#3a1111' : '#113a18', border: message.includes('Error') ? '1px solid red' : '1px solid green', borderRadius: '8px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: '#111', padding: '30px', borderRadius: '12px', border: '1px solid #333' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ccc' }}>Title</label>
          <input required type="text" name="title" placeholder="e.g. Master this Sandhi in 60 seconds!" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ccc' }}>Description (Optional)</label>
          <textarea name="description" rows={3} placeholder="Add context or hashtags..." style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '6px' }}></textarea>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ccc' }}>Video URL (.mp4)</label>
          <input required type="url" name="videoUrl" placeholder="https://your-s3-bucket.com/video.mp4" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ccc' }}>Thumbnail URL (Optional)</label>
          <input type="url" name="thumbnailUrl" placeholder="https://your-s3-bucket.com/thumbnail.jpg" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
        </div>

        <button disabled={isPending} type="submit" style={{ padding: '15px', background: 'var(--primary, #f26422)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}>
          {isPending ? 'Publishing...' : 'Publish Short'}
        </button>
      </form>
    </div>
  );
}
