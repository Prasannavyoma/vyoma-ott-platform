import { Metadata } from 'next';
import { getVoucherClaimDetails } from '@/app/actions/gift';
import ClaimClientPage from './ClaimClientPage';
import NavBar from '@/app/components/NavBar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Open Your Gift of Wisdom | Vyoma Sanskrit OTT',
  description: 'A special sacred gift of Sanskrit learning has been prepared exclusively for you.'
};

export default async function ClaimPage({
  params,
  searchParams
}: {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ theme?: string }>;
}) {
  const unwrappedParams = await params;
  const unwrappedSearchParams = searchParams ? await searchParams : {};
  const code = unwrappedParams.code || '';
  const overrideTheme = unwrappedSearchParams?.theme;

  const voucherData = await getVoucherClaimDetails(code);

  if (!voucherData.success) {
    return (
      <main style={{ minHeight: '100vh', background: '#020710', color: '#fff', fontFamily: "'Outfit', 'Inter', system-ui, sans-serif" }}>
        <NavBar />
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '160px 20px 80px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '50px 30px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🔍</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '15px' }}>Gift Voucher Not Found</h1>
            <p style={{ color: '#8f98a9', fontSize: '1rem', lineHeight: '1.6', marginBottom: '30px' }}>
              We couldn't locate an active gift for code <code style={{ color: '#ffd700', background: 'rgba(255,215,0,0.1)', padding: '3px 8px', borderRadius: '4px' }}>{code}</code>. Please double-check your link or try entering it manually.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <Link href="/redeem" style={{ background: 'linear-gradient(135deg, #ffd700, #ffa500)', color: '#000', padding: '12px 26px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none' }}>
                Enter Code Manually
              </Link>
              <Link href="/" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '12px 26px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none' }}>
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Use override theme if passed in query string, otherwise use DB/telemetry theme
  const initialData = {
    ...voucherData,
    cardTheme: (overrideTheme as any) || voucherData.cardTheme || 'SWARNA'
  };

  return <ClaimClientPage initialData={initialData as any} />;
}
