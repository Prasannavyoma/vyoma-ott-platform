import crypto from 'crypto';

/**
 * Generates a cryptographically salted scrypt password hash.
 * Format: s2$<salt>$<hash>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `s2$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against:
 * 1. Modern salted scrypt (s2$<salt>$<hash>)
 * 2. Direct plaintext match (for legacy imported/unhashed accounts)
 * 3. Legacy unsalted SHA-256 (64 hex characters)
 * 4. Legacy MD5 (32 hex characters)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // 1. Modern salted scrypt format: s2$<salt>$<hash>
  if (storedHash.startsWith('s2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    try {
      const derivedKey = crypto.scryptSync(password, salt, 64);
      const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
      const hashBuffer = Buffer.from(hash, 'hex');
      return keyBuffer.length === hashBuffer.length && crypto.timingSafeEqual(keyBuffer, hashBuffer);
    } catch {
      return false;
    }
  }

  // 2. Direct plaintext match (common for unhashed migrations or direct DB entries)
  if (password === storedHash) {
    return true;
  }

  // 3. Legacy unsalted SHA-256 (64 hex characters)
  if (storedHash.length === 64 && /^[0-9a-fA-F]+$/.test(storedHash)) {
    try {
      const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
      const legacyBuf = Buffer.from(legacyHash.toLowerCase(), 'hex');
      const storedBuf = Buffer.from(storedHash.toLowerCase(), 'hex');
      if (legacyBuf.length === storedBuf.length && crypto.timingSafeEqual(legacyBuf, storedBuf)) {
        return true;
      }
    } catch {}
  }

  // 4. Legacy MD5 (32 hex characters)
  if (storedHash.length === 32 && /^[0-9a-fA-F]+$/.test(storedHash)) {
    try {
      const md5Hash = crypto.createHash('md5').update(password).digest('hex');
      const md5Buf = Buffer.from(md5Hash.toLowerCase(), 'hex');
      const storedBuf = Buffer.from(storedHash.toLowerCase(), 'hex');
      if (md5Buf.length === storedBuf.length && crypto.timingSafeEqual(md5Buf, storedBuf)) {
        return true;
      }
    } catch {}
  }

  return false;
}
