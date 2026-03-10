import { addDays, format, parseISO, differenceInDays, startOfDay } from 'date-fns';

// ============================================================================
// STORAGE CONDITIONS & SHELF LIFE
// ============================================================================

export type StorageCondition = 'fresh' | 'cooked' | 'frozen' | 'dry' | 'refrigerated' | 'ambient' | 'hot' | 'thawed';

/**
 * Baseline shelf life in days for each storage condition
 * These are the default values used when no recipe-specific shelf life is provided
 */
export const STORAGE_CONDITION_SHELF_LIFE: Record<StorageCondition, number> = {
  fresh: 1,          // 1 day (raw ingredients)
  cooked: 3,         // 3 days (prepared hot foods)
  frozen: 30,        // 30 days (frozen storage)
  dry: 90,           // 90 days (dry storage)
  refrigerated: 7,   // 7 days (cold storage)
  ambient: 3,        // 3 days (room temperature)
  hot: 0.166,        // 4 hours (hot holding - converted to days: 4/24 = 0.16666)
  thawed: 1,         // 1 day (24 hours after thawing)
};

/**
 * Storage condition multipliers
 * Applied to recipe shelf life when storage condition changes
 * Example: A recipe with 3 day shelf life becomes 12 days when frozen (3 × 4)
 */
export const STORAGE_CONDITION_MULTIPLIERS: Record<StorageCondition, number> = {
  fresh: 0.33,       // Reduces shelf life to 1/3
  cooked: 1,         // No change (baseline)
  frozen: 4,         // 4× longer shelf life
  dry: 10,           // 10× longer shelf life
  refrigerated: 1,   // No change (baseline)
  ambient: 0.5,      // Half the shelf life
  hot: 0.05,         // Drastically reduced (4 hours only)
  thawed: 0.33,      // Reduces to 1/3
};

/**
 * Human-readable labels for storage conditions
 */
export const STORAGE_CONDITION_LABELS: Record<StorageCondition, string> = {
  fresh: 'Fresh',
  cooked: 'Cooked',
  frozen: 'Frozen',
  dry: 'Dry Storage',
  refrigerated: 'Refrigerated',
  ambient: 'Room Temperature',
  hot: 'Hot',
  thawed: 'Thawed',
};

// ============================================================================
// DATE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate expiry date based on prep date and storage condition
 * 
 * @param prepDate - Preparation date (ISO string or Date object)
 * @param storageCondition - Storage condition
 * @param recipeShelfLifeDays - Optional: Recipe-specific shelf life (overrides default)
 * @returns ISO date string (YYYY-MM-DD)
 * 
 * @example
 * // Using default shelf life
 * calculateExpiryDate('2026-03-01', 'frozen') // Returns '2026-03-31' (30 days)
 * 
 * // Using recipe shelf life with multiplier
 * calculateExpiryDate('2026-03-01', 'frozen', 3) // Returns '2026-03-13' (3 × 4 = 12 days)
 */
export function calculateExpiryDate(
  prepDate: string | Date,
  storageCondition: StorageCondition,
  recipeShelfLifeDays?: number
): string {
  if (!prepDate || !storageCondition) return '';

  const prep = typeof prepDate === 'string' ? parseISO(prepDate) : new Date(prepDate);
  
  // Use recipe shelf life with multiplier, or default shelf life
  let shelfLifeDays: number;
  
  if (recipeShelfLifeDays !== undefined && recipeShelfLifeDays !== null) {
    // Apply storage condition multiplier to recipe shelf life
    const multiplier = STORAGE_CONDITION_MULTIPLIERS[storageCondition];
    shelfLifeDays = Math.max(Math.ceil(recipeShelfLifeDays * multiplier), 1); // Minimum 1 day
  } else {
    // Use default shelf life for storage condition
    shelfLifeDays = STORAGE_CONDITION_SHELF_LIFE[storageCondition];
  }

  // For 'hot' condition (4 hours), round up to at least 1 day for date display
  // The actual hot holding time is tracked separately in the app
  if (storageCondition === 'hot') {
    shelfLifeDays = 1; // Display as "expires today" essentially
  }

  const expiryDate = addDays(prep, shelfLifeDays);
  return format(expiryDate, 'yyyy-MM-dd');
}

/**
 * Recalculate expiry date when storage condition changes
 * Useful when user changes condition in a form
 * 
 * @param prepDate - Original preparation date
 * @param newStorageCondition - New storage condition selected
 * @param recipeShelfLifeDays - Optional recipe shelf life
 * @returns New expiry date (ISO string)
 */
export function recalculateExpiryOnConditionChange(
  prepDate: string | Date,
  newStorageCondition: StorageCondition,
  recipeShelfLifeDays?: number
): string {
  return calculateExpiryDate(prepDate, newStorageCondition, recipeShelfLifeDays);
}

/**
 * Get shelf life in days for a given storage condition
 * 
 * @param storageCondition - Storage condition
 * @param recipeShelfLifeDays - Optional recipe baseline
 * @returns Shelf life in days
 */
