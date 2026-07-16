"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateChannel, addChannel, toggleChannel, addSection, deleteSection, updateSection, toggleKnowledgeRoadmap, toggleShortsFeature, toggleBlogFeature } from '@/app/actions/layout-settings';

interface LayoutSettingsClientProps {
  sections: any[];
  channels: any[];
  availableCategories: string[];
  roadmapEnabled?: boolean;
  shortsEnabled?: boolean;
  blogEnabled?: boolean;
}

export default function LayoutSettingsClient({ 
  sections, 
  channels, 
  availableCategories, 
  roadmapEnabled = true,
  shortsEnabled = true,
  blogEnabled = true
}: LayoutSettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isRoadmapEnabled, setIsRoadmapEnabled] = useState(roadmapEnabled);
  const [isShortsEnabled, setIsShortsEnabled] = useState(shortsEnabled);
  const [isBlogEnabled, setIsBlogEnabled] = useState(blogEnabled);

  return (
    <div style={{ maxWidth: '1000px' }}>
      <style>{`
        .save-channel-btn {
          padding: 9px 20px;
          background: #f26422;
          border: none;
          border-radius: 6px;
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }
        .save-channel-btn:hover {
          background: #d55318;
        }
      `}</style>
      
      {/* 0. FEATURE TOGGLES */}
      <div style={{ marginBottom: '50px' }}>
        <div className="admin-header" style={{ marginBottom: '25px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
             ⚙️ Global Feature Toggles
          </h1>
          <p style={{ color: '#aaa', marginTop: '5px' }}>Enable or disable experimental or major UI features platform-wide.</p>
        </div>
        <div style={{ 
          background: 'linear-gradient(to right, #0f1624, #070b14)', 
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '20px', 
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>🌌 Knowledge Roadmap (Constellation)</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>Shows the interactive 2D constellation roadmap on user profiles.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
            <div style={{
              width: '50px', height: '26px', background: isRoadmapEnabled ? '#28a745' : '#444', 
              borderRadius: '26px', position: 'relative', transition: 'all 0.3s'
            }}>
              <div style={{
                width: '22px', height: '22px', background: 'white', borderRadius: '50%',
                position: 'absolute', top: '2px', left: isRoadmapEnabled ? '26px' : '2px', transition: 'all 0.3s'
              }} />
            </div>
            <input 
              type="checkbox" 
              checked={isRoadmapEnabled} 
              style={{ display: 'none' }}
              onChange={async (e) => {
                const newVal = e.target.checked;
                setIsRoadmapEnabled(newVal);
                await toggleKnowledgeRoadmap(newVal);
              }} 
            />
          </label>
        </div>

        <div style={{ 
          background: 'linear-gradient(to right, #0f1624, #070b14)', 
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '20px', 
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '15px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>📱 Vyoma Shorts</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>Enable the TikTok-style vertical video Shorts module across the platform.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
            <div style={{
              width: '50px', height: '26px', background: isShortsEnabled ? '#28a745' : '#444', 
              borderRadius: '26px', position: 'relative', transition: 'all 0.3s'
            }}>
              <div style={{
                width: '22px', height: '22px', background: 'white', borderRadius: '50%',
                position: 'absolute', top: '2px', left: isShortsEnabled ? '26px' : '2px', transition: 'all 0.3s'
              }} />
            </div>
            <input 
              type="checkbox" 
              checked={isShortsEnabled} 
              style={{ display: 'none' }}
              onChange={async (e) => {
                const newVal = e.target.checked;
                setIsShortsEnabled(newVal);
                await toggleShortsFeature(newVal);
              }} 
            />
          </label>
        </div>

        <div style={{ 
          background: 'linear-gradient(to right, #0f1624, #070b14)', 
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '20px', 
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '15px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>📝 Vyoma Insights Blog</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '5px' }}>Enable the educational blog and articles module.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '10px' }}>
            <div style={{
              width: '50px', height: '26px', background: isBlogEnabled ? '#28a745' : '#444', 
              borderRadius: '26px', position: 'relative', transition: 'all 0.3s'
            }}>
              <div style={{
                width: '22px', height: '22px', background: 'white', borderRadius: '50%',
                position: 'absolute', top: '2px', left: isBlogEnabled ? '26px' : '2px', transition: 'all 0.3s'
              }} />
            </div>
            <input 
              type="checkbox" 
              checked={isBlogEnabled} 
              style={{ display: 'none' }}
              onChange={async (e) => {
                const newVal = e.target.checked;
                setIsBlogEnabled(newVal);
                await toggleBlogFeature(newVal);
              }} 
            />
          </label>
        </div>
      </div>
      
      {/* 1. SLEEK CHANNELS DASHBOARD MANAGER */}
      <div style={{ marginBottom: '50px' }}>
        <div className="admin-header" style={{ marginBottom: '25px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
             ⭐ Hotstar Channels Dashboard
          </h1>
          <p style={{ color: '#aaa', marginTop: '5px' }}>Modify titles, URL mappings, and iconography for the interactive studio filters on the Homepage.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {channels.map((chan: any) => (
            <form key={chan.id} onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const fd = new FormData(e.currentTarget);
                await updateChannel(fd);
                router.refresh();
              } finally {
                setLoading(false);
              }
            }} style={{ 
              background: 'linear-gradient(to right, #0f1624, #070b14)', 
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '15px 20px', 
              borderRadius: '10px', 
              display: 'grid', 
              gridTemplateColumns: '230px 1fr 2fr 60px 80px auto', 
              gap: '15px', 
              alignItems: 'center' 
            }}>
              <input type="hidden" name="id" value={chan.id} />
              
              {/* Icon Input & Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ display: 'block', color: '#777', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Icon/Emoji/URL</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {(chan.icon?.startsWith('http') || chan.icon?.startsWith('/')) && (
                    <img src={chan.icon} alt="Preview" style={{ width: '36px', height: '36px', objectFit: 'contain', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }} />
                  )}
                  <input
                    required
                    id={`icon-field-${chan.id}`}
                    type="text"
                    name="icon"
                    defaultValue={chan.icon}
                    placeholder="Emoji or Image URL"
                    style={{ flex: 1, padding: '8px', background: '#030b17', border: '1px solid #222', borderRadius: '6px', color: '#fff', textAlign: 'left', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label style={{ display: 'block', color: '#777', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Channel Title</label>
                <input required type="text" name="name" defaultValue={chan.name} style={{ width: '100%', padding: '8px', background: '#030b17', border: '1px solid #222', borderRadius: '6px', color: '#fff', fontWeight: 'bold' }} />
              </div>

              {/* URL Link Input */}
              <div>
                <label style={{ display: 'block', color: '#777', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Redirect URL Path</label>
                <input required type="text" name="url" defaultValue={chan.url} style={{ width: '100%', padding: '8px', background: '#030b17', border: '1px solid #222', borderRadius: '6px', color: '#8f98a9', fontFamily: 'monospace', fontSize: '0.85rem' }} />
              </div>

              {/* Order Input */}
              <div>
                <label style={{ display: 'block', color: '#777', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Weight</label>
                <input type="number" name="order" defaultValue={chan.order} style={{ width: '100%', padding: '8px', background: '#030b17', border: '1px solid #222', borderRadius: '6px', color: '#fff', textAlign: 'center' }} />
              </div>

              {/* Active Toggle */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <label style={{ display: 'block', color: '#777', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</label>
                <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px', cursor: 'pointer' }}>
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: chan.active !== false ? '#4ade80' : '#444', 
                    borderRadius: '20px', transition: '0.3s' 
                  }}>
                    <div style={{ 
                      position: 'absolute', top: '2px', left: chan.active !== false ? '22px' : '2px', 
                      width: '16px', height: '16px', backgroundColor: 'white', 
                      borderRadius: '50%', transition: '0.3s' 
                    }} />
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked={chan.active !== false}
                    onChange={async (e) => {
                      try {
                        await toggleChannel(chan.id, e.target.checked);
                      } catch (err) {}
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Save Trigger */}
              <div style={{ paddingTop: '14px' }}>
                <button type="submit" disabled={loading} className="save-channel-btn" style={{ opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ))}
          
          {/* Add New Channel Form */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const fd = new FormData(e.currentTarget);
              await addChannel(fd);
              e.currentTarget.reset();
            } finally {
              setLoading(false);
            }
          }} style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px dashed rgba(255,255,255,0.2)',
            padding: '15px 20px', 
            borderRadius: '10px', 
            display: 'grid', 
            gridTemplateColumns: '230px 1fr 2fr 60px 80px auto', 
            gap: '15px', 
            alignItems: 'center',
            marginTop: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input required type="text" name="icon" placeholder="Emoji or Image URL" style={{ width: '100%', padding: '8px', background: '#030b17', border: '1px solid #222', borderRadius: '6px', color: '#fff', fontSize: '0.9rem' }} />
            </div>
            <div>
              <input required type="text" name="name" placeholder="New Channel Title" style={{ width: '100%', padding: '8px', background: '#030b17', border: '1px solid #222', borderRadius: '6px', color: '#fff', fontWeight: 'bold' }} />
            </div>
            <div>
              <input required type="text" name="url" placeholder="/genre/..." style={{ width: '100%', padding: '8px', background: '#030b17', border: '1px solid #222', borderRadius: '6px', color: '#8f98a9', fontFamily: 'monospace', fontSize: '0.85rem' }} />
            </div>
            <div>
              <input type="number" name="order" defaultValue="100" style={{ width: '100%', padding: '8px', background: '#030b17', border: '1px solid #222', borderRadius: '6px', color: '#fff', textAlign: 'center' }} />
            </div>
            <div></div>
            <div>
              <button type="submit" disabled={loading} style={{ background: '#4ade80', color: '#000', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                + Add
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. ORIGINAL HOMEPAGE RAILS BUILDER */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
        <div className="admin-header" style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Homepage Rails Builder</h1>
          <p style={{ color: '#aaa', marginTop: '5px' }}>Dynamic construction of frontend content rows. Add, remove, and sequence category sliders.</p>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>➕ Append New Row Injection</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            const fd = new FormData(e.currentTarget);
            await addSection(fd);
            (e.target as HTMLFormElement).reset();
            router.refresh();
          } finally {
            setLoading(false);
          }
        }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', color: '#777', fontSize: '0.75rem', marginBottom: '5px' }}>Display Title (Frontend)</label>
            <input required type="text" name="title" placeholder="e.g. World of Chants" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '5px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#777', fontSize: '0.75rem', marginBottom: '5px' }}>Source Category</label>
            <select required name="category" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '5px', color: '#fff' }}>
              <option value="">Select mapping...</option>
              {availableCategories.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
              ))}
              {availableCategories.length === 0 && <option disabled>No categories cached in course tree.</option>}
            </select>
          </div>
          <div>
             <label style={{ display: 'block', color: '#777', fontSize: '0.75rem', marginBottom: '5px' }}>Order</label>
             <input type="number" name="order" defaultValue={10} style={{ width: '80px', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '5px', color: '#fff' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '11px 20px', background: '#f26422', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Committing...' : 'Commit'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '5px' }}>Current Frontend Topology</h3>
        {sections.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #333', color: '#555', borderRadius: '10px' }}>
            Waiting for platform bootstrap. Visit Homepage to instantiate base state.
          </div>
        ) : (
          sections.map((section: any, i: number) => {
            if (editingSectionId === section.id) {
              return (
                <form
                  key={section.id}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      const fd = new FormData(e.currentTarget);
                      await updateSection(fd);
                      setEditingSectionId(null);
                      router.refresh();
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    border: '1px solid #f26422',
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr auto auto',
                    gap: '15px',
                    alignItems: 'center'
                  }}
                >
                  <input type="hidden" name="id" value={section.id} />
                  <div>
                    <label style={{ display: 'block', color: '#777', fontSize: '0.65rem', marginBottom: '3px' }}>Title</label>
                    <input
                      required
                      type="text"
                      name="title"
                      defaultValue={section.title}
                      style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#777', fontSize: '0.65rem', marginBottom: '3px' }}>Category</label>
                    <select
                      required
                      name="category"
                      defaultValue={section.category}
                      style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                    >
                      {availableCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#777', fontSize: '0.65rem', marginBottom: '3px' }}>Weight</label>
                    <input
                      type="number"
                      name="order"
                      defaultValue={section.order}
                      style={{ width: '100%', padding: '8px', background: '#000', border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div style={{ paddingTop: '15px' }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ background: '#46d369', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Save
                    </button>
                  </div>
                  <div style={{ paddingTop: '15px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingSectionId(null)}
                      style={{ background: 'transparent', color: '#aaa', border: '1px solid #333', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div key={section.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                   <div style={{ background: '#111', padding: '8px', borderRadius: '4px', minWidth: '35px', textAlign: 'center', fontWeight: 'bold', color: '#f26422' }}>{i+1}</div>
                   <div>
                     <div style={{ fontWeight: 'bold', color: '#fff' }}>{section.title}</div>
                     <div style={{ fontSize: '0.8rem', color: '#666' }}>Target: {section.category} | Weight: {section.order}</div>
                   </div>
                 </div>
                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                   <button
                     type="button"
                     onClick={() => setEditingSectionId(section.id)}
                     style={{ background: 'transparent', color: '#f26422', border: '1px solid rgba(242,100,34,0.3)', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                   >
                     Edit
                   </button>
                   <form onSubmit={async (e) => {
                     e.preventDefault();
                     if (!confirm('Are you sure you want to delete this shelf row?')) return;
                     setLoading(true);
                     try {
                       const fd = new FormData(e.currentTarget);
                       await deleteSection(fd);
                       router.refresh();
                     } finally {
                       setLoading(false);
                     }
                   }}>
                     <input type="hidden" name="id" value={section.id} />
                     <button type="submit" disabled={loading} style={{ background: 'transparent', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.3)', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                       Delete
                     </button>
                   </form>
                 </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
