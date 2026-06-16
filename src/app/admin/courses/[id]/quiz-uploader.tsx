"use client";

import { useState } from 'react';
import { bulkUploadQuizCSV } from '../actions';

interface Episode {
  id: string;
  title: string;
  order: number;
}

export default function QuizUploader({ 
  episodes,
  courseId 
}: { 
  episodes: Episode[];
  courseId: string;
}) {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(episodes[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEpisodeId) {
      setStatus({ type: 'error', message: 'Please select an episode.' });
      return;
    }
    if (!file) {
      setStatus({ type: 'error', message: 'Please choose a CSV file to upload.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Parsing and inserting quiz markers...' });

    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const res = await bulkUploadQuizCSV(selectedEpisodeId, formData);
      if (res.error) {
        setStatus({ type: 'error', message: res.error });
      } else {
        setStatus({ 
          type: 'success', 
          message: `Successfully uploaded and configured ${res.count} Video Quiz markers!` 
        });
        setFile(null);
        // Clear input value
        const fileInput = document.getElementById('quiz-csv-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'An error occurred during upload.' });
    }
  };

  return (
    <div style={{ 
      marginTop: '25px', 
      background: 'var(--card-bg, #111)', 
      padding: '25px', 
      borderRadius: '12px', 
      border: '1px solid rgba(255,255,255,0.05)' 
    }}>
      <h3 style={{ 
        marginBottom: '15px', 
        fontSize: '1.1rem', 
        fontWeight: 800, 
        color: '#fff', 
        borderBottom: '1px solid #222', 
        paddingBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📝</span> Bulk Upload Video Quiz Markers (.csv)
      </h3>

      <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '20px', lineHeight: '1.4' }}>
        Instantly configure or overwrite interactive quiz popups inside the video timeline for any selected module.
      </p>

      {episodes.length === 0 ? (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#555', 
          border: '1px dashed #333', 
          borderRadius: '8px',
          fontSize: '0.85rem' 
        }}>
          Please add sequence modules / episodes to this course first before uploading quiz markers.
        </div>
      ) : (
        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
              Select Episode / Module
            </label>
            <select 
              value={selectedEpisodeId}
              onChange={(e) => setSelectedEpisodeId(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                background: '#000', 
                border: '1px solid #333', 
                borderRadius: '6px', 
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              {episodes.map(ep => (
                <option key={ep.id} value={ep.id}>
                  Unit {ep.order}: {ep.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
              Quiz Markers CSV File
            </label>
            <input 
              id="quiz-csv-file-input"
              type="file" 
              accept=".csv"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ 
                width: '100%', 
                padding: '8px 10px', 
                background: '#000', 
                border: '1px solid #333', 
                borderRadius: '6px', 
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Download Template & Action Controls */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <a 
              href="/quiz_template.csv" 
              download="quiz_template.csv"
              style={{ 
                flex: 1,
                padding: '12px', 
                background: 'rgba(255,255,255,0.03)', 
                color: '#aaa', 
                textAlign: 'center', 
                borderRadius: '6px', 
                fontWeight: 700, 
                textDecoration: 'none', 
                fontSize: '0.8rem',
                border: '1px solid #222',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.color = '#aaa';
              }}
            >
              📥 DOWNLOAD TEMPLATE (.CSV)
            </a>

            <button 
              type="submit" 
              disabled={status.type === 'loading'}
              style={{ 
                flex: 1.2,
                padding: '12px', 
                background: status.type === 'loading' ? '#444' : 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px', 
                fontWeight: 900, 
                cursor: status.type === 'loading' ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                boxShadow: '0 4px 15px rgba(242,100,34,0.15)'
              }}
            >
              {status.type === 'loading' ? 'PROCESSING...' : '🚀 BULK CREATE QUIZ'}
            </button>
          </div>

          {/* Alert Status */}
          {status.message && (
            <div style={{ 
              padding: '12px 15px', 
              borderRadius: '6px', 
              fontSize: '0.8rem', 
              fontWeight: 700,
              border: '1px solid',
              marginTop: '5px',
              color: status.type === 'success' ? '#46d369' : status.type === 'error' ? '#ff4d4f' : '#389e0d',
              background: status.type === 'success' ? 'rgba(70,211,105,0.05)' : status.type === 'error' ? 'rgba(255,77,79,0.05)' : 'rgba(0,0,0,0.2)',
              borderColor: status.type === 'success' ? 'rgba(70,211,105,0.2)' : status.type === 'error' ? 'rgba(255,77,79,0.2)' : '#222'
            }}>
              {status.type === 'success' ? '✓ ' : status.type === 'error' ? '✕ ' : '⏳ '}
              {status.message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