export function getShelfLifeDays(
  storageCondition: StorageCondition,
  recipeShelfLifeDays?: number
): number {
  if (recipeShelfLifeDays !== undefined && recipeShelfLifeDays !== null) {
    const multiplier = STORAGE_CONDITION_MULTIPLIERS[storageCondition];
    return Math.max(Math.ceil(recipeShelfLifeDays * multiplier), 1);
  }
  
  return STORAGE_CONDITION_SHELF_LIFE[storageCondition];
}

// ============================================================================
// URGENCY CALCULATION (for Expiring Soon module)
// ============================================================================

export type UrgencyLevel = 'critical' | 'warning' | 'upcoming';

/**
 * Calculate urgency level based on days until expiry
 * 
 * @param expiryDate - Expiry date (ISO string or Date)
 * @param currentDate - Optional current date (defaults to now)
 * @returns Urgency level
 * 
 * Rules:
 * - critical: Expired (≤ 0 days)
 * - warning: Expires tomorrow (1 day)
 * - upcoming: 2-7 days until expiry
 */
export function calculateUrgency(
  expiryDate: string | Date,
  currentDate: Date = new Date()
): UrgencyLevel {
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  const daysUntil = differenceInDays(expiry, currentDate);

  if (daysUntil <= 0) return 'critical'; // Expired
  if (daysUntil === 1) return 'warning';  // Expires tomorrow
  return 'upcoming';                       // 2-7 days
}

/**
 * Get human-readable urgency label
 * 
 * @param urgency - Urgency level
 * @param daysUntil - Days until expiry (can be negative for expired)
 * @returns Human-readable label
 */
export function getUrgencyLabel(urgency: UrgencyLevel, daysUntil: number): string {
  switch (urgency) {
    case 'critical':
      return daysUntil < 0 ? `Expired ${Math.abs(daysUntil)} days ago` : 'Expired';
    case 'warning':
      return 'Expires tomorrow';
    case 'upcoming':
      return `${daysUntil} days left`;
    default:
      return `${daysUntil} days left`;
  }
}

/**
 * Calculate days until expiry
 * Uses start of day (midnight) for both dates to avoid timezone/hour issues
 * 
 * @param expiryDate - Expiry date (ISO string or Date)
 * @param currentDate - Optional current date (defaults to now)
 * @returns Number of days (negative if expired)
 * 
 * @example
 * calculateDaysUntilExpiry('2026-03-05') // Returns days until March 5, 2026
 * calculateDaysUntilExpiry('2026-02-28') // Returns negative if past
 */
export function calculateDaysUntilExpiry(
  expiryDate: string | Date,
  currentDate: Date = new Date()
): number {
  const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
  
  // Use start of day for both dates to eliminate timezone/hour effects
  const expiryStartOfDay = startOfDay(expiry);
  const currentStartOfDay = startOfDay(currentDate);
  
  return differenceInDays(expiryStartOfDay, currentStartOfDay);
}

// ============================================================================
// URGENCY COLOR CLASSES (for Expiring Soon module)
// ============================================================================

interface UrgencyColorClasses {
  bg: string;
  border: string;
  text: string;
  badge: string;
  dot: string;
}

/**
 * Get Tailwind CSS classes for urgency level
 * 
 * @param urgency - Urgency level
 * @returns Object with CSS classes for different elements
 */
export function getUrgencyColorClasses(urgency: UrgencyLevel): UrgencyColorClasses {
  switch (urgency) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        dot: 'bg-red-500',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-700 dark:text-yellow-300',
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        dot: 'bg-yellow-500',
      };
    case 'upcoming':
      return {
        bg: 'bg-green-50 dark:bg-green-950',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        dot: 'bg-green-500',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-950',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        dot: 'bg-gray-500',
      };
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if a storage condition value is valid
 * 
 * @param condition - Storage condition to validate
 * @returns true if valid
 */
export function isValidStorageCondition(condition: string): condition is StorageCondition {
  return condition in STORAGE_CONDITION_SHELF_LIFE;
}

/**
 * Validate and sanitize expiry date
 * Ensures it's not in the past (unless explicitly allowed)
 * 
 * @param expiryDate - Expiry date to validate
 * @param allowPast - Whether to allow dates in the past
 * @returns Valid expiry date or null if invalid
 */
export function validateExpiryDate(
  expiryDate: string | Date,
  allowPast: boolean = false
): Date | null {
  try {
    const expiry = typeof expiryDate === 'string' ? parseISO(expiryDate) : expiryDate;
    
    if (isNaN(expiry.getTime())) {
      return null;
    }

    if (!allowPast && expiry < new Date()) {
      return null;
    }

    return expiry;
  } catch {
    return null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Types
  STORAGE_CONDITION_SHELF_LIFE,
  STORAGE_CONDITION_MULTIPLIERS,
  STORAGE_CONDITION_LABELS,
  
  // Core functions
  calculateExpiryDate,
  recalculateExpiryOnConditionChange,
  getShelfLifeDays,
  
  // Urgency functions
  calculateUrgency,
  getUrgencyLabel,
  calculateDaysUntilExpiry,
  getUrgencyColorClasses,
  
  // Validation
  isValidStorageCondition,
  validateExpiryDate,
};
