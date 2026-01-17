import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://imnecvcvhypnlvujajpn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk";
const ORG_ID = "4808e8a5-547b-4601-ab90-a8388ee748fa";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🍝 Re-assigning 'Tomato Sauce' to new 'Sauces' subcategory...\n");

async function reassignTomatoSauce() {
  // Get "Sauces" subcategory ID
  const { data: saucesSubcategory } = await supabase
    .from('label_subcategories')
    .select('id, name, label_categories!inner(name)')
    .eq('name', 'Sauces')
    .eq('organization_id', ORG_ID)
    .single();

  if (!saucesSubcategory) {
    console.error("❌ 'Sauces' subcategory not found!");
    return;
  }

  console.log(`✅ Found subcategory: ${saucesSubcategory.label_categories.name} / ${saucesSubcategory.name}`);

  // Find "Tomato Sauce" product
  const { data: product } = await supabase
    .from('products')
    .select('id, name, subcategory_id')
    .eq('name', 'Tomato Sauce')
    .eq('organization_id', ORG_ID)
    .single();

  if (!product) {
    console.log("\n⚠️  'Tomato Sauce' product not found. Nothing to reassign.");
    return;
  }

  console.log(`\n📦 Found product: ${product.name}`);

  // Check current assignment
  if (product.subcategory_id) {
    const { data: currentSub } = await supabase
      .from('label_subcategories')
      .select('name, label_categories!inner(name)')
      .eq('id', product.subcategory_id)
      .single();

    console.log(`   Currently assigned to: ${currentSub?.label_categories.name} / ${currentSub?.name}`);
  } else {
    console.log(`   Currently unassigned`);
  }

  // Reassign to "Sauces"
  const { error } = await supabase
    .from('products')
    .update({ subcategory_id: saucesSubcategory.id })
    .eq('id', product.id);

  if (error) {
    console.error(`\n❌ Error reassigning:`, error.message);
    return;
  }

  console.log(`\n✅ Successfully reassigned to: Sauces & Condiments / Sauces`);
  console.log(`\n💡 Now "Tomato Sauce" is in the correct subcategory with:`);
  console.log(`   - Béchamel`);
  console.log(`   - Marinara`);
  console.log(`   - Alfredo`);
  console.log(`   - Hollandaise`);
  console.log(`   - And more sauces!`);

  console.log(`\n🎉 Done!`);
}

reassignTomatoSauce();
