'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAllSubhashitas, 
  deleteSubhashita, 
  createSubhashita, 
  uploadSubhashitasCSV 
} from '@/app/actions/subhashitas';
import Link from 'next/link';

interface SubhashitaWord {
  word: string;
  meaning: string;
}

interface SubhashitaType {
  id: string;
  sanskrit: string;
  transliteration: string;
  translation: string;
  source: string;
  wordsJson: string;
  createdAt: any;
}

export default function SubhashitasPage() {
  const [subhashitas, setSubhashitas] = useState<SubhashitaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  
  // Tab control: 'list' | 'add' | 'bulk'
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'bulk'>('list');

  // Manual Form State
  const [sanskrit, setSanskrit] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [translation, setTranslation] = useState('');
  const [source, setSource] = useState('');
  const [words, setWords] = useState<SubhashitaWord[]>([{ word: '', meaning: '' }]);
  
  // Bulk CSV State
  const [csvText, setCsvText] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Load and Feedbacks
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getAllSubhashitas();
      setSubhashitas(data as any);
      setAuthorized(true);
    } catch (err) {
      console.error(err);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Word Split Handlers for Manual Form
  const addWordRow = () => {
    setWords(prev => [...prev, { word: '', meaning: '' }]);
  };

  const removeWordRow = (index: number) => {
    setWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleWordChange = (index: number, field: 'word' | 'meaning', val: string) => {
    setWords(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  // Submit Manual Form
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanskrit || !transliteration || !translation) {
      setMessage({ type: 'error', text: 'Sanskrit, transliteration, and translation are required.' });
      return;
    }

    setActionInProgress('add');
    setMessage(null);

    try {
      const res = await createSubhashita({
        sanskrit,
        transliteration,
        translation,
        source,
        words: words.filter(w => w.word.trim())
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Subhashita added successfully!' });
        // Clear manual fields
        setSanskrit('');
        setTransliteration('');
        setTranslation('');
        setSource('');
        setWords([{ word: '', meaning: '' }]);
        loadData();
        setActiveTab('list');
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to create Subhashita.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error occurred.' });
    } finally {
      setActionInProgress(null);
    }
  };

  // Submit Bulk CSV Form
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile && !csvText.trim()) {
      setMessage({ type: 'error', text: 'Please upload a CSV file or paste raw CSV text.' });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const fd = new FormData();
      if (csvFile) fd.append('csvFile', csvFile);
      if (csvText) fd.append('csvText', csvText);

      const res = await uploadSubhashitasCSV(fd);
      if ('error' in res) {
        setMessage({ type: 'error', text: res.error });
      } else if (res.success) {
        let msg = `Successfully imported ${res.count} Slokas!`;
        if (res.errors && res.errors.length > 0) {
          msg += ` Note: skipped/errored rows: ${res.errors.join(', ')}`;
        }
        setMessage({ type: 'success', text: msg });
        setCsvText('');
        setCsvFile(null);
        // Reset file input element manually
        const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        loadData();
        setActiveTab('list');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error occurred during bulk upload.' });
    } finally {
      setImporting(false);
    }
  };

  // Delete Sloka Handler
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Sloka permanently?')) return;
    setActionInProgress(id);
    setMessage(null);

    try {
      const res = await deleteSubhashita(id);
      if (res.success) {
        setSubhashitas(prev => prev.filter(s => s.id !== id));
        setMessage({ type: 'success', text: 'Subhashita deleted.' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Delete failed.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Delete error occurred.' });
    } finally {
      setActionInProgress(null);
    }
  };

  if (authorized === false) {
    return (
      <div style={{ padding: '40px', color: '#ff4d4f', textAlign: 'center', background: 'rgba(255, 77, 79, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 77, 79, 0.2)', margin: '40px auto', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
        <p style={{ marginTop: '10px', color: '#aaa' }}>Super Admin access required for Sloka management actions.</p>
        <Link href="/admin" style={{ color: '#fff', textDecoration: 'underline', marginTop: '15px', display: 'inline-block' }}>Return to Overview</Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '60px', color: '#fff', fontFamily: 'var(--font-geist-sans), sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .sloka-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .sloka-card:hover {
          transform: translateY(-3px) scale(1.002);
          border-color: rgba(242, 100, 34, 0.2) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45), 0 0 20px rgba(242, 100, 34, 0.05);
        }
        .tab-filter-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .tab-filter-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .action-delete-btn {
          transition: all 0.2s ease !important;
        }
        .action-delete-btn:hover {
          background: rgba(255, 77, 79, 0.2) !important;
          border-color: rgba(255, 77, 79, 0.5) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 77, 79, 0.2);
        }
        .action-add-row-btn {
          transition: all 0.2s ease !important;
        }
        .action-add-row-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
      ` }} />

      {/* HEADER */}
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 className="admin-title" style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Sloka / Subhashita Library</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Control and upload Sanskrit Slokas for the daily recitation widget on the platform homepage.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/sanskrit-settings" className="btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none' }}>
            ← Hub Settings
          </Link>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {message && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '10px',
          marginBottom: '25px',
          border: message.type === 'success' ? '1px solid rgba(70,211,105,0.3)' : '1px solid rgba(255,77,79,0.3)',
          background: message.type === 'success' ? 'rgba(70,211,105,0.08)' : 'rgba(255,77,79,0.08)',
          color: message.type === 'success' ? '#46d369' : '#ff4d4f',
          fontWeight: 600
        }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', marginBottom: '30px' }}>
        <button
          onClick={() => { setActiveTab('list'); setMessage(null); }}
          className={`tab-filter-btn ${activeTab === 'list' ? 'active' : ''}`}
          style={{
            padding: '10px 22px',
            borderRadius: '20px',
            border: activeTab === 'list' ? '1px solid var(--primary, #f26422)' : '1px solid rgba(255,255,255,0.05)',
            background: activeTab === 'list' ? 'rgba(242,100,34,0.1)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'list' ? 'var(--primary, #f26422)' : '#888',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
          }}
        >
          📜 Sloka Library ({subhashitas.length})
        </button>
        <button
          onClick={() => { setActiveTab('add'); setMessage(null); }}
          className={`tab-filter-btn ${activeTab === 'add' ? 'active' : ''}`}
          style={{
            padding: '10px 22px',
            borderRadius: '20px',
            border: activeTab === 'add' ? '1px solid var(--primary, #f26422)' : '1px solid rgba(255,255,255,0.05)',
            background: activeTab === 'add' ? 'rgba(242,100,34,0.1)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'add' ? 'var(--primary, #f26422)' : '#888',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
          }}
        >
          ➕ Add Manually
        </button>
        <button
          onClick={() => { setActiveTab('bulk'); setMessage(null); }}
          className={`tab-filter-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          style={{
            padding: '10px 22px',
            borderRadius: '20px',
            border: activeTab === 'bulk' ? '1px solid var(--primary, #f26422)' : '1px solid rgba(255,255,255,0.05)',
            background: activeTab === 'bulk' ? 'rgba(242,100,34,0.1)' : 'rgba(255,255,255,0.02)',
            color: activeTab === 'bulk' ? 'var(--primary, #f26422)' : '#888',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.9rem',
          }}
        >
          📥 Bulk Import (CSV)
        </button>
      </div>

      {/* TAB CONTENT: 📜 LIBRARY LIST */}
      {activeTab === 'list' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>⏱ Loading Sloka Library...</div>
        ) : subhashitas.length === 0 ? (
          <div className="admin-card" style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#888'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>📭</span>
            <h3 style={{ fontSize: '1.2rem', color: '#ccc', fontWeight: 'bold' }}>Library is empty</h3>
            <p style={{ marginTop: '5px', fontSize: '0.9rem' }}>Use "Add Manually" or "Bulk Import" to populate Slokas. Falling back to default app array in the meantime.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {subhashitas.map((sloka) => {
              const isDeleting = actionInProgress === sloka.id;
              let parsedWords: SubhashitaWord[] = [];
              try {
                parsedWords = JSON.parse(sloka.wordsJson);
              } catch (e) {}

              return (
                <div key={sloka.id} className="admin-card sloka-card" style={{ padding: '25px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <span className="admin-badge admin-badge-primary">
                        📖 Source: {sloka.source || 'Unknown'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(sloka.id)}
                      disabled={isDeleting}
                      className="action-delete-btn"
                      style={{
                        background: 'rgba(255,77,79,0.1)',
                        border: '1px solid rgba(255,77,79,0.3)',
                        color: '#ff4d4f',
                        padding: '6px 15px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        cursor: isDeleting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isDeleting ? '⏱ Removing...' : '🗑️ Delete'}
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.4rem', color: '#ffd700', lineHeight: '1.6', whiteSpace: 'pre-line', marginBottom: '10px' }}>
                    {sloka.sanskrit}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', whiteSpace: 'pre-line', marginBottom: '15px' }}>
                    {sloka.transliteration}
                  </p>
                  <p style={{ fontSize: '0.92rem', color: '#e2e8f0', lineHeight: '1.6', background: 'rgba(0,0,0,0.15)', padding: '14px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    {sloka.translation}
                  </p>

                  {parsedWords.length > 0 && (
                    <div style={{ marginTop: '18px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#4b5a75', display: 'block', marginBottom: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Word Splits</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {parsedWords.map((w, idx) => (
                          <span key={idx} style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', color: '#94a3b8' }}>
                            <strong style={{ color: '#fff', marginRight: '4px' }}>{w.word}</strong>: {w.meaning}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* TAB CONTENT: ➕ MANUAL CREATION FORM */}
      {activeTab === 'add' && (
        <form onSubmit={handleManualSubmit} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="admin-form-group">
            <label>Sanskrit Text (use newlines for verse formatting)</label>
            <textarea
              required
              rows={3}
              value={sanskrit}
              onChange={(e) => setSanskrit(e.target.value)}
              placeholder="उद्यमेन हि सिध्यन्ति..."
            />
          </div>

          <div className="admin-form-group">
            <label>English Transliteration</label>
            <textarea
              required
              rows={3}
              value={transliteration}
              onChange={(e) => setTransliteration(e.target.value)}
              placeholder="Udyamena hi sidhyanti..."
            />
          </div>

          <div className="admin-form-group">
            <label>English Translation</label>
            <textarea
              required
              rows={3}
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Tasks are accomplished by effort..."
            />
          </div>

          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Source / Book Reference</label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Hitopadesha, Chanakya Niti, etc."
              />
            </div>
          </div>

          {/* WORD SPLITS */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Word Splits & Meanings (Optional)</label>
              <button
                type="button"
                onClick={addWordRow}
                className="action-add-row-btn"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ➕ Add Word
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {words.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={item.word}
                    onChange={(e) => handleWordChange(idx, 'word', e.target.value)}
                    placeholder="Sanskrit word"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    value={item.meaning}
                    onChange={(e) => handleWordChange(idx, 'meaning', e.target.value)}
                    placeholder="English meaning"
                    style={{ flex: 2 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeWordRow(idx)}
                    style={{ background: 'none', border: 'none', color: '#ff4d4f', fontSize: '1.2rem', cursor: 'pointer', padding: '0 5px' }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={actionInProgress === 'add'}
              className="btn btn-primary"
              style={{
                padding: '12px 30px',
                borderRadius: '12px',
                cursor: actionInProgress === 'add' ? 'default' : 'pointer'
              }}
            >
              {actionInProgress === 'add' ? '⏱ Saving Sloka...' : '💾 Save Sloka'}
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT: 📥 BULK IMPORT */}
      {activeTab === 'bulk' && (
        <div className="admin-grid-2">
          {/* UPLOADER */}
          <form onSubmit={handleBulkSubmit} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="admin-form-group">
              <label>Option A: Upload CSV File</label>
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  padding: '24px',
                  background: 'rgba(15, 22, 36, 0.45)',
                  border: '2px dashed rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              />
            </div>

            <div style={{ textAlign: 'center', color: '#4b5a75', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '2px' }}>
              — OR —
            </div>

            <div className="admin-form-group">
              <label>Option B: Paste Raw CSV Text</label>
              <textarea
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="sanskrit,transliteration,translation,source,words&#10;&quot;विद्या ददाति...&quot;,&quot;Vidyā dadāti...&quot;,&quot;Knowledge gives...&quot;,&quot;Hitopadesha&quot;,&quot;विद्या:knowledge;ददाति:gives&quot;"
              />
            </div>

            <button
              type="submit"
              disabled={importing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                cursor: importing ? 'default' : 'pointer'
              }}
            >
              {importing ? '⏱ Importing Slokas...' : '📥 Synchronize & Import'}
            </button>
          </form>

          {/* TEMPLATE INFO CARD */}
          <div className="admin-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '15px', color: 'var(--primary, #f26422)' }}>
              📋 CSV Formatting Instructions
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '15px' }}>
              To ensure error-free uploads, format your spreadsheet with the following headers:
            </p>
            <table style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 0', color: '#fff' }}>Column</th>
                  <th style={{ padding: '8px 0', color: '#fff' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '8px 0', color: '#ffd700', fontWeight: 'bold' }}>sanskrit</td>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Devanagari verses (use \n for line breaks)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '8px 0', color: '#ffd700', fontWeight: 'bold' }}>transliteration</td>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>English reading helper (use \n for line breaks)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '8px 0', color: '#ffd700', fontWeight: 'bold' }}>translation</td>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Complete English meaning</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '8px 0', color: '#ffd700', fontWeight: 'bold' }}>source</td>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Book reference (e.g. Chanakya Niti)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#ffd700', fontWeight: 'bold' }}>words</td>
                  <td style={{ padding: '8px 0', color: '#94a3b8' }}>Splits formatted as: <code>word:meaning;word2:meaning</code></td>
                </tr>
              </tbody>
            </table>
            <div style={{
              background: '#070c14',
              padding: '14px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              color: '#888',
              lineHeight: '1.5',
              fontFamily: 'monospace',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              sanskrit,transliteration,translation,source,words<br />
              "उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः।\nन हि सुप्तस्य सिंहस्य प्रविशन्ति मुखे मृगाः॥","Udyamena hi sidhyanti kāryāṇi na manorathaiḥ\nNa hi suptasya siṁhasya praviśanti mukhe mṛgāḥ","Indeed tasks are accomplished by effort and hard work...","Hitopadesha","उद्यमेन:by effort;हि:indeed;सिध्यन्ति:succeed"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
