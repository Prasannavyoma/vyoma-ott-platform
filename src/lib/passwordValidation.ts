export interface PasswordStrengthResult {
  label: string;
  color: string;
  percent: number;
  isValid: boolean;
  error?: string;
}

/**
 * Validates that a password cannot start with a space, cannot be blank or only whitespace,
 * cannot contain spaces, and must meet the minimum length requirements.
 */
export function validatePassword(pwd: string): { isValid: boolean; error?: string } {
  if (!pwd || pwd.trim() === '') {
    return { isValid: false, error: 'Password cannot be blank or empty.' };
  }
  if (pwd.startsWith(' ')) {
    return { isValid: false, error: 'Password cannot start with a space.' };
  }
  if (/\s/.test(pwd)) {
    return { isValid: false, error: 'Password cannot contain spaces.' };
  }
  if (pwd.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
}

/**
 * Computes password strength while strictly enforcing that blank passwords
 * or passwords starting with a space are immediately marked invalid.
 */
export function getPasswordStrength(pwd: string): PasswordStrengthResult {
  if (!pwd || pwd.trim() === '') {
    return { label: 'Cannot be blank', color: '#ef4444', percent: 0, isValid: false, error: 'Password cannot be blank.' };
  }
  if (pwd.startsWith(' ')) {
    return { label: 'Cannot start with space', color: '#ef4444', percent: 15, isValid: false, error: 'Password cannot start with a space.' };
  }
  if (/\s/.test(pwd)) {
    return { label: 'Spaces not allowed', color: '#ef4444', percent: 20, isValid: false, error: 'Password cannot contain spaces.' };
  }
  if (pwd.length < 6) {
    return { label: 'Weak (Too Short)', color: '#ef4444', percent: 25, isValid: false, error: 'Must be at least 6 characters.' };
  }

  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score >= 4) return { label: 'Strong Password', color: '#22c55e', percent: 100, isValid: true };
  if (score >= 2) return { label: 'Medium Password', color: '#ffb020', percent: 65, isValid: true };
  return { label: 'Weak Password', color: '#ef4444', percent: 35, isValid: false };
}
