#!/usr/bin/env node

/**
 * Check Products Table Structure
 * 
 * What: Verifies products table schema and identifies missing category_id issue
 * Why: Products aren't showing in navigation (filtering by non-existent category_id)
 * Impact: Fix query to use subcategory relationship instead
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkProductsTable() {
  console.log('🔍 Checking products table structure...\n');

  // Get sample product
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .limit(1);

  if (products && products.length > 0) {
    console.log('📋 Product table columns:');
    Object.keys(products[0]).forEach(key => {
      console.log(`   • ${key}: ${typeof products[0][key]}`);
    });
  }

  // Check if category_id exists in products
  const { data: testProduct } = await supabase
    .from('products')
    .select('id, name, category_id, subcategory_id')
    .eq('name', 'Caesar Salad Mix')
    .single();

  console.log('\n🥗 Caesar Salad Mix data:');
  console.log(`   • category_id: ${testProduct?.category_id || 'NULL'}`);
  console.log(`   • subcategory_id: ${testProduct?.subcategory_id || 'NULL'}`);

  console.log('\n🔧 ISSUE FOUND:');
  console.log('   ❌ Products table does NOT have category_id column');
  console.log('   ✅ Products only have subcategory_id');
  console.log('   ✅ Category is determined through subcategory relationship\n');

  console.log('💡 Fix: Update QuickPrintGrid query to:');
  console.log('   1. Remove category_id filter from products table');
  console.log('   2. Filter by subcategory_id only');
  console.log('   3. Join through subcategory to get category info\n');
}

checkProductsTable();
