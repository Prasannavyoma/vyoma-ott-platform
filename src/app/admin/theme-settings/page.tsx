'use client';

import React, { useState, useEffect } from 'react';
import { getThemeSettings, saveThemeSettings } from '@/app/actions/theme-settings';
import Link from 'next/link';

export default function ThemeSettingsPage() {
  const [primaryColor, setPrimaryColor] = useState('#f26422');
  const [backgroundColor, setBackgroundColor] = useState('#030b17');
  const [cardBg, setCardBg] = useState('#0f1624');
  const [fontFamily, setFontFamily] = useState('Outfit');
  const [fontSizeBase, setFontSizeBase] = useState('16px');
  const [buttonRadius, setButtonRadius] = useState('8px');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getThemeSettings();
        setPrimaryColor(data.primaryColor);
        setBackgroundColor(data.backgroundColor);
        setCardBg(data.cardBg);
        setFontFamily(data.fontFamily);
        setFontSizeBase(data.fontSizeBase);
        setButtonRadius(data.buttonRadius);
      } catch (err) {
        console.error(err);
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
      await saveThemeSettings({
        primaryColor,
        backgroundColor,
        cardBg,
        fontFamily,
        fontSizeBase,
        buttonRadius
      });
      setMessage({ type: 'success', text: 'Theme settings saved successfully. Global CSS variables updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save theme settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '60px', color: '#fff', textAlign: 'center' }}>
        <p>Loading Theme Customization...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 5%', color: 'var(--foreground)', fontFamily: 'var(--font-geist-sans)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px 0', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Theme & Customization
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Dynamically update colors, fonts, and layouts globally.
          </p>
        </div>
        <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Settings Form */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Colors</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#ccc' }}>Primary Brand Color</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }} />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#ccc' }}>Background Color</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }} />
                  <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#ccc' }}>Card/Panel Background</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" value={cardBg} onChange={(e) => setCardBg(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }} />
                  <input type="text" value={cardBg} onChange={(e) => setCardBg(e.target.value)} style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                </div>
              </div>
            </div>

            <h3 style={{ margin: '20px 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Typography & Layout</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#ccc' }}>Font Family</label>
                <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
                  <option value="Outfit">Outfit (Default)</option>
                  <option value="Inter">Inter (Modern)</option>
                  <option value="Roboto">Roboto (Classic)</option>
                  <option value="Playfair Display">Playfair Display (Serif)</option>
                  <option value="Space Grotesk">Space Grotesk (Tech)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#ccc' }}>Base Font Size</label>
                <select value={fontSizeBase} onChange={(e) => setFontSizeBase(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
                  <option value="14px">14px (Compact)</option>
                  <option value="16px">16px (Standard)</option>
                  <option value="18px">18px (Large)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: '#ccc' }}>Button Style (Border Radius)</label>
                <select value={buttonRadius} onChange={(e) => setButtonRadius(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }}>
                  <option value="0px">Square (0px)</option>
                  <option value="4px">Slight Curve (4px)</option>
                  <option value="8px">Rounded (8px)</option>
                  <option value="12px">Extra Rounded (12px)</option>
                  <option value="50px">Pill / Fully Rounded (50px)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button 
                type="submit" 
                disabled={isSaving}
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  background: 'var(--primary)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Saving & Publishing...' : 'Save Theme & Publish Globally'}
              </button>
            </div>

            {message && (
              <div style={{ padding: '15px', borderRadius: '8px', background: message.type === 'success' ? 'rgba(70, 211, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#46d369' : '#ef4444', border: `1px solid ${message.type === 'success' ? 'rgba(70, 211, 105, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                {message.text}
              </div>
            )}
          </form>
        </div>

        {/* Live Preview Pane */}
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#ccc' }}>Live Preview</h3>
          <div style={{
            background: backgroundColor,
            padding: '40px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: `"${fontFamily}", sans-serif`,
            fontSize: fontSizeBase,
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}>
            <h1 style={{ color: '#fff', marginTop: 0, marginBottom: '10px' }}>Welcome to Vyoma OTT</h1>
            <p style={{ color: '#8f98a9', lineHeight: '1.6', marginBottom: '25px' }}>
              This is a live preview of your customized theme settings. You can adjust colors, fonts, and button styles in real-time before saving them to the database.
            </p>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button style={{
                background: primaryColor,
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: buttonRadius,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit'
              }}>
                Primary Action
              </button>
              
              <button style={{
                background: cardBg,
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '12px 24px',
                borderRadius: buttonRadius,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit'
              }}>
                Secondary Button
              </button>
            </div>
            
            <div style={{ marginTop: '30px', padding: '20px', background: cardBg, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Interactive Content Card</h4>
              <p style={{ color: '#8f98a9', fontSize: '0.9em', margin: 0 }}>Cards and panels will use the designated Card Background Color to stand out from the page background.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
