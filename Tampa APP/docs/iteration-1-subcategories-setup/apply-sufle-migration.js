// Apply Suflê subcategories directly via SQL queries
// Run with: node apply-sufle-migration.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imnecvcvhypnlvujajpn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2OTI4NzMsImV4cCI6MjA3MTI2ODg3M30.NEeQADbjV6kTF2mZfESk2rbpyoFPa3aQzWZ4rgddUoI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying Suflê subcategories structure...\n');
  
  try {
    // Step 1: Create new categories
    console.log('📁 Creating new categories...');
    
    const newCategories = [
      'Fish and Seafood',
      'Bakery',
      'Raw Ingredients',
      'Meat & Poultry'
    ];
    
    for (const catName of newCategories) {
      // Check if category exists
      const { data: existing } = await supabase
        .from('label_categories')
        .select('id')
        .eq('name', catName)
        .is('organization_id', null)
        .single();
      
      if (existing) {
        console.log(`   ✓ ${catName} (already exists)`);
      } else {
        const { error } = await supabase
          .from('label_categories')
          .insert({ name: catName, organization_id: null });
        
        if (error) {
          console.error(`   ❌ Error creating ${catName}:`, error.message);
        } else {
          console.log(`   ✓ ${catName} (created)`);
        }
      }
    }
    
    // Step 2: Delete "Bakery and Desserts"
    console.log('\n🗑️  Removing old category...');
    const { error: deleteError } = await supabase
      .from('label_categories')
      .delete()
      .eq('name', 'Bakery and Desserts')
      .is('organization_id', null);
    
    if (deleteError) {
      console.log('   (Category not found or already deleted)');
    } else {
      console.log('   ✓ Deleted "Bakery and Desserts"');
    }
    
    // Step 3: Get category IDs
    console.log('\n📊 Fetching category IDs...');
    const { data: categories, error: catError } = await supabase
      .from('label_categories')
      .select('id, name')
      .is('organization_id', null);
    
    if (catError) {
      throw catError;
    }
    
    const catMap = {};
    categories.forEach(cat => {
      catMap[cat.name] = cat.id;
    });
    
    // Step 4: Insert subcategories
    console.log('\n📦 Creating subcategories...\n');
    
    const subcategories = [
      // Fish and Seafood
      { category: 'Fish and Seafood', name: 'Fresh Fish', order: 1 },
      { category: 'Fish and Seafood', name: 'Frozen Fish', order: 2 },
      { category: 'Fish and Seafood', name: 'Shellfish', order: 3 },
      { category: 'Fish and Seafood', name: 'Crustaceans', order: 4 },
      { category: 'Fish and Seafood', name: 'Mollusks', order: 5 },
      { category: 'Fish and Seafood', name: 'Smoked Fish', order: 6 },
      { category: 'Fish and Seafood', name: 'Canned Seafood', order: 7 },
      
      // Bakery
      { category: 'Bakery', name: 'Artisan Breads', order: 1 },
      { category: 'Bakery', name: 'Rolls & Buns', order: 2 },
      { category: 'Bakery', name: 'Baguettes', order: 3 },
      { category: 'Bakery', name: 'Croissants', order: 4 },
      { category: 'Bakery', name: 'Pastries', order: 5 },
      { category: 'Bakery', name: 'Danish', order: 6 },
      { category: 'Bakery', name: 'Focaccia', order: 7 },
      { category: 'Bakery', name: 'Flatbreads', order: 8 },
      { category: 'Bakery', name: 'Specialty Breads', order: 9 },
      
      // Raw Ingredients
      { category: 'Raw Ingredients', name: 'Fresh Vegetables', order: 1 },
      { category: 'Raw Ingredients', name: 'Fresh Fruits', order: 2 },
      { category: 'Raw Ingredients', name: 'Herbs & Aromatics', order: 3 },
      { category: 'Raw Ingredients', name: 'Leafy Greens', order: 4 },
      { category: 'Raw Ingredients', name: 'Root Vegetables', order: 5 },
      { category: 'Raw Ingredients', name: 'Mushrooms', order: 6 },
      { category: 'Raw Ingredients', name: 'Legumes & Pulses', order: 7 },
      { category: 'Raw Ingredients', name: 'Grains & Rice', order: 8 },
      { category: 'Raw Ingredients', name: 'Flours', order: 9 },
      { category: 'Raw Ingredients', name: 'Nuts & Seeds', order: 10 },
      { category: 'Raw Ingredients', name: 'Oils & Fats', order: 11 },
      { category: 'Raw Ingredients', name: 'Vinegars', order: 12 },
      { category: 'Raw Ingredients', name: 'Spices', order: 13 },
      { category: 'Raw Ingredients', name: 'Dried Herbs', order: 14 },
      { category: 'Raw Ingredients', name: 'Sugars & Sweeteners', order: 15 },
      
      // Meat & Poultry
      { category: 'Meat & Poultry', name: 'Beef', order: 1 },
      { category: 'Meat & Poultry', name: 'Pork', order: 2 },
      { category: 'Meat & Poultry', name: 'Lamb', order: 3 },
      { category: 'Meat & Poultry', name: 'Veal', order: 4 },
      { category: 'Meat & Poultry', name: 'Chicken', order: 5 },
      { category: 'Meat & Poultry', name: 'Duck', order: 6 },
      { category: 'Meat & Poultry', name: 'Turkey', order: 7 },
      { category: 'Meat & Poultry', name: 'Game Meats', order: 8 },
      { category: 'Meat & Poultry', name: 'Offal', order: 9 },
      { category: 'Meat & Poultry', name: 'Charcuterie', order: 10 },
      { category: 'Meat & Poultry', name: 'Sausages', order: 11 },
    ];
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const sub of subcategories) {
      const categoryId = catMap[sub.category];
      
      if (!categoryId) {
        console.log(`   ⚠️  Skipping "${sub.name}" - category "${sub.category}" not found`);
        continue;
      }
      
      // Check if subcategory exists
      const { data: existing } = await supabase
        .from('label_subcategories')
        .select('id')
        .eq('name', sub.name)
        .eq('category_id', categoryId)
        .is('organization_id', null)
        .single();
      
      if (existing) {
        skipCount++;
      } else {
        const { error } = await supabase
          .from('label_subcategories')
          .insert({
            name: sub.name,
            category_id: categoryId,
            organization_id: null,
            display_order: sub.order
          });
        
        if (error) {
          console.error(`   ❌ Error creating "${sub.name}":`, error.message);
        } else {
          successCount++;
          console.log(`   ✓ ${sub.category} → ${sub.name}`);
        }
      }
    }
    
    console.log(`\n✅ Created ${successCount} subcategories${skipCount > 0 ? ` (${skipCount} already existed)` : ''}`);
    
    // Step 5: Verify results
    console.log('\n📊 Final verification...\n');
    
    const { data: allCategories } = await supabase
      .from('label_categories')
      .select('name')
      .is('organization_id', null)
      .order('name');
    
    console.log('📁 Categories:');
    allCategories.forEach(cat => console.log(`   • ${cat.name}`));
    
    const { data: allSubcategories } = await supabase
      .from('label_subcategories')
      .select('id')
      .is('organization_id', null);
    
    console.log(`\n📦 Total Subcategories: ${allSubcategories.length}`);
    
    console.log('\n🎉 Migration complete! Open your app and check Quick Print → By Categories');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
