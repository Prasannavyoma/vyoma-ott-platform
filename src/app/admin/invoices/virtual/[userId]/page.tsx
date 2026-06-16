import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function VirtualInvoicePage({ params }: { params: Promise<{ userId: string }> }) {
  const userId = (await params).userId;
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.plan === 'FREE') {
    return notFound();
  }

  // Derive virtual pricing metrics anchored to standard tiers
  const amount = user.plan === 'PLATINUM' ? 490.00 : 390.00;
  const subtotal = (amount / 1.18).toFixed(2);
  const tax = (amount - Number(subtotal)).toFixed(2);
  const dateStr = user.planStartedAt ? new Date(user.planStartedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', padding: '40px 20px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background-color: #fff !important; }
          .invoice-card { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important;}
        }
        .invoice-card {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          border: 1px solid #e5e7eb;
          padding: 60px;
          color: #1f2937;
          font-family: system-ui, sans-serif;
        }
        .flex-row { display: flex; justify-content: space-between; }
        .font-bold { font-weight: 700; }
        .border-b { border-bottom: 1px solid #e5e7eb; }
      `}} />

      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href={`/admin/users/${user.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Customer Profile
        </Link>
        <button 
          id="print-trigger"
          style={{ 
            backgroundColor: '#000', color: 'white', padding: '10px 20px', 
            border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          🖨️ Download / Print
        </button>
      </div>

      <div className="invoice-card">
        <div style={{ marginBottom: '40px' }}>
          <img 
            src="https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png" 
            alt="Vyoma" 
            style={{ height: '55px', objectFit: 'contain', marginBottom: '10px' }}
          />
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111' }}>Vyoma Linguistic Labs Foundation</div>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 30px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Invoice (Virtual Plan Reciept)</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px', fontSize: '14px', marginBottom: '35px' }}>
          <div><span className="font-bold">Account ID:</span> {user.id.substring(0,8).toUpperCase()}</div>
          <div><span className="font-bold">Billing Commencement:</span> {dateStr}</div>
        </div>

        <div style={{ marginBottom: '35px' }}>
          <h3 className="border-b" style={{ paddingBottom: '5px', marginBottom: '15px', textTransform: 'uppercase', fontSize: '13px' }}>Billed To</h3>
          <div style={{ fontSize: '15px' }}>
            <div className="font-bold">{user.name || 'Member'}</div>
            <div style={{ color: '#4b5563' }}>{user.address || 'Address not specified'}</div>
            <div style={{ color: '#4b5563' }}>Email: {user.email}</div>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h3 className="border-b" style={{ paddingBottom: '5px', marginBottom: '15px', textTransform: 'uppercase', fontSize: '13px' }}>Subscription Cycle</h3>
          <div style={{ fontSize: '14px' }}>
            <div><span className="font-bold">Plan Name:</span> {user.plan} MEMBERSHIP ({user.planInterval || 'MONTHLY'})</div>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', maxWidth: '350px', borderTop: '2px solid #333', paddingTop: '15px' }}>
          <div className="flex-row" style={{ padding: '5px 0' }}>
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex-row" style={{ padding: '5px 0', marginBottom: '10px' }}>
            <span>IGST (18%)</span>
            <span>₹{tax}</span>
          </div>
          <div className="flex-row font-bold" style={{ borderTop: '1px solid #333', padding: '15px 0', fontSize: '20px' }}>
            <span>Total Plan Value</span>
            <span>₹{amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('print-trigger').onclick = () => window.print();
      `}} />
    </div>
  );
}
