"use client";

import { useState } from 'react';
import { saveSponsor, deleteSponsor, setHideDummySponsors } from '@/app/actions/sponsors';

interface Sponsor {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  createdAt: Date;
}

export default function SponsorsClient({ 
  initialSponsors, 
  initialHideDummy 
}: { 
  initialSponsors: Sponsor[];
  initialHideDummy: boolean;
}) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [hideDummy, setHideDummy] = useState(initialHideDummy);

  // Form submit handler
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    if (editingId) {
      fd.append('id', editingId);
    }

    try {
      const res = await saveSponsor(fd);
      if (res.success) {
        alert(editingId ? "Sponsor updated successfully!" : "Sponsor added successfully!");
        window.location.reload(); // Refresh to load updated DB state
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`System Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Populate form for editing
  function handleEdit(sponsor: Sponsor) {
    setEditingId(sponsor.id);
    setName(sponsor.name);
    setDescription(sponsor.description);
    setLogoUrl(sponsor.logoUrl);
  }

  // Delete sponsor
  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this sponsor?")) return;
    setLoading(true);
    try {
      const res = await deleteSponsor(id);
      if (res.success) {
        setSponsors(sponsors.filter(s => s.id !== id));
        alert("Sponsor deleted successfully!");
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`System Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Toggle Hide Dummy sponsors setting
  async function handleToggleHideDummy(checked: boolean) {
    setHideDummy(checked);
    try {
      const res = await setHideDummySponsors(checked);
      if (!res.success) {
        alert(`Failed to save setting: ${res.error}`);
      }
    } catch (err: any) {
      alert(`System Error: ${err.message}`);
    }
  }

  // Reset form state
  function handleCancelEdit() {
    setEditingId(null);
    setName('');
    setDescription('');
    setLogoUrl('');
  }

  return (
    <div>
      <div className="admin-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0 }}>🤝 Sponsors & Partners</h1>
          <p style={{ color: '#888', marginTop: '4px', margin: '4px 0 0 0' }}>
            Manage sponsor logos, names, and descriptions displayed on the scrolling marquee inside the footer.
          </p>
        </div>

        {/* Dynamic configuration toggle block */}
        <div style={{ background: '#0a0f18', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="checkbox" 
            id="hideDummyToggle" 
            checked={hideDummy} 
            onChange={e => handleToggleHideDummy(e.target.checked)} 
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#ffd700' }}
          />
          <label htmlFor="hideDummyToggle" style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
             🚫 Remove Dummy Slider Data from website footer
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* FORM PANEL */}
        <div style={{ background: '#0a0f18', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 800, color: '#ffd700' }}>
            {editingId ? "✏️ Edit Sponsor" : "➕ Add New Sponsor"}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Sponsor Name</label>
              <input 
                required 
                type="text" 
                name="name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Sanskrit Heritage Foundation" 
                style={inputStyle} 
              />
            </div>

            <div>
              <label style={labelStyle}>Description / Tagline</label>
              <textarea 
                required 
                name="description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3}
                placeholder="e.g. Supporting digital preservation of ancient manuscripts and interactive grammar tools." 
                style={{ ...inputStyle, fontFamily: 'inherit', resize: 'none' }} 
              />
            </div>

            <div>
              <label style={labelStyle}>Sponsor Logo File (Physical Upload)</label>
              <input 
                type="file" 
                name="logoFile" 
                accept="image/*" 
                style={inputStyle} 
              />
              <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                Optional. Leave blank to use URL or fallback placeholder.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Sponsor Logo URL (Fallback)</label>
              <input 
                type="text" 
                name="logoUrl" 
                value={logoUrl} 
                onChange={e => setLogoUrl(e.target.value)} 
                placeholder="e.g. https://domain.com/logo.png" 
                style={inputStyle} 
              />
              <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                Used if no file is uploaded.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  flex: 2,
                  padding: '12px', 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: 800, 
                  cursor: 'pointer' 
                }}
              >
                {loading ? 'Processing...' : (editingId ? 'Update Sponsor' : 'Register Sponsor')}
              </button>
              
              {editingId && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  style={{ 
                    flex: 1,
                    padding: '12px', 
                    background: 'rgba(255,255,255,0.05)', 
                    color: '#ccc', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '6px', 
                    fontWeight: 800, 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST TABLE PANEL */}
        <div style={{ background: '#0a0f18', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 800, color: '#fff' }}>Registered Sponsors</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#555', borderBottom: '1px solid #222' }}>
                <th style={{ padding: '10px 0', width: '80px' }}>Logo</th>
                <th style={{ padding: '10px 0' }}>Name & Info</th>
                <th style={{ padding: '10px 0', width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#444' }}>
                    No sponsors configured. Configure one to display in the footer!
                  </td>
                </tr>
              ) : (
                sponsors.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '15px 0' }}>
                      <img 
                        src={s.logoUrl} 
                        alt={s.name} 
                        style={{ 
                          width: '60px', 
                          height: '35px', 
                          objectFit: 'contain', 
                          background: 'rgba(255,255,255,0.03)', 
                          borderRadius: '4px',
                          border: '1px solid #222' 
                        }} 
                      />
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{s.name}</div>
                      <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '3px', lineHeight: '1.4' }}>{s.description}</div>
                    </td>
                    <td style={{ padding: '15px 0', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleEdit(s)}
                        style={{ 
                          background: 'rgba(255,215,0,0.1)', 
                          color: '#ffd700', 
                          border: '1px solid rgba(255,215,0,0.3)', 
                          borderRadius: '4px', 
                          padding: '4px 8px', 
                          fontSize: '0.75rem', 
                          cursor: 'pointer',
                          marginRight: '8px'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        style={{ 
                          background: 'rgba(229,9,20,0.1)', 
                          color: '#e50914', 
                          border: '1px solid rgba(229,9,20,0.3)', 
                          borderRadius: '4px', 
                          padding: '4px 8px', 
                          fontSize: '0.75rem', 
                          cursor: 'pointer' 
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px', fontWeight: 'bold', textTransform: 'uppercase'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: '#111', border: '1px solid #222', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none'
};
