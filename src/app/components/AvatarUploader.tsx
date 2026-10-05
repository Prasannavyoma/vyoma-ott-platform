"use client";

import { useState } from 'react';

export default function AvatarUploader({ currentUrl }: { currentUrl?: string }) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentUrl || '');
  const [inputMode, setInputMode] = useState<'FILE' | 'URL'>('FILE');

  // Compress image on client-side canvas before uploading
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400; // 400x400 max avatar dimension
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => resolve(blob || file),
              'image/jpeg',
              0.85
            );
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedBlob, file.name || 'avatar.jpg');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      }).then((r) => r.json());

      if (res.success && res.url) {
        setUrl(res.url);
      } else {
        alert(res.error || 'Upload failed. Please try again.');
      }
    } catch (e: any) {
      console.error('Avatar upload error:', e);
      alert('Upload error: ' + (e.message || 'Failed to upload photo.'));
    } finally {
      setUploading(false);
    }
  }

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  return (
    <div style={{ background: '#000', border: '1px solid #222', borderRadius: '12px', padding: '15px' }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Avatar Live Preview */}
        <div style={{ position: 'relative' }}>
          <img 
            src={url || defaultAvatar} 
            alt="Personal Identity Photo" 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              border: '2px solid var(--primary, #f26422)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              background: '#111'
            }} 
          />
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={() => setInputMode('FILE')}
              style={{
                background: inputMode === 'FILE' ? 'rgba(242,100,34,0.2)' : 'transparent',
                border: inputMode === 'FILE' ? '1px solid #f26422' : '1px solid #333',
                color: inputMode === 'FILE' ? '#f26422' : '#aaa',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📷 Upload Photo File
            </button>
            <button
              type="button"
              onClick={() => setInputMode('URL')}
              style={{
                background: inputMode === 'URL' ? 'rgba(242,100,34,0.2)' : 'transparent',
                border: inputMode === 'URL' ? '1px solid #f26422' : '1px solid #333',
                color: inputMode === 'URL' ? '#f26422' : '#aaa',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔗 Paste Image Link
            </button>
          </div>

          {inputMode === 'FILE' ? (
            <label style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: '#111', 
              border: '1px dashed #444', 
              color: '#fff', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: uploading ? 'wait' : 'pointer', 
              fontSize: '0.8rem',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}>
              {uploading ? '⏫ Compressing & Uploading...' : '📷 Select Local Photo File'}
              <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} style={{ display: 'none' }} />
            </label>
          ) : (
            <input 
              type="url" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste direct HTTPS image URL..."
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #333',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          )}
        </div>
      </div>

      {/* Hidden input passed into FormData when user submits profile form */}
      <input type="hidden" name="avatarUrl" value={url} />
    </div>
  );
}
