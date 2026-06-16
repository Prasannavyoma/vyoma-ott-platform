import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export default async function VoucherManager() {
  let vouchers: any[] = [];
  try {
     // Decoupled conduit
     // @ts-ignore
     vouchers = await prisma.$queryRawUnsafe(`SELECT * FROM SubscriptionVoucher ORDER BY createdAt DESC LIMIT 50`);
  } catch(e) {}

  async function generateVouchers(formData: FormData) {
     "use server";
     const count = parseInt(formData.get('count') as string || "1");
     const plan = formData.get('plan') as string;
     const sponsor = formData.get('sponsor') as string || "Platform Admin";

     function generateCode() {
       return "VYOMA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
     }

     for(let i=0; i < Math.min(count, 100); i++) {
        const id = `vc_${Date.now()}_${i}`;
        const code = generateCode();
        const now = new Date().toISOString();
        try {
           await prisma.$executeRawUnsafe(
             `INSERT INTO SubscriptionVoucher (id, code, plan, months, isUsed, sponsoredBy, createdAt) VALUES (?,?,?,12,0,?,?)`,
             id, code, plan, sponsor, now
           );
        } catch(e) {}
     }
     revalidatePath('/admin/vouchers');
  }

  return (
    <div>
       <div className="admin-header" style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Gift & Sponsor Vouchers</h1>
          <p style={{ color: '#888', marginTop: '4px' }}>Generate pre-paid subscription codes facilitating bulk distribution, gifting, or institutional access logic.</p>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          
          <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <h3 style={{ marginBottom: '20px', fontWeight: 800 }}>Spawn Pre-Paid Pool</h3>
             <form action={generateVouchers} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>Batch Volume (Max 100)</label>
                   <input required type="number" name="count" defaultValue="1" min="1" max="100" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>Designated Plan</label>
                   <select required name="plan" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }}>
                      <option value="GOLD">GOLD Annual</option>
                      <option value="PLATINUM">PLATINUM Annual</option>
                   </select>
                </div>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '5px' }}>Sponsor / Benefactor Name</label>
                   <input required type="text" name="sponsor" placeholder="e.g. Corporate Gift Group" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', borderRadius: '6px', color: '#fff' }} />
                </div>
                <button type="submit" style={{ padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}>
                  Inject Vouchers
                </button>
             </form>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
             <h3 style={{ marginBottom: '20px', fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
                <span>Generated Vault (Last 50)</span>
             </h3>
             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                   <tr style={{ textAlign: 'left', color: '#555', borderBottom: '1px solid #222' }}>
                      <th style={{ padding: '10px 0' }}>Secure Code</th>
                      <th style={{ padding: '10px 0' }}>Plan</th>
                      <th style={{ padding: '10px 0' }}>State</th>
                      <th style={{ padding: '10px 0' }}>Sponsor</th>
                   </tr>
                </thead>
                <tbody>
                   {vouchers.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#444' }}>No minted vouchers found.</td></tr>
                   ) : (
                      vouchers.map((v) => (
                         <tr key={v.id} style={{ borderBottom: '1px solid #111' }}>
                            <td style={{ padding: '12px 0', fontFamily: 'monospace', color: '#46d369', fontWeight: 'bold' }}>{v.code}</td>
                            <td style={{ padding: '12px 0' }}>{v.plan}</td>
                            <td style={{ padding: '12px 0' }}>
                               <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: v.isUsed ? '#333' : '#111', color: v.isUsed ? '#666' : '#f26422' }}>
                                 {v.isUsed ? "CONSUMED" : "ACTIVE"}
                               </span>
                            </td>
                            <td style={{ padding: '12px 0', color: '#777' }}>{v.sponsoredBy}</td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>

       </div>
    </div>
  );
}
