// Phone formatting utilities

/**
 * Format phone number to (XXX) XXX-XXXX format
 * Removes non-numeric characters and formats
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Format based on length
  if (phoneNumber.length === 0) return '';
  if (phoneNumber.length <= 3) return phoneNumber;
  if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  // Full format: (XXX) XXX-XXXX
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
}

/**
 * Get raw phone number (numeric only)
 */
export function getRawPhoneNumber(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

/**
 * Validate phone number (must be 10 digits for US format)
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const raw = getRawPhoneNumber(phoneNumber);
  return raw.length === 10;
}
