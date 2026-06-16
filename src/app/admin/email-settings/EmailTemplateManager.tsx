"use client";

import { useState, useTransition, useEffect } from 'react';
import { saveEmailTemplateAction, sendTestEmailAction } from './actions';

interface UserItem {
  id: string;
  name: string | null;
  email: string;
}

interface SavedTemplate {
  key: string;
  subject: string;
  body: string;
}

interface EmailTemplateManagerProps {
  users: UserItem[];
  savedTemplates: SavedTemplate[];
  defaultSubjects: Record<string, string>;
  defaultBodies: Record<string, string>;
}

export default function EmailTemplateManager({
  users,
  savedTemplates,
  defaultSubjects,
  defaultBodies
}: EmailTemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('WELCOME');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [testUserId, setTestUserId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [editorTab, setEditorTab] = useState<'code' | 'visual'>('code');

  // Sync state with selected template
  useEffect(() => {
    const saved = savedTemplates.find(t => t.key === selectedTemplate);
    setSubject(saved ? saved.subject : defaultSubjects[selectedTemplate] || '');
    setBody(saved ? saved.body : defaultBodies[selectedTemplate] || '');
    setTestStatus(null);
  }, [selectedTemplate, savedTemplates, defaultSubjects, defaultBodies]);

  // Sync testEmail when test user changes
  const handleUserChange = (uid: string) => {
    setTestUserId(uid);
    const user = users.find(u => u.id === uid);
    if (user) {
      setTestEmail(user.email);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await saveEmailTemplateAction(selectedTemplate, subject, body);
        alert('Email template saved successfully!');
      } catch (err: any) {
        alert('Failed to save template: ' + err.message);
      }
    });
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      setTestStatus({ type: 'error', message: 'Please specify a recipient email address.' });
      return;
    }
    setTestStatus(null);

    startTransition(async () => {
      try {
        await sendTestEmailAction(testEmail, selectedTemplate, testUserId);
        setTestStatus({ type: 'success', message: `Test email sent to ${testEmail} successfully!` });
      } catch (err: any) {
        setTestStatus({ type: 'error', message: 'Failed to send test email: ' + err.message });
      }
    });
  };

  // Compute live visual representation of template wrapper
  const renderedHtmlPreview = () => {
    let content = body;
    const platformUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const name = 'Seeker';

    content = content.replace(/{{name}}/g, name);
    content = content.replace(/{{platform_url}}/g, platformUrl);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { background-color: #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; margin: 0; padding: 20px; }
          .wrap { max-width: 600px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222; padding: 40px; border-radius: 16px; margin-top: 20px; }
          .brand { font-size: 24px; font-weight: 900; color: #f26422; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; text-align: center;}
          h1 { font-size: 22px; margin-bottom: 15px; color: #fff; }
          p { color: #ccc; font-size: 16px; line-height: 1.6; }
          .btn { display: inline-block; padding: 15px 30px; background: #f26422; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; text-align: center; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #222; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="brand">Vyoma OTT</div>
          ${content}
          <div class="footer">© 2026 Vyoma Linguistic Labs Foundation. All transactional data secured.</div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', marginTop: '40px' }}>
      
      {/* HEADER BAR */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>✉️ Lifecycle Email Template Editor</h2>
        <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>Customize Subject Lines and HTML templates triggered by user events.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '35px', alignItems: 'start' }}>
        
        {/* TEMPLATE EDITING FORM */}
        <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '30px', borderRadius: '20px' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* SELECT TEMPLATE TRIGGER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>SELECT LIFECYCLE EVENT TRIGGER</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                style={selectStyle}
              >
                <option value="WELCOME">Welcome / Registration Onboarding (WELCOME)</option>
                <option value="WINBACK">"Come back to us" / Inactive Winback (WINBACK)</option>
                <option value="RENEWAL">"Pls renew the plan" / Subscription Warning (RENEWAL)</option>
                <option value="UPGRADE">"Upgrade Plan" / Upsell Recommendation (UPGRADE)</option>
              </select>
            </div>

            {/* SUBJECT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>EMAIL SUBJECT</label>
              <input
                required
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject Line"
                style={inputStyle}
              />
            </div>

            {/* HTML BODY TABS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditorTab('code')}
                    style={{
                      background: editorTab === 'code' ? 'var(--primary, #f26422)' : 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    📝 HTML Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('visual')}
                    style={{
                      background: editorTab === 'visual' ? 'var(--primary, #f26422)' : 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    👁️ Visual View (Preview)
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#f26422' }}>Placeholders: {'{{name}}'}, {'{{platform_url}}'}</span>
              </div>

              {editorTab === 'code' ? (
                <textarea
                  required
                  rows={12}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter HTML markup here..."
                  style={{
                    ...inputStyle,
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.85rem',
                    lineHeight: '1.4'
                  }}
                />
              ) : (
                <iframe
                  srcDoc={renderedHtmlPreview()}
                  style={{
                    width: '100%',
                    height: '350px',
                    border: '1px solid #1c1c24',
                    borderRadius: '8px',
                    background: '#000'
                  }}
                />
              )}
            </div>

            {/* SAVE BUTTON */}
            <div>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  background: 'var(--primary, #f26422)',
                  color: '#fff',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.7 : 1
                }}
              >
                {isPending ? 'SAVING CHANGES...' : '💾 SAVE TEMPLATE'}
              </button>
            </div>

          </form>
        </div>

        {/* TEST EMULATION & DISPATCH CONSOLE */}
        <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '30px', borderRadius: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>⚡ Live Transmission Matrix</h3>
          <p style={{ fontSize: '0.8rem', color: '#666', margin: '0 0 20px 0', lineHeight: '1.4' }}>
            Verify layout wrappers, template substitutions, and delivery parameters using a test recipient.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* SELECT USER PRESET */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>RECIPIENT PRESET / MOCK USER</label>
              <select
                value={testUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                style={selectStyle}
              >
                <option value="">-- Seeker (Generic Mock) --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name || 'Unnamed User'} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* TARGET EMAIL INPUT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>TARGET EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="test-receiver@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* DISPATCH ACTION */}
            <div style={{ marginTop: '5px' }}>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isPending}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.7 : 1
                }}
              >
                🚀 SEND TEST/TARGETED EMAIL
              </button>
            </div>

            {/* STATUS NOTIFICATION */}
            {testStatus && (
              <div style={{
                background: testStatus.type === 'success' ? 'rgba(70,211,105,0.05)' : 'rgba(255,107,107,0.05)',
                border: `1px solid ${testStatus.type === 'success' ? '#46d369' : '#ff6b6b'}`,
                color: testStatus.type === 'success' ? '#46d369' : '#ff6b6b',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginTop: '10px',
                textAlign: 'center'
              }}>
                {testStatus.message}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: '#000',
  border: '1px solid #1c1c24',
  color: '#fff',
  padding: '12px 15px',
  borderRadius: '8px',
  outline: 'none',
  fontSize: '0.9rem',
  cursor: 'pointer'
};

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
