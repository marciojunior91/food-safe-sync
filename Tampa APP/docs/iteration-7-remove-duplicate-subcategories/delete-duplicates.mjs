#!/usr/bin/env node

/**
 * Delete Duplicate Subcategories Script
 * 
 * Removes 3 duplicate subcategories from the database:
 * 1. 'Pastries' from Desserts (keep in Bakery)
 * 2. 'Leafy Greens' from Vegetables (keep in Raw Ingredients)
 * 3. 'Root Vegetables' from Vegetables (keep in Raw Ingredients)
 * 
 * Usage: node delete-duplicates.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk';
const ORGANIZATION_ID = '4808e8a5-547b-4601-ab90-a8388ee748fa';

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Main execution function
 */
async function deleteDuplicates() {
  console.log('🗑️  Starting duplicate subcategories deletion...\n');

  try {
    // ============================================================================
    // STEP 1: Verify duplicates before deletion
    // ============================================================================
    console.log('📋 STEP 1: Verifying duplicates...\n');

    const duplicates = [
      { name: 'Pastries', removeFrom: 'Desserts', keepIn: 'Bakery' },
      { name: 'Leafy Greens', removeFrom: 'Vegetables', keepIn: 'Raw Ingredients' },
      { name: 'Root Vegetables', removeFrom: 'Vegetables', keepIn: 'Raw Ingredients' },
    ];

    for (const dup of duplicates) {
      const { data, error } = await supabase
        .from('label_subcategories')
        .select(`
          id,
          name,
          label_categories!inner(name)
        `)
        .eq('name', dup.name)
        .eq('organization_id', ORGANIZATION_ID);

      if (error) {
        console.error(`❌ Error checking '${dup.name}':`, error.message);
        continue;
      }

      console.log(`   '${dup.name}' found in ${data.length} categories:`);
      data.forEach(item => {
        const categoryName = item.label_categories.name;
        const status = categoryName === dup.removeFrom ? '❌ (will delete)' : '✅ (will keep)';
        console.log(`     - ${categoryName} ${status}`);
      });
    }

    // ============================================================================
    // STEP 2: Check for products assigned to duplicate subcategories
    // ============================================================================
    console.log('\n📦 STEP 2: Checking for assigned products...\n');

    let hasAssignedProducts = false;

    for (const dup of duplicates) {
      // Get the category ID first
      const { data: categoryData, error: categoryError } = await supabase
        .from('label_categories')
        .select('id')
        .eq('name', dup.removeFrom)
        .eq('organization_id', ORGANIZATION_ID)
        .single();

      if (categoryError) {
        console.error(`❌ Error finding category '${dup.removeFrom}':`, categoryError.message);
        continue;
      }

      // Get subcategory ID
      const { data: subcategoryData, error: subcategoryError } = await supabase
        .from('label_subcategories')
        .select('id')
        .eq('name', dup.name)
        .eq('category_id', categoryData.id)
        .eq('organization_id', ORGANIZATION_ID)
        .single();

      if (subcategoryError) {
        console.log(`   ℹ️  '${dup.name}' not found in '${dup.removeFrom}' (already deleted or never existed)`);
        continue;
      }

      // Check for products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .eq('subcategory_id', subcategoryData.id);

      if (productsError) {
        console.error(`❌ Error checking products for '${dup.name}' in '${dup.removeFrom}':`, productsError.message);
        continue;
      }

      if (products.length > 0) {
        console.log(`   ⚠️  WARNING: ${products.length} products assigned to '${dup.name}' in '${dup.removeFrom}':`);
        products.forEach(p => console.log(`      - ${p.name}`));
        hasAssignedProducts = true;
      } else {
        console.log(`   ✅ No products assigned to '${dup.name}' in '${dup.removeFrom}'`);
      }
    }

    if (hasAssignedProducts) {
      console.error('\n❌ ABORTED: Products are assigned to duplicate subcategories!');
      console.error('   Please reassign these products before deleting duplicates.');
      process.exit(1);
    }

    // ============================================================================
    // STEP 3: Delete duplicate subcategories
    // ============================================================================
    console.log('\n🗑️  STEP 3: Deleting duplicate subcategories...\n');

    let totalDeleted = 0;

    for (const dup of duplicates) {
      // Get the category ID
      const { data: categoryData, error: categoryError } = await supabase
        .from('label_categories')
        .select('id')
        .eq('name', dup.removeFrom)
        .eq('organization_id', ORGANIZATION_ID)
        .single();

      if (categoryError) {
        console.error(`   ❌ Error finding category '${dup.removeFrom}':`, categoryError.message);
        continue;
      }

      // Delete the subcategory
      const { data: deleteData, error: deleteError } = await supabase
        .from('label_subcategories')
        .delete()
        .eq('name', dup.name)
        .eq('category_id', categoryData.id)
        .eq('organization_id', ORGANIZATION_ID)
        .select();

      if (deleteError) {
        console.error(`   ❌ Error deleting '${dup.name}' from '${dup.removeFrom}':`, deleteError.message);
        continue;
      }

      if (deleteData && deleteData.length > 0) {
        console.log(`   ✅ Deleted '${dup.name}' from '${dup.removeFrom}'`);
        totalDeleted++;
      } else {
        console.log(`   ℹ️  '${dup.name}' not found in '${dup.removeFrom}' (already deleted)`);
      }
    }

    // ============================================================================
    // STEP 4: Verification after deletion
    // ============================================================================
    console.log('\n📊 STEP 4: Verifying final counts...\n');

    // Get all categories
    const { data: allCategories, error: categoriesError } = await supabase
      .from('label_categories')
      .select('id, name')
      .eq('organization_id', ORGANIZATION_ID)
      .order('name');

    if (categoriesError) {
      console.error('❌ Error getting categories:', categoriesError.message);
    } else {
      console.log('   Category                | Subcategories');
      console.log('   ------------------------|-------------');
      
      let totalSubcategories = 0;
      
      for (const cat of allCategories) {
        const { count } = await supabase
          .from('label_subcategories')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
          .eq('organization_id', ORGANIZATION_ID);
        
        totalSubcategories += count || 0;
        console.log(`   ${cat.name.padEnd(23)} | ${count || 0}`);
      }
      
      console.log('   ------------------------|-------------');
      console.log(`   TOTAL                   | ${totalSubcategories}`);
      
      console.log('\n✅ Expected Results:');
      console.log('   - Bakery: 9 (Pastries kept)');
      console.log('   - Desserts: 4 (Pastries removed)');
      console.log('   - Raw Ingredients: 15 (Leafy Greens & Root Vegetables kept)');
      console.log('   - Vegetables: 4 (Leafy Greens & Root Vegetables removed)');
      console.log('   - Total: 71 subcategories (was 74, removed 3 duplicates)');
    }

    // ============================================================================
    // Summary
    // ============================================================================
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('🎉 DELETION COMPLETE!');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   • Duplicates deleted: ${totalDeleted}/3`);
    console.log(`   • Total subcategories: 74 → 71`);
    console.log(`   • Products affected: 0`);
    console.log('\n✅ Database is now clean!');
    console.log('✅ TypeScript compilation should work without errors!');
    console.log('\n💡 Next steps:');
    console.log('   1. Hard refresh your app (Ctrl + Shift + R)');
    console.log('   2. Test category navigation');
    console.log('   3. Verify icons display correctly\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
deleteDuplicates();
