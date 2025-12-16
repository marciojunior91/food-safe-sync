import { createClient } from '@supabase/supabase-js';

// Supabase connection with service role key (bypasses RLS)
const SUPABASE_URL = "https://imnecvcvhypnlvujajpn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbmVjdmN2aHlwbmx2dWphanBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY5Mjg3MywiZXhwIjoyMDcxMjY4ODczfQ.yFgAcczt8EIV7DSdayOVJK9U0hhcqM5KYflEfQYGBQk";
const ORG_ID = "4808e8a5-547b-4601-ab90-a8388ee748fa";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log("🚀 Starting Product-to-Subcategory Linking...\n");

// Step 1: Fetch all subcategories with their categories
async function fetchSubcategories() {
  console.log("📂 Fetching subcategories...");
  
  const { data, error } = await supabase
    .from('label_subcategories')
    .select(`
      id,
      name,
      category_id,
      label_categories!inner(name)
    `)
    .eq('organization_id', ORG_ID);

  if (error) {
    console.error("❌ Error fetching subcategories:", error);
    throw error;
  }

  console.log(`✅ Found ${data.length} subcategories\n`);
  return data;
}

// Step 2: Fetch all products
async function fetchProducts() {
  console.log("📦 Fetching products...");
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, subcategory_id')
    .eq('organization_id', ORG_ID);

  if (error) {
    console.error("❌ Error fetching products:", error);
    throw error;
  }

  console.log(`✅ Found ${data.length} total products`);
  
  const unassigned = data.filter(p => !p.subcategory_id);
  console.log(`📊 Unassigned: ${unassigned.length} products\n`);
  
  return data;
}

