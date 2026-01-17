import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://imnecvcvhypnlvujajpn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk";
const ORG_ID = "4808e8a5-547b-4601-ab90-a8388ee748fa";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🌶️ Adding 'Sauces' subcategory to Sauces & Condiments...\n");

async function addSaucesSubcategory() {
  // Get Sauces & Condiments category ID
  const { data: category, error: catError } = await supabase
    .from('label_categories')
    .select('id, name')
    .eq('name', 'Sauces & Condiments')
    .eq('organization_id', ORG_ID)
    .single();

  if (catError || !category) {
    console.error("❌ Sauces & Condiments category not found!", catError);
    return;
  }

  console.log(`✅ Found category: ${category.name} (${category.id})\n`);

  // Get current subcategories
  const { data: currentSubs } = await supabase
    .from('label_subcategories')
    .select('name, display_order')
    .eq('category_id', category.id)
    .eq('organization_id', ORG_ID)
    .order('display_order');

  console.log("📋 Current subcategories:");
  currentSubs?.forEach(s => console.log(`   ${s.display_order}. ${s.name}`));

  // Check if "Sauces" already exists
  const { data: existing } = await supabase
    .from('label_subcategories')
    .select('id')
    .eq('name', 'Sauces')
    .eq('category_id', category.id)
    .eq('organization_id', ORG_ID)
    .single();

  if (existing) {
    console.log(`\n⚠️  "Sauces" subcategory already exists!`);
    return;
  }

  // Insert new "Sauces" subcategory
  // Place it at display_order 15 (between existing ones)
  console.log(`\n➕ Adding new subcategory: "Sauces"...`);

  const { data: newSub, error: insertError } = await supabase
    .from('label_subcategories')
    .insert({
      name: 'Sauces',
      category_id: category.id,
      organization_id: ORG_ID,
      display_order: 15
    })
    .select()
    .single();

  if (insertError) {
    console.error(`❌ Error:`, insertError.message);
    return;
  }

  console.log(`✅ Successfully added "Sauces" subcategory!`);

  // Show updated list
  const { data: updatedSubs } = await supabase
    .from('label_subcategories')
    .select('name, display_order')
    .eq('category_id', category.id)
    .eq('organization_id', ORG_ID)
    .order('display_order');

  console.log(`\n📋 Updated subcategories (${updatedSubs?.length} total):`);
  updatedSubs?.forEach(s => console.log(`   ${s.display_order}. ${s.name}`));

  console.log(`\n💡 "Sauces" subcategory is for:`);
  console.log(`   - Béchamel sauce`);
  console.log(`   - Tomato sauce (marinara, pomodoro)`);
  console.log(`   - Hollandaise sauce`);
  console.log(`   - Alfredo sauce`);
  console.log(`   - Pesto`);
  console.log(`   - Curry sauce`);
  console.log(`   - Gravy`);
  console.log(`   - And more!`);

  console.log(`\n🎉 Done! New subcategory added.`);
}

addSaucesSubcategory();
