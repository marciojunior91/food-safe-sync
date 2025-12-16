#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://imnecvcvhypnlvujajpn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk';
const ORGANIZATION_ID = '4808e8a5-547b-4601-ab90-a8388ee748fa';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function diagnoseIssue() {
  console.log('🔍 Diagnosing Caesar Salad Mix issue...\n');

  // Get Caesar Salad Mix
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('name', 'Caesar Salad Mix')
    .single();

  console.log('🥗 Caesar Salad Mix:');
  console.log(`   • Product category_id: ${product.category_id}`);
  console.log(`   • Product subcategory_id: ${product.subcategory_id}\n`);

  // Get Prepared Foods category
  const { data: preparedFoods } = await supabase
    .from('label_categories')
    .select('*')
    .eq('name', 'Prepared Foods')
    .eq('organization_id', ORGANIZATION_ID)
    .single();

  console.log('📁 Prepared Foods category:');
  console.log(`   • Category ID: ${preparedFoods.id}\n`);

  // Get Salads subcategory
  const { data: salads } = await supabase
    .from('label_subcategories')
    .select('*')
    .eq('name', 'Salads')
    .eq('category_id', preparedFoods.id)
    .eq('organization_id', ORGANIZATION_ID)
    .single();

  console.log('🥗 Salads subcategory:');
  console.log(`   • Subcategory ID: ${salads.id}`);
  console.log(`   • Parent category_id: ${salads.category_id}\n`);

  // Check if IDs match
  console.log('🔍 ID Comparison:');
  const categoryMatch = product.category_id === preparedFoods.id;
  const subcategoryMatch = product.subcategory_id === salads.id;

  console.log(`   Product category_id: ${product.category_id}`);
  console.log(`   Expected (Prepared Foods): ${preparedFoods.id}`);
  console.log(`   Match: ${categoryMatch ? '✅' : '❌'}\n`);

  console.log(`   Product subcategory_id: ${product.subcategory_id}`);
  console.log(`   Expected (Salads): ${salads.id}`);
  console.log(`   Match: ${subcategoryMatch ? '✅' : '❌'}\n`);

  if (!categoryMatch && subcategoryMatch) {
    console.log('⚠️  MISMATCH FOUND!');
    console.log('   • Product has correct subcategory_id');
    console.log('   • But wrong category_id!');
    console.log('   • This causes the product to not show in UI\n');

    console.log('💡 Solution: Update product category_id to match subcategory parent\n');
  } else if (categoryMatch && subcategoryMatch) {
    console.log('✅ All IDs match correctly!');
    console.log('   Issue must be in UI component logic\n');
  }
}

diagnoseIssue();
