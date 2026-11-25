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
 * Verifies a password against either a salted scrypt hash or legacy SHA-256 hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Modern salted scrypt format: s2$<salt>$<hash>
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

  // Backward compatibility: legacy unsalted sha256
  try {
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    const legacyBuf = Buffer.from(legacyHash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (legacyBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(legacyBuf, storedBuf);
  } catch {
    return false;
  }
}
