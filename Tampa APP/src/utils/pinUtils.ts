// PIN Management Utilities
// 4-digit PIN hashing and verification for team member profile editing
// Uses Web Crypto API for browser compatibility

/**
 * Hash a 4-digit PIN for secure storage
 * Uses SHA-256 with salt for security
 */
export async function hashPIN(pin: string, salt?: string): Promise<string> {
  // Validate PIN format (4 digits)
  if (!/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 digits');
  }

  // Generate salt if not provided
  const pinSalt = salt || generateSalt();
  
  // Hash PIN with salt using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + pinSalt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt:hash format for storage
  return `${pinSalt}:${hash}`;
}

/**
 * Verify a PIN against a stored hash
 */
export async function verifyPIN(pin: string, storedHash: string): Promise<boolean> {
  try {
    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return false;
    }

    // Extract salt from stored hash
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) {
      return false;
    }

    // Hash the provided PIN with the same salt
    const testHash = await hashPIN(pin, salt);
    
    // Compare hashes (constant-time comparison to prevent timing attacks)
    return timingSafeEqual(testHash, storedHash);
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
}

/**
 * Generate a random salt for PIN hashing
 */
function generateSalt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 16; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate a random 4-digit PIN (for initial setup)
 */
export function generateRandomPIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Validate PIN format
 */
export function isValidPIN(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

/**
 * Format PIN for display (with masking)
 */
export function maskPIN(pin: string): string {
  if (!isValidPIN(pin)) {
    return '****';
  }
  return '••••';
}
