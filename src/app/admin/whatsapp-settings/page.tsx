"use client";

import { useState, useEffect } from 'react';

export default function WhatsAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [settings, setSettings] = useState({
    enabled: false,
    phoneId: '',
    accessToken: '',
    templates: {
      newCourse: '',
      certificate: '',
      subscription: '',
      progress: '',
      resume: '',
      referral: '',
      discount: ''
    }
  });

  useEffect(() => {
    fetch('/api/admin/whatsapp')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSettings({
            enabled: data.enabled || false,
            phoneId: data.phoneId || '',
            accessToken: data.accessToken || '',
            templates: {
              newCourse: data.templates?.newCourse || '',
              certificate: data.templates?.certificate || '',
              subscription: data.templates?.subscription || '',
              progress: data.templates?.progress || '',
              resume: data.templates?.resume || '',
              referral: data.templates?.referral || '',
              discount: data.templates?.discount || ''
            }
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        setMessage('✅ Settings saved successfully!');
      } else {
        setMessage('❌ Failed to save settings.');
      }
    } catch (err) {
      setMessage('❌ An error occurred.');
    }
    setSaving(false);
  };

  if (loading) return <div style={{ color: '#fff', padding: '50px' }}>Loading settings...</div>;

  return (
    <div style={{ color: '#fff', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#25D366' }}>💬</span> WhatsApp Cloud API Settings
      </h1>
      
      <p style={{ color: '#aaa', marginBottom: '30px', lineHeight: '1.6' }}>
        Configure the official Meta WhatsApp Cloud API credentials below. 
        Once configured and enabled, the platform will automatically dispatch pre-approved template messages for key triggers like new courses, certificates, and subscriptions.
      </p>

      {message && (
        <div style={{ padding: '15px', background: message.includes('✅') ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)', border: message.includes('✅') ? '1px solid rgba(46, 213, 115, 0.3)' : '1px solid rgba(255, 71, 87, 0.3)', borderRadius: '8px', marginBottom: '20px', color: message.includes('✅') ? '#2ed573' : '#ff4757' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {/* GLOBAL TOGGLE */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>Enable WhatsApp Automation</h3>
            <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Turn on/off all automated outbound WhatsApp messages.</p>
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
              backgroundColor: settings.enabled ? '#25D366' : '#333', 
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

        {/* CORE CREDENTIALS */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#f26422' }}>API Credentials</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Phone Number ID</label>
              <input 
                type="text" 
                value={settings.phoneId}
                onChange={e => setSettings({...settings, phoneId: e.target.value})}
                placeholder="e.g. 10459382948"
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>System User Access Token (Permanent)</label>
              <input 
                type="password" 
                value={settings.accessToken}
                onChange={e => setSettings({...settings, accessToken: e.target.value})}
                placeholder="EAAI..."
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* TEMPLATES */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#f26422' }}>Message Templates</h3>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>Enter the exact template name as approved in your Meta Developer Console (e.g. `course_published_alert`). Note: Language is defaulted to `en_US`.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {Object.entries(settings.templates).map(([key, value]) => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()} Template
                </label>
                <input 
                  type="text" 
                  value={value}
                  onChange={e => setSettings({...settings, templates: {...settings.templates, [key]: e.target.value}})}
                  placeholder={`e.g. ${key.toLowerCase()}_alert`}
                  style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', outline: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          style={{ 
            padding: '15px 30px', 
            background: 'var(--primary)', 
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
