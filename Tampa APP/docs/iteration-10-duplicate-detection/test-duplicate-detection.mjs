#!/usr/bin/env node
/**
 * Test Duplicate Detection Functions
 * 
 * Run after applying migration manually in Supabase SQL Editor
 * Tests all 4 functions with real data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk';
const ORGANIZATION_ID = '4808e8a5-547b-4601-ab90-a8388ee748fa';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testDuplicateDetection() {
  console.log('🧪 Testing Duplicate Product Detection Functions\n');
  console.log('=' .repeat(60), '\n');

  // Test 1: Find similar products
  console.log('TEST 1: Find Similar Products');
  console.log('-'.repeat(60));
  
  const testNames = [
    'Caesar Salad',
    'Chicken Breast',
    'Tomato Sauce',
    'Fresh Fish'
  ];

  for (const testName of testNames) {
    console.log(`\n🔍 Searching for products similar to "${testName}"...`);
    
    const { data, error } = await supabase
      .rpc('find_similar_products', {
        search_name: testName,
        org_id: ORGANIZATION_ID,
        min_similarity: 0.3
      });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log('   ℹ️  No similar products found');
    } else {
      console.log(`   ✅ Found ${data.length} similar product(s):`);
      data.forEach((product, index) => {
        console.log(`      ${index + 1}. ${product.product_name}`);
        console.log(`         Similarity: ${(product.similarity_score * 100).toFixed(1)}%`);
        console.log(`         Category: ${product.category_name || 'N/A'} > ${product.subcategory_name || 'N/A'}`);
        console.log(`         Allergens: ${product.allergen_count}`);
        if (product.last_printed) {
          console.log(`         Last printed: ${new Date(product.last_printed).toLocaleString()}`);
        }
      });
    }
  }

  // Test 2: Check if name is duplicate
  console.log('\n\n' + '='.repeat(60));
  console.log('TEST 2: Check if Product Name is Duplicate');
  console.log('-'.repeat(60));

  const checkNames = [
    'Caesar Salad Mix',  // Exists
    'Chicken Breast',    // Might exist
    'Brand New Product',  // Doesn't exist
    'caesar salad mix'   // Case insensitive test
  ];

  for (const checkName of checkNames) {
    console.log(`\n🔍 Checking if "${checkName}" is a duplicate...`);
    
    const { data, error } = await supabase
      .rpc('is_duplicate_product', {
        check_name: checkName,
        org_id: ORGANIZATION_ID
      });

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ${data ? '⚠️  YES - This is likely a duplicate!' : '✅ NO - Name is available'}`);
    }
  }

  // Test 3: Get duplicate statistics
  console.log('\n\n' + '='.repeat(60));
  console.log('TEST 3: Get Duplicate Statistics');
  console.log('-'.repeat(60));

  const { data: stats, error: statsError } = await supabase
    .rpc('get_duplicate_stats', {
      org_id: ORGANIZATION_ID
    });

  if (statsError) {
    console.log(`❌ Error: ${statsError.message}`);
  } else if (stats && stats.length > 0) {
    const stat = stats[0];
    console.log(`\n📊 Organization Statistics:`);
    console.log(`   Total products: ${stat.total_products}`);
    console.log(`   Potential duplicates: ${stat.potential_duplicates}`);
    
    if (stat.duplicate_groups && stat.duplicate_groups.length > 0) {
      console.log(`\n   Duplicate pairs found:`);
      stat.duplicate_groups.slice(0, 5).forEach((pair, index) => {
        console.log(`   ${index + 1}. "${pair.product1.name}" ↔️ "${pair.product2.name}"`);
        console.log(`      Similarity: ${(pair.similarity * 100).toFixed(1)}%`);
      });
      if (stat.duplicate_groups.length > 5) {
        console.log(`   ... and ${stat.duplicate_groups.length - 5} more pairs`);
      }
    } else {
      console.log('   ✅ No duplicate pairs detected!');
    }
  }

  // Test 4: Merge products (dry run - commented out for safety)
  console.log('\n\n' + '='.repeat(60));
  console.log('TEST 4: Merge Products Function');
  console.log('-'.repeat(60));
  console.log('\n⚠️  SKIPPED - Merge function not tested to prevent data loss');
  console.log('   To test merge, manually run:');
  console.log('   SELECT merge_products(source_id, target_id, org_id);');

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ All tests complete!');
  console.log('='.repeat(60) + '\n');
}

testDuplicateDetection().catch(console.error);
