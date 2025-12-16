/**
 * Quick Print Category & Sub  'Baguet  'Danish': '  'Root Vegetables': '�',
  'Mushrooms': '🍄',
  'Legumes & Pulses': '🌱',  // Seedling - very compatible emoji
  'Grains & Rice': '🌾',
  'Focaccia': '🍕',  // Changed from 🫓 (not supported)
  'Flatbreads': '🍞',  // Basic bread emoji - very compatible
  'Specialty Breads': '🥨',: '🥖',
  'Croissants': '🥐',
  'Pastries': '🧁',
  'Danish': '🥮',
  'Focaccia': '🍕',  // Changed from 🫓 (not supported)
  'Flatbreads': '🍞',  // Changed to basic bread emoji
  'Specialty Breads': '🥨',y Icon Mappings
 * Used for hierarchical navigation in Quick Print mode
 * Synchronized with label_categories and label_subcategories tables
 */

// Category Icons (Main categories)
export const CATEGORY_ICONS: Record<string, string> = {
  'Fish & Seafood': '🐟',  // Fixed: was "Fish and Seafood"
  'Bakery': '🍞',
  'Raw Ingredients': '🥬',
  'Meat & Poultry': '🥩',
  'Dairy': '🥛',
  'Sauces & Condiments': '🌶️',
  'Desserts': '🍰',
  'Prepared Foods': '🍽️',
  'Beverages': '🥤',
  'Vegetables': '🥬',  // Added: was missing!
};

// Subcategory Icons
export const SUBCATEGORY_ICONS: Record<string, string> = {
  // Fish and Seafood Subcategories (7)
  'Fresh Fish': '🐟',
  'Frozen Fish': '🧊',
  'Shellfish': '🦪',
  'Crustaceans': '🦐',
  'Mollusks': '🦑',
  'Smoked Fish': '💨',
  'Canned Seafood': '🥫',
  
  // Bakery Subcategories (9)
  'Artisan Breads': '🍞',
  'Rolls & Buns': '🥖',
  'Baguettes': '🥖',
  'Croissants': '🥐',
  'Pastries': '🧁',
  'Danish': '🥮',
  'Focaccia': '🍕',  // Changed from 🫓 (not supported)
  'Flatbreads': '🍞',  // Changed from 🫓 (not supported)
  'Specialty Breads': '🥨',
  
  // Raw Ingredients Subcategories (15)
  'Fresh Vegetables': '🥬',
  'Fresh Fruits': '🍊',
  'Herbs & Aromatics': '🌿',
  'Leafy Greens': '🥬',
  'Root Vegetables': '🥕',
  'Mushrooms': '🍄',
  'Legumes & Pulses': '🌱',  // Seedling - very compatible emoji
  'Grains & Rice': '🌾',
  'Flours': '🌾',
  'Nuts & Seeds': '🥜',
  'Oils & Fats': '🛢️',  // Changed from 🫒 (not supported)
  'Spices': '🧂',
  'Dried Herbs': '🍃',
  'Sugars & Sweeteners': '🍯',
  
  // Meat & Poultry Subcategories (11)
  'Beef': '🐄',
  'Pork': '🐖',
  'Lamb': '🐑',
  'Veal': '🐮',
  'Chicken': '🐔',
  'Duck': '🦆',
  'Turkey': '🦃',
  'Game Meats': '🦌',
  'Offal': '🍖',  // Changed from 🫀 (not supported)
  'Charcuterie': '🥓',
  'Sausages': '🌭',
  
  // Dairy Subcategories (5) - ADDED
  'Milk': '🥛',
  'Cheese': '🧀',
  'Yogurt': '🥛',
  'Butter & Cream': '🧈',
  'Plant-Based Dairy': '🌱',
  
  // Beverages Subcategories (5) - ADDED
  'Juices': '🧃',
  'Sodas': '🥤',
  'Coffee & Tea': '☕',
  'Alcoholic': '🍷',
  'Water': '💧',
  
  // Desserts Subcategories (4) - ADDED (Removed duplicate 'Pastries')
  'Cakes': '🎂',
  'Ice Cream': '🍦',
  'Cookies': '🍪',
  'Puddings': '🍮',
  
  // Prepared Foods Subcategories (5) - ADDED
  'Soups': '🍲',
  'Salads': '🥗',
  'Sandwiches': '🥪',
  'Entrees': '🍽️',
  'Sides': '🍚',
  
  // Sauces & Condiments Subcategories (6) - UPDATED
  'Hot Sauces': '🌶️',
  'Sauces': '🍝',  // For béchamel, tomato sauce, marinara, alfredo, etc.
  'Dressings': '🥗',
  'Marinades': '🧂',
  'Vinegars': '🍶',
  'Oils': '🛢️',  // Changed from 🫒 (not supported)
  
  // Vegetables Subcategories (4) - ADDED (Removed duplicates 'Leafy Greens' and 'Root Vegetables' - already in Raw Ingredients)
  'Cruciferous': '🥦',
  'Nightshades': '🍅',
  'Alliums': '🧅',
  'Squashes': '🎃',
};

// Default icons for fallback
export const DEFAULT_ICONS = {
  category: '📁',
  subcategory: '📂',
  product: '📦',
};

/**
 * Get icon for a category by name
 * @param categoryName - Name of the category
 * @returns Emoji string or default category icon
 */
export function getCategoryIcon(categoryName: string): string {
  const icon = CATEGORY_ICONS[categoryName];
  
  if (!icon) {
    console.warn(`⚠️ No icon found for category: "${categoryName}"`, {
      categoryName,
      length: categoryName.length,
      availableCategories: Object.keys(CATEGORY_ICONS),
    });
  }
  
  return icon || DEFAULT_ICONS.category;
}

/**
 * Get icon for a subcategory by name
 * @param subcategoryName - Name of the subcategory
 * @returns Emoji string or default subcategory icon
 */
export function getSubcategoryIcon(subcategoryName: string): string {
  const icon = SUBCATEGORY_ICONS[subcategoryName];
  
  if (!icon) {
    console.warn(`⚠️ No icon found for subcategory: "${subcategoryName}"`, {
      subcategoryName,
      length: subcategoryName.length,
      availableSubcategories: Object.keys(SUBCATEGORY_ICONS),
    });
  }
  
  return icon || DEFAULT_ICONS.subcategory;
}

/**
 * Get product icon (always generic)
 * @returns Default product icon
 */
export function getProductIcon(): string {
  return DEFAULT_ICONS.product;
}

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
