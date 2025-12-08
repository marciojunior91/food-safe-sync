
export type ExpiryStatus = 'expired' | 'warning' | 'safe';

export const getExpiryStatus = (expiryDate: string): ExpiryStatus => {
  if (!expiryDate) return 'safe';

  const now = new Date();
  const expiry = new Date(expiryDate);
  
  // Reset time part for accurate day comparison if needed, 
  // but usually we want exact time comparison. 
  // If expiryDate is just YYYY-MM-DD, it defaults to 00:00 UTC or local depending on parsing.
  // Assuming expiryDate is YYYY-MM-DD string from the input.
  
  // If expiry is strictly less than now, it's expired.
  if (expiry < now) {
    return 'expired';
  }

  const oneDayInMs = 24 * 60 * 60 * 1000;
  const timeDiff = expiry.getTime() - now.getTime();

  if (timeDiff <= oneDayInMs) {
    return 'warning';
  }

  return 'safe';
};

export const getStatusColor = (status: ExpiryStatus): string => {
  switch (status) {
    case 'expired':
      return 'text-red-500 bg-red-100'; // Red
    case 'warning':
      return 'text-yellow-500 bg-yellow-100'; // Yellow
    case 'safe':
      return 'text-green-500 bg-green-100'; // Green
    default:
      return 'text-gray-500 bg-gray-100';
  }
};
