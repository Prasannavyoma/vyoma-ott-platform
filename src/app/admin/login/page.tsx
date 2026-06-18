"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateAdmin } from '@/app/actions/admin-auth';

export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    try {
      const result = await authenticateAdmin(fd);
      if (result && result.success) {
        // Force hard refresh / router transition to lock session validation
        router.refresh();
        router.push('/admin');
      } else {
        setError(result?.message || "Access Denied. Verification failure.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network anomaly. Verification failed.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #0f1624 0%, #030b17 100%)'
    }}>
      <div className="login-box" style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(15, 22, 36, 0.8)',
        backdropFilter: 'blur(15px)',
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
           <img 
             src="https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png" 
             alt="Vyoma Logo" 
             style={{ height: '50px', objectFit: 'contain', marginBottom: '15px' }} 
           />
           <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.5px' }}>
             Admin Orchestration
           </h2>
           <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
             Secure Mainframe Access
           </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(255,77,79,0.1)', 
            border: '1px solid rgba(255,77,79,0.3)', 
            color: '#ff4d4f', 
            padding: '12px', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            marginBottom: '20px',
            textAlign: 'center',
            fontWeight: 700
          }}>
            🚨 {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#8f98a9', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Administrative Email</label>
            <input 
              name="email"
              type="email" 
              placeholder="Admin Email"
              required 
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: '#030b17', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#fff', fontSize: '0.95rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#8f98a9', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Global Master Key</label>
            <input 
              name="password"
              type="password" 
              placeholder="Master Password"
              required 
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: '#030b17', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#fff', fontSize: '0.95rem'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '10px',
              background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)',
              color: '#fff', padding: '15px', borderRadius: '8px', border: 'none',
              fontWeight: 900, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: '0.2s', boxShadow: '0 10px 25px rgba(242,100,34,0.3)'
            }}
          >
            {loading ? 'AUTHORIZING MAIN FRAME...' : 'INITIATE SECURE LOGIN'}
          </button>
        </form>
        
        <p style={{ marginTop: '25px', textAlign: 'center', color: '#555', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
          Unauthorized tracking enabled. Your IP is logged.
        </p>
      </div>
    </div>
  );
}
