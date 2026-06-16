"use client";

import { useState } from 'react';

export default function AvatarUploader({ currentUrl }: { currentUrl?: string }) {
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(currentUrl || '');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if(!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData }).then(r => r.json());
      if(res.success) {
        setUrl(res.url);
      }
    } catch(e) {
      alert("Upload failure.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
         <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#222', backgroundSize: 'cover', backgroundImage: url ? `url(${url})` : 'none', border: '1px solid #444' }}></div>
         <label style={{ background: '#111', border: '1px dashed #444', color: '#aaa', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
           {uploading ? '⏫ Uploading...' : '📷 Upload Local Photo'}
           <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
         </label>
      </div>
      <input type="hidden" name="avatarUrl" value={url} />
    </div>
  );
}
