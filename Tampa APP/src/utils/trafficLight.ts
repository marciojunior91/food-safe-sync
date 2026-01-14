
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
      return '#ef4444'; // Red
    case 'warning':
      return '#f59e0b'; // Orange/Yellow
    case 'safe':
      return '#10b981'; // Green
    default:
      return '#6b7280'; // Gray
  }
};

export const getStatusLabel = (status: ExpiryStatus): string => {
  switch (status) {
    case 'expired':
      return 'Expired';
    case 'warning':
      return 'Expiring Soon';
    case 'safe':
      return ''; // Don't show "Safe" badge - only show warnings/expired
    default:
      return 'Unknown';
  }
};

// Helper to check if status should display a badge
export const shouldShowStatusBadge = (status: ExpiryStatus): boolean => {
  return status === 'expired' || status === 'warning';
};

