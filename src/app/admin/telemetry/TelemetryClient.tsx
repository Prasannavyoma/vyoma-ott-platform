"use client";

import React from 'react';

export default function TelemetryClient({ totalEvents, byType, topBanners, recentEvents }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#8f98a9', margin: '0 0 10px 0' }}>Total Events Tracked</h3>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{totalEvents}</div>
        </div>

        {byType.map((item: any) => (
          <div key={item.type} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#8f98a9', margin: '0 0 10px 0' }}>{item.type}</h3>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{item.count}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Top Banners / Links */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '15px', color: '#fff' }}>Top Hotlinks / Banners</h2>
          {topBanners.length === 0 ? (
            <p style={{ color: '#687387' }}>No data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topBanners.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.sourceId}</span>
                  <span style={{ background: 'rgba(242,100,34,0.2)', color: '#f26422', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {item.count} clicks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Events Log */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '15px', color: '#fff' }}>Recent Telemetry Log</h2>
          {recentEvents.length === 0 ? (
            <p style={{ color: '#687387' }}>No data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {recentEvents.map((event: any) => (
                <div key={event.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{event.eventType}</span>
                    <span style={{ fontSize: '0.8rem', color: '#8f98a9' }}>{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Source: {event.sourceId}</div>
                  {event.userId && <div style={{ color: '#10b981', fontSize: '0.8rem' }}>User: {event.userId}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
