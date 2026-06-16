import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  
  // 1. Fetch from purchase (Course)
  let purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { user: true, course: true }
  }) as any;

  let isBundle = false;
  let productName = "";
  let category = "";
  let durationText = "1 Year Access";

  if (!purchase) {
    // 2. Fallback to bundle purchase
    purchase = await prisma.bundlePurchase.findUnique({
      where: { id },
      include: { user: true, bundle: true }
    });
    if (purchase) {
      isBundle = true;
      productName = purchase.bundle?.title || 'Premium Bundle';
      category = 'Curricular Bundle';
      if (purchase.bundle?.validityDays) {
        durationText = `${purchase.bundle.validityDays} Days Access`;
      } else {
        durationText = "Lifetime Access";
      }
    }
  } else {
    productName = purchase.course?.title || 'Premium Course';
    category = purchase.course?.category || 'Sanskrit OTT Course';
  }

  if (!purchase) {
    return notFound();
  }

  const amount = purchase.amount || 0;
  const isKarnataka = (purchase.placeOfSupply || '').toLowerCase().includes('karnataka') || 
                      (purchase.placeOfSupply || '').startsWith('29') ||
                      (purchase.user?.state || '').toLowerCase().includes('karnataka');

  // Math-exact GST calculations
  const taxableValue = Number((amount / 1.18).toFixed(2));
  const totalTax = Number((amount - taxableValue).toFixed(2));
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isKarnataka) {
    cgst = Number((totalTax / 2).toFixed(2));
    sgst = Number((totalTax / 2).toFixed(2));
  } else {
    igst = totalTax;
  }

  const dateStr = new Date(purchase.createdAt).toLocaleDateString('en-GB');
  const invoiceNo = `VYOMA/2026-27/${purchase.id.slice(-6).toUpperCase()}`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f4', padding: '40px 20px' }}>
      {/* Action Toolbar - hidden on print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background-color: #fff !important; }
          .invoice-card { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important; 
            margin: 0 !important;
          }
        }
        .invoice-card {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 1px solid #e5e7eb;
          padding: 50px;
          color: #1f2937;
          font-family: 'Segoe UI', Roboto, Helvetica, sans-serif;
        }
        .flex-row { display: flex; justify-content: space-between; }
        .text-sm { font-size: 0.875rem; }
        .font-bold { font-weight: 700; }
        .border-b { border-bottom: 1px solid #e5e7eb; }
        .tax-table th, .tax-table td {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
        }
      `}} />

      <div className="no-print" style={{ maxWidth: '800px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/profile" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Profile
        </Link>
        <button 
          id="print-trigger"
          style={{ 
            backgroundColor: '#000', color: 'white', padding: '10px 20px', 
            border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
          }}
        >
          🖨️ Download Invoice PDF
        </button>
      </div>

      {/* Actual Tax Invoice Replicated perfectly */}
      <div className="invoice-card">
        <div className="flex-row" style={{ marginBottom: '35px', alignItems: 'flex-start' }}>
          <div>
            <img 
              src="https://floralwhite-marten-419677.hostingersite.com/wp-content/uploads/2023/02/logo-200-x-70-px.png" 
              alt="Vyoma" 
              style={{ height: '55px', objectFit: 'contain', marginBottom: '10px' }}
            />
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111' }}>Vyoma Linguistic Labs Foundation</div>
            <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
              155, 4th Cross Rd, Govindaraja Nagar Ward,<br />
              GKW Layout, Vijayanagar, Bengaluru, Karnataka 560040
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', color: '#4b5563' }}>
            <h2 style={{ fontSize: '20px', color: '#111', margin: '0 0 10px', fontWeight: '900', textTransform: 'uppercase' }}>Tax Invoice</h2>
            <div><strong>Invoice No:</strong> {invoiceNo}</div>
            <div><strong>Invoice Date:</strong> {dateStr}</div>
            <div><strong>Place of Supply:</strong> {purchase.placeOfSupply || purchase.user.state || 'Karnataka'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '35px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          {/* Seller Metadata */}
          <div>
            <h4 style={{ textTransform: 'uppercase', color: '#888', fontSize: '11px', margin: '0 0 8px', letterSpacing: '1px' }}>Seller Metadata</h4>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <strong>Vyoma Linguistic Labs Foundation</strong><br />
              GSTIN: <span className="font-bold">29AAECV2657F1Z4</span><br />
              PAN: <span className="font-bold">AAECV2657F</span><br />
              Email: support@vyomalabs.in
            </div>
          </div>

          {/* Billed To (Customer Details) */}
          <div>
            <h4 style={{ textTransform: 'uppercase', color: '#888', fontSize: '11px', margin: '0 0 8px', letterSpacing: '1px' }}>Billed To</h4>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
              <strong>{purchase.user.name || 'Member Account'}</strong><br />
              <span style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>
                {purchase.billingAddress || purchase.user.address || 'Address pending confirmation'}
                {purchase.user.city ? `, ${purchase.user.city}` : ''}
                {purchase.user.zipCode ? ` - ${purchase.user.zipCode}` : ''}
              </span><br />
              Email: {purchase.user.email}
            </div>
          </div>
        </div>

        {/* Transaction particulars & SAC Codes */}
        <table className="tax-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '30px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
              <th>Product / Description</th>
              <th>SAC Code</th>
              <th>Duration</th>
              <th style={{ textAlign: 'right' }}>Taxable Value</th>
              <th style={{ textAlign: 'right' }}>Rate</th>
              <th style={{ textAlign: 'right' }}>Total (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111' }}>{productName}</div>
                <div style={{ color: '#6b7280', fontSize: '12px' }}>Category: {category} | Type: {isBundle ? 'BUNDLE' : 'COURSE'}</div>
              </td>
              <td>998439</td>
              <td>{durationText}</td>
              <td style={{ textAlign: 'right' }}>₹{taxableValue}</td>
              <td style={{ textAlign: 'right' }}>18% GST</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Dynamic CGST/SGST/IGST breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #eee' }}>
            <strong>Payment Reference:</strong><br />
            Method: Online Payment Gateway (Razorpay)<br />
            Payment ID: <span style={{ fontFamily: 'monospace' }}>{purchase.razorpayPaymentId || 'pay_CAPTURED'}</span><br />
            Order ID: <span style={{ fontFamily: 'monospace' }}>{purchase.razorpayOrderId || 'order_CAPTURED'}</span>
          </div>

          <div style={{ marginLeft: 'auto', width: '100%', maxWidth: '300px' }}>
            <div className="flex-row text-sm" style={{ padding: '4px 0' }}>
              <span>Taxable Value (Base)</span>
              <span>₹{taxableValue}</span>
            </div>
            
            {isKarnataka ? (
              <>
                <div className="flex-row text-sm" style={{ padding: '4px 0', color: '#6b7280' }}>
                  <span>CGST (9%)</span>
                  <span>₹{cgst}</span>
                </div>
                <div className="flex-row text-sm" style={{ padding: '4px 0', color: '#6b7280', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                  <span>SGST (9%)</span>
                  <span>₹{sgst}</span>
                </div>
              </>
            ) : (
              <div className="flex-row text-sm" style={{ padding: '4px 0', color: '#6b7280', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                <span>IGST (18%)</span>
                <span>₹{igst}</span>
              </div>
            )}

            <div className="flex-row font-bold" style={{ padding: '12px 0', fontSize: '18px', color: '#111' }}>
              <span>Total Paid</span>
              <span>₹{amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Signature Box */}
        <div className="flex-row" style={{ marginTop: '60px', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '350px' }}>
            This is an electronically generated document. No physical signature is required under section 5 of the Information Technology Act.
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '5px' }}>For Vyoma Linguistic Labs Foundation</div>
            <div style={{ height: '40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontStyle: 'italic', color: '#555', borderBottom: '1px dashed #bbb', paddingBottom: '2px' }}>Authorized Signatory</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
          Thank you for subscribing to DigitalSanskrit - The World's First Sanskrit OTT platform.
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', () => {
          const btn = document.getElementById('print-trigger');
          if (btn) btn.onclick = () => window.print();
        });
      `}} />
    </div>
  );
}
