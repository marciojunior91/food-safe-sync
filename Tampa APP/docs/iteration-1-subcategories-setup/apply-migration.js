// Apply Suflê subcategories migration
// Run with: node apply-migration.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imnecvcvhypnlvujajpn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2OTI4NzMsImV4cCI6MjA3MTI2ODg3M30.NEeQADbjV6kTF2mZfESk2rbpyoFPa3aQzWZ4rgddUoI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying Suflê subcategories migration...\n');
    
    // Call the function that was created in the migration
    const { data, error } = await supabase.rpc('insert_sufle_subcategories');
    
    if (error) {
      console.error('❌ Error applying migration:', error.message);
      throw error;
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Verifying categories...');
    
    // Verify categories
    const { data: categories, error: catError } = await supabase
      .from('label_categories')
      .select('name')
      .is('organization_id', null)
      .order('name');
    
    if (catError) {
      console.error('Error fetching categories:', catError.message);
    } else {
      console.log('\n📁 Categories found:');
      categories.forEach(cat => console.log(`  ✓ ${cat.name}`));
    }
    
    // Verify subcategories count
    const { data: subcategories, error: subError } = await supabase
      .from('label_subcategories')
      .select('id, name')
      .is('organization_id', null);
    
    if (subError) {
      console.error('Error fetching subcategories:', subError.message);
    } else {
      console.log(`\n📦 Total Subcategories: ${subcategories.length}`);
    }
    
    // Delete "Bakery and Desserts" if it exists
    console.log('\n🗑️  Checking for "Bakery and Desserts" category...');
    const { data: oldCat, error: deleteError } = await supabase
      .from('label_categories')
      .delete()
      .eq('name', 'Bakery and Desserts')
      .is('organization_id', null)
      .select();
    
    if (deleteError) {
      console.log('   (Category not found or already deleted)');
    } else if (oldCat && oldCat.length > 0) {
      console.log('   ✓ Deleted "Bakery and Desserts" category');
    } else {
      console.log('   (Category not found)');
    }
    
    console.log('\n🎉 Done! Open your app and check Quick Print → By Categories');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
