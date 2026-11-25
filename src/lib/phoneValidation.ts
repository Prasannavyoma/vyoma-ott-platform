export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  /** Digits-only number (with leading '+' if one was entered). null when the field is blank. */
  normalized: string | null;
}

const INDIA_CODE = '91';

/** True when every digit is the same (e.g. 0000000000, 9999999999). */
function isRepeatedDigit(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

/**
 * Validates a profile phone number. Shared by the client form and the server action.
 *
 * - Blank is allowed (the field is optional).
 * - Only digits, spaces, dashes, brackets and a single leading '+' are accepted.
 * - 10–15 digits in total.
 * - Indian numbers (10 digits, 0 + 10 digits, 91 + 10 digits or +91 + 10 digits) must be a
 *   real mobile number: 10 digits starting with 6–9.
 * - Dummy numbers are rejected: all zeros / one repeated digit, including after a country
 *   code or trunk prefix (e.g. +91 0000000000, +44 0000000000).
 */
export function validatePhone(raw: string | null | undefined): PhoneValidationResult {
  const value = (raw ?? '').trim();
  if (value === '') {
    return { isValid: true, normalized: null };
  }

  if (!/^\+?[0-9\s\-()]+$/.test(value)) {
    return {
      isValid: false,
      normalized: null,
      error: 'Phone number can only contain digits, spaces, "-", brackets and a leading "+".',
    };
  }

  const hasPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');

  if (digits.length < 10 || digits.length > 15) {
    return { isValid: false, normalized: null, error: 'Phone number must be 10–15 digits long.' };
  }

  if (/^0+$/.test(digits) || isRepeatedDigit(digits)) {
    return { isValid: false, normalized: null, error: 'Please enter a valid phone number, not a dummy number like 0000000000.' };
  }

  // Work out the subscriber (national) part for Indian numbers
  let indianNational: string | null = null;
  if (hasPlus && digits.startsWith(INDIA_CODE)) {
    indianNational = digits.slice(INDIA_CODE.length);
  } else if (!hasPlus) {
    if (digits.length === 10) indianNational = digits;
    else if (digits.length === 11 && digits.startsWith('0')) indianNational = digits.slice(1);
    else if (digits.length === 12 && digits.startsWith(INDIA_CODE)) indianNational = digits.slice(INDIA_CODE.length);
  }

  if (indianNational !== null) {
    if (!/^[6-9]\d{9}$/.test(indianNational) || isRepeatedDigit(indianNational)) {
      return {
        isValid: false,
        normalized: null,
        error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.',
      };
    }
  } else {
    // International: country codes are 1–3 digits; the rest must not be a dummy sequence
    for (let ccLength = 1; ccLength <= 3; ccLength++) {
      const subscriber = digits.slice(ccLength);
      if (/^0+$/.test(subscriber) || isRepeatedDigit(subscriber)) {
        return { isValid: false, normalized: null, error: 'Please enter a valid phone number, not a dummy number.' };
      }
    }
    if (digits.startsWith('0')) {
      return { isValid: false, normalized: null, error: 'Country code cannot start with 0.' };
    }
  }

  return { isValid: true, normalized: hasPlus ? '+' + digits : digits };
}
