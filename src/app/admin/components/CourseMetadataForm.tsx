"use client";

import { useState } from 'react';

export default function CourseMetadataForm({ 
  course, 
  categories, 
  updateCourseAction 
}: { 
  course: any, 
  categories: any[], 
  updateCourseAction: (fd: FormData) => Promise<void> 
}) {
  // Interactive Toggle States for Custom Inputs
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [showCustomContentType, setShowCustomContentType] = useState(false);
  const [showCustomAccessLevel, setShowCustomAccessLevel] = useState(false);

  return (
    <div style={{ background: 'var(--card-bg, #111)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 800, color: '#fff', borderBottom: '1px solid #222', paddingBottom: '10px' }}>Global Course Definitions</h3>
      <form action={updateCourseAction} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
         <div>
           <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Main Title</label>
           <input required type="text" name="title" defaultValue={course.title} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
         </div>
         <div>
           <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Synopsis / Description</label>
           <textarea required name="description" defaultValue={course.description} rows={4} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontFamily: 'inherit' }} />
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
           {/* 1. Access Restriction Level */}
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
               <label style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Access Restriction Level</label>
               {showCustomAccessLevel && (
                 <button type="button" onClick={() => setShowCustomAccessLevel(false)} style={{ background: 'none', border: 'none', color: '#f26422', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold' }}>← Presets</button>
               )}
             </div>
             {showCustomAccessLevel ? (
               <input type="text" name="accessLevel" required defaultValue={course.accessLevel} placeholder="Type custom level..." style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--primary, #f26422)', borderRadius: '6px', color: '#fff' }} />
             ) : (
               <select name="accessLevel" defaultValue={course.accessLevel} onChange={(e) => { if (e.target.value === 'ADD_NEW_CUSTOM') { setShowCustomAccessLevel(true); e.target.value = ''; } }} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
                 <option value="FREE">Free Access</option>
                 <option value="GOLD_MONTHLY">Gold Monthly</option>
                 <option value="GOLD_YEARLY">Gold Yearly</option>
                 <option value="PLATINUM_MONTHLY">Platinum Monthly</option>
                 <option value="PLATINUM_YEARLY">Platinum Yearly</option>
                 <option value="PAID">Individual Purchase</option>
                 {/* Show current category option if it's not standard */}
                 {!['FREE', 'GOLD_MONTHLY', 'GOLD_YEARLY', 'PLATINUM_MONTHLY', 'PLATINUM_YEARLY', 'PAID'].includes(course.accessLevel) && (
                   <option value={course.accessLevel}>{course.accessLevel}</option>
                 )}
                 <option value="ADD_NEW_CUSTOM" style={{ color: '#f26422', fontWeight: 'bold' }}>➕ + Add Custom Level...</option>
               </select>
             )}
           </div>

           {/* 2. Content Type */}
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
               <label style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Content Type</label>
               {showCustomContentType && (
                 <button type="button" onClick={() => setShowCustomContentType(false)} style={{ background: 'none', border: 'none', color: '#f26422', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold' }}>← Presets</button>
               )}
             </div>
             {showCustomContentType ? (
               <input type="text" name="contentType" required defaultValue={course.contentType || 'VIDEO'} placeholder="Type custom content type..." style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--primary, #f26422)', borderRadius: '6px', color: '#fff' }} />
             ) : (
               <select name="contentType" defaultValue={course.contentType || 'VIDEO'} onChange={(e) => { if (e.target.value === 'ADD_NEW_CUSTOM') { setShowCustomContentType(true); e.target.value = 'VIDEO'; } }} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
                 <option value="VIDEO">Video Series</option>
                 <option value="AUDIOBOOK">Audio Book</option>
                 <option value="PODCAST">Podcast</option>
                 <option value="GAME">Game-Based Learning</option>
                 <option value="EBOOK">Ebook Reader</option>
                 <option value="PROGRAM">Learning Program</option>
                 {!['VIDEO', 'AUDIOBOOK', 'PODCAST', 'GAME', 'EBOOK', 'PROGRAM'].includes(course.contentType || '') && course.contentType && (
                   <option value={course.contentType}>{course.contentType}</option>
                 )}
                 <option value="ADD_NEW_CUSTOM" style={{ color: '#f26422', fontWeight: 'bold' }}>➕ + Add Custom Type...</option>
               </select>
             )}
           </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
           {/* 3. Taxonomy Group / Category */}
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
               <label style={{ fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>Taxonomy Group / Genre</label>
               {showCustomCategory && (
                 <button type="button" onClick={() => setShowCustomCategory(false)} style={{ background: 'none', border: 'none', color: '#f26422', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 'bold' }}>← Presets</button>
               )}
             </div>
             {showCustomCategory ? (
               <input type="text" name="category" required defaultValue={course.category || ''} placeholder="Type custom genre..." style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--primary, #f26422)', borderRadius: '6px', color: '#fff' }} />
             ) : (
               <select name="category" defaultValue={course.category || ''} onChange={(e) => { if (e.target.value === 'ADD_NEW_CUSTOM') { setShowCustomCategory(true); e.target.value = ''; } }} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
                 <option value="">Uncategorized</option>
                 {categories.map((c: any) => (
                   <option key={c.id} value={c.name}>{c.name}</option>
                 ))}
                 {/* Display current value if not inside categories database */}
                 {course.category && !categories.some(c => c.name === course.category) && (
                   <option value={course.category}>{course.category}</option>
                 )}
                 <option value="ADD_NEW_CUSTOM" style={{ color: '#f26422', fontWeight: 'bold' }}>➕ + Add Custom Genre...</option>
               </select>
             )}
           </div>
           <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Individual Sale Price (INR)</label>
              <input required type="number" step="0.01" name="price" defaultValue={course.price || 0} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
           </div>
           <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Roadmap Order Index</label>
              <input required type="number" name="roadmapOrder" defaultValue={course.roadmapOrder || 0} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
           </div>
         </div>

         <div>
           <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Catalog Banner Poster URL</label>
           <input type="text" name="thumbnailUrl" defaultValue={course.thumbnailUrl || ''} style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
         </div>

         <div>
           <label style={{ display: 'block', fontSize: '0.7rem', color: '#f26422', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>🎬 Cinematic Trailer URL</label>
           <input type="text" name="trailerUrl" defaultValue={course.trailerUrl || ''} placeholder="e.g. Direct MP4 Link or Streaming Trailer URL" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
           <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>Activates Netflix/Prime style "Watch Trailer" cinema mode on frontend.</p>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'rgba(70, 211, 105, 0.05)', borderRadius: '8px', border: '1px solid rgba(70, 211, 105, 0.15)' }}>
              <input type="checkbox" name="showRibbon" id="showRibbon" defaultChecked={course.showRibbon !== false} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#46d369' }} />
              <label htmlFor="showRibbon" style={{ fontWeight: 800, color: '#46d369', cursor: 'pointer', fontSize: '0.9rem' }}>🏷️ Enable "NEWLY ADDED" Ribbon</label>
           </div>
           
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', background: 'rgba(242, 100, 34, 0.05)', borderRadius: '8px', border: '1px solid rgba(242, 100, 34, 0.15)' }}>
              <input type="checkbox" name="hasFreeTrial" id="hasFreeTrial" defaultChecked={course.hasFreeTrial === true} style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#f26422' }} />
              <label htmlFor="hasFreeTrial" style={{ fontWeight: 800, color: '#f26422', cursor: 'pointer', fontSize: '0.9rem' }}>🎁 Enable Free Trial Access</label>
           </div>
         </div>

         <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed #333', borderRadius: '8px', marginTop: '15px', marginBottom: '15px' }}>
             <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '15px', color: 'var(--primary, #f26422)' }}>🔍 SEO & Marketing Metadata</h4>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Meta Title (SEO Title)</label>
                   <input type="text" name="metaTitle" defaultValue={course.metaTitle || ''} placeholder="e.g. Learn Sanskrit Online" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Image ALT Tag</label>
                   <input type="text" name="imageAlt" defaultValue={course.imageAlt || ''} placeholder="e.g. Sanskrit Grammar illustration" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
             </div>
             
             <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>Meta Description</label>
                <textarea name="metaDescription" defaultValue={course.metaDescription || ''} rows={3} placeholder="A short, catchy description for Google search results..." style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontFamily: 'inherit', resize: 'vertical' }} />
             </div>

             <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>SEO Keywords (Comma Separated)</label>
                <input type="text" name="seoKeywords" defaultValue={course.seoKeywords || ''} placeholder="sanskrit, online learning, grammar" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
             </div>
          </div>

          <button type="submit" style={{ marginTop: '10px', padding: '14px', background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 15px rgba(242,100,34,0.2)' }}>
           COMMIT CORE DEFINITIONS
         </button>
      </form>
    </div>
  );
}
