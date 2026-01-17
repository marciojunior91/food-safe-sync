/**
 * Quick Print Type Definitions and Utilities
 * 
 * NOTE: Icons are now fetched directly from the database (label_categories and label_subcategories tables).
 * This file only contains type definitions and the generic product icon.
 * 
 * @deprecated CATEGORY_ICONS and SUBCATEGORY_ICONS - Use database icons instead
 */

/**
 * Navigation level types for breadcrumb
 */
export type NavigationLevelType = 'category' | 'subcategory' | 'product';

/**
 * Navigation level interface
 */
export interface NavigationLevel {
  type: NavigationLevelType;
  id: string | null;
  name: string;
  icon: string;
}

/**
 * Print mode types
 */
export type PrintMode = 'products' | 'categories';

/**
 * Default icons for fallback
 */
export const DEFAULT_ICONS = {
  category: '📁',
  subcategory: '📂',
  product: '📦',
} as const;

/**
 * Get product icon (always generic)
 * Products don't have individual icons, they use a generic package icon
 * @returns Default product icon
 */
export function getProductIcon(): string {
  return DEFAULT_ICONS.product;
}

