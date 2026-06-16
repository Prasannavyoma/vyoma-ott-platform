"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StickyNote({ courseId, initialNote }: { courseId: string, initialNote?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState(initialNote || '');
  const [saving, setSaving] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);

  // 1. MULTI-TIERED HYDRATION FAILSAFE: Hydrate from LocalStorage if DB differs/failed
  useEffect(() => {
    try {
      const localDraft = localStorage.getItem(`note_backup_${courseId}`);
      // Only fall back to local draft if it contains useful text and differs from the current loaded state
      if (localDraft && localDraft !== initialNote && localDraft.trim().length > 0) {
        setNote(localDraft);
        setSavedTime("🔄 Recovered Draft");
      } else {
        setNote(initialNote || '');
      }
    } catch (e) {}
  }, [courseId, initialNote]);

  async function saveNote() {
    setSaving(true);
    setSavedTime(null);
    try {
      // A. Secure backup inside Browser Engine FIRST before attempting network transmission!
      localStorage.setItem(`note_backup_${courseId}`, note);

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, content: note })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP_ERROR_${res.status}`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "API_REJECTED");
      }

      setSavedTime(new Date().toLocaleTimeString());
      
      // B. BREAK NEXT.JS CACHE: Trigger dynamic route router refresh
      router.refresh();

    } catch (e: any) {
      console.error("[NOTE_SAVE] Error saving note:", e);
      setSavedTime("⚠️ SAVE FAILED");
    } finally {
      setSaving(false);
    }
  }

  function handleNoteChange(val: string) {
    setNote(val);
    // Debounce-less local disk backup for 100% uptime integrity
    try {
      localStorage.setItem(`note_backup_${courseId}`, val);
    } catch(e){}
  }

  return (
    <div style={{ marginBottom: '25px', width: '100%' }}>
      {/* 1. THE WIDE TOGGLE BUTTON RENDERED DIRECTLY IN SIDEBAR */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: isOpen ? 'rgba(255,255,255,0.05)' : 'rgba(255, 232, 152, 0.06)',
          border: isOpen ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255, 232, 152, 0.2)',
          color: isOpen ? '#fff' : '#ffe898',
          padding: '16px 20px',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
          boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
          letterSpacing: '0.5px',
          marginBottom: isOpen ? '20px' : '0'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.background = isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255, 232, 152, 0.12)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = isOpen ? 'rgba(255,255,255,0.05)' : 'rgba(255, 232, 152, 0.06)';
          e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>📝</span> Personal Notebook
        </span>
        <span style={{ fontSize: '0.75rem', opacity: 0.8, background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
          {isOpen ? '▲ CLOSE' : '▼ CLICK TO OPEN'}
        </span>
      </button>

      {/* 2. THE EXPANDABLE YELLOW NOTEBOOK ACCORDION BLOCK */}
      {isOpen && (
        <div style={{ 
          background: 'linear-gradient(135deg, #ffe898 0%, #fff2c1 100%)', 
          color: '#4a3f1b', 
          padding: '25px', 
          borderRadius: '16px', 
          boxShadow: '0 15px 35px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.2)', 
          position: 'relative',
          transform: 'rotate(0.5deg)',
          transformOrigin: 'top center',
          animation: 'expandScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}>
           {/* Top pinned decoration for sticky aesthetics */}
           <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(242,100,34,0.8)', width: '80px', height: '24px', borderRadius: '2px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}></div>

           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '15px', borderBottom: '1px dashed rgba(74,63,27,0.2)', paddingBottom: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                 📌 Writing Desk Active
              </span>
              <span style={{ color: '#8f7a34', fontSize: '0.7rem', fontWeight: 'bold' }}>
                 {saving ? 'Saving...' : savedTime ? `Saved: ${savedTime}` : 'Ready to Sync'}
              </span>
           </div>

           <textarea 
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Jot down core insights, timestamp references, or notes from this curriculum module..."
              style={{ 
                 width: '100%', 
                 background: 'transparent', 
                 border: 'none', 
                 minHeight: '220px', 
                 outline: 'none', 
                 color: 'inherit', 
                 fontFamily: 'system-ui, sans-serif', 
                 fontSize: '1rem', 
                 lineHeight: '1.6',
                 resize: 'none',
                 backgroundImage: 'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
                 backgroundSize: '100% 28px',
                 paddingTop: '5px'
              }}
           ></textarea>

           <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={saveNote}
                style={{ 
                   background: '#1a1a1a', 
                   color: '#ffe898', 
                   border: 'none', 
                   padding: '10px 20px', 
                   borderRadius: '8px', 
                   fontSize: '0.8rem', 
                   fontWeight: 900, 
                   letterSpacing: '0.5px',
                   cursor: 'pointer',
                   boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                   transition: 'transform 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                 💾 SECURE SAVE NOTE
              </button>
           </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes expandScale {
          from { opacity: 0; transform: translateY(-10px) scaleY(0.8) rotate(0.5deg); }
          to { opacity: 1; transform: translateY(0) scaleY(1) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
}

