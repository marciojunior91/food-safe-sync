#!/usr/bin/env node
/**
 * Iteration 8: Fix Category ID Mismatches
 * 
 * Problem: Products with correct subcategory_id but wrong category_id
 * Root cause: category_id is redundantly stored but can become inconsistent
 * Solution: Update product.category_id to match subcategory.category_id
 * 
 * This script:
 * 1. Finds all products with category_id != subcategory.category_id
 * 2. Updates them to use the correct category from their subcategory
 * 3. Validates the fix
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixCategoryMismatches() {
  console.log('🔧 Finding products with category_id mismatches...\n');

  // Get all products with their subcategory's parent category
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category_id,
      subcategory_id,
      label_subcategories!inner(
        id,
        name,
        category_id,
        label_categories!inner(
          id,
          name
        )
      )
    `);

  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }

  // Find mismatches
  const mismatches = products.filter(p => 
    p.category_id !== p.label_subcategories.category_id
  );

  if (mismatches.length === 0) {
    console.log('✅ No mismatches found! All products have consistent category IDs.\n');
    return;
  }

  console.log(`⚠️  Found ${mismatches.length} product(s) with category_id mismatch:\n`);

  for (const product of mismatches) {
    const correctCategoryId = product.label_subcategories.category_id;
    const correctCategoryName = product.label_subcategories.label_categories.name;
    const subcategoryName = product.label_subcategories.name;

    console.log(`📦 ${product.name}`);
    console.log(`   Current category_id: ${product.category_id} (wrong)`);
    console.log(`   Correct category_id: ${correctCategoryId}`);
    console.log(`   Category: ${correctCategoryName} > ${subcategoryName}\n`);

    // Update the product
    const { error: updateError } = await supabase
      .from('products')
      .update({ category_id: correctCategoryId })
      .eq('id', product.id);

    if (updateError) {
      console.error(`   ❌ Failed to update: ${updateError.message}\n`);
    } else {
      console.log(`   ✅ Updated successfully!\n`);
    }
  }

  console.log('🎉 All mismatches fixed!\n');

  // Validate fix
  console.log('🔍 Validating fix...\n');
  
  const { data: validationProducts } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category_id,
      label_subcategories!inner(category_id)
    `);

  const stillMismatched = validationProducts.filter(p => 
    p.category_id !== p.label_subcategories.category_id
  );

  if (stillMismatched.length === 0) {
    console.log('✅ Validation passed! All products now have consistent category IDs.\n');
  } else {
    console.log(`⚠️  Warning: ${stillMismatched.length} product(s) still mismatched.\n`);
  }
}

fixCategoryMismatches();
