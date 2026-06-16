"use client";

import { useState, useEffect } from 'react';

export default function MeilisearchSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [message, setMessage] = useState('');
  
  const [settings, setSettings] = useState({
    enabled: false,
    host: '',
    apiKey: '',
    connected: false,
    statusMessage: ''
  });

  const fetchSettings = () => {
    fetch('/api/admin/meilisearch')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSettings({
            enabled: data.enabled || false,
            host: data.host || '',
            apiKey: data.apiKey || '',
            connected: data.connected || false,
            statusMessage: data.statusMessage || ''
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/meilisearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        setMessage('✅ Settings saved successfully! Initial indexing started in the background.');
        // Refresh connection state
        setTimeout(fetchSettings, 1500);
      } else {
        setMessage('❌ Failed to save settings.');
      }
    } catch (err) {
      setMessage('❌ An error occurred.');
    }
    setSaving(false);
  };

  const handleReindex = async () => {
    setIndexing(true);
    setMessage('');
    try {
      const res = await fetch('/api/api/admin/meilisearch/reindex', {
        method: 'POST'
      });
      // Fallback in case of router prefix double-handling
      const finalRes = res.status === 404 
        ? await fetch('/api/admin/meilisearch/reindex', { method: 'POST' })
        : res;
        
      const data = await finalRes.json();
      if (finalRes.ok) {
        setMessage('⚡ Content successfully synced and indexed in Meilisearch!');
      } else {
        setMessage(`❌ Indexing failed: ${data.error || 'Check server logs'}`);
      }
    } catch (err) {
      setMessage('❌ Connection timed out during re-indexing.');
    }
    setIndexing(false);
  };

  if (loading) return <div style={{ color: '#fff', padding: '50px' }}>Loading settings...</div>;

  return (
    <div style={{ color: '#fff', maxWidth: '800px', padding: '10px 0' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: '#f26422' }}>🔍</span> Meilisearch Engine Setup
      </h1>
      
      <p style={{ color: '#aaa', marginBottom: '30px', lineHeight: '1.6' }}>
        Configure the credentials for your Meilisearch server. Once enabled, course catalog and curriculum lesson indexing is updated dynamically to support fast searching with advanced typo-tolerance.
      </p>

      {message && (
        <div style={{ 
          padding: '15px', 
          background: message.includes('✅') || message.includes('⚡') ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)', 
          border: message.includes('✅') || message.includes('⚡') ? '1px solid rgba(46, 213, 115, 0.3)' : '1px solid rgba(255, 71, 87, 0.3)', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          color: message.includes('✅') || message.includes('⚡') ? '#2ed573' : '#ff4757',
          fontWeight: 600
        }}>
          {message}
        </div>
      )}

      {/* Connection Status Indicator */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        padding: '20px', 
        borderRadius: '12px', 
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>Meilisearch Status</h3>
          <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>Current operational health state of the configured search instance.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: settings.connected ? '#2ed573' : '#ff4757',
            display: 'inline-block',
            boxShadow: settings.connected ? '0 0 10px #2ed573' : '0 0 10px #ff4757'
          }} />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: settings.connected ? '#2ed573' : '#ff4757' }}>
            {settings.statusMessage}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {/* GLOBAL ENABLE SWITCH */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Enable Search Engine</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Redirect search requests to the Meilisearch server instead of database query matches.</p>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
            <input 
              type="checkbox" 
              checked={settings.enabled} 
              onChange={e => setSettings({...settings, enabled: e.target.checked})}
              style={{ opacity: 0, width: 0, height: 0 }} 
            />
            <span style={{ 
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: settings.enabled ? '#f26422' : '#333', 
              transition: '.4s', borderRadius: '34px' 
            }}>
              <span style={{ 
                position: 'absolute', content: '""', height: '26px', width: '26px', 
                left: settings.enabled ? '30px' : '4px', bottom: '4px', 
                backgroundColor: 'white', transition: '.4s', borderRadius: '50%' 
              }} />
            </span>
          </label>
        </div>

        {/* HOST & KEY CREDENTIALS */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#f26422' }}>Configuration Settings</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Meilisearch Host URL</label>
              <input 
                type="text" 
                value={settings.host}
                onChange={e => setSettings({...settings, host: e.target.value})}
                placeholder="e.g. http://localhost:7700"
                required={settings.enabled}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Private/Search API Key</label>
              <input 
                type="password" 
                value={settings.apiKey}
                onChange={e => setSettings({...settings, apiKey: e.target.value})}
                placeholder="e.g. masterKey123"
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* OPERATIONS CARD */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f26422' }}>Indexing Operations</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>
            Force a manual re-indexing of all courses and episodes from the local database database to the Meilisearch engine index. Use this after populating new courses or importing WP content.
          </p>

          <button
            type="button"
            onClick={handleReindex}
            disabled={indexing || !settings.connected}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: indexing || !settings.connected ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: indexing || !settings.connected ? 0.5 : 1
            }}
          >
            {indexing ? '🔄 Re-indexing Content...' : '🔄 Re-index All Content'}
          </button>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          style={{ 
            padding: '15px 30px', 
            background: 'linear-gradient(135deg, #f26422 0%, #ff8c53 100%)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '30px', 
            fontSize: '1.1rem', 
            fontWeight: 800, 
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            alignSelf: 'flex-start',
            boxShadow: '0 10px 30px rgba(242,100,34,0.3)'
          }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

      </form>
    </div>
  );
}
