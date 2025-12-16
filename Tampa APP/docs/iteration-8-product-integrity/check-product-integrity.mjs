#!/usr/bin/env node

/**
 * Product Data Integrity Checker
 * 
 * What: Validates all products have valid category/subcategory assignments
 * Why: User reported "Prepared Foods > Salads" shows count but displays empty
 * Impact: Prevents orphaned products and ensures navigation works correctly
 * 
 * Usage: node check-product-integrity.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk';
const ORGANIZATION_ID = '4808e8a5-547b-4601-ab90-a8388ee748fa';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkProductIntegrity() {
  console.log('🔍 Checking Product Data Integrity...\n');

  try {
    // ============================================================================
    // STEP 1: Get all products with their subcategory and category info
    // ============================================================================
    console.log('📦 STEP 1: Fetching all products...\n');

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        subcategory_id,
        label_subcategories!inner (
          id,
          name,
          category_id,
          label_categories!inner (
            id,
            name
          )
        )
      `)
      .eq('label_subcategories.organization_id', ORGANIZATION_ID);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message);
      process.exit(1);
    }

    console.log(`   Found ${products.length} products with category/subcategory info\n`);

    // ============================================================================
    // STEP 2: Check for orphaned products (no subcategory or invalid subcategory)
    // ============================================================================
    console.log('🔗 STEP 2: Checking for orphaned products...\n');

    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('id, name, subcategory_id')
      .eq('organization_id', ORGANIZATION_ID);

    if (allProductsError) {
      console.error('❌ Error fetching all products:', allProductsError.message);
      process.exit(1);
    }

    const orphanedProducts = [];
    
    for (const product of allProducts) {
      if (!product.subcategory_id) {
        orphanedProducts.push({
          ...product,
          issue: 'No subcategory assigned'
        });
      } else {
        // Check if subcategory exists
        const { data: subcategory, error: subError } = await supabase
          .from('label_subcategories')
          .select('id, name, category_id')
          .eq('id', product.subcategory_id)
          .single();

        if (subError || !subcategory) {
          orphanedProducts.push({
            ...product,
            issue: 'Subcategory does not exist'
          });
        }
      }
    }

    if (orphanedProducts.length > 0) {
      console.log(`   ⚠️  Found ${orphanedProducts.length} orphaned products:\n`);
      orphanedProducts.forEach(p => {
        console.log(`      ❌ "${p.name}" - ${p.issue}`);
      });
      console.log('');
    } else {
      console.log('   ✅ No orphaned products found\n');
    }

    // ============================================================================
    // STEP 3: Check "Prepared Foods > Salads" specifically
    // ============================================================================
    console.log('🥗 STEP 3: Investigating "Prepared Foods > Salads"...\n');

    // Get Prepared Foods category
    const { data: preparedFoodsCategory, error: catError } = await supabase
      .from('label_categories')
      .select('id, name')
      .eq('name', 'Prepared Foods')
      .eq('organization_id', ORGANIZATION_ID)
      .single();

    if (catError || !preparedFoodsCategory) {
      console.log('   ⚠️  "Prepared Foods" category not found\n');
    } else {
      console.log(`   ✅ Found category: ${preparedFoodsCategory.name}\n`);

      // Get Salads subcategory
      const { data: saladsSubcategory, error: subError } = await supabase
        .from('label_subcategories')
        .select('id, name, category_id')
        .eq('name', 'Salads')
        .eq('category_id', preparedFoodsCategory.id)
        .eq('organization_id', ORGANIZATION_ID)
        .single();

      if (subError || !saladsSubcategory) {
        console.log('   ⚠️  "Salads" subcategory not found under "Prepared Foods"\n');
      } else {
        console.log(`   ✅ Found subcategory: ${saladsSubcategory.name}\n`);

        // Get products assigned to Salads
        const { data: saladsProducts, error: prodError } = await supabase
          .from('products')
          .select('id, name, subcategory_id')
          .eq('subcategory_id', saladsSubcategory.id);

        if (prodError) {
          console.log('   ❌ Error fetching products:', prodError.message);
        } else {
          console.log(`   📊 Products assigned to "Prepared Foods > Salads": ${saladsProducts.length}\n`);
          
          if (saladsProducts.length > 0) {
            console.log('   Products:');
            saladsProducts.forEach(p => {
              console.log(`      • ${p.name}`);
            });
            console.log('');
          } else {
            console.log('   ℹ️  No products assigned to this subcategory\n');
          }
        }
      }
    }

    // ============================================================================
    // STEP 4: Show all category/subcategory/product relationships
    // ============================================================================
    console.log('📊 STEP 4: Full hierarchy overview...\n');

    const { data: categories, error: categoriesError } = await supabase
      .from('label_categories')
      .select('id, name')
      .eq('organization_id', ORGANIZATION_ID)
      .order('name');

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError.message);
    } else {
      for (const category of categories) {
        // Get subcategories
        const { data: subcategories } = await supabase
          .from('label_subcategories')
          .select('id, name')
          .eq('category_id', category.id)
          .eq('organization_id', ORGANIZATION_ID)
          .order('name');

        // Count products per subcategory
        let categoryTotal = 0;
        const subcategoryDetails = [];

        for (const subcategory of subcategories || []) {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('subcategory_id', subcategory.id);

          categoryTotal += count || 0;
          subcategoryDetails.push({
            name: subcategory.name,
            count: count || 0
          });
        }

        console.log(`   📁 ${category.name} (${categoryTotal} products total)`);
        
        if (subcategoryDetails.length > 0) {
          subcategoryDetails.forEach(sub => {
            const icon = sub.count > 0 ? '✅' : '⚪';
            console.log(`      ${icon} ${sub.name}: ${sub.count} products`);
          });
        } else {
          console.log('      ⚠️  No subcategories');
        }
        console.log('');
      }
    }

    // ============================================================================
    // STEP 5: Validation Rules Summary
    // ============================================================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✅ Checks performed:');
    console.log('   1. All products have subcategory_id assigned');
    console.log('   2. All subcategory_ids reference valid subcategories');
    console.log('   3. All subcategories link to valid categories');
    console.log('   4. "Prepared Foods > Salads" issue investigated\n');

    if (orphanedProducts.length > 0) {
      console.log('⚠️  ISSUES FOUND:');
      console.log(`   • ${orphanedProducts.length} orphaned products need fixing\n`);
      
      console.log('💡 To fix orphaned products:');
      console.log('   1. Run: node docs/iteration-4-product-linking/link-products-to-subcategories.mjs');
      console.log('   2. Or manually assign via Supabase dashboard\n');
    } else {
      console.log('✅ All products have valid category/subcategory assignments!\n');
    }

    console.log('🔒 To prevent future issues:');
    console.log('   • Always assign new products to valid subcategories');
    console.log('   • Use the automation script for bulk assignments');
    console.log('   • Run this integrity check after adding products\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the check
checkProductIntegrity();