// Step 3: Intelligent matching logic
function findBestSubcategory(product, subcategories) {
  const productName = product.name.toLowerCase();

  // Define keyword mappings for each subcategory
  const keywordMappings = {
    // Fish & Seafood
    'Fresh Fish': ['salmon', 'tuna', 'cod', 'bass', 'trout', 'halibut', 'tilapia', 'snapper', 'mackerel', 'fillet'],
    'Frozen Fish': ['frozen fish', 'frozen salmon', 'frozen cod'],
    'Shellfish': ['oyster', 'clam', 'mussel', 'scallop'],
    'Crustaceans': ['shrimp', 'lobster', 'crab', 'prawn', 'crawfish', 'crayfish'],
    'Mollusks': ['squid', 'octopus', 'calamari'],
    'Smoked Fish': ['smoked salmon', 'smoked trout', 'smoked mackerel', 'lox'],
    'Canned Seafood': ['canned tuna', 'canned salmon', 'sardine', 'anchov'],

    // Bakery
    'Artisan Breads': ['sourdough', 'ciabatta', 'multigrain', 'rye bread', 'whole wheat bread', 'artisan bread', 'bread loaf'],
    'Rolls & Buns': ['roll', 'bun', 'brioche', 'kaiser roll'],
    'Baguettes': ['baguette'],
    'Croissants': ['croissant'],
    'Pastries': ['danish', 'tart', 'éclair', 'puff pastry', 'turnover'],
    'Danish': ['danish'],
    'Focaccia': ['focaccia'],
    'Flatbreads': ['flatbread', 'pita', 'naan', 'lavash'],
    'Specialty Breads': ['pretzel', 'challah', 'bagel', 'english muffin'],

    // Raw Ingredients
    'Fresh Vegetables': ['tomato', 'pepper', 'cucumber', 'zucchini', 'eggplant', 'celery'],
    'Fresh Fruits': ['apple', 'orange', 'banana', 'berry', 'lemon', 'lime', 'melon', 'grape'],
    'Herbs & Aromatics': ['basil', 'parsley', 'cilantro', 'thyme', 'rosemary', 'garlic', 'ginger', 'sage'],
    'Leafy Greens': ['lettuce', 'spinach', 'arugula', 'kale', 'chard', 'collard'],
    'Root Vegetables': ['carrot', 'potato', 'beet', 'turnip', 'radish', 'parsnip'],
    'Mushrooms': ['mushroom', 'portobello', 'shiitake', 'oyster mushroom'],
    'Legumes & Pulses': ['bean', 'lentil', 'chickpea', 'pea'],
    'Grains & Rice': ['rice', 'quinoa', 'barley', 'oat', 'wheat'],
    'Flours': ['flour', 'almond flour', 'coconut flour'],
    'Nuts & Seeds': ['almond', 'walnut', 'cashew', 'pecan', 'seed', 'pine nut'],
    'Oils & Fats': ['olive oil', 'vegetable oil', 'coconut oil', 'butter', 'lard'],
    'Vinegars': ['vinegar', 'balsamic', 'wine vinegar'],
    'Spices': ['pepper', 'salt', 'cumin', 'paprika', 'cinnamon', 'nutmeg'],
    'Dried Herbs': ['dried basil', 'dried oregano', 'dried thyme'],
    'Sugars & Sweeteners': ['sugar', 'honey', 'syrup', 'agave', 'stevia'],

    // Meat & Poultry
    'Beef': ['beef', 'steak', 'ground beef', 'brisket', 'ribeye', 'sirloin'],
    'Pork': ['pork', 'bacon', 'ham', 'pork chop', 'tenderloin'],
    'Lamb': ['lamb', 'mutton'],
    'Veal': ['veal'],
    'Chicken': ['chicken', 'hen'],
    'Duck': ['duck'],
    'Turkey': ['turkey'],
    'Game Meats': ['venison', 'rabbit', 'quail', 'pheasant', 'bison'],
    'Offal': ['liver', 'kidney', 'heart', 'tongue', 'tripe'],
    'Charcuterie': ['salami', 'prosciutto', 'chorizo', 'pepperoni', 'mortadella'],
    'Sausages': ['sausage', 'bratwurst', 'kielbasa', 'andouille'],

    // Dairy
    'Milk': ['milk', 'whole milk', 'skim milk'],
    'Cheese': ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'brie', 'gouda'],
    'Yogurt': ['yogurt', 'greek yogurt'],
    'Butter & Cream': ['butter', 'cream', 'heavy cream', 'whipping cream', 'sour cream'],
    'Plant-Based Dairy': ['almond milk', 'soy milk', 'oat milk', 'vegan cheese'],

    // Beverages
    'Juices': ['juice', 'orange juice', 'apple juice'],
    'Sodas': ['soda', 'cola', 'sprite', 'carbonated'],
    'Coffee & Tea': ['coffee', 'tea', 'espresso'],
    'Alcoholic': ['wine', 'beer', 'whiskey', 'vodka', 'rum', 'liquor'],
    'Water': ['water', 'sparkling water', 'mineral water'],

    // Desserts
    'Cakes': ['cake', 'cheesecake', 'sponge cake'],
    'Ice Cream': ['ice cream', 'gelato', 'sorbet'],
    'Cookies': ['cookie', 'biscuit'],
    'Puddings': ['pudding', 'custard', 'mousse'],

    // Prepared Foods
    'Soups': ['soup', 'broth', 'bisque', 'chowder'],
    'Salads': ['salad', 'coleslaw'],
    'Sandwiches': ['sandwich', 'panini', 'wrap'],
    'Entrees': ['lasagna', 'pasta', 'casserole', 'stir fry'],
    'Sides': ['mashed potato', 'french fries', 'rice pilaf'],

    // Sauces & Condiments
    'Hot Sauces': ['hot sauce', 'sriracha', 'tabasco', 'chili sauce'],
    'Sauces': ['sauce', 'bechamel', 'béchamel', 'marinara', 'alfredo', 'hollandaise', 'pesto', 'gravy', 'bolognese', 'carbonara', 'velouté'],
    'Dressings': ['dressing', 'ranch', 'caesar', 'vinaigrette'],
    'Marinades': ['marinade', 'teriyaki'],
    'Oils': ['oil'],

    // Vegetables (category)
    'Cruciferous': ['broccoli', 'cauliflower', 'cabbage', 'brussels sprout'],
    'Nightshades': ['tomato', 'pepper', 'eggplant', 'potato'],
    'Alliums': ['onion', 'garlic', 'leek', 'shallot'],
    'Squashes': ['squash', 'pumpkin', 'butternut'],
  };

  // Find matching subcategories
  const matches = [];

  for (const subcategory of subcategories) {
    const subcategoryName = subcategory.name;
    const categoryName = subcategory.label_categories.name;
    const keywords = keywordMappings[subcategoryName] || [];

    let score = 0;

    // Check if product name contains any keywords
    for (const keyword of keywords) {
      if (productName.includes(keyword)) {
        score += 10;
        break; // Found a match, move on
      }
    }

    // Exact subcategory name match (rare but high confidence)
    if (productName.includes(subcategoryName.toLowerCase())) {
      score += 20;
    }

    // Special case: generic "bread" matches Artisan Breads
    if (productName === 'bread' && subcategoryName === 'Artisan Breads') {
      score += 15;
    }

    if (score > 0) {
      matches.push({ subcategory, score });
    }
  }

  // Sort by score and return best match
  matches.sort((a, b) => b.score - a.score);

  return matches.length > 0 ? matches[0] : null;
}

