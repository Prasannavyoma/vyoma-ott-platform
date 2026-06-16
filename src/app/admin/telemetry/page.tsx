import { getTelemetryStats } from '@/app/actions/telemetry';
import TelemetryClient from './TelemetryClient';

export default async function AdminTelemetryPage() {
  const data = await getTelemetryStats();

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>
        Telemetry Dashboard
      </h1>
      <p style={{ color: '#8f98a9', marginBottom: '30px' }}>
        Track user engagement, banner clicks, custom page views, and hotlinks here.
      </p>

      {data.success ? (
        <TelemetryClient 
          totalEvents={data.totalEvents} 
          byType={data.byType} 
          topBanners={data.topBanners} 
          recentEvents={data.recentEvents} 
        />
      ) : (
        <div style={{ color: '#ef4444' }}>Failed to load telemetry stats.</div>
      )}
    </div>
  );
}
