/**
 * Script to synchronize quickPrintIcons.ts with database categories and subcategories
 * Run this to generate icon mappings based on actual database data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzMzI2NjcsImV4cCI6MjA0NjkwODY2N30.n7IrXL6UDj6F5IFhVOh6T4rS0D9JCx8bCqW0qiDNFXc';
const ORG_ID = '4808e8a5-547b-4601-ab90-a8388ee748fa';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Suggested emoji mappings based on names
const SUGGESTED_CATEGORY_EMOJIS: Record<string, string> = {
  'Fish and Seafood': '🐟',
  'Bakery': '🍞',
  'Raw Ingredients': '🥬',
  'Meat & Poultry': '🥩',
  'Dairy': '🥛',
  'Sauces & Condiments': '🌶️',
  'Desserts': '🍰',
  'Prepared Foods': '🍽️',
  'Beverages': '🥤',
  'Bakery and Desserts': '🧁',
};

const SUGGESTED_SUBCATEGORY_EMOJIS: Record<string, string> = {
  // Fish and Seafood
  'Fresh Fish': '🐟',
  'Frozen Fish': '🧊',
  'Shellfish': '🦪',
  'Crustaceans': '🦐',
  'Mollusks': '🦑',
  'Smoked Fish': '💨',
  'Canned Seafood': '🥫',
  
  // Bakery
  'Artisan Breads': '🍞',
  'Rolls & Buns': '🥖',
  'Baguettes': '🥖',
  'Croissants': '🥐',
  'Pastries': '🧁',
  'Danish': '🥮',
  'Focaccia': '🫓',
  'Flatbreads': '🫓',
  'Specialty Breads': '🥨',
  
  // Raw Ingredients
  'Fresh Vegetables': '🥬',
  'Fresh Fruits': '🍊',
  'Herbs & Aromatics': '🌿',
  'Leafy Greens': '🥬',
  'Root Vegetables': '🥕',
  'Mushrooms': '🍄',
  'Legumes & Pulses': '🫘',
  'Grains & Rice': '🌾',
  'Flours': '🌾',
  'Nuts & Seeds': '🥜',
  'Oils & Fats': '🫒',
  'Vinegars': '🍶',
  'Spices': '🧂',
  'Dried Herbs': '🍃',
  'Sugars & Sweeteners': '🍯',
  
  // Meat & Poultry
  'Beef': '🐄',
  'Pork': '🐖',
  'Lamb': '🐑',
  'Veal': '🐮',
  'Chicken': '🐔',
  'Duck': '🦆',
  'Turkey': '🦃',
  'Game Meats': '🦌',
  'Offal': '🫀',
  'Charcuterie': '🥓',
  'Sausages': '🌭',
};

async function syncIcons() {
  console.log('🔄 Fetching categories and subcategories from database...\n');

  try {
    // Fetch categories
    const { data: categories, error: catError } = await supabase
      .from('label_categories')
      .select('id, name')
      .eq('organization_id', ORG_ID)
      .order('name');

    if (catError) {
      console.error('❌ Error fetching categories:', catError);
      return;
    }

    // Fetch subcategories
    const { data: subcategories, error: subError } = await supabase
      .from('label_subcategories')
      .select('id, name, category_id')
      .eq('organization_id', ORG_ID)
      .order('name');

    if (subError) {
      console.error('❌ Error fetching subcategories:', subError);
      return;
    }

    console.log(`✅ Found ${categories?.length || 0} categories`);
    console.log(`✅ Found ${subcategories?.length || 0} subcategories\n`);

    // Generate category icons
    console.log('📁 CATEGORY_ICONS:');
    console.log('export const CATEGORY_ICONS: Record<string, string> = {');
    categories?.forEach(cat => {
      const emoji = SUGGESTED_CATEGORY_EMOJIS[cat.name] || '📁';
      console.log(`  '${cat.name}': '${emoji}',`);
    });
    console.log('};\n');

    // Generate subcategory icons
    console.log('📂 SUBCATEGORY_ICONS:');
    console.log('export const SUBCATEGORY_ICONS: Record<string, string> = {');
    
    // Group by category for better organization
    const categoryMap = new Map<string, any[]>();
    categories?.forEach(cat => {
      const subs = subcategories?.filter(sub => sub.category_id === cat.id) || [];
      if (subs.length > 0) {
        categoryMap.set(cat.name, subs);
      }
    });

    categoryMap.forEach((subs, catName) => {
      console.log(`  // ${catName} Subcategories`);
      subs.forEach(sub => {
        const emoji = SUGGESTED_SUBCATEGORY_EMOJIS[sub.name] || '📂';
        console.log(`  '${sub.name}': '${emoji}',`);
      });
      console.log('');
    });
    console.log('};\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`Total Categories: ${categories?.length || 0}`);
    console.log(`Total Subcategories: ${subcategories?.length || 0}`);
    
    console.log('\nCategories:');
    categories?.forEach(cat => {
      const count = subcategories?.filter(sub => sub.category_id === cat.id).length || 0;
      console.log(`  - ${cat.name}: ${count} subcategories`);
    });

    console.log('\n✅ Copy the output above and update src/constants/quickPrintIcons.ts');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

syncIcons();