// Step 4: Assign products to subcategories
async function assignProducts(products, subcategories) {
  console.log("🔗 Starting intelligent matching...\n");

  const unassignedProducts = products.filter(p => !p.subcategory_id);
  const assignments = [];
  const noMatch = [];

  for (const product of unassignedProducts) {
    const match = findBestSubcategory(product, subcategories);

    if (match && match.score >= 10) {
      assignments.push({
        productId: product.id,
        productName: product.name,
        subcategoryId: match.subcategory.id,
        subcategoryName: match.subcategory.name,
        categoryName: match.subcategory.label_categories.name,
        confidence: match.score
      });
    } else {
      noMatch.push(product);
    }
  }

  console.log(`✅ Found matches for ${assignments.length} products`);
  console.log(`⚠️  No matches for ${noMatch.length} products\n`);

  // Show sample assignments
  if (assignments.length > 0) {
    console.log("📋 Sample assignments (first 10):");
    assignments.slice(0, 10).forEach(a => {
      console.log(`   "${a.productName}" → ${a.categoryName} / ${a.subcategoryName} (confidence: ${a.confidence})`);
    });
    console.log();
  }

  // Perform bulk update
  if (assignments.length > 0) {
    console.log("💾 Updating database...");

    let successCount = 0;
    let errorCount = 0;

    // Update in batches of 50
    for (let i = 0; i < assignments.length; i += 50) {
      const batch = assignments.slice(i, i + 50);
      
      for (const assignment of batch) {
        const { error } = await supabase
          .from('products')
          .update({ subcategory_id: assignment.subcategoryId })
          .eq('id', assignment.productId)
          .eq('organization_id', ORG_ID);

        if (error) {
          console.error(`   ❌ Error updating "${assignment.productName}":`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      }

      console.log(`   Progress: ${Math.min(i + 50, assignments.length)}/${assignments.length}`);
    }

    console.log(`\n✅ Successfully assigned ${successCount} products`);
    if (errorCount > 0) {
      console.log(`❌ Failed to assign ${errorCount} products`);
    }
  }

  // Report unmatched products
  if (noMatch.length > 0 && noMatch.length <= 20) {
    console.log(`\n⚠️  Products with no matches (${noMatch.length}):`);
    noMatch.forEach(p => {
      console.log(`   - "${p.name}" (category: ${p.category || 'none'})`);
    });
  } else if (noMatch.length > 20) {
    console.log(`\n⚠️  ${noMatch.length} products had no matches (too many to list)`);
  }
}

// Step 5: Generate summary statistics
async function generateSummary() {
  console.log("\n📊 Generating summary statistics...\n");

  const { data, error } = await supabase
    .from('label_subcategories')
    .select(`
      id,
      name,
      label_categories!inner(name),
      products!products_subcategory_id_fkey(count)
    `)
    .eq('organization_id', ORG_ID);

  if (error) {
    console.error("❌ Error generating summary:", error);
    return;
  }

  console.log("=".repeat(80));
  console.log("SUBCATEGORY ASSIGNMENT SUMMARY");
  console.log("=".repeat(80));

  const categoryGroups = {};
  
  for (const subcategory of data) {
    const categoryName = subcategory.label_categories.name;
    if (!categoryGroups[categoryName]) {
      categoryGroups[categoryName] = [];
    }
    categoryGroups[categoryName].push({
      name: subcategory.name,
      count: subcategory.products?.[0]?.count || 0
    });
  }

  for (const [category, subcategories] of Object.entries(categoryGroups)) {
    const totalProducts = subcategories.reduce((sum, s) => sum + s.count, 0);
    console.log(`\n${category} (${totalProducts} products):`);
    subcategories.forEach(s => {
      if (s.count > 0) {
        console.log(`   ✅ ${s.name}: ${s.count} products`);
      } else {
        console.log(`   ⚪ ${s.name}: 0 products`);
      }
    });
  }

  // Overall stats
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID);

  const { count: assignedProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', ORG_ID)
    .not('subcategory_id', 'is', null);

  console.log("\n" + "=".repeat(80));
  console.log(`OVERALL STATS:`);
  console.log(`   Total Products: ${totalProducts}`);
  console.log(`   Assigned: ${assignedProducts}`);
  console.log(`   Unassigned: ${totalProducts - assignedProducts}`);
  console.log(`   Coverage: ${((assignedProducts / totalProducts) * 100).toFixed(1)}%`);
  console.log("=".repeat(80));
}

// Main execution
async function main() {
  try {
    const subcategories = await fetchSubcategories();
    const products = await fetchProducts();
    await assignProducts(products, subcategories);
    await generateSummary();

    console.log("\n✅ Product linking complete!\n");
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
