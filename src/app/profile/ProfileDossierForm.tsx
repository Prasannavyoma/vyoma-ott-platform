"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AvatarUploader from '@/app/components/AvatarUploader';

interface ProfileDossierFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    gender: string | null;
    age: number | null;
    interests: string | null;
    avatarUrl: string | null;
    nameRewardGiven: boolean;
    profileRewardGiven: boolean;
  };
  uiCoinsNameReward: number;
  uiCoinsProfileReward: number;
  updateProfile: (fd: FormData) => Promise<void>;
}

export default function ProfileDossierForm({
  user,
  uiCoinsNameReward,
  uiCoinsProfileReward,
  updateProfile
}: ProfileDossierFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMsg(null);

    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        await updateProfile(formData);
        router.refresh();
        setStatusMsg({ type: 'success', text: '🎉 Profile modifications saved successfully!' });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 4000);
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: err?.message || 'Failed to save modifications. Please try again.' });
      }
    });
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', color: '#666', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px', borderRadius: '8px', outline: 'none'
  };

  return (
    <div id="dossier" style={{ background: '#0d0d0d', borderRadius: '20px', border: '1px solid #1a1a1a', overflow: 'hidden' }}>
      <div style={{ borderBottom: '1px solid #1a1a1a', padding: '20px 30px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>⚙️ Personal Dossier Settings</h3>
        {statusMsg && statusMsg.type === 'success' && (
          <span style={{ color: '#46d369', fontSize: '0.85rem', fontWeight: 800, background: 'rgba(70, 211, 105, 0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(70, 211, 105, 0.3)' }}>
            ✅ Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {statusMsg && (
          <div style={{
            gridColumn: 'span 2',
            background: statusMsg.type === 'success' ? 'rgba(70, 211, 105, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(70, 211, 105, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            color: statusMsg.type === 'success' ? '#46d369' : '#ef4444',
            padding: '14px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: statusMsg.type === 'success' ? '0 4px 20px rgba(70, 211, 105, 0.15)' : 'none'
          }}>
            <span>{statusMsg.text}</span>
            <button 
              type="button" 
              onClick={() => setStatusMsg(null)} 
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 900, padding: '0 5px' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ gridColumn: 'span 2', background: 'rgba(242, 100, 34, 0.05)', border: '1px solid rgba(242, 100, 34, 0.15)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏆</span>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Profile Gamification Quests</strong>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.8rem', marginTop: '5px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: '#aaa' }}>✏️ Add Display Name</span>
              <strong style={{ color: user.nameRewardGiven ? '#46d369' : '#ffd700' }}>
                {user.nameRewardGiven ? `✅ Earned +${uiCoinsNameReward}` : `💰 +${uiCoinsNameReward} Coin`}
              </strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: '#aaa' }}>📋 Complete Full Profile</span>
              <strong style={{ color: user.profileRewardGiven ? '#46d369' : '#ffd700' }}>
                {user.profileRewardGiven ? `✅ Earned +${uiCoinsProfileReward}` : `💰 +${uiCoinsProfileReward} Coins`}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Personal Identity Photo</label>
          <AvatarUploader currentUrl={user.avatarUrl || ''} />
        </div>

        <div>
          <label style={labelStyle}>Display Name</label>
          <input required type="text" name="name" defaultValue={user.name || ''} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Phone / Mobile Number</label>
          <input 
            type="tel" 
            name="phone" 
            defaultValue={user.phone || ''} 
            placeholder="e.g. +91 9876543210" 
            pattern="^[\+]?[0-9\s\-\(\)]{10,18}$"
            title="Please enter a valid 10-15 digit mobile number (e.g. +91 9876543210 or 9876543210)"
            style={inputStyle} 
          />
          <span style={{ color: '#777', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>
            Must be 10–15 digits with optional country code (+91) for WhatsApp updates.
          </span>
        </div>

        <div>
          <label style={labelStyle}>Geographic Address</label>
          <input type="text" name="address" defaultValue={user.address || ''} placeholder="City, State" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Gender Identity</label>
          <select name="gender" defaultValue={user.gender || ''} style={inputStyle}>
            <option value="">Select...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Current Age <span style={{ color: '#f26422' }}>*</span></label>
          <input required type="number" name="age" defaultValue={user.age || ''} min="1" max="120" style={inputStyle} />
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Personal Interests / Focus Areas</label>
          <textarea name="interests" defaultValue={user.interests || ''} rows={2} placeholder="Veda, Sanskrit Grammar, Historical Epics..." style={{ ...inputStyle, fontFamily: 'inherit', resize: 'none' }}></textarea>
        </div>

        <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px' }}>
          <input type="checkbox" id="consent" name="consent" required style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px', accentColor: '#f26422' }} />
          <label htmlFor="consent" style={{ color: '#999', fontSize: '0.85rem', cursor: 'pointer', lineHeight: '1.4' }}>
            I consent to saving my profile information and acknowledge that my details will be stored securely in accordance with the platform's terms of service and privacy policy.
          </label>
        </div>

        <div style={{ gridColumn: 'span 2', borderTop: '1px solid #1a1a1a', paddingTop: '20px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px' }}>
          {justSaved && (
            <span style={{ color: '#46d369', fontWeight: 800, fontSize: '0.85rem' }}>
              ✅ Saved Successfully!
            </span>
          )}
          <button 
            type="submit" 
            disabled={isPending}
            style={{ 
              background: isPending ? '#333' : justSaved ? '#46d369' : '#fff', 
              color: isPending || justSaved ? '#fff' : '#000', 
              padding: '12px 30px', 
              borderRadius: '8px', 
              fontWeight: 900, 
              border: 'none', 
              cursor: isPending ? 'not-allowed' : 'pointer', 
              transition: 'all 0.3s ease', 
              boxShadow: justSaved ? '0 4px 15px rgba(70,211,105,0.4)' : '0 4px 15px rgba(255,255,255,0.1)'
            }}
          >
            {isPending ? '⏳ SAVING MODIFICATIONS...' : justSaved ? '✅ SAVED SUCCESSFULLY!' : 'SAVE PROFILE MODIFICATIONS'}
          </button>
        </div>
      </form>
    </div>
  );
}
