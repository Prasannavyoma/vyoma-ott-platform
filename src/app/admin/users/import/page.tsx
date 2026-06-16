"use client";

import { useState, useTransition } from 'react';
import { registerUsersFromCSV, handleMigrationCSV } from '@/app/actions/import-users';

export default function UserImportDashboard() {
  const [activeTab, setActiveTab] = useState<'register' | 'wordpress'>('register');
  const [isPending, startTransition] = useTransition();
  
  // Tab 1 (CSV Registration) States
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [regRowErrors, setRegRowErrors] = useState<string[] | null>(null);

  // Tab 2 (WP Migration) States
  const [wpSuccess, setWpSuccess] = useState<string | null>(null);
  const [wpError, setWpError] = useState<string | null>(null);

  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegSuccess(null);
    setRegError(null);
    setRegRowErrors(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registerUsersFromCSV(formData);
      if (res.error) {
        setRegError(res.error);
      } else {
        setRegSuccess(`Successfully registered ${res.count} users directly into the database!`);
        if (res.errors && res.errors.length > 0) {
          setRegRowErrors(res.errors);
        }
      }
    });
  }

  async function handleWpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWpSuccess(null);
    setWpError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await handleMigrationCSV(formData);
      if (res.error) {
        setWpError(res.error);
      } else {
        setWpSuccess(`WordPress migration complete! Ingested ${res.count} users.`);
      }
    });
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff', maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>📥</span> User Ingestion Portal
        </h1>
        <p style={{ color: '#aaa', marginTop: '8px', fontSize: '1.05rem', maxWidth: '800px', lineHeight: '1.6' }}>
          Bulk register new users with temporary credentials or import historical subscription records from WordPress.
        </p>
      </div>

      {/* TABS CONTAINER */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '35px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '10px', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('register')}
          style={{
            background: activeTab === 'register' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'register' ? '#fff' : '#aaa',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'register' ? '0 4px 12px rgba(242,100,34,0.3)' : 'none'
          }}
        >
          🔑 CSV User Registration
        </button>
        <button
          onClick={() => setActiveTab('wordpress')}
          style={{
            background: activeTab === 'wordpress' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'wordpress' ? '#fff' : '#aaa',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '6px',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 'wordpress' ? '0 4px 12px rgba(242,100,34,0.3)' : 'none'
          }}
        >
          🌐 WordPress Migration
        </button>
      </div>

      {/* CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'start' }}>
        
        {/* TAB 1: CSV REGISTRATION */}
        {activeTab === 'register' && (
          <>
            {/* Form Console */}
            <div style={{ background: '#121214', padding: '35px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '15px' }}>🚀 Ingest Registration CSV</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
                This tool registers users directly with temporary credentials. Registered users will be prompted to setup a new personal password on their very next login.
              </p>

              {regSuccess && (
                <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '8px', padding: '16px', color: '#4ade80', fontSize: '0.95rem', marginBottom: '25px', fontWeight: 'bold' }}>
                  {regSuccess}
                </div>
              )}

              {regError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '16px', color: '#ff6b6b', fontSize: '0.95rem', marginBottom: '25px' }}>
                  ⚠️ {regError}
                </div>
              )}

              {regRowErrors && regRowErrors.length > 0 && (
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', padding: '16px', color: '#fbbf24', fontSize: '0.85rem', marginBottom: '25px', maxHeight: '150px', overflowY: 'auto' }}>
                  <strong style={{ display: 'block', marginBottom: '8px' }}>Some rows had warnings:</strong>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {regRowErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                {/* File Dropzone */}
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '2px dashed rgba(255,255,255,0.1)', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px', transition: 'border-color 0.2s' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📁</div>
                  <input type="file" name="csvFile" accept=".csv" style={{ color: '#aaa', cursor: 'pointer' }} />
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>Upload `.csv` spreadsheet file with user matrix</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '25px 0', color: '#444' }}>
                  <div style={{ flex: 1, height: '1px', background: '#222' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#555' }}>OR PASTE PLAIN CSV TEXT</span>
                  <div style={{ flex: 1, height: '1px', background: '#222' }}></div>
                </div>

                <textarea
                  name="csvText"
                  placeholder="name,email,temporaryPassword,plan&#10;Ram Sharma,ram@sanskrit.com,RamPass123,GOLD&#10;Gita Patel,gita@sanskrit.com,GitaPass456,PLATINUM"
                  style={{ width: '100%', minHeight: '180px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#22c55e', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
                ></textarea>

                <button 
                  type="submit" 
                  disabled={isPending}
                  style={{ width: '100%', marginTop: '25px', background: 'var(--primary)', color: '#fff', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 900, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '1.1rem', boxShadow: '0 8px 24px rgba(242,100,34,0.3)', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? 'Processing Registration Ingestion...' : '🚀 REGISTER USERS FROM CSV'}
                </button>
              </form>
            </div>

            {/* Playbook Documentation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>📖 CSV Formatting Rules</h4>
                
                <div style={{ fontSize: '0.88rem', color: '#bbb', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <strong style={{ color: '#fff' }}>Columns Needed:</strong>
                    <ul style={{ margin: '5px 0 0', paddingLeft: '20px', color: '#aaa' }}>
                      <li>`name` (User full display name)</li>
                      <li>`email` (Primary login email - must be unique)</li>
                      <li>`temporaryPassword` (Initial temp login credential)</li>
                      <li>`plan` (Sub Tier: `GOLD`, `PLATINUM`, or `FREE`)</li>
                    </ul>
                  </div>

                  <div>
                    <strong style={{ color: '#fff' }}>Force Password Reset:</strong>
                    Upon first login, the user is automatically flagged with a forced password update redirect. They cannot access features until configuring their new password.
                  </div>

                  <div style={{ marginTop: '5px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', padding: '15px' }}>
                    <strong style={{ color: '#fff', fontSize: '0.85rem', display: 'block', marginBottom: '10px' }}>📄 Live CSV Template Preview:</strong>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: '#ccc', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '6px 4px', fontWeight: 'bold', color: 'var(--primary)' }}>name</th>
                            <th style={{ padding: '6px 4px', fontWeight: 'bold', color: 'var(--primary)' }}>email</th>
                            <th style={{ padding: '6px 4px', fontWeight: 'bold', color: 'var(--primary)' }}>temporaryPassword</th>
                            <th style={{ padding: '6px 4px', fontWeight: 'bold', color: 'var(--primary)' }}>plan</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '6px 4px' }}>Prasanna Vyoma</td>
                            <td style={{ padding: '6px 4px' }}>prasanna@example.com</td>
                            <td style={{ padding: '6px 4px' }}>VyomaTemp123</td>
                            <td style={{ padding: '6px 4px' }}>GOLD</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '6px 4px' }}>Sanskrit Learner</td>
                            <td style={{ padding: '6px 4px' }}>learner@example.com</td>
                            <td style={{ padding: '6px 4px' }}>SanskritTemp456</td>
                            <td style={{ padding: '6px 4px' }}>PLATINUM</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px 4px' }}>Free User</td>
                            <td style={{ padding: '6px 4px' }}>free@example.com</td>
                            <td style={{ padding: '6px 4px' }}>FreeTemp789</td>
                            <td style={{ padding: '6px 4px' }}>FREE</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    <a
                      href="/users_registration_template.csv"
                      download
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '10px 18px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    >
                      💾 Download Example CSV
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: WP MIGRATION */}
        {activeTab === 'wordpress' && (
          <>
            {/* Form Console */}
            <div style={{ background: '#121214', padding: '35px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '15px' }}>🌐 WordPress Plan Sync Conduit</h3>
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
                Seamlessly import or synchronize historical WordPress member lists to set subscription access levels and validities instantly.
              </p>

              {wpSuccess && (
                <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)', borderRadius: '8px', padding: '16px', color: '#4ade80', fontSize: '0.95rem', marginBottom: '25px', fontWeight: 'bold' }}>
                  {wpSuccess}
                </div>
              )}

              {wpError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '16px', color: '#ff6b6b', fontSize: '0.95rem', marginBottom: '25px' }}>
                  ⚠️ {wpError}
                </div>
              )}

              <form onSubmit={handleWpSubmit}>
                {/* File Dropzone */}
                <div style={{ background: 'rgba(0,0,0,0.3)', border: '2px dashed rgba(255,255,255,0.1)', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📁</div>
                  <input type="file" name="csvFile" accept=".csv" style={{ color: '#aaa', cursor: 'pointer' }} />
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>Upload physical WP exported `.csv` file</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '25px 0', color: '#444' }}>
                  <div style={{ flex: 1, height: '1px', background: '#222' }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#555' }}>OR PASTE EXPORT COLUMNS</span>
                  <div style={{ flex: 1, height: '1px', background: '#222' }}></div>
                </div>

                <textarea
                  name="csvText"
                  placeholder="user_email,display_name,membership_plan,start_date&#10;prasanna@gmail.com,Prasanna,Gold,2026-05-01"
                  style={{ width: '100%', minHeight: '180px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', color: '#ffd700', padding: '15px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
                ></textarea>

                <button 
                  type="submit" 
                  disabled={isPending}
                  style={{ width: '100%', marginTop: '25px', background: 'var(--primary)', color: '#fff', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 900, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '1.1rem', boxShadow: '0 8px 24px rgba(242,100,34,0.3)', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? 'Syncing WordPress Users...' : '🔥 INGEST WORDPRESS USER LIST'}
                </button>
              </form>
            </div>

            {/* Playbook Documentation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>📖 Ingestion Flow Steps</h4>
                
                <div style={{ fontSize: '0.88rem', color: '#bbb', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <strong style={{ color: '#fff' }}>Step 1: Get Export CSV</strong>
                    Go to WP Admin &rarr; Users or Memberships and select CSV Export.
                  </div>
                  <div>
                    <strong style={{ color: '#fff' }}>Step 2: Column Headers Map</strong>
                    Headers mapped automatically: `user_email`, `display_name`, `membership_plan`, and optional `start_date`.
                  </div>
                  <div>
                    <strong style={{ color: '#fff' }}>Step 3: Conflict Resolution</strong>
                    Auto-merges duplicate user profiles based on unique email key matching, overriding sub tier status dynamically.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
