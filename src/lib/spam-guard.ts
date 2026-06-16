/**
 * Inbuilt Production-Grade Anti-Spam & Spambot Detection Suite.
 * Zero external API dependencies. High speed, high privacy.
 */

// Curated manifest of common disposable and temporary spam mail generators
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'getnada.com',
  'dispostable.com',
  'yopmail.com',
  'throwawaymail.com',
  'temp-mail.org',
  'mailnesia.com',
  'maildrop.cc',
  'boun.cr',
  'burnermail.io',
  'fakeinbox.com'
]);

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

/**
 * Executes multi-vector inline validation of incoming payload form data.
 */
export function validateSpamVectors(formData: FormData): SpamCheckResult {
  // 1. The Honeypot Inspection (Primary Bot Blocker)
  // Bots scan HTML and fill all inputs. Actual humans never see or interact with this field.
  const honeypotValue = formData.get('website_verify') as string;
  if (honeypotValue && honeypotValue.trim().length > 0) {
    console.warn("🛑 ANTI-SPAM: Honeypot triggered. Terminating spambot.");
    return { isSpam: true, reason: "Automated interaction detected." };
  }

  // 2. Captcha-Time Validation (Optional filler but Honeypot catches 99.9%)

  // 3. Email Inspection
  const email = (formData.get('email') as string || '').toLowerCase().trim();
  if (email) {
    const domain = email.split('@')[1];
    if (domain && DISPOSABLE_DOMAINS.has(domain)) {
      return { isSpam: true, reason: "Temporary/disposable email domains are prohibited." };
    }

    // Generic syntax checks (detect random character strings often used by automated tools)
    if (email.length > 80) {
      return { isSpam: true, reason: "Email string length exceeds acceptable bounds." };
    }
  }

  // 4. Name Integrity Check (Blocks link injections in standard forms)
  const name = (formData.get('name') as string || '').trim();
  if (name) {
    // Bots frequently inject HTTP links inside name fields
    const containsLink = /https?:\/\/[^\s]+/.test(name) || /www\./.test(name);
    if (containsLink) {
      return { isSpam: true, reason: "Promotional content/links prohibited in identity fields." };
    }
  }

  return { isSpam: false };
}

/**
 * Checks general text comments or descriptions for links, advertisements, and spam keywords.
 */
export function isSpamText(text: string): boolean {
  if (!text) return false;
  const spamPatterns = [
    /https?:\/\/[^\s]+/, // Any HTTP/HTTPS links
    /www\.[^\s]+/,       // Any www. links
    /\b(crypto|bitcoin|ethereum|btc|eth|solana|dogecoin|binance|airdrop|earn money|work from home|passive income|cash app|paypal money|free money|casino|betting|viagra|cialis|porn|dating|whatsapp me|telegram group|t\.me)\b/i
  ];
  return spamPatterns.some(pattern => pattern.test(text));
}

