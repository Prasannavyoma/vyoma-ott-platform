import nodemailer from 'nodemailer';
import prisma from './prisma';

async function getDynamicTransporter() {
  // Dynamic lookup bypassing Next cache artifacts
  // @ts-ignore
  const settingsRaw = await prisma.$queryRawUnsafe(`SELECT key, value FROM SystemSetting WHERE key LIKE 'SMTP_%'`);
  
  const settings: Record<string, string> = {};
  if (Array.isArray(settingsRaw)) {
    settingsRaw.forEach((s: any) => { settings[s.key] = s.value; });
  }

  const host = settings['SMTP_HOST'] || 'smtp.gmail.com';
  const port = parseInt(settings['SMTP_PORT'] || '587');
  const user = settings['SMTP_USER'] || '';
  const pass = settings['SMTP_PASS'] || '';

  if (!user || !pass) {
    console.log("[Mail System] SMTP not fully initialized. Skipping dispatch.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function verifySmtpConnection() {
  try {
    const transporter = await getDynamicTransporter();
    if (!transporter) return { success: false, reason: 'Credentials not configured' };
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return { success: false, reason: error.message };
  }
}


function getLuxuryWrap(contentHtml: string, preheader: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body { background-color: #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #fff; margin: 0; padding: 0; }
        .wrap { max-width: 600px; margin: 0 auto; background: #0a0a0a; border: 1px solid #222; padding: 40px; border-radius: 16px; margin-top: 40px; }
        .brand { font-size: 24px; font-weight: 900; color: #f26422; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; text-align: center;}
        h1 { font-size: 22px; margin-bottom: 15px; }
        p { color: #ccc; font-size: 16px; line-height: 1.6; }
        .btn { display: inline-block; padding: 15px 30px; background: #f26422; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #222; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div style="display:none; max-height:0; overflow:hidden;">${preheader}</div>
      <div class="wrap">
        <div class="brand">Vyoma OTT</div>
        ${contentHtml}
        <div class="footer">© 2026 Vyoma Linguistic Labs Foundation. All transactional data secured.</div>
      </div>
    </body>
    </html>
  `;
}

export function getDefaultSubject(key: string): string {
  switch (key) {
    case 'WELCOME':
      return '🎉 Welcome to Vyoma - Your Vedic Portal is Ready!';
    case 'WINBACK':
      return '🌸 We Miss You at Vyoma - Reconnect with Vedic Knowledge';
    case 'RENEWAL':
      return '⚠️ Action Required: Keep Your Premium Access Active';
    case 'UPGRADE':
      return '⚡ Elevate Your Sanskrit Journey: Upgrade to Premium';
    default:
      return 'Notification from Vyoma';
  }
}

export function getDefaultBody(key: string): string {
  switch (key) {
    case 'WELCOME':
      return `<h1>Auspicious Beginnings, {{name}}!</h1>
<p>Your global key to deep Vedic insights and curated curricular streams has been provisioned successfully.</p>
<p>You now hold unfettered access to our fundamental knowledge tier. Begin iterating through your chosen taxonomy path immediately.</p>
<a href="{{platform_url}}" class="btn">Enter Platform</a>`;
    case 'WINBACK':
      return `<h1>Pranam, {{name}}!</h1>
<p>It's been a while since we saw you on the platform. The path of wisdom is a continuous journey, and we have uploaded new Sanskrit streams and interactive games since your last session.</p>
<p>Come back today to continue your study and keep earning coins towards exclusive rewards!</p>
<a href="{{platform_url}}" class="btn">Resume Learning</a>`;
    case 'RENEWAL':
      return `<h1>Pranam, {{name}}!</h1>
<p>Your premium access plan is expiring soon (or has expired). To ensure uninterrupted access to your active courses, quizzes, and digital certificates, please renew your subscription today.</p>
<p>Choose from our flexible annual or monthly Gold & Platinum plans designed for serious learners.</p>
<a href="{{platform_url}}/subscribe" class="btn">Renew Subscription Now</a>`;
    case 'UPGRADE':
      return `<h1>Unlock the Full Horizon, {{name}}!</h1>
<p>You are currently on our free tier. Did you know that Premium Gold & Platinum learners get access to unlimited audiobooks, interactive Sanskrit grammar quizzes, and digital certifications?</p>
<p>Upgrade today and take your learning to the next level.</p>
<a href="{{platform_url}}/subscribe" class="btn">View Premium Plans</a>`;
    default:
      return `<p>Hello {{name}}, you have a new update from Vyoma!</p>`;
  }
}

export async function sendTemplatedEmail(to: string, templateKey: string, templateVars: Record<string, string>) {
  const transporter = await getDynamicTransporter();
  if (!transporter) {
    console.log(`[Mail System] SMTP not configured. Simulating email dispatch for ${templateKey} to ${to}`);
    return;
  }

  const subjectKey = `TEMPLATE_${templateKey}_SUBJECT`;
  const bodyKey = `TEMPLATE_${templateKey}_BODY`;

  const sSetting = await prisma.systemSetting.findUnique({ where: { key: subjectKey } });
  const bSetting = await prisma.systemSetting.findUnique({ where: { key: bodyKey } });

  let subject = sSetting?.value || getDefaultSubject(templateKey);
  let body = bSetting?.value || getDefaultBody(templateKey);

  // Substitute variables
  for (const [k, v] of Object.entries(templateVars)) {
    const regex = new RegExp(`{{${k}}}`, 'g');
    subject = subject.replace(regex, v);
    body = body.replace(regex, v);
  }

  const html = getLuxuryWrap(body, subject);

  await transporter.sendMail({
    from: `"Vyoma Portal" <${(transporter.options as any).auth?.user}>`,
    to,
    subject,
    html
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  const platformUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  await sendTemplatedEmail(to, 'WELCOME', { name, platform_url: platformUrl }).catch(console.error);
}

export async function sendPurchaseSuccess(to: string, planName: string, amount: number) {
  const transporter = await getDynamicTransporter();
  if (!transporter) return;

  const html = getLuxuryWrap(`
    <h1 style="color: #46d369;">Transactional Capture Complete</h1>
    <p>Liquidity fulfilled. Your access elevation to <strong>${planName}</strong> tier is now fully solidified.</p>
    <div style="background: #111; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px dashed #333;">
      <strong>Settlement Amount:</strong> ₹${amount} <br />
      <strong>New Privilege Tier:</strong> ${planName} Unlimited Access
    </div>
    <p>Full invoices and static consumption records are cached permanently in your 'Billing Profile' tab on our platform.</p>
  `, `Payment Success: Tier upgrade to ${planName}`);

  await transporter.sendMail({
    from: `"Vyoma Accounts" <${(transporter.options as any).auth?.user}>`,
    to,
    subject: `💰 Successful Privilege Upgrade: ${planName}`,
    html
  }).catch(console.error);
}

export async function sendCancelNotification(to: string) {
  const transporter = await getDynamicTransporter();
  if (!transporter) return;

  const html = getLuxuryWrap(`
    <h1>Access Scheduled for Termination</h1>
    <p>We have received authorization commands to suspend your automated renewal vector.</p>
    <p>Your current premium privileges will remain intact until the final cadence of the current cycle, after which dynamic locks will re-engage.</p>
    <p>Should this constitute an analytic anomaly, reactivation vectors are available via your Management Console at all times.</p>
  `, "Subscription suspension cycle initiated.");

  await transporter.sendMail({
    from: `"Vyoma Alerts" <${(transporter.options as any).auth?.user}>`,
    to,
    subject: '⚠️ Subscription Cycle Notice',
    html
  }).catch(console.error);
}

export async function sendPromotionalCampaignEmail(
  to: string, 
  name: string, 
  subject: string, 
  bannerUrl: string, 
  bodyHtml: string, 
  ctaText: string, 
  ctaUrl: string
) {
  const transporter = await getDynamicTransporter();
  if (!transporter) return;

  const html = getLuxuryWrap(`
    ${bannerUrl ? `<div style="text-align: center; margin-bottom: 25px;"><img src="${bannerUrl}" alt="Campaign Banner" style="max-width: 100%; border-radius: 8px; border: 1px solid #222;" /></div>` : ''}
    <h1>Salutations, ${name || 'Noble Seeker'}!</h1>
    <div style="font-size: 16px; color: #ccc; line-height: 1.6; margin-top: 15px;">
      ${bodyHtml}
    </div>
    ${(ctaText && ctaUrl) ? `<div style="text-align: center; margin-top: 30px;"><a href="${ctaUrl}" class="btn">${ctaText}</a></div>` : ''}
  `, subject);

  await transporter.sendMail({
    from: `"Vyoma Campaigns" <${(transporter.options as any).auth?.user}>`,
    to,
    subject,
    html
  }).catch(console.error);
}

export async function sendGiftVoucherEmail(
  to: string,
  recipientName: string,
  buyerName: string,
  relationship: string,
  planName: string,
  months: number,
  codes: string[],
  personalMessage: string
) {
  const transporter = await getDynamicTransporter();
  if (!transporter) {
    console.log("[Mail System] SMTP not configured. Gift email simulation triggered.");
    return;
  }

  const durationStr = months >= 12 ? '1 Year' : `${months} Month${months > 1 ? 's' : ''}`;
  const keysListHtml = codes.map((c, i) => `
    <div style="background: #111; padding: 15px; border-radius: 8px; margin: 10px 0; border: 1px solid #ffd700; font-family: monospace; font-size: 18px; color: #ffd700; text-align: center; letter-spacing: 1px;">
      <strong>${c}</strong>
    </div>
  `).join('');

  const html = getLuxuryWrap(`
    <h1 style="color: #ffd700; text-align: center;">🎁 A Gift of Wisdom for You!</h1>
    <p>Pranam, <strong>${recipientName}</strong>!</p>
    <p>We are delighted to share that <strong>${buyerName}</strong> (${relationship}) has gifted you <strong>${durationStr} of ${planName} Access</strong> on Vyoma Sanskrit OTT!</p>
    
    <div style="background: #161a22; border-left: 4px solid #ffd700; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
      <p style="font-style: italic; margin: 0; color: #e2e8f0;">
        "${personalMessage || 'Wishing you knowledge, peace, and spiritual growth.'}"
      </p>
    </div>

    <p>Below are your Activation Keys:</p>
    ${keysListHtml}

    <p style="margin-top: 25px;">To redeem your gift and begin your Sanskrit learning journey, simply click the button below, sign up or log in, and enter your Activation Key:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/redeem" class="btn" style="background: linear-gradient(135deg, #ffd700, #ffa500); color: #000; border: none; font-weight: bold; border-radius: 8px; padding: 15px 30px; text-decoration: none;">Redeem Your Gift</a>
    </div>
  `, `Gift from ${buyerName}: ${durationStr} of Vyoma Premium Access`);

  await transporter.sendMail({
    from: `"Vyoma Academy" <${(transporter.options as any).auth?.user}>`,
    to,
    subject: `🎁 Gift of Wisdom: Your Vyoma Sanskrit Activation Key!`,
    html
  }).catch(console.error);
}
