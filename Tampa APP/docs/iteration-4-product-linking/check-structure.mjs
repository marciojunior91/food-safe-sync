import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://imnecvcvhypnlvujajpn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk";
const ORG_ID = "4808e8a5-547b-4601-ab90-a8388ee748fa";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkData() {
  console.log("📋 Checking database structure...\n");

  // Check Fish & Seafood category
  const { data: fishCategory } = await supabase
    .from('label_categories')
    .select('id, name')
    .eq('name', 'Fish & Seafood')
    .eq('organization_id', ORG_ID)
    .single();

  if (fishCategory) {
    console.log("✅ Found Fish & Seafood category:", fishCategory.id);

    // Get its subcategories
    const { data: subcategories } = await supabase
      .from('label_subcategories')
      .select('id, name')
      .eq('category_id', fishCategory.id)
      .eq('organization_id', ORG_ID);

    console.log(`\n📂 Fish & Seafood subcategories (${subcategories?.length || 0}):`);
    subcategories?.forEach(s => console.log(`   - ${s.name}`));
  } else {
    console.log("❌ Fish & Seafood category not found!");
  }

  // Check unassigned product
  const { data: product } = await supabase
    .from('products')
    .select('id, name, subcategory_id')
    .eq('name', 'Fresh Salmon Fillet')
    .eq('organization_id', ORG_ID)
    .single();

  console.log(`\n🐟 Fresh Salmon Fillet:`, product);

  // Show all categories
  const { data: allCategories } = await supabase
    .from('label_categories')
    .select('name')
    .eq('organization_id', ORG_ID)
    .order('name');

  console.log(`\n📁 All categories (${allCategories?.length}):`);
  allCategories?.forEach(c => console.log(`   - ${c.name}`));
}

checkData();
