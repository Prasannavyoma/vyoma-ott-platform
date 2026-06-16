"use client";

import { useState, useTransition } from 'react';
import { saveTierAction, deleteTierAction } from './actions';

interface ReferralTier {
  id: string;
  referralsRequired: number;
  rewardName: string;
}

interface ReferralTierManagerProps {
  tiers: ReferralTier[];
}

export default function ReferralTierManager({ tiers }: ReferralTierManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [referralsRequired, setReferralsRequired] = useState<number | ''>('');
  const [rewardName, setRewardName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // When user clicks the Edit button
  const handleEditClick = (tier: ReferralTier) => {
    setReferralsRequired(tier.referralsRequired);
    setRewardName(tier.rewardName);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setReferralsRequired('');
    setRewardName('');
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (referralsRequired === '' || !rewardName) return;

    startTransition(async () => {
      await saveTierAction(Number(referralsRequired), rewardName);
      setReferralsRequired('');
      setRewardName('');
      setIsEditing(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this milestone tier?')) return;
    
    startTransition(async () => {
      await deleteTierAction(id);
      // If we deleted the tier currently being edited, reset form
      const deletedTier = tiers.find(t => t.id === id);
      if (deletedTier && deletedTier.referralsRequired === referralsRequired) {
        handleCancel();
      }
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
      
      {/* 1. Add / Edit Form */}
      <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '25px', borderRadius: '20px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{isEditing ? '✏️' : '⚙️'}</span> {isEditing ? 'Edit Milestone Tier' : 'Add Milestone Tier'}
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>REFERRALS REQUIRED</label>
            <input 
              required 
              type="number" 
              value={referralsRequired}
              onChange={(e) => setReferralsRequired(e.target.value !== '' ? parseInt(e.target.value) : '')}
              min="1" 
              disabled={isEditing} // Prevent changing the key unique value when editing
              placeholder="e.g. 50" 
              style={{
                ...inputStyle,
                opacity: isEditing ? 0.6 : 1,
                cursor: isEditing ? 'not-allowed' : 'text'
              }} 
            />
            {isEditing && (
              <span style={{ fontSize: '0.7rem', color: '#888', marginTop: '2px' }}>
                Note: Referrals count cannot be modified during editing. To change the milestone target, please delete this tier and create a new one.
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>REWARD / GIFT NAME</label>
            <input 
              required 
              type="text" 
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              placeholder="e.g. Vyoma Sanskrit Notebook" 
              style={inputStyle} 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={isPending}
              style={{ 
                flex: 1,
                background: 'var(--primary, #f26422)', 
                color: '#fff', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '8px', 
                fontWeight: 900, 
                cursor: isPending ? 'not-allowed' : 'pointer', 
                fontSize: '0.85rem',
                opacity: isPending ? 0.7 : 1
              }}
            >
              {isPending ? 'SAVING...' : isEditing ? '💾 UPDATE REWARD' : '➕ SAVE MILESTONE TIER'}
            </button>
            
            {isEditing && (
              <button 
                type="button" 
                onClick={handleCancel}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  color: '#ccc', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  padding: '12px 20px', 
                  borderRadius: '8px', 
                  fontWeight: 900, 
                  cursor: 'pointer', 
                  fontSize: '0.85rem' 
                }}
              >
                CANCEL
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 2. Active Tiers List */}
      <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '25px', borderRadius: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>🎯 Current Reward Tiers</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tiers.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
              No tiers loaded. Add a tier above to get started.
            </div>
          ) : (
            tiers.map(t => (
              <div 
                key={t.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: '#000', 
                  border: isEditing && referralsRequired === t.referralsRequired ? '1px solid var(--primary, #f26422)' : '1px solid #1c1c24', 
                  padding: '12px 15px', 
                  borderRadius: '10px',
                  transition: 'border 0.2s'
                }}
              >
                <div style={{ flex: 1, paddingRight: '10px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>{t.referralsRequired} Referrals</div>
                  <div style={{ fontSize: '0.75rem', color: '#ff8a50', marginTop: '2px' }}>{t.rewardName}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* Edit Button */}
                  <button 
                    type="button" 
                    onClick={() => handleEditClick(t)}
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: 'none', 
                      color: '#ff8a50', 
                      cursor: 'pointer', 
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }} 
                    title="Edit Tier"
                  >
                    ✏️ Edit
                  </button>
                  
                  {/* Delete Button */}
                  <button 
                    type="button" 
                    onClick={() => handleDelete(t.id)}
                    style={{ 
                      background: 'rgba(255,107,107,0.05)', 
                      border: 'none', 
                      color: '#ff6b6b', 
                      cursor: 'pointer', 
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }} 
                    title="Delete Tier"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#000',
  border: '1px solid #1c1c24',
  color: '#fff',
  padding: '12px 15px',
  borderRadius: '8px',
  outline: 'none',
  fontSize: '0.9rem'
};
