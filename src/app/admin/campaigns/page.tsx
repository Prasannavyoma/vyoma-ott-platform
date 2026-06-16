import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendPromotionalCampaignEmail } from '@/lib/mail';
import EmailCampaignForge from '../components/EmailCampaignForge';

async function getSetting(key: string) {
  try {
    const res = await prisma.$queryRawUnsafe(`SELECT value FROM SystemSetting WHERE key = ? LIMIT 1`, key) as any[];
    return res?.[0]?.value || "";
  } catch (e) { return ""; }
}

export default async function CampaignsPage() {
  const appId = await getSetting('ONESIGNAL_APP_ID');
  const apiKey = await getSetting('ONESIGNAL_API_KEY');
  const totalUsersCount = await prisma.user.count();

  // Server Action: Loop over users and dispatch email blast
  async function dispatchEmailCampaign(fd: FormData) {
    "use server";
    const subject = fd.get('subject') as string;
    const bannerUrl = fd.get('bannerUrl') as string;
    const body = fd.get('body') as string;
    const ctaText = fd.get('ctaText') as string;
    const ctaUrl = fd.get('ctaUrl') as string;

    const users = await prisma.user.findMany({
      select: { email: true, name: true }
    });

    let dispatchedCount = 0;
    for (const u of users) {
      try {
        await sendPromotionalCampaignEmail(u.email, u.name || "", subject, bannerUrl, body, ctaText, ctaUrl);
        dispatchedCount++;
      } catch (err) {
        console.error(`Failed to send campaign mail to ${u.email}`, err);
      }
    }

    return { success: true, dispatched: dispatchedCount };
  }

  async function saveConfig(fd: FormData) {
    "use server";
    const aid = fd.get('appId') as string;
    const akey = fd.get('apiKey') as string;
    
    const q = `INSERT INTO SystemSetting ("key", "value", "updatedAt") VALUES (?, ?, ?) 
               ON CONFLICT("key") DO UPDATE SET "value"=excluded."value", "updatedAt"=excluded."updatedAt"`;
    await prisma.$executeRawUnsafe(q, 'ONESIGNAL_APP_ID', aid, new Date().toISOString());
    await prisma.$executeRawUnsafe(q, 'ONESIGNAL_API_KEY', akey, new Date().toISOString());
    
    revalidatePath('/admin/campaigns');
  }

  async function dispatchBlast(fd: FormData) {
    "use server";
    const title = fd.get('title') as string;
    const message = fd.get('message') as string;
    const url = fd.get('url') as string;

    const aid = await getSetting('ONESIGNAL_APP_ID');
    const akey = await getSetting('ONESIGNAL_API_KEY');

    if (!aid || !akey) {
      console.error("OneSignal creds missing.");
      return;
    }

    try {
      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${akey}`
        },
        body: JSON.stringify({
          app_id: aid,
          included_segments: ["All"],
          headings: { "en": title },
          contents: { "en": message },
          url: url || undefined
        })
      });
      const json = await res.json();
      console.log("Blast payload:", json);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div style={{ paddingBottom: '50px' }}>
      <div className="admin-header" style={{ marginBottom: '30px' }}>
         <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Campaign Blast Forge</h1>
         <p style={{ color: '#888', marginTop: '4px' }}>Commandeer direct broadcast conduits yielding immediate engagement saturation across mobile and desktop surfaces.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* LEFT: Integration */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)', alignSelf: 'start' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '1rem', fontWeight: 800 }}>🛰️ OneSignal Conduits</h3>
          <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '20px' }}>Map your external app handles powering browser push vectors.</p>
          
          <form action={saveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <div>
               <label style={{ fontSize: '0.7rem', color: '#aaa', display: 'block', marginBottom: '5px' }}>App ID</label>
               <input type="text" name="appId" defaultValue={appId} placeholder="xxxx-xxxx-xxxx" style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '6px' }} />
             </div>
             <div>
               <label style={{ fontSize: '0.7rem', color: '#aaa', display: 'block', marginBottom: '5px' }}>REST API Key (Sensitive)</label>
               <input type="password" name="apiKey" defaultValue={apiKey} placeholder="••••••••••••" style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '6px' }} />
             </div>
             <button type="submit" style={{ background: '#444', color: '#fff', padding: '10px', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>
               Save Keys
             </button>
          </form>
        </div>

        {/* RIGHT: Creator */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 800 }}>🚀 Spawn Instant Campaign</h3>
           
           <form action={dispatchBlast} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>Notification Title</label>
                <input required type="text" name="title" placeholder="e.g., Live Stream Commencing Soon!" style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '15px', borderRadius: '8px', color: '#fff', fontSize: '1rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>Push Body Message</label>
                <textarea required name="message" rows={3} placeholder="Capture immediate user awareness with actionable text segments..." style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '15px', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'none' }}></textarea>
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>Launch Target URL (Optional)</label>
                <input type="text" name="url" placeholder="https://..." style={{ width: '100%', background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff' }} />
              </div>

              <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                 {(!appId || !apiKey) ? (
                   <div style={{ color: '#f26422', fontSize: '0.85rem', background: 'rgba(242,100,34,0.1)', padding: '12px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(242,100,34,0.2)' }}>
                     ⚠️ Deployment locked. Resolve OneSignal Conduits configuration to unfreeze ignition triggers.
                   </div>
                 ) : (
                   <button type="submit" style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '15px', borderRadius: '8px', border: 'none', fontSize: '1.1rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 30px rgba(242, 100, 34, 0.2)' }}>
                     IGNITE PUSH BLAST NOW
                   </button>
                 )}
              </div>
           </form>
        </div>

      </div>

      <div style={{ marginTop: '40px' }}>
        <EmailCampaignForge totalUsersCount={totalUsersCount} dispatchEmailCampaign={dispatchEmailCampaign} />
      </div>
    </div>
  );
}
