import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export default async function AuthSettingsPage() {
  // Load current values
  let allowPassword = "true";
  let allowGoogle = "false";
  let googleClientId = "";

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['AUTH_ALLOW_PASSWORD', 'AUTH_ALLOW_GOOGLE', 'AUTH_GOOGLE_CLIENT_ID']
        }
      }
    });

    for (const s of settings) {
      if (s.key === 'AUTH_ALLOW_PASSWORD') allowPassword = s.value;
      if (s.key === 'AUTH_ALLOW_GOOGLE') allowGoogle = s.value;
      if (s.key === 'AUTH_GOOGLE_CLIENT_ID') googleClientId = s.value;
    }
  } catch (e) {
    console.error("Failed to load auth settings:", e);
  }

  async function saveAuthSettings(fd: FormData) {
    "use server";
    const allowPassVal = fd.get('allowPassword') as string;
    const allowGoogleVal = fd.get('allowGoogle') as string;
    const clientIDVal = (fd.get('googleClientId') as string) || "";

    const data = [
      { key: 'AUTH_ALLOW_PASSWORD', value: allowPassVal || "true" },
      { key: 'AUTH_ALLOW_GOOGLE', value: allowGoogleVal || "false" },
      { key: 'AUTH_GOOGLE_CLIENT_ID', value: clientIDVal }
    ];

    for (const item of data) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value }
      });
    }

    revalidatePath('/admin/auth-settings');
    revalidatePath('/login');
    revalidatePath('/register');
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔑</span> Authentication & Login Portal Controls
          </h1>
          <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
            Toggle login/register methods, enable Google Single Sign-On (SSO), and configure your OAuth keys.
          </p>
        </div>
        <Link href="/admin" style={{ background: 'rgba(255,255,255,0.05)', color: '#bbb', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.08)' }}>
          ← Back
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '40px' }}>
        
        {/* CONFIGURATION FORM */}
        <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', borderRadius: '20px', padding: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <form action={saveAuthSettings} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Setting 1: Standard Password Login */}
            <div style={settingRow}>
              <div style={infoPane}>
                <h3 style={settingTitle}>📧 Standard Password Credentials</h3>
                <p style={settingDesc}>Allow users to register and sign in using standard Email and Password credentials.</p>
              </div>
              <div>
                <select name="allowPassword" defaultValue={allowPassword} style={selectStyle}>
                  <option value="true">🟢 ENABLED</option>
                  <option value="false">🔴 DISABLED</option>
                </select>
              </div>
            </div>

            <hr style={divider} />

            {/* Setting 2: Google SSO Login */}
            <div style={settingRow}>
              <div style={infoPane}>
                <h3 style={settingTitle}>🌐 Google Sign-In (Single Sign-On)</h3>
                <p style={settingDesc}>Enable the Google OAuth button on Login & Registration flows so users can instantly sign in.</p>
              </div>
              <div>
                <select name="allowGoogle" defaultValue={allowGoogle} style={selectStyle}>
                  <option value="true">🟢 ENABLED</option>
                  <option value="false">🔴 DISABLED</option>
                </select>
              </div>
            </div>

            <hr style={divider} />

            {/* Setting 3: Google Client ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Google Client ID (OAuth Web Client ID)
              </label>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#555', lineHeight: '1.4' }}>
                Generate a Web Application OAuth Client ID in your Google Cloud Console (credentials section), register your domain's authorized redirects, and enter it here.
              </p>
              <input 
                type="text" 
                name="googleClientId" 
                defaultValue={googleClientId} 
                placeholder="e.g. 123456789-abc123xyz.apps.googleusercontent.com" 
                style={inputStyle} 
              />
            </div>

            <div style={{ marginTop: '10px', borderTop: '1px solid #1c1c24', paddingTop: '25px', textAlign: 'right' }}>
              <button type="submit" style={{ background: 'var(--primary, #f26422)', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 5px 15px rgba(242,100,34,0.3)', transition: 'all 0.2s' }}>
                💾 SAVE PORTAL CONTROLS
              </button>
            </div>

          </form>
        </div>

        {/* SIDEBAR SUMMARY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'linear-gradient(135deg, rgba(242,100,34,0.05) 0%, rgba(15,22,36,0.6) 100%)', border: '1px solid rgba(242,100,34,0.2)', padding: '25px', borderRadius: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#ffaf85', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💡</span> Google SSO Setup Guide
            </h4>
            <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: '#aaa', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary, #f26422)', textDecoration: 'none' }}>Google Cloud Console</a>.</li>
              <li>Create or select your project, go to <strong>API & Services &gt; Credentials</strong>.</li>
              <li>Click <strong>Create Credentials &gt; OAuth client ID</strong>.</li>
              <li>Select <strong>Web application</strong>.</li>
              <li>Add your platform domain (e.g. <code>https://vyoma-ott.example.com</code> or <code>http://localhost:3000</code>) to <strong>Authorized JavaScript origins</strong>.</li>
              <li>Copy the client ID and paste it into the field on the left.</li>
            </ol>
          </div>

          <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '25px', borderRadius: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>⚙️ Active Portal Settings</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: '#666' }}>Password login</span>
                <span style={{ color: allowPassword === "true" ? '#46d369' : '#e50914', fontWeight: 'bold' }}>
                  {allowPassword === "true" ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                <span style={{ color: '#666' }}>Google Sign-In</span>
                <span style={{ color: allowGoogle === "true" ? '#46d369' : '#e50914', fontWeight: 'bold' }}>
                  {allowGoogle === "true" ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ color: '#666' }}>Registered Client ID</span>
                <span style={{ color: googleClientId ? '#aaa' : '#e50914', fontSize: '0.75rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {googleClientId || 'none'}
                </span>
              </div>
            </div>
          </div>

          {/* ANTI-SPAM MATRIX */}
          <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '25px', borderRadius: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#46d369', boxShadow: '0 0 8px #46d369' }}></span>
               <span>🛡️ Auto Spam Defender</span>
            </h4>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>
              Multi-vector heuristic audits run in the background to automatically identify spambots.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', color: '#aaa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                <span>Identity Honeypot Trap</span>
                <strong style={{ color: '#46d369' }}>ACTIVE</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                <span>Disposable Domain Blacklist</span>
                <strong style={{ color: '#46d369' }}>ACTIVE</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                <span>Injected Link Rejection</span>
                <strong style={{ color: '#46d369' }}>ACTIVE</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                <span>Ad Keyword Filters</span>
                <strong style={{ color: '#46d369' }}>ACTIVE</strong>
              </div>
            </div>
          </div>

          {/* FUTURE HACKING ACTIONS */}
          <div style={{ background: '#0a0a0c', border: '1px solid #1c1c24', padding: '25px', borderRadius: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#f26422', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <span>🔒 Security Hardening Blueprint</span>
            </h4>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>
              Immediate actions to enhance security and prevent malicious hacking attempts:
            </p>
            <ol style={{ margin: 0, paddingLeft: '15px', fontSize: '0.75rem', color: '#aaa', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <strong>HTTP Headers (Helmet)</strong>: Install <code>helmet</code> to shield headers from cross-site scripting (XSS) and clickjacking.
              </li>
              <li>
                <strong>API Rate Limiting</strong>: Implement request throttling (e.g. max 100 queries/min per IP) to guard against brute-force login attempts.
              </li>
              <li>
                <strong>CSRF Verification</strong>: Embed secure tokens on mutations to protect POST operations from unauthorized remote calls.
              </li>
              <li>
                <strong>Parameterized DB Access</strong>: Fully phase out raw SQL string concatenation to eliminate SQL Injection vectors.
              </li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
}

// Styling Constants
const settingRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '20px'
};

const infoPane: React.CSSProperties = {
  flex: 1
};

const settingTitle: React.CSSProperties = {
  margin: '0 0 5px 0',
  fontSize: '1.1rem',
  fontWeight: 800,
  color: '#fff'
};

const settingDesc: React.CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#666',
  lineHeight: '1.4'
};

const switchContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center'
};

const switchLabel: React.CSSProperties = {
  position: 'relative',
  display: 'inline-block',
  width: '50px',
  height: '26px'
};

const checkboxStyle: React.CSSProperties = {
  opacity: 0,
  width: 0,
  height: 0
};

const switchSlider: React.CSSProperties = {
  position: 'absolute',
  cursor: 'pointer',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#333',
  transition: '.3s',
  borderRadius: '34px'
};

// We will handle slider circle in global css or custom style inline:
// Standard input checkbox checked styling is easier via standard checkboxes:
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

const selectStyle: React.CSSProperties = {
  background: '#000',
  border: '1px solid #1c1c24',
  color: '#fff',
  padding: '10px 15px',
  borderRadius: '8px',
  outline: 'none',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #1c1c24',
  margin: 0
};
