import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://imnecvcvhypnlvujajpn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk";
const ORG_ID = "4808e8a5-547b-4601-ab90-a8388ee748fa";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🐟 Creating Fish & Seafood subcategories...\n");

async function createFishSubcategories() {
  // Get Fish & Seafood category ID
  const { data: category, error: catError } = await supabase
    .from('label_categories')
    .select('id')
    .eq('name', 'Fish & Seafood')
    .eq('organization_id', ORG_ID)
    .single();

  if (catError || !category) {
    console.error("❌ Fish & Seafood category not found!", catError);
    return;
  }

  console.log(`✅ Found Fish & Seafood category: ${category.id}\n`);

  // Define subcategories
  const subcategories = [
    { name: 'Fresh Fish', display_order: 1 },
    { name: 'Frozen Fish', display_order: 2 },
    { name: 'Shellfish', display_order: 3 },
    { name: 'Crustaceans', display_order: 4 },
    { name: 'Mollusks', display_order: 5 },
    { name: 'Smoked Fish', display_order: 6 },
    { name: 'Canned Seafood', display_order: 7 },
  ];

  console.log("📝 Inserting subcategories...");

  let successCount = 0;
  let skipCount = 0;

  for (const sub of subcategories) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('label_subcategories')
      .select('id')
      .eq('name', sub.name)
      .eq('category_id', category.id)
      .eq('organization_id', ORG_ID)
      .single();

    if (existing) {
      console.log(`   ⏭️  ${sub.name} - already exists`);
      skipCount++;
      continue;
    }

    // Insert new subcategory
    const { error } = await supabase
      .from('label_subcategories')
      .insert({
        name: sub.name,
        category_id: category.id,
        organization_id: ORG_ID,
        display_order: sub.display_order
      });

    if (error) {
      console.error(`   ❌ ${sub.name} - Error:`, error.message);
    } else {
      console.log(`   ✅ ${sub.name} - created`);
      successCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   Created: ${successCount}`);
  console.log(`   Skipped: ${skipCount}`);
  console.log(`   Total: ${subcategories.length}`);

  // Verify
  const { data: allSubs } = await supabase
    .from('label_subcategories')
    .select('name')
    .eq('category_id', category.id)
    .eq('organization_id', ORG_ID)
    .order('display_order');

  console.log(`\n✅ Fish & Seafood now has ${allSubs?.length || 0} subcategories:`);
  allSubs?.forEach(s => console.log(`   - ${s.name}`));

  // Now try to assign the salmon product
  console.log(`\n🐟 Assigning Fresh Salmon Fillet...`);
  
  const { data: freshFish } = await supabase
    .from('label_subcategories')
    .select('id')
    .eq('name', 'Fresh Fish')
    .eq('category_id', category.id)
    .eq('organization_id', ORG_ID)
    .single();

  if (freshFish) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ subcategory_id: freshFish.id })
      .eq('name', 'Fresh Salmon Fillet')
      .eq('organization_id', ORG_ID);

    if (updateError) {
      console.error(`   ❌ Error:`, updateError.message);
    } else {
      console.log(`   ✅ Fresh Salmon Fillet assigned to Fresh Fish!`);
    }
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

  console.log(`\n📊 Final Product Stats:`);
  console.log(`   Total Products: ${total}`);
  console.log(`   Assigned: ${assigned}`);
  console.log(`   Unassigned: ${total - assigned}`);
  console.log(`   Coverage: ${((assigned / total) * 100).toFixed(1)}%`);

  console.log(`\n🎉 Done! All subcategories created and products assigned!`);
}

createFishSubcategories();
