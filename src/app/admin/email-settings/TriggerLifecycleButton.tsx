"use client";

import { useState } from 'react';

export default function TriggerLifecycleButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTrigger = async (force: boolean) => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch(`/api/cron/lifecycle-emails?forceAll=${force}`);
      const data = await res.json();
      if (data.success) {
        setResult({
          type: 'success',
          message: `Finished! Sent: ${data.winbackSent} Winbacks, ${data.renewalWarningSent} Renewals, ${data.upgradeUpsellSent} Upgrades.`
        });
      } else {
        setResult({
          type: 'error',
          message: 'Error executing cron: ' + (data.error || 'Unknown error')
        });
      }
    } catch (err: any) {
      setResult({
        type: 'error',
        message: 'Network failure: ' + err.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
      <button
        onClick={() => handleTrigger(false)}
        disabled={isRunning}
        style={{
          width: '100%',
          background: 'rgba(70, 211, 105, 0.1)',
          border: '1px solid #46d369',
          color: '#46d369',
          padding: '10px 15px',
          borderRadius: '8px',
          fontWeight: 800,
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: '0.8rem'
        }}
      >
        {isRunning ? 'RUNNING DAILY SCAN...' : '⏰ RUN DAILY WINDOW SCAN'}
      </button>

      <button
        onClick={() => handleTrigger(true)}
        disabled={isRunning}
        style={{
          width: '100%',
          background: 'rgba(242, 100, 34, 0.1)',
          border: '1px solid #f26422',
          color: '#f26422',
          padding: '10px 15px',
          borderRadius: '8px',
          fontWeight: 800,
          cursor: isRunning ? 'not-allowed' : 'pointer',
          fontSize: '0.8rem'
        }}
        title="Sends winback to all inactive users > 7 days, renewal warning to all expiring soon, upsell to all free accounts"
      >
        {isRunning ? 'SENDING LIFECYCLE EMAILS...' : '🚀 FORCE RUN LIFE CYCLE EMAILS NOW'}
      </button>

      {result && (
        <div style={{
          background: result.type === 'success' ? 'rgba(70,211,105,0.05)' : 'rgba(255,107,107,0.05)',
          border: `1px solid ${result.type === 'success' ? '#46d369' : '#ff6b6b'}`,
          color: result.type === 'success' ? '#46d369' : '#ff6b6b',
          padding: '10px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          {result.message}
        </div>
      )}
    </div>
  );
}
