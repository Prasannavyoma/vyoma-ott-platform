"use client";
import { useState } from 'react';
import { bulkCreateCourses } from '../courses/actions';

export default function BulkUploader() {
  const [uploading, setUploading] = useState(false);
  const [csvSample] = useState(`title,description,category,accessLevel,price,thumbnailUrl,videoUrl
Sample Course,Full summary,Grammar Simplified,PLATINUM,0,https://img.jpg,https://vid.mp4`);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Fast native CSV parser implementation
      const rows = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const header = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const data = rows.slice(1).map(row => {
        const cols = row.split(',').map(c => c.trim().replace(/"/g, ''));
        const obj: any = {};
        header.forEach((key, i) => {
          obj[key] = cols[i] || "";
        });
        return obj;
      });

      console.log("Parsed Data Ready for Upload:", data);
      const res = await bulkCreateCourses(data);
      
      setUploading(false);
      if (res.success) {
         alert(`🚀 SUCCESS! ${res.count} new courses imported instantly into the system!`);
         window.location.reload();
      } else {
         alert(`❌ Failed: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed #444', padding: '25px', borderRadius: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '5px' }}>📊 Bulk Sheet Ingest</h3>
          <p style={{ fontSize: '0.85rem', color: '#888' }}>Instantly reads Title, Desc, Plan levels and media strings.</p>
        </div>
        <div style={{ fontSize: '0.75rem', background: '#111', border: '1px solid #222', padding: '8px', borderRadius: '4px' }}>
          <strong>Expects Header Keys:</strong><br/>
          <code>title,description,category,accessLevel,price,thumbnailUrl,videoUrl</code>
        </div>
      </div>

      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileUpload} 
        disabled={uploading}
        style={{ width: '100%', padding: '20px', border: '2px dashed var(--primary)', textAlign: 'center', background: 'rgba(242,100,34,0.05)', borderRadius: '6px', cursor: uploading ? 'wait' : 'pointer', color: '#f26422', fontWeight: 700 }}
      />
      {uploading && <div style={{ marginTop: '10px', color: 'var(--primary)', fontWeight: 'bold' }}>⏱ Parsing & Synchronizing DB...</div>}
    </div>
  );
}
