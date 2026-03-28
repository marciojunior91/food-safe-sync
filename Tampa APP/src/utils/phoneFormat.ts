// Phone formatting utilities — Australian mobile format

/**
 * Format phone number to Australian mobile format: 04XX XXX XXX
 * Removes non-numeric characters and formats
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Format based on length
  if (phoneNumber.length === 0) return '';
  if (phoneNumber.length <= 4) return phoneNumber;
  if (phoneNumber.length <= 7) {
    return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4)}`;
  }
  // Full format: 04XX XXX XXX
  return `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7, 10)}`;
}

/**
 * Get raw phone number (numeric only)
 */
export function getRawPhoneNumber(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

/**
 * Validate phone number (must be 10 digits for Australian mobile starting with 04)
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const raw = getRawPhoneNumber(phoneNumber);
  return raw.length === 10 && raw.startsWith('04');
}

/**
 * Format TFN (Tax File Number) to "nnn nnn nnn" format
 * Accepts 8 or 9 digits
 */
export function formatTFN(value: string): string {
  // Remove all non-numeric characters
  const tfnNumber = value.replace(/\D/g, '');
  
  // Limit to 9 digits
  const limited = tfnNumber.slice(0, 9);
  
  // Format based on length
  if (limited.length === 0) return '';
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) {
    return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  }
  // Full format: nnn nnn nnn (8 or 9 digits)
  return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
}

/**
 * Get raw TFN (numeric only)
 */
export function getRawTFN(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

/**
 * Validate TFN (must be 8 or 9 digits)
 */
export function isValidTFN(tfn: string): boolean {
  const raw = getRawTFN(tfn);
  return raw.length === 8 || raw.length === 9;
}
