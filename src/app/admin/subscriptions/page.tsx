import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function getSafeSetting(key: string): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value || "";
  } catch (e) {
    console.error(`[SafeConfig] Read failure on key ${key}:`, e);
    return "";
  }
}

async function upsertSafeSetting(key: string, value: string) {
  try {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value, updatedAt: new Date() }
    });
  } catch (e) {
    console.error(`[SafeConfig] Upsert failed for ${key}:`, e);
  }
}

export default async function SubscriptionManagementPage() {
  // 1. Resiliently load settings directly from storage engine bypass
  const currentKey = await getSafeSetting('RAZORPAY_KEY_ID');
  const currentSecret = await getSafeSetting('RAZORPAY_KEY_SECRET');

  // 2. Test Connection immediately if credentials present
  let connectionStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING' = 'PENDING';
  let statusMsg = "Keys not provided.";

  if (currentKey && currentSecret) {
    try {
      const auth = Buffer.from(`${currentKey}:${currentSecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/plans?count=1', {
        headers: { Authorization: `Basic ${auth}` },
        next: { revalidate: 0 }
      });
      
      if (res.ok) {
        connectionStatus = 'ACTIVE';
        statusMsg = "Successfully synchronized with Razorpay Production Grid.";
      } else {
        connectionStatus = 'INACTIVE';
        statusMsg = "Remote accepted connect but rejected credentials. Verify live keys.";
      }
    } catch (e) {
       connectionStatus = 'INACTIVE';
       statusMsg = "Network conduit failure. Failed connecting to Razorpay cluster.";
    }
  }

  // 3. Load plans
  let plans = await prisma.plan.findMany();
  if (plans.length === 0) {
    await prisma.plan.createMany({
      data: [
        { name: 'GOLD', interval: 'MONTHLY', priceINR: 39, priceUSD: 5 },
        { name: 'GOLD', interval: 'YEARLY', priceINR: 399, priceUSD: 50 },
        { name: 'PLATINUM', interval: 'MONTHLY', priceINR: 49, priceUSD: 10 },
        { name: 'PLATINUM', interval: 'YEARLY', priceINR: 499, priceUSD: 100 }
      ]
    });
    plans = await prisma.plan.findMany();
  }

  // Actions
  async function updateKeys(formData: FormData) {
    "use server";
    const key = formData.get('keyId') as string;
    const secret = formData.get('keySecret') as string;

    await upsertSafeSetting('RAZORPAY_KEY_ID', key);
    await upsertSafeSetting('RAZORPAY_KEY_SECRET', secret);

    revalidatePath('/admin/subscriptions');
  }

  async function updatePlanPrice(formData: FormData) {
    "use server";
    const planId = formData.get('planId') as string;
    const inr = parseFloat(formData.get('inr') as string);
    const usd = parseFloat(formData.get('usd') as string);

    await prisma.plan.update({
      where: { id: planId },
      data: { priceINR: inr, priceUSD: usd }
    });
    revalidatePath('/admin/subscriptions');
  }

  async function addPlan(formData: FormData) {
    "use server";
    const name = (formData.get('name') as string || '').toUpperCase();
    const interval = (formData.get('interval') as string || 'MONTHLY').toUpperCase();
    const priceINR = parseFloat(formData.get('priceINR') as string || '0');
    const priceUSD = parseFloat(formData.get('priceUSD') as string || '0');

    if (!name) return;

    await prisma.plan.create({
      data: {
        name,
        interval,
        priceINR,
        priceUSD
      }
    });

    revalidatePath('/admin/subscriptions');
  }

  async function deletePlan(formData: FormData) {
    "use server";
    const planId = formData.get('planId') as string;
    if (!planId) return;

    await prisma.plan.delete({
      where: { id: planId }
    });

    revalidatePath('/admin/subscriptions');
  }

  return (
    <div style={{ maxWidth: '900px', paddingBottom: '80px' }}>
      <div className="admin-header" style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Payment & Gateway Orchestration</h1>
        <p style={{ color: '#aaa', marginTop: '5px' }}>Secure deployment of processing conduits and regional pricing vectors.</p>
      </div>

      {/* 1. Razorpay Connection Panel */}
      <div style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        {/* Live Indicator */}
        <div style={{ position: 'absolute', top: '25px', right: '25px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '8px 15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            background: connectionStatus === 'ACTIVE' ? '#46d369' : (connectionStatus === 'INACTIVE' ? '#e50914' : '#555'),
            boxShadow: connectionStatus === 'ACTIVE' ? '0 0 10px #46d369' : (connectionStatus === 'INACTIVE' ? '0 0 10px #e50914' : 'none')
          }}></div>
          <span style={{ fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
            {connectionStatus === 'ACTIVE' ? 'LIVE CONNECTION' : (connectionStatus === 'INACTIVE' ? 'DISCONNECTED' : 'AWAITING INPUT')}
          </span>
        </div>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          💳 Razorpay Key Infrastructure
        </h2>
        <p style={{ fontSize: '0.9rem', color: statusMsg.includes('Success') ? '#46d369' : '#888', marginBottom: '25px' }}>
          {statusMsg}
        </p>

        <form action={updateKeys} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', marginBottom: '5px' }}>Key ID</label>
            <input 
              type="text" 
              name="keyId" 
              defaultValue={currentKey} 
              placeholder="rzp_live_..."
              style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontFamily: 'monospace' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', marginBottom: '5px' }}>Key Secret</label>
            <input 
              type="password" 
              name="keySecret" 
              defaultValue={currentSecret}
              placeholder="••••••••••••••••"
              style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontFamily: 'monospace' }}
            />
          </div>
          <button type="submit" style={{ background: 'linear-gradient(to right, #2563eb, #4f46e5)', border: 'none', color: 'white', padding: '13px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            Apply & Link
          </button>
        </form>
      </div>

      {/* 2. Pricing Grid */}
      <div style={{ marginBottom: '15px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>Regional Pricing Engine</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Modulate dynamic plan fees reflecting local buying power.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {plans.map((plan) => (
          <div key={plan.id} style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: plan.name === 'PLATINUM' ? '#e50914' : '#f26422' }}>
                  {plan.name} 
                </h2>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', fontSize: '0.7rem', borderRadius: '4px' }}>{plan.interval}</span>
              </div>
              <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '5px' }}>Last updated: {new Date(plan.updatedAt).toLocaleDateString()}</p>
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
              <form action={updatePlanPrice} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                <input type="hidden" name="planId" value={plan.id} />
                <div>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Domestic (INR ₹)</label>
                  <input type="number" step="0.01" name="inr" defaultValue={plan.priceINR} style={{ background: '#0f1014', border: '1px solid #333', color: 'white', padding: '10px', borderRadius: '4px', width: '120px', fontSize: '1rem', fontWeight: 'bold' }} />
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '20px' }}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Abroad (USD $)</label>
                  <input type="number" step="0.01" name="usd" defaultValue={plan.priceUSD} style={{ background: '#0f1014', border: '1px solid #333', color: '#46d369', padding: '10px', borderRadius: '4px', width: '120px', fontSize: '1rem', fontWeight: 'bold' }} />
                </div>
                <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '42px' }}>Save Plan</button>
              </form>
              <form action={deletePlan} style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
                <input type="hidden" name="planId" value={plan.id} />
                <button type="submit" style={{ background: 'transparent', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.3)', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '42px' }}>
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Add New Plan Card */}
      <div style={{ background: 'linear-gradient(to right, #0f1624, #070b14)', border: '1px solid rgba(255,255,255,0.06)', padding: '25px', borderRadius: '12px', marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          ➕ Add New Subscription Plan
        </h2>
        <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px' }}>Inject a brand new tier or custom billing period into the regional pricing matrix.</p>
        <form action={addPlan} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '15px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Plan Name (e.g. VIP, GOLD, BASIC)</label>
            <input required type="text" name="name" placeholder="VIP" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '5px', color: '#fff', fontWeight: 'bold' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Billing Cycle</label>
            <select name="interval" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '5px', color: '#fff', height: '42px', fontWeight: 'bold' }}>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Domestic (INR ₹)</label>
            <input required type="number" step="0.01" name="priceINR" placeholder="299" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '5px', color: '#fff' }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Abroad (USD $)</label>
            <input required type="number" step="0.01" name="priceUSD" placeholder="9.99" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid #333', borderRadius: '5px', color: '#fff' }} />
          </div>
          <button type="submit" style={{ background: '#f26422', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '42px' }}>
            Create Plan
          </button>
        </form>
      </div>
    </div>
  );
}
