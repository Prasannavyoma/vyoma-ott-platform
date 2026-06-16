'use client';

import React, { useState, useEffect } from 'react';
import { getSanskritSettings, updateSanskritSettings } from '@/app/actions/sanskrit-settings';
import Link from 'next/link';

export default function SanskritSettingsPage() {
  const [hubEnabled, setHubEnabled] = useState(true);
  const [subhashitaEnabled, setSubhashitaEnabled] = useState(true);
  const [grammarEnabled, setGrammarEnabled] = useState(true);
  const [memorizerEnabled, setMemorizerEnabled] = useState(true);
  const [coachEnabled, setCoachEnabled] = useState(true);
  const [coachThreshold, setCoachThreshold] = useState(75);
  const [sanskritGeminiKey, setSanskritGeminiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // States
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getSanskritSettings();
        setHubEnabled(data.hubEnabled);
        setSubhashitaEnabled(data.subhashitaEnabled);
        setGrammarEnabled(data.grammarEnabled);
        setMemorizerEnabled(data.memorizerEnabled);
        setCoachEnabled(data.coachEnabled);
        setCoachThreshold(data.coachThreshold);
        setSanskritGeminiKey(data.sanskritGeminiKey);
        setIsSuperAdmin(true);
      } catch (err: any) {
        console.error(err);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await updateSanskritSettings({
        hubEnabled,
        subhashitaEnabled,
        grammarEnabled,
        memorizerEnabled,
        coachEnabled,
        coachThreshold,
        sanskritGeminiKey
      });
      setMessage({ type: 'success', text: 'Sanskrit Hub settings saved successfully!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(242, 100, 34, 0.1)', borderTopColor: '#f26422', borderRadius: '50%', animation: 'sanskritSpin 1s linear infinite', margin: '0 auto 15px' }} />
          <span>Verifying Authorization & Loading Settings...</span>
        </div>
        <style jsx>{`
          @keyframes sanskritSpin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '40px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '20px', textAlign: 'center', color: '#fff' }}>
        <span style={{ fontSize: '3rem' }}>🚫</span>
        <h2 style={{ color: '#ef4444', marginTop: '20px', fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
        <p style={{ color: '#94a3b8', margin: '15px 0 30px', fontSize: '0.95rem', lineHeight: 1.6 }}>
          This administrative configuration panel is strictly reserved for **SUPER_ADMIN** roles. General admins and managers are unauthorized to view or modify Sanskrit configurations.
        </p>
        <Link href="/admin" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, display: 'inline-block', transition: 'all 0.2s' }}>
          Return to Overview
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', fontFamily: 'var(--font-geist-sans), sans-serif', color: '#fff' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(242, 100, 34, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '1px solid rgba(242, 100, 34, 0.2)' }}>
          🌸
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>Sanskrit Practice Hub Settings</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>Super Admin configurations for toggles, individual practice features, and Speech Recitation Coach settings.</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: '12px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
            color: message.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: 600
          }}>
            {message.type === 'success' ? '✅ ' : '⚠️ '} {message.text}
          </div>
        )}

        {/* Global Hub Switch */}
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 700 }}>Enable Sanskrit Practice Hub</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Globally turn on/off all Sanskrit learning widgets and tools on the frontend.</p>
          </div>
          
          <label className="admin-switch">
            <input
              type="checkbox"
              checked={hubEnabled}
              onChange={(e) => setHubEnabled(e.target.checked)}
            />
            <span className="admin-switch-slider" />
          </label>
        </div>

        {/* Feature Specific Toggles */}
        <div className="admin-card" style={{
          opacity: hubEnabled ? 1 : 0.5,
          pointerEvents: hubEnabled ? 'auto' : 'none',
          display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#ff8c00', fontWeight: 700 }}>Individual Tool Toggles</h3>
          
          {/* Subhashita Toggle */}
          <div className="admin-switch-container">
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem' }}>1. Daily Subhashita Widget</label>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Enables the daily inspirational quotes banner on the home screen.</span>
              <div style={{ marginTop: '8px' }}>
                <Link 
                  href="/admin/sanskrit-settings/subhashitas"
                  style={{
                    fontSize: '0.82rem',
                    color: '#ff8c00',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255,140,0,0.08)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,140,0,0.15)',
                    transition: 'all 0.2s'
                  }}
                >
                  🪔 Manage & Upload Slokas Library →
                </Link>
              </div>
            </div>
            <label className="admin-switch">
              <input
                type="checkbox"
                checked={subhashitaEnabled}
                onChange={(e) => setSubhashitaEnabled(e.target.checked)}
              />
              <span className="admin-switch-slider" />
            </label>
          </div>

          {/* Grammar Analyzer Toggle */}
          <div className="admin-switch-container">
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem' }}>2. AI Grammar & Sandhi Analyzer</label>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Enables the case breakdowns and word splits search engine page.</span>
            </div>
            <label className="admin-switch">
              <input
                type="checkbox"
                checked={grammarEnabled}
                onChange={(e) => setGrammarEnabled(e.target.checked)}
              />
              <span className="admin-switch-slider" />
            </label>
          </div>

          {/* Shloka Memorizer Toggle */}
          <div className="admin-switch-container">
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem' }}>3. Shloka Memorizer Game</label>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Enables the click-to-assemble shuffled word block game page.</span>
            </div>
            <label className="admin-switch">
              <input
                type="checkbox"
                checked={memorizerEnabled}
                onChange={(e) => setMemorizerEnabled(e.target.checked)}
              />
              <span className="admin-switch-slider" />
            </label>
          </div>

          {/* Speech Recitation Coach Toggle */}
          <div className="admin-switch-container">
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.92rem' }}>4. Speech Recitation Coach</label>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Enables real-time pronunciation evaluation using browser Speech Recognition.</span>
            </div>
            <label className="admin-switch">
              <input
                type="checkbox"
                checked={coachEnabled}
                onChange={(e) => setCoachEnabled(e.target.checked)}
              />
              <span className="admin-switch-slider" />
            </label>
          </div>
        </div>

        {/* Coach Settings & Custom API Key */}
        <div className="admin-card" style={{
          opacity: hubEnabled ? 1 : 0.5,
          pointerEvents: hubEnabled ? 'auto' : 'none',
          display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#ff8c00', fontWeight: 700 }}>Advanced Settings</h3>

          {/* Coach Threshold Input */}
          {coachEnabled && (
            <div className="admin-form-group">
              <label>Speech Recitation Coach Passing Score (%)</label>
              <span className="description">
                Set the target pronunciation correctness match percentage required for a successful attempt.
              </span>
              <input
                type="number"
                min="30"
                max="100"
                value={coachThreshold}
                onChange={(e) => setCoachThreshold(Math.max(30, Math.min(100, parseInt(e.target.value, 10) || 75)))}
                style={{ width: '200px' }}
              />
            </div>
          )}

          {/* Custom Gemini key */}
          <div className="admin-form-group">
            <label>Sanskrit Hub Gemini API Key (Optional)</label>
            <span className="description">
              Specify a separate Google Gemini API Key for the Sanskrit analyzer features. If left blank, it will automatically fall back to the main chatbot settings API key.
            </span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={sanskritGeminiKey}
                onChange={(e) => setSanskritGeminiKey(e.target.value)}
                placeholder="Fallback to Main Chatbot API Key..."
                style={{
                  paddingRight: '45px',
                  letterSpacing: (showKey || !sanskritGeminiKey) ? 'normal' : '4px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                {showKey ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '20px' }}>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              padding: '12px 30px', borderRadius: '12px', cursor: isSaving ? 'default' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}
          >
            {isSaving ? 'Saving Configurations...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
