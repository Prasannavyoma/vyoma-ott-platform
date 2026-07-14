"use client";

import { useState } from 'react';
import { createBlogPost, updateBlogPost, deleteBlogPost, toggleBlogPublish } from '@/app/actions/blogs';
import Link from 'next/link';

export default function BlogsClient({ blogs }: { blogs: any[] }) {
  const [loading, setLoading] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);

  async function handleTogglePublish(id: string, published: boolean) {
    setLoading(true);
    try {
      await toggleBlogPublish(id, !published);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if(!confirm('Delete this blog post permanently?')) return;
    setLoading(true);
    try {
      await deleteBlogPost(id);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      if (editingBlog?.id) {
        await updateBlogPost(editingBlog.id, fd);
      } else {
        await createBlogPost(fd);
      }
      setEditingBlog(null);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditingBlog({ title: '', slug: '', author: 'Admin', excerpt: '', content: '', published: false });
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={editingBlog ? () => setEditingBlog(null) : handleAdd} className="btn btn-primary" style={{ padding: '8px 16px', fontWeight: 'bold' }}>
          {editingBlog ? 'Cancel Editing' : '+ Write New Blog'}
        </button>
      </div>

      {editingBlog && (
        <form onSubmit={handleSave} style={{ background: '#111', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #333' }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px' }}>{editingBlog.id ? 'Edit Blog' : 'New Blog'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input name="title" defaultValue={editingBlog.title} placeholder="Blog Title" required className="form-input" style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
            <input name="slug" defaultValue={editingBlog.slug} placeholder="URL Slug (e.g. my-first-blog)" required className="form-input" style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <input name="author" defaultValue={editingBlog.author} placeholder="Author" required className="form-input" style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
            <input name="thumbnailUrl" defaultValue={editingBlog.thumbnailUrl} placeholder="Thumbnail URL (Optional)" className="form-input" style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px' }} />
          </div>
          <textarea name="excerpt" defaultValue={editingBlog.excerpt} placeholder="Short Excerpt (shows on listing page)..." required rows={2} style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px', marginBottom: '15px' }} />
          <textarea name="content" defaultValue={editingBlog.content} placeholder="Full HTML Content..." required rows={10} style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '6px', marginBottom: '15px', fontFamily: 'monospace' }} />
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" name="published" value="true" defaultChecked={editingBlog.published} style={{ width: '18px', height: '18px' }} />
              Publish Immediately
            </label>
            <button type="submit" disabled={loading} style={{ marginLeft: 'auto', padding: '8px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : 'Save Blog Post'}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        {blogs.length === 0 && <p style={{ color: '#666' }}>No blog posts found.</p>}
        {blogs.map(b => (
          <div key={b.id} style={{ 
            background: 'linear-gradient(to right, #0f1624, #070b14)', 
            border: b.published ? '1px solid rgba(70, 211, 105, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px', 
            borderRadius: '12px',
            display: 'flex',
            gap: '20px'
          }}>
            {b.thumbnailUrl && (
              <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
                <img src={b.thumbnailUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1.2rem' }}>{b.title}</strong>
                <span style={{ color: '#888', fontSize: '0.9rem' }}>by {b.author}</span>
                <span style={{ 
                  marginLeft: 'auto', 
                  fontSize: '0.75rem', 
                  padding: '3px 8px', 
                  borderRadius: '10px',
                  background: b.published ? 'rgba(70,211,105,0.1)' : 'rgba(255,255,255,0.05)',
                  color: b.published ? '#46d369' : '#888',
                  fontWeight: 'bold'
                }}>
                  {b.published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>
              <p style={{ color: '#ccc', margin: '0 0 10px 0', fontSize: '0.95rem' }}>{b.excerpt}</p>
              <div style={{ color: '#555', fontSize: '0.75rem', display: 'flex', gap: '15px' }}>
                <span>Slug: /{b.slug}</span>
                <span>Created: {new Date(b.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
              <button onClick={() => setEditingBlog(b)} disabled={loading} style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                ✏ Edit
              </button>
              <button onClick={() => handleTogglePublish(b.id, b.published)} disabled={loading} style={{ padding: '6px', background: b.published ? 'rgba(255,193,7,0.1)' : 'rgba(70,211,105,0.1)', color: b.published ? '#ffc107' : '#46d369', border: `1px solid ${b.published ? 'rgba(255,193,7,0.3)' : 'rgba(70,211,105,0.3)'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {b.published ? 'Unpublish' : 'Publish'}
              </button>
              <Link href={`/blog/${b.slug}`} target="_blank" style={{ padding: '6px', background: 'rgba(0,123,255,0.1)', color: '#0d6efd', border: '1px solid rgba(0,123,255,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>
                👁 View Live
              </Link>
              <button onClick={() => handleDelete(b.id)} disabled={loading} style={{ padding: '6px', background: 'rgba(255,77,79,0.1)', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', marginTop: 'auto' }}>
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
