"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addItem, deleteItem, updateItem } from '@/app/actions/navigation-settings';

interface NavigationClientProps {
  initialHeaderMenus: any[];
  initialFooterMenus: any[];
}

export default function NavigationClient({ initialHeaderMenus, initialFooterMenus }: NavigationClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>('header');

  const currentMenus = activeTab === 'header' ? initialHeaderMenus : initialFooterMenus;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        .nav-edit-input {
          background: transparent;
          border: 1px solid transparent;
          padding: 4px 8px;
          border-radius: 4px;
          outline: none;
          transition: border-color 0.2s;
        }
        .nav-edit-input:focus {
          border: 1px solid #444 !important;
        }
        .tab-btn {
          padding: 12px 24px;
          border-radius: 30px;
          font-weight: 800;
          font-size: 0.95rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, var(--primary) 0%, #ff8c53 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(242, 100, 34, 0.4);
        }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '10px' }}>
            {activeTab === 'header' ? 'Header Navigation Matrix' : 'Footer Navigation Matrix'}
          </h1>
          <p style={{ color: '#888', margin: 0 }}>
            {activeTab === 'header' 
              ? 'Manage universal link hierarchies, dynamic dropdowns, and directional placement sequences.' 
              : 'Manage footer section links, legal policies, and support portal connections.'}
          </p>
        </div>
        
        {/* Navigation Type Selector */}
        <div style={{ display: 'flex', gap: '10px', background: '#0e1118', padding: '6px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            className={`tab-btn ${activeTab === 'header' ? 'active' : ''}`}
            onClick={() => setActiveTab('header')}
          >
            🧭 Header Menu
          </button>
          <button 
            className={`tab-btn ${activeTab === 'footer' ? 'active' : ''}`}
            onClick={() => setActiveTab('footer')}
          >
            👣 Footer Menu
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '30px' }}>
        
        {/* CREATOR CONSOLE */}
        <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '12px', border: '1px solid #222', height: 'fit-content' }}>
           <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 800 }}>
             ➕ Add {activeTab === 'header' ? 'Header' : 'Footer'} Link
           </h3>
           
           <form onSubmit={async (e) => {
             e.preventDefault();
             setLoading(true);
             try {
               const fd = new FormData(e.currentTarget);
               await addItem(fd);
               (e.target as HTMLFormElement).reset();
               router.refresh();
             } finally {
               setLoading(false);
             }
           }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="hidden" name="isFooter" value={activeTab === 'footer' ? 'true' : 'false'} />

              <div>
                 <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px' }}>Link Label / Text</label>
                 <input required name="label" type="text" placeholder="e.g., Privacy Policy" style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div>
                 <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px' }}>Target URL Path</label>
                 <input name="url" type="text" placeholder="/privacy or #" style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '6px', color: '#fff' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                 <div>
                    <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px' }}>Parent Menu Group</label>
                    <select name="parentId" style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '6px', color: '#fff' }}>
                       <option value="">-- Set as Top Level --</option>
                       {currentMenus.map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                       ))}
                    </select>
                 </div>
                 <div>
                    <label style={{ fontSize: '0.75rem', color: '#888', display: 'block', marginBottom: '6px' }}>Order Priority</label>
                    <input type="number" name="order" defaultValue="0" style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '6px', color: '#fff' }} />
                 </div>
              </div>

              <button type="submit" disabled={loading} style={{ background: 'var(--primary)', color: '#fff', padding: '15px', borderRadius: '8px', border: 'none', fontWeight: 900, cursor: 'pointer', marginTop: '10px', opacity: loading ? 0.7 : 1 }}>
                 {loading ? 'SAVING...' : `ADD TO ${activeTab === 'header' ? 'HEADER' : 'FOOTER'} STACK`}
              </button>
           </form>
        </div>

        {/* HIERARCHY VIEWER */}
        <div>
           <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 800 }}>🌲 Current Active Hierarchy</h3>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {currentMenus.length === 0 && <div style={{ color: '#555' }}>No links configured in this section yet. Add one on the left.</div>}
              
              {currentMenus.map(m => (
                 <div key={m.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' }}>
                    
                    {/* PARENT ROW - INLINE EDIT FORM */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#1a1a1a' }}>
                       <form onSubmit={async (e) => {
                         e.preventDefault();
                         setLoading(true);
                         try {
                           const fd = new FormData(e.currentTarget);
                           await updateItem(fd);
                           router.refresh();
                         } finally {
                           setLoading(false);
                         }
                       }} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="text" name="label" defaultValue={m.label} className="nav-edit-input" style={{ color: '#fff', fontWeight: 900, fontSize: '0.95rem', width: '130px' }} />
                          <input type="text" name="url" defaultValue={m.url || ''} style={{ background: '#000', border: '1px solid #333', color: '#aaa', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', width: '200px' }} />
                          <button type="submit" disabled={loading} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                       </form>
                       
                       <form onSubmit={async (e) => {
                         e.preventDefault();
                         if (!confirm('Are you sure you want to delete this menu?')) return;
                         setLoading(true);
                         try {
                           const fd = new FormData(e.currentTarget);
                           await deleteItem(fd);
                           router.refresh();
                         } finally {
                           setLoading(false);
                         }
                       }}>
                          <input type="hidden" name="id" value={m.id} />
                          <button type="submit" disabled={loading} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '10px' }}>Delete</button>
                       </form>
                    </div>

                    {/* CHILD LOOP - INLINE EDIT FORMS */}
                    {m.children && m.children.length > 0 && (
                       <div style={{ padding: '10px 20px 10px 40px', background: '#050505', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {m.children.map((child: any) => (
                             <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '6px 8px', borderBottom: '1px dashed #1a1a1a' }}>
                                <form onSubmit={async (e) => {
                                  e.preventDefault();
                                  setLoading(true);
                                  try {
                                    const fd = new FormData(e.currentTarget);
                                    await updateItem(fd);
                                    router.refresh();
                                  } finally {
                                    setLoading(false);
                                  }
                                }} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                   <input type="hidden" name="id" value={child.id} />
                                   <span style={{ color: '#666' }}>↳</span>
                                   <input type="text" name="label" defaultValue={child.label} className="nav-edit-input" style={{ color: '#ccc', fontSize: '0.85rem', width: '180px' }} />
                                   <input type="text" name="url" defaultValue={child.url || ''} style={{ background: '#000', border: '1px solid #222', color: '#888', fontSize: '0.7rem', padding: '3px 6px', borderRadius: '3px', width: '160px' }} />
                                   <button type="submit" disabled={loading} style={{ background: 'none', border: 'none', color: '#55aaff', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline' }}>Update</button>
                                </form>
                                
                                <form onSubmit={async (e) => {
                                  e.preventDefault();
                                  if (!confirm('Are you sure?')) return;
                                  setLoading(true);
                                  try {
                                    const fd = new FormData(e.currentTarget);
                                    await deleteItem(fd);
                                    router.refresh();
                                  } finally {
                                    setLoading(false);
                                  }
                                }}>
                                   <input type="hidden" name="id" value={child.id} />
                                   <button type="submit" disabled={loading} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.7rem', marginLeft: '10px' }}>✕</button>
                                </form>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
