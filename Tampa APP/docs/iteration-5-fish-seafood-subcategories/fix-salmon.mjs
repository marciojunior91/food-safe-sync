import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://imnecvcvhypnlvujajpn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk";
const ORG_ID = "4808e8a5-547b-4601-ab90-a8388ee748fa";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🐟 Manually assigning Fresh Salmon Fillet...\n");

async function assignSalmon() {
  // Get Fresh Fish subcategory ID
  const { data: subcategory } = await supabase
    .from('label_subcategories')
    .select('id')
    .eq('name', 'Fresh Fish')
    .eq('organization_id', ORG_ID)
    .single();

  if (!subcategory) {
    console.error("❌ Fresh Fish subcategory not found!");
    return;
  }

  // Update the salmon product
  const { error } = await supabase
    .from('products')
    .update({ subcategory_id: subcategory.id })
    .eq('name', 'Fresh Salmon Fillet')
    .eq('organization_id', ORG_ID);

  if (error) {
    console.error("❌ Error:", error);
  } else {
    console.log("✅ Successfully assigned 'Fresh Salmon Fillet' to 'Fresh Fish' subcategory!");
  }

  // Final stats
  const { count: total } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID);

  const { count: assigned } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID)
    .not('subcategory_id', 'is', null);

  console.log(`\n📊 Final Stats:`);
  console.log(`   Total Products: ${total}`);
  console.log(`   Assigned: ${assigned}`);
  console.log(`   Coverage: ${((assigned / total) * 100).toFixed(1)}%`);
  console.log(`\n🎉 All products linked!`);
}

assignSalmon();
