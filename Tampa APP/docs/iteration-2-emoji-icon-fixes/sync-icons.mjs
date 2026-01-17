// sync-icons.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzMzI2NjcsImV4cCI6MjA0NjkwODY2N30.n7IrXL6UDj6F5IFhVOh6T4rS0D9JCx8bCqW0qiDNFXc';
const ORG_ID = '4808e8a5-547b-4601-ab90-a8388ee748fa';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SUGGESTED_EMOJIS = {
  categories: {
    'Fish and Seafood': '🐟',
    'Bakery': '🍞',
    'Raw Ingredients': '🥬',
    'Meat & Poultry': '🥩',
    'Dairy': '🥛',
    'Sauces & Condiments': '🌶️',
    'Desserts': '🍰',
    'Prepared Foods': '🍽️',
    'Beverages': '🥤',
  },
  subcategories: {
    'Fresh Fish': '🐟', 'Frozen Fish': '🧊', 'Shellfish': '🦪', 'Crustaceans': '🦐',
    'Mollusks': '🦑', 'Smoked Fish': '💨', 'Canned Seafood': '🥫',
    'Artisan Breads': '🍞', 'Rolls & Buns': '🥖', 'Baguettes': '🥖', 'Croissants': '🥐',
    'Pastries': '🧁', 'Danish': '🥮', 'Focaccia': '🫓', 'Flatbreads': '🫓', 'Specialty Breads': '🥨',
    'Fresh Vegetables': '🥬', 'Fresh Fruits': '🍊', 'Herbs & Aromatics': '🌿', 'Leafy Greens': '🥬',
    'Root Vegetables': '🥕', 'Mushrooms': '🍄', 'Legumes & Pulses': '🫘', 'Grains & Rice': '🌾',
    'Flours': '🌾', 'Nuts & Seeds': '🥜', 'Oils & Fats': '🫒', 'Vinegars': '🍶',
    'Spices': '🧂', 'Dried Herbs': '🍃', 'Sugars & Sweeteners': '🍯',
    'Beef': '🐄', 'Pork': '🐖', 'Lamb': '🐑', 'Veal': '🐮', 'Chicken': '🐔',
    'Duck': '🦆', 'Turkey': '🦃', 'Game Meats': '🦌', 'Offal': '🫀',
    'Charcuterie': '🥓', 'Sausages': '🌭',
  }
};

async function sync() {
  const { data: categories } = await supabase
    .from('label_categories')
    .select('id, name')
    .eq('organization_id', ORG_ID)
    .order('name');

  const { data: subcategories } = await supabase
    .from('label_subcategories')
    .select('id, name, category_id')
    .eq('organization_id', ORG_ID)
    .order('display_order');

  console.log('\n=== CATEGORIES ===');
  categories?.forEach(c => console.log(`${c.name}: ${SUGGESTED_EMOJIS.categories[c.name] || '📁'}`));
  
  console.log('\n=== SUBCATEGORIES BY CATEGORY ===');
  categories?.forEach(cat => {
    const subs = subcategories?.filter(s => s.category_id === cat.id);
    if (subs?.length > 0) {
      console.log(`\n${cat.name} (${subs.length}):`);
      subs.forEach(s => console.log(`  - ${s.name}: ${SUGGESTED_EMOJIS.subcategories[s.name] || '📂'}`));
    }
  });
}

sync();
