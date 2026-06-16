"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminDeleteUser } from '@/app/actions/users';

interface DeleteUserButtonProps {
  userId: string;
  userEmail: string;
}

export default function DeleteUserButton({ userId, userEmail }: DeleteUserButtonProps) {
  const [stage, setStage] = useState<'idle' | 'confirm'>('idle');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleExecution() {
    if (stage === 'idle') {
      setStage('confirm');
      return;
    }

    // Double stage confirmation satisfied. Execute mutation
    setLoading(true);
    try {
      const result = await adminDeleteUser(userId);
      if (result.success) {
        router.push('/admin/users?deleted=true');
        router.refresh();
      } else {
        alert(`🚨 Deletion Refused: ${result.error}`);
        setLoading(false);
        setStage('idle');
      }
    } catch (err: any) {
      alert(`🚨 System Failure: ${err.message || "Server refusal."}`);
      setLoading(false);
      setStage('idle');
    }
  }

  return (
    <div style={{ marginTop: '10px' }}>
      
      {stage === 'confirm' && (
        <div style={{ 
          background: 'rgba(255,77,79,0.08)', 
          border: '1px dashed #ff4d4f', 
          padding: '12px', 
          borderRadius: '8px', 
          fontSize: '0.75rem', 
          color: '#ff4d4f',
          marginBottom: '10px',
          lineHeight: '1.4'
        }}>
          <strong>⚠️ CRITICAL IRREVERSIBLE ACTION</strong>
          <p style={{ marginTop: '4px', opacity: 0.8 }}>Erasing <strong>{userEmail}</strong> permanently destroys their purchases, certificates, progress, and authentication credentials. This cannot be undone.</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          type="button"
          disabled={loading}
          onClick={handleExecution}
          style={{
            flex: 1,
            background: stage === 'confirm' ? '#ff4d4f' : 'rgba(255,77,79,0.1)',
            color: stage === 'confirm' ? '#fff' : '#ff4d4f',
            border: stage === 'confirm' ? 'none' : '1px solid rgba(255,77,79,0.3)',
            padding: '12px',
            borderRadius: '8px',
            fontWeight: 900,
            fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: stage === 'confirm' ? '0 4px 15px rgba(255,77,79,0.3)' : 'none',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {loading ? '🔥 WIPING RECORD...' : (stage === 'confirm' ? '💥 CLICK TO PERMANENTLY ERASE' : '🛑 TERMINATE PROFILE')}
        </button>

        {stage === 'confirm' && !loading && (
          <button 
            type="button"
            onClick={() => setStage('idle')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '0 15px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>

    </div>
  );
}
