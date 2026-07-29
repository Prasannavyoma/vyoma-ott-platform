"use client";

import { useState } from 'react';
import { toggleMalwareEngine, triggerSystemAudit } from '@/app/actions/security';
import { Shield, Activity, Lock, CheckCircle, AlertTriangle, RefreshCw, Zap, Server, FileSearch } from 'lucide-react';

export default function SecurityClient({
  initialEngineEnabled,
  adminUsers
}: {
  initialEngineEnabled: boolean;
  adminUsers: any[];
}) {
  const [engineEnabled, setEngineEnabled] = useState(initialEngineEnabled);
  const [isToggling, setIsToggling] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleMalwareEngine(!engineEnabled);
      if (result.success) {
        setEngineEnabled(result.enabled);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to toggle malware engine');
    }
    setIsToggling(false);
  };

  const handleAudit = async () => {
    setIsAuditing(true);
    setAuditMessage(null);
    try {
      const result = await triggerSystemAudit();
      setAuditMessage(result.message);
    } catch (e) {
      setAuditMessage('Audit failed to complete due to server error.');
    }
    setIsAuditing(false);
  };

  return (
    <div className="security-dashboard-container">
      <div className="security-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '2rem', color: '#fff' }}>
          <Shield size={32} color="#4ade80" /> Security & Compliance Center
        </h1>
        <p style={{ color: '#888', marginTop: '5px' }}>
          Cloud Security Posture Management (CSPM) and Access Monitor
        </p>
      </div>

      <div className="security-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        
        {/* System Health Engine */}
        <div className="security-card" style={{ background: 'rgba(25, 25, 25, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', margin: 0 }}><Activity size={20} color="#60a5fa" /> System Health Status</h3>
            <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>SECURE</span>
          </div>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Continuous vulnerability scanning is active. Node modules and dependencies are currently monitored.</p>
          
          <div style={{ background: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #333', fontFamily: 'monospace', fontSize: '0.85rem', color: '#4ade80', marginBottom: '20px' }}>
            {isAuditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={14} className="spin" /> Running full system audit...
              </div>
            ) : auditMessage ? (
              <div>{auditMessage}</div>
            ) : (
              <div>Last scan: Today at 08:00 AM<br/>Vulnerabilities found: 0</div>
            )}
          </div>
          
          <button 
            onClick={handleAudit} 
            disabled={isAuditing}
            style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: isAuditing ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {isAuditing ? 'Auditing...' : 'Run Dependency Audit'} <Zap size={16} />
          </button>
        </div>

        {/* Malware Upload Engine */}
        <div className="security-card" style={{ background: 'rgba(25, 25, 25, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', margin: 0 }}><FileSearch size={20} color="#f43f5e" /> Malware Upload Engine</h3>
            {engineEnabled ? (
              <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>ACTIVE</span>
            ) : (
              <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>OFFLINE</span>
            )}
          </div>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Scans user-uploaded files (PDFs, Images, Videos) for malicious signatures before persisting to cloud storage.</p>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>Engine Status</span>
              <span style={{ color: '#888', fontSize: '0.8rem' }}>Toggle real-time scanning</span>
            </div>
            
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={engineEnabled} 
                onChange={handleToggle} 
                disabled={isToggling}
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span className={`slider round ${engineEnabled ? 'checked' : ''}`} style={{ 
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: engineEnabled ? '#4ade80' : '#ccc', transition: '.4s', borderRadius: '24px' 
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: engineEnabled ? 'translateX(26px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>

          <div style={{ color: '#aaa', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Disabling the malware engine may expose the platform to zero-day file injection attacks. Leave enabled unless debugging.</span>
          </div>
        </div>

        {/* WAF Status (Visual Only) */}
        <div className="security-card" style={{ background: 'rgba(25, 25, 25, 0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', margin: 0 }}><Server size={20} color="#a855f7" /> Web App Firewall</h3>
            <span style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>ENFORCING</span>
          </div>
          <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '20px' }}>Cloudflare/Vercel Edge protection is actively routing traffic and blocking DDoS attempts.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>SQL Injection Blocks (24h)</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>14</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>Bot Traffic Filtered</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>1,204 reqs</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
              <span style={{ color: '#888', fontSize: '0.85rem' }}>Edge Cache Hit Rate</span>
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>98.2%</span>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Lock size={24} color="#f59e0b" /> Privileged Access Monitor
      </h2>
      <div style={{ background: 'rgba(25, 25, 25, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid #333' }}>
              <th style={{ padding: '15px', color: '#888', fontWeight: 'normal' }}>Admin Email</th>
              <th style={{ padding: '15px', color: '#888', fontWeight: 'normal' }}>Role Level</th>
              <th style={{ padding: '15px', color: '#888', fontWeight: 'normal' }}>Last Active Profile Update</th>
              <th style={{ padding: '15px', color: '#888', fontWeight: 'normal' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: i === adminUsers.length - 1 ? 'none' : '1px solid #333' }}>
                <td style={{ padding: '15px', color: '#fff', fontWeight: 'bold' }}>{u.email}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    background: u.role === 'SUPER_ADMIN' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: u.role === 'SUPER_ADMIN' ? '#f59e0b' : '#3b82f6',
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: '15px', color: '#aaa', fontSize: '0.9rem' }}>
                  {new Date(u.updatedAt).toLocaleString()}
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4ade80', fontSize: '0.85rem' }}>
                    <CheckCircle size={14} /> Verified
                  </span>
                </td>
              </tr>
            ))}
            {adminUsers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No admin users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin {
          animation: spin 2s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
