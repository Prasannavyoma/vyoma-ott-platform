import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { getDefaultSubject, getDefaultBody, verifySmtpConnection } from '@/lib/mail';
import EmailTemplateManager from './EmailTemplateManager';
import TriggerLifecycleButton from './TriggerLifecycleButton';

async function getSetting(key: string) {
  try {
    // Standard decoupled direct fallback
    // @ts-ignore
    const result = await prisma.$queryRawUnsafe(`SELECT value FROM SystemSetting WHERE key = ?`, key);
    return Array.isArray(result) && result.length > 0 ? result[0].value : '';
  } catch(e) { return ''; }
}

export default async function EmailSettingsPage() {
  const connectionStatus = await verifySmtpConnection();

  const smtpHost = await getSetting('SMTP_HOST') || 'smtp.gmail.com';
  const smtpPort = await getSetting('SMTP_PORT') || '587';
  const smtpUser = await getSetting('SMTP_USER') || '';
  const smtpPass = await getSetting('SMTP_PASS') || ''; // The app password

  // Fetch all registered users to configure mock transmission presets
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' }
  });

  const templateKeys = ['WELCOME', 'WINBACK', 'RENEWAL', 'UPGRADE'];
  const savedTemplates = [];

  for (const key of templateKeys) {
    const sSetting = await prisma.systemSetting.findUnique({ where: { key: `TEMPLATE_${key}_SUBJECT` } });
    const bSetting = await prisma.systemSetting.findUnique({ where: { key: `TEMPLATE_${key}_BODY` } });

    if (sSetting || bSetting) {
      savedTemplates.push({
        key,
        subject: sSetting?.value || getDefaultSubject(key),
        body: bSetting?.value || getDefaultBody(key)
      });
    }
  }

  const defaultSubjects = {
    WELCOME: getDefaultSubject('WELCOME'),
    WINBACK: getDefaultSubject('WINBACK'),
    RENEWAL: getDefaultSubject('RENEWAL'),
    UPGRADE: getDefaultSubject('UPGRADE'),
  };

  const defaultBodies = {
    WELCOME: getDefaultBody('WELCOME'),
    WINBACK: getDefaultBody('WINBACK'),
    RENEWAL: getDefaultBody('RENEWAL'),
    UPGRADE: getDefaultBody('UPGRADE'),
  };

  async function saveSettings(formData: FormData) {
    "use server";
    const host = formData.get('host') as string;
    const port = formData.get('port') as string;
    const user = formData.get('user') as string;
    const pass = formData.get('pass') as string;

    const updates = [
      { k: 'SMTP_HOST', v: host },
      { k: 'SMTP_PORT', v: port },
      { k: 'SMTP_USER', v: user },
      { k: 'SMTP_PASS', v: pass },
    ];

    for (const update of updates) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO SystemSetting ("key", "value", "updatedAt") VALUES (?, ?, ?)
         ON CONFLICT("key") DO UPDATE SET "value"=excluded."value", "updatedAt"=excluded."updatedAt"`,
        update.k, update.v, new Date().toISOString()
      );
    }
    revalidatePath('/admin/email-settings');
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
       
       {/* HEADER SECTION */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0 }}>✉️ Email Communications Matrix</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '20px' }}>
                   <span style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: connectionStatus.success ? '#46d369' : '#ff6b6b',
                      boxShadow: connectionStatus.success ? '0 0 10px #46d369, 0 0 4px #46d369' : '0 0 10px #ff6b6b, 0 0 4px #ff6b6b'
                   }} />
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, color: connectionStatus.success ? '#46d369' : '#ff6b6b' }}>
                      {connectionStatus.success ? 'GATEWAY ONLINE' : 'GATEWAY OFFLINE'}
                   </span>
                </div>
             </div>
             <p style={{ color: '#666', marginTop: '4px', fontSize: '0.9rem' }}>
                Anchor SMTP credentials and customize transactional lifecycle notification templates.
             </p>
          </div>
          <Link href="/admin" style={{ background: 'rgba(255,255,255,0.05)', color: '#bbb', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)' }}>
            ← Back
          </Link>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', alignItems: 'start' }}>
          
          {/* SMTP CREDENTIALS */}
          <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '30px', borderRadius: '20px' }}>
             <h3 style={{ margin: '0 0 20px 0', fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>🔐 Gateway Configuration</h3>
             
             <form action={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                     <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>SMTP HOST</label>
                     <input required type="text" name="host" defaultValue={smtpHost} placeholder="smtp.gmail.com" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                     <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>PORT</label>
                     <input required type="text" name="port" defaultValue={smtpPort} placeholder="587" style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                   <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>SMTP USERNAME / ADDRESS</label>
                   <input required type="email" name="user" defaultValue={smtpUser} placeholder="your-name@gmail.com" style={inputStyle} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                   <label style={{ fontSize: '0.75rem', color: '#888', fontWeight: 700 }}>APP PASSWORD (SENSITIVE)</label>
                   <input type="password" name="pass" defaultValue={smtpPass} placeholder="••••••••••••••••" style={inputStyle} />
                   <p style={{ fontSize: '0.7rem', color: '#555', marginTop: '3px' }}>For Gmail, utilize a 16-character Google App Password rather than standard account credentials.</p>
                </div>

                <div style={{ marginTop: '10px' }}>
                   <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--primary, #f26422)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.85rem' }}>
                     💾 ACTIVATE MAIL GATEWAY
                   </button>
                </div>

             </form>
          </div>

          {/* STATUS TRACING SIDEBAR */}
          <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '30px', borderRadius: '20px' }}>
             <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 800, color: '#46d369' }}>⚡ Active Life Cycle Conduits</h3>
             <ul style={{ fontSize: '0.85rem', color: '#aaa', paddingLeft: '20px', margin: 0, lineHeight: '2.0' }}>
                <li>Pre-registration Lifecycle: <strong>ACTIVE</strong></li>
                <li>Inactivity Retention Matrix: <strong>STANDBY</strong></li>
                <li>Renewal Churn Matrix: <strong>STANDBY</strong></li>
                <li>Privilege Upsell Prompts: <strong>STANDBY</strong></li>
             </ul>
             <TriggerLifecycleButton />
          </div>
       </div>

       {/* EMAIL TEMPLATES MANAGER */}
       <EmailTemplateManager 
         users={users}
         savedTemplates={savedTemplates}
         defaultSubjects={defaultSubjects}
         defaultBodies={defaultBodies}
       />

    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#000',
  border: '1px solid #1c1c24',
  color: '#fff',
  padding: '12px 15px',
  borderRadius: '8px',
  outline: 'none',
  fontSize: '0.9rem'
};
