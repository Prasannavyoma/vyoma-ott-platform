"use client";

import { createCourse } from '../actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddCoursePage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    
    const formData = new FormData(event.currentTarget);
    await createCourse(formData);
    
    setIsPending(false);
    router.push('/admin/courses');
  }

  // Interactive Toggle States for Custom Inputs
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomContentType, setShowCustomContentType] = useState(false);
  const [showCustomAccessLevel, setShowCustomAccessLevel] = useState(false);

  return (
    <div style={{ maxWidth: '850px', fontFamily: 'system-ui, sans-serif', color: '#fff' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '30px', fontWeight: 900 }}>Provision Single Catalog Asset</h1>
      
      <form onSubmit={onSubmit} style={{ background: 'var(--card-bg, #111)', padding: '35px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Asset Main Title</label>
          <input type="text" name="title" required placeholder="Enter global presentation title..." style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '0.95rem' }} />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Curriculum Narrative & Description</label>
          <textarea name="description" required rows={5} placeholder="Establish storyline overview, key learning points, and global synopsis..." style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px', resize: 'vertical', fontSize: '0.95rem', fontFamily: 'inherit' }}></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px' }}>
          {/* 1. Asset Classification / Genre */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Genre</label>
              {showCustomCategory && (
                <button type="button" onClick={() => setShowCustomCategory(false)} style={{ background: 'none', border: 'none', color: '#f26422', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold' }}>← Presets</button>
              )}
            </div>
            {showCustomCategory ? (
              <input type="text" name="category" required placeholder="Type custom genre..." style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid var(--primary)', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }} />
            ) : (
              <select name="category" onChange={(e) => { if (e.target.value === 'ADD_NEW_CUSTOM') { setShowCustomCategory(true); e.target.value = ''; } }} style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }}>
                <option value="World of Chants">World of Chants</option>
                <option value="Bhakti Bhava Lahari">Bhakti Bhava Lahari</option>
                <option value="Grammar Simplified">Grammar Simplified</option>
                <option value="Evergreen Epics & Puranas">Evergreen Epics & Puranas</option>
                <option value="Shaastra Studies">Shaastra Studies</option>
                <option value="ADD_NEW_CUSTOM" style={{ color: '#f26422', fontWeight: 'bold' }}>➕ + Add Custom Genre...</option>
              </select>
            )}
          </div>

          {/* 2. Interactive Content Type */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Content Type</label>
              {showCustomContentType && (
                <button type="button" onClick={() => setShowCustomContentType(false)} style={{ background: 'none', border: 'none', color: '#f26422', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold' }}>← Presets</button>
              )}
            </div>
            {showCustomContentType ? (
              <input type="text" name="contentType" required placeholder="Type custom type..." style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid var(--primary)', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }} />
            ) : (
              <select name="contentType" defaultValue="VIDEO" onChange={(e) => { if (e.target.value === 'ADD_NEW_CUSTOM') { setShowCustomContentType(true); e.target.value = 'VIDEO'; } }} style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }}>
                <option value="VIDEO">Video Series</option>
                <option value="AUDIOBOOK">Audio Book</option>
                <option value="PODCAST">Podcast Series</option>
                <option value="GAME">Game-Based Module</option>
                <option value="EBOOK">Ebook Document</option>
                <option value="PROGRAM">Extensive Program</option>
                <option value="ADD_NEW_CUSTOM" style={{ color: '#f26422', fontWeight: 'bold' }}>+ Add Custom Type...</option>
              </select>
            )}
          </div>

          {/* 3. Default Lock Level */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Default Lock Level</label>
              {showCustomAccessLevel && (
                <button type="button" onClick={() => setShowCustomAccessLevel(false)} style={{ background: 'none', border: 'none', color: '#f26422', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold' }}>← Presets</button>
              )}
            </div>
            {showCustomAccessLevel ? (
              <input type="text" name="accessLevel" required placeholder="Type custom lock..." style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid var(--primary)', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }} />
            ) : (
              <select name="accessLevel" defaultValue="FREE" onChange={(e) => { if (e.target.value === 'ADD_NEW_CUSTOM') { setShowCustomAccessLevel(true); e.target.value = 'FREE'; } }} style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }}>
                <option value="FREE">FREE</option>
                <option value="GOLD_MONTHLY">GOLD (MONTHLY)</option>
                <option value="GOLD_YEARLY">GOLD (YEARLY)</option>
                <option value="PLATINUM_MONTHLY">PLATINUM (MONTHLY)</option>
                <option value="PLATINUM_YEARLY">PLATINUM (YEARLY)</option>
                <option value="PAID">PAID (Individual)</option>
                <option value="ADD_NEW_CUSTOM" style={{ color: '#f26422', fontWeight: 'bold' }}>+ Add Custom Level...</option>
              </select>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Domestic Individual Price (₹ INR)</label>
            <input type="number" name="price" step="0.01" placeholder="e.g. 299" style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid #333', color: '#46d369', borderRadius: '8px', fontWeight: 'bold' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Foreign Individual Price ($ USD)</label>
            <input type="number" name="priceUSD" step="0.01" placeholder="e.g. 10.99" style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid #333', color: '#46d369', borderRadius: '8px', fontWeight: 'bold' }} />
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Primary Poster / Thumbnail Artwork URL</label>
          <input type="url" name="thumbnailUrl" required placeholder="https://path-to-cloud-storage.jpg" style={{ width: '100%', padding: '14px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
        </div>

        <div style={{ marginBottom: '35px', padding: '25px', background: 'rgba(0,0,0,0.2)', border: '1px dashed #444', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '15px', color: '#fff', fontWeight: 800, borderBottom: '1px solid #222', paddingBottom: '10px' }}>🔍 SEO & Marketing Metadata</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>META TITLE (SEO TITLE)</label>
              <input type="text" name="metaTitle" placeholder="e.g. Learn Sanskrit | Vyoma OTT" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>IMAGE ALT TAG</label>
              <input type="text" name="imageAlt" placeholder="e.g. Sanskrit Grammar course poster illustration" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>META DESCRIPTION</label>
            <textarea name="metaDescription" rows={3} placeholder="A short, catchy summary that appears on search engine results..." style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>SEO KEYWORDS (COMMA SEPARATED)</label>
            <input type="text" name="seoKeywords" placeholder="e.g. sanskrit, learning, online course, grammar, vyoma" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
          </div>
        </div>

        <div style={{ marginBottom: '35px', padding: '25px', background: 'rgba(0,0,0,0.2)', border: '1px dashed #444', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '15px', color: '#fff', fontWeight: 800, borderBottom: '1px solid #222', paddingBottom: '10px' }}>🚀 Stream Source & Visibility</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#888', fontWeight: 'bold' }}>DEFAULT MAIN VIDEO SOURCE URL (MP4 / M3U8)</label>
            <input type="text" name="videoUrl" required placeholder="https://digitalsanskrit.b-cdn.net/Videos/.../Balakanda.mp4" style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '8px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'rgba(242, 100, 34, 0.05)', borderRadius: '8px', border: '1px solid rgba(242, 100, 34, 0.15)', marginBottom: '10px' }}>
            <input type="checkbox" name="featuredInSlider" id="featured" style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#f26422' }} />
            <label htmlFor="featured" style={{ fontWeight: 800, color: '#f26422', cursor: 'pointer', fontSize: '0.9rem' }}>📌 Pin Asset to Primary Top Homepage Billboard Slider</label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'rgba(70, 211, 105, 0.05)', borderRadius: '8px', border: '1px solid rgba(70, 211, 105, 0.15)' }}>
              <input type="checkbox" name="showRibbon" id="showRibbon" style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#46d369' }} />
              <label htmlFor="showRibbon" style={{ fontWeight: 800, color: '#46d369', cursor: 'pointer', fontSize: '0.9rem' }}>🏷️ Enable "NEWLY ADDED" Ribbon</label>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'rgba(242, 100, 34, 0.05)', borderRadius: '8px', border: '1px solid rgba(242, 100, 34, 0.15)' }}>
              <input type="checkbox" name="hasFreeTrial" id="hasFreeTrial" style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#f26422' }} />
              <label htmlFor="hasFreeTrial" style={{ fontWeight: 800, color: '#f26422', cursor: 'pointer', fontSize: '0.9rem' }}>🎁 Enable Free Trial Access</label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid #444', color: '#aaa', padding: '14px 28px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.color='#fff'} onMouseLeave={(e)=>e.currentTarget.style.color='#aaa'}>
            Cancel Creation
          </button>
          <button type="submit" disabled={isPending} style={{ background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: '#fff', border: 'none', padding: '14px 35px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 30px rgba(242,100,34,0.2)', opacity: isPending ? 0.7 : 1, transition: 'transform 0.1s' }}>
            {isPending ? 'INJECTING CORE PAYLOAD...' : '⚡ PUBLISH CORE ASSET'}
          </button>
        </div>
      </form>
    </div>
  );
}
