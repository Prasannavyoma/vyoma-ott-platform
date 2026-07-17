"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Bookmark, Download, Cloud } from 'lucide-react';

interface Bookmark {
  id: string;
  time: number;
  text: string;
}

interface WatchNotesManagerProps {
  courseId: string;
  initialNote?: string;
}

export default function WatchNotesManager({ courseId, initialNote }: { courseId: string, initialNote?: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks'>('notes');
  const [note, setNote] = useState(initialNote || '');
  const [saving, setSaving] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);
  
  // Real-time video time synchronization
  const [videoTime, setVideoTime] = useState<number>(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newBookmarkText, setNewBookmarkText] = useState('');

  // 1. Load notes backup and bookmarks from LocalStorage
  useEffect(() => {
    try {
      const localDraft = localStorage.getItem(`note_backup_${courseId}`);
      if (localDraft && localDraft !== initialNote && localDraft.trim().length > 0) {
        setNote(localDraft);
        setSavedTime("🔄 Recovered Draft");
      } else {
        setNote(initialNote || '');
      }

      const savedBookmarks = localStorage.getItem(`bookmarks_${courseId}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      } else {
        setBookmarks([]);
      }
    } catch (e) {}
  }, [courseId, initialNote]);

  // 2. Synchronize current playback time from AdaptivePlayer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleTimeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (typeof customEvent.detail?.time === 'number') {
        setVideoTime(customEvent.detail.time);
      }
    };
    window.addEventListener('video-time-update', handleTimeUpdate);
    return () => window.removeEventListener('video-time-update', handleTimeUpdate);
  }, []);

  // Save text note to DB & LocalStorage
  async function saveNote() {
    setSaving(true);
    setSavedTime(null);
    try {
      localStorage.setItem(`note_backup_${courseId}`, note);

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, content: note })
      });
      
      if (!res.ok) throw new Error("HTTP_ERROR");

      setSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      router.refresh();
    } catch (e) {
      console.error("Error saving note:", e);
      setSavedTime("⚠️ SAVE FAILED");
    } finally {
      setSaving(false);
    }
  }

  function handleNoteChange(val: string) {
    setNote(val);
    try {
      localStorage.setItem(`note_backup_${courseId}`, val);
    } catch (e) {}
  }

  // Manage Bookmarks
  const addBookmark = () => {
    const text = newBookmarkText.trim() || `Bookmark at ${formatTime(videoTime)}`;
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      time: Math.floor(videoTime),
      text
    };
    const updated = [...bookmarks, newBookmark].sort((a, b) => a.time - b.time);
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${courseId}`, JSON.stringify(updated));
    setNewBookmarkText('');
  };

  const deleteBookmark = (id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${courseId}`, JSON.stringify(updated));
  };

  const seekToBookmark = (time: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('video-seek-request', { detail: { time } }));
    }
  };

  // Exporter to download styled Markdown Study Cheat Sheet
  const exportStudyGuide = () => {
    const header = `# Vyoma Sanskrit Study Guide & Notes\nCourse Reference: ${courseId.toUpperCase()}\nExported: ${new Date().toLocaleDateString()}\n\n`;
    const notesSection = `## 📝 General Study Notes\n${note.trim() || "*No notes recorded yet.*"}\n\n`;
    
    let bookmarksSection = `## 🔖 Timestamped Lesson Bookmarks\n`;
    if (bookmarks.length === 0) {
      bookmarksSection += `*No bookmarks saved for this course.*`;
    } else {
      bookmarks.forEach(b => {
        bookmarksSection += `- **[${formatTime(b.time)}]**: ${b.text}\n`;
      });
    }

    const fullMarkdown = `${header}${notesSection}${bookmarksSection}`;
    
    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sanskrit_Study_Guide_${courseId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to format seconds
  const formatTime = (timeInSeconds: number) => {
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      background: 'rgba(11, 18, 30, 0.65)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      padding: '25px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      width: '100%',
      marginBottom: '30px'
    }}>
      {/* Tab Switcher Headers */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', marginBottom: '20px', gap: '15px' }}>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'notes' ? '#f26422' : '#8f98a9',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '4px 8px',
            borderBottom: activeTab === 'notes' ? '2px solid #f26422' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <FileText size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Study Notes
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'bookmarks' ? '#f26422' : '#8f98a9',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '4px 8px',
            borderBottom: activeTab === 'bookmarks' ? '2px solid #f26422' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Bookmark size={16} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Video Bookmarks ({bookmarks.length})
        </button>

        <button 
          onClick={exportStudyGuide}
          disabled={!note.trim() && bookmarks.length === 0}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: (!note.trim() && bookmarks.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (!note.trim() && bookmarks.length === 0) ? 0.5 : 1
          }}
          title="Export everything to Markdown file"
        >
          <Download size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Export guide
        </button>
      </div>

      {/* TAB CONTENT: NOTES */}
      {activeTab === 'notes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: '#8f98a9', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Notebook desk
            </span>
            <span style={{ fontSize: '0.7rem', color: '#f26422', fontWeight: 'bold' }}>
              {saving ? 'Syncing...' : savedTime ? `Synced: ${savedTime}` : 'Autosaved locally'}
            </span>
          </div>

          <textarea
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Jot down notes, grammar formulas, or shloka highlights from this class module here..."
            style={{
              width: '100%',
              minHeight: '200px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              color: '#fff',
              padding: '15px',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              outline: 'none',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
            <button
              onClick={saveNote}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
                color: '#fff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(242,100,34,0.3)'
              }}
            >
              <Cloud size={14} style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px' }} /> Cloud Sync
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <div>
          {/* Add Bookmark form */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              color: '#ffd700',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center'
            }}>
              {formatTime(videoTime)}
            </div>
            
            <input
              type="text"
              value={newBookmarkText}
              onChange={(e) => setNewBookmarkText(e.target.value)}
              placeholder="Tag this moment (e.g. Word Meanings start)..."
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                color: '#fff',
                padding: '8px 14px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            
            <button
              onClick={addBookmark}
              style={{
                background: '#ffd700',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '0 16px',
                fontWeight: 950,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(255,215,0,0.2)'
              }}
            >
              + Tag
            </button>
          </div>

          {/* Bookmarks list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '5px' }}>
            {bookmarks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', padding: '20px' }}>
                <span style={{ display: 'block', marginBottom: '8px', opacity: 0.5 }}><Bookmark size={32} /></span>
                <p style={{ margin: 0, fontSize: '0.8rem' }}>No bookmarks saved. Type above and click "+ Tag" to save timestamp bookmarks.</p>
              </div>
            ) : (
              bookmarks.map(b => (
                <div 
                  key={b.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <button
                    onClick={() => seekToBookmark(b.time)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ color: '#ffd700', fontFamily: 'monospace', fontWeight: 800 }}>[{formatTime(b.time)}]</span>
                    <span style={{ opacity: 0.9 }}>{b.text}</span>
                  </button>

                  <button
                    onClick={() => deleteBookmark(b.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ff4444',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: '4px'
                    }}
                    title="Delete bookmark"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
