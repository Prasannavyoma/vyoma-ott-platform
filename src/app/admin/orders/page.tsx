import prisma from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function OrdersAdminPage() {
  // Fetch standard course purchases
  const standardPurchases = await prisma.purchase.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      course: true
    }
  });

  // Fetch bundle purchases
  const bundlePurchases = await prisma.bundlePurchase.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      bundle: true
    }
  });

  // Normalize into a unified ledger format for the finance team
  const rawLedger = [
    ...standardPurchases.map(p => ({
      ...p,
      type: 'COURSE',
      productName: p.course?.title || 'Unknown Course',
      // Ensure safe fallback if missing
      hsnCode: (p as any).hsnCode || '998439',
      placeOfSupply: (p as any).placeOfSupply || p.user?.state || 'Unknown',
      billingAddress: (p as any).billingAddress || p.user?.address || 'Unknown'
    })),
    ...bundlePurchases.map(p => ({
      ...p,
      type: 'BUNDLE',
      productName: p.bundle?.title || 'Unknown Bundle',
      hsnCode: '998439', // Standard digital goods fallback
      placeOfSupply: p.user?.state || 'Unknown',
      billingAddress: p.user?.address || 'Unknown'
    }))
  ];

  // Sort unified ledger descending by creation time
  const orders = rawLedger.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Server Action to update metadata directly by Finance Team
  async function updateOrderMetadata(formData: FormData) {
    "use server";
    const orderId = formData.get('orderId') as string;
    const type = formData.get('type') as string;
    const hsnCode = formData.get('hsnCode') as string;
    const placeOfSupply = formData.get('placeOfSupply') as string;

    if (type === 'COURSE') {
      await prisma.purchase.update({
        where: { id: orderId },
        data: { hsnCode, placeOfSupply } as any
      });
    }
    revalidatePath('/admin/orders');
  }



  // Server Action to delete a selected transaction record
  async function deleteOrder(formData: FormData) {
    "use server";
    const orderId = formData.get('orderId') as string;
    const type = formData.get('type') as string;

    if (type === 'COURSE') {
      await prisma.purchase.delete({ where: { id: orderId } });
    } else {
      await prisma.bundlePurchase.delete({ where: { id: orderId } });
    }

    revalidatePath('/admin/orders');
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Financial Orders & Ledger</h1>
          <p style={{ color: '#888' }}>WooCommerce-style ledger for the Finance team to track, export, and modify transaction metadata.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>

           <button style={{ background: '#fff', color: '#000', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
             📥 Export CSV Report
           </button>
        </div>
      </div>

      <div style={{ background: 'var(--card-bg, #111)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#1a1a1a', color: '#888', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '15px' }}>Order Ref / Date</th>
              <th style={{ padding: '15px' }}>Customer Entity</th>
              <th style={{ padding: '15px' }}>Line Item (Product)</th>
              <th style={{ padding: '15px' }}>Gross Amount</th>
              <th style={{ padding: '15px' }}>Razorpay Payment ID</th>
              <th style={{ padding: '15px' }}>Finance Tax Meta (HSN/PoS)</th>
              <th style={{ padding: '15px' }}>Audit Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#555' }}>No orders captured in the ledger yet. Orders will appear automatically when users purchase on the website.</td></tr>
            )}
            {orders.map((order: any) => (
              <tr key={`${order.type}-${order.id}`} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                  <div style={{ color: '#666', fontSize: '0.75rem' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{order.user?.name || 'Guest User'}</div>
                  <div style={{ color: '#888', fontSize: '0.8rem' }}>{order.user?.email}</div>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary, #f26422)', fontSize: '0.85rem' }}>{order.productName}</div>
                  <div style={{ fontSize: '0.7rem', display: 'inline-block', background: '#222', padding: '2px 6px', borderRadius: '4px', color: '#aaa', marginTop: '4px' }}>{order.type}</div>
                </td>
                <td style={{ padding: '15px', fontWeight: 'bold', color: '#46d369' }}>
                  ₹{order.amount || '0'}
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: order.razorpayPaymentId ? '#ccc' : '#f00' }}>
                    {order.razorpayPaymentId || 'AWAITING PAYMENT'}
                  </div>
                  {order.razorpayOrderId && (
                    <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '3px' }}>Ord: {order.razorpayOrderId}</div>
                  )}
                </td>
                <td style={{ padding: '15px', minWidth: '250px' }}>
                  <form action={updateOrderMetadata} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="type" value={order.type} />
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.7rem', color: '#888', width: '35px' }}>HSN:</span>
                       <input type="text" name="hsnCode" defaultValue={order.hsnCode} style={{ background: '#000', border: '1px solid #333', color: '#ccc', fontSize: '0.75rem', padding: '4px', borderRadius: '4px', width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                       <span style={{ fontSize: '0.7rem', color: '#888', width: '35px' }}>PoS:</span>
                       <input type="text" name="placeOfSupply" defaultValue={order.placeOfSupply} style={{ background: '#000', border: '1px solid #333', color: '#ccc', fontSize: '0.75rem', padding: '4px', borderRadius: '4px', width: '100%' }} />
                    </div>
                    {order.type === 'COURSE' && (
                       <button type="submit" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', fontSize: '0.7rem', padding: '4px', cursor: 'pointer', borderRadius: '4px', marginTop: '2px' }}>Update Meta</button>
                    )}
                  </form>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link href={`/admin/invoices/${order.id}`} style={{ display: 'inline-block', background: 'rgba(70, 211, 105, 0.1)', border: '1px solid rgba(70, 211, 105, 0.2)', color: '#46d369', fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' }}>
                      📄 View Invoice
                    </Link>
                    <form action={deleteOrder} style={{ margin: 0 }}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="type" value={order.type} />
                      <button type="submit" style={{ background: 'rgba(255, 0, 0, 0.08)', border: '1px solid rgba(255, 0, 0, 0.15)', color: '#ff4444', fontSize: '0.75rem', padding: '6px 12px', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>
                        🗑️ Void Order
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
