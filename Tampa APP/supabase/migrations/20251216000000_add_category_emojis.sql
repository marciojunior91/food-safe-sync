-- Add emoji/icon support to categories and subcategories
-- Migration: 20251216000000_add_category_emojis.sql
-- Iteration 11: Epic 1 - Category & Subcategory Emojis


-- Populate default emojis for ACTUAL categories (from quickPrintIcons.ts)
UPDATE label_categories SET icon = '🥩' WHERE name = 'Meat & Poultry' AND icon IS NULL;
UPDATE label_categories SET icon = '🐟' WHERE name = 'Fish & Seafood' AND icon IS NULL;
UPDATE label_categories SET icon = '🍞' WHERE name = 'Bakery' AND icon IS NULL;
UPDATE label_categories SET icon = '🥬' WHERE name = 'Raw Ingredients' AND icon IS NULL;
UPDATE label_categories SET icon = '🥛' WHERE name = 'Dairy' AND icon IS NULL;
UPDATE label_categories SET icon = '🌶️' WHERE name = 'Sauces & Condiments' AND icon IS NULL;
UPDATE label_categories SET icon = '🍰' WHERE name = 'Desserts' AND icon IS NULL;
UPDATE label_categories SET icon = '🍽️' WHERE name = 'Prepared Foods' AND icon IS NULL;
UPDATE label_categories SET icon = '🥤' WHERE name = 'Beverages' AND icon IS NULL;
UPDATE label_categories SET icon = '🥗' WHERE name = 'Vegetables & Fruits' AND icon IS NULL;

-- Populate default emojis for ACTUAL subcategories (from quickPrintIcons.ts)
-- Fish & Seafood subcategories (7)
UPDATE label_subcategories SET icon = '🐟' WHERE name = 'Fresh Fish' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🧊' WHERE name = 'Frozen Fish' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🦪' WHERE name = 'Shellfish' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🦐' WHERE name = 'Crustaceans' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🦑' WHERE name = 'Mollusks' AND icon IS NULL;
UPDATE label_subcategories SET icon = '💨' WHERE name = 'Smoked Fish' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥫' WHERE name = 'Canned Seafood' AND icon IS NULL;

-- Bakery subcategories (9)
UPDATE label_subcategories SET icon = '🍞' WHERE name = 'Artisan Breads' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥖' WHERE name = 'Rolls & Buns' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥖' WHERE name = 'Baguettes' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥐' WHERE name = 'Croissants' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🧁' WHERE name = 'Pastries' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥮' WHERE name = 'Danish' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍕' WHERE name = 'Focaccia' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍞' WHERE name = 'Flatbreads' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥨' WHERE name = 'Specialty Breads' AND icon IS NULL;

-- Raw Ingredients subcategories (12) - Removed Fresh Vegetables & Fresh Fruits (now category)
UPDATE label_subcategories SET icon = '🌿' WHERE name = 'Herbs & Aromatics' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥬' WHERE name = 'Leafy Greens' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥕' WHERE name = 'Root Vegetables' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍄' WHERE name = 'Mushrooms' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🌱' WHERE name = 'Legumes & Pulses' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🌾' WHERE name = 'Grains & Rice' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🌾' WHERE name = 'Flours' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥜' WHERE name = 'Nuts & Seeds' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🛢️' WHERE name = 'Oils & Fats' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🧂' WHERE name = 'Spices' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍃' WHERE name = 'Dried Herbs' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍯' WHERE name = 'Sugars & Sweeteners' AND icon IS NULL;

-- Meat & Poultry subcategories (11)
UPDATE label_subcategories SET icon = '🐄' WHERE name = 'Beef' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🐖' WHERE name = 'Pork' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🐑' WHERE name = 'Lamb' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🐮' WHERE name = 'Veal' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🐔' WHERE name = 'Chicken' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🦆' WHERE name = 'Duck' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🦃' WHERE name = 'Turkey' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🦌' WHERE name = 'Game Meats' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍖' WHERE name = 'Offal' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥓' WHERE name = 'Charcuterie' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🌭' WHERE name = 'Sausages' AND icon IS NULL;

-- Dairy subcategories (5)
UPDATE label_subcategories SET icon = '🥛' WHERE name = 'Milk' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🧀' WHERE name = 'Cheese' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥛' WHERE name = 'Yogurt' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🧈' WHERE name = 'Butter & Cream' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥥' WHERE name = 'Plant-Based Dairy' AND icon IS NULL;

-- Beverages subcategories (5)
UPDATE label_subcategories SET icon = '🧃' WHERE name = 'Juices' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥤' WHERE name = 'Sodas' AND icon IS NULL;
UPDATE label_subcategories SET icon = '☕' WHERE name = 'Coffee & Tea' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍷' WHERE name = 'Alcoholic' AND icon IS NULL;
UPDATE label_subcategories SET icon = '💧' WHERE name = 'Water' AND icon IS NULL;

-- Desserts subcategories (4)
UPDATE label_subcategories SET icon = '🎂' WHERE name = 'Cakes' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍨' WHERE name = 'Ice Cream' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍪' WHERE name = 'Cookies' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍮' WHERE name = 'Puddings' AND icon IS NULL;

-- Prepared Foods subcategories (5)
UPDATE label_subcategories SET icon = '🍲' WHERE name = 'Soups' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥗' WHERE name = 'Salads' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥪' WHERE name = 'Sandwiches' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍽️' WHERE name = 'Entrees' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍚' WHERE name = 'Sides' AND icon IS NULL;

-- Sauces & Condiments subcategories (6)
UPDATE label_subcategories SET icon = '🌶️' WHERE name = 'Hot Sauces' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍝' WHERE name = 'Sauces' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🥗' WHERE name = 'Dressings' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🧂' WHERE name = 'Marinades' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍶' WHERE name = 'Vinegars' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🛢️' WHERE name = 'Oils' AND icon IS NULL;

-- Vegetables & Fruits subcategories (9) - combining vegetable and fruit types
UPDATE label_subcategories SET icon = '🥦' WHERE name = 'Cruciferous' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍅' WHERE name = 'Nightshades' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🧅' WHERE name = 'Alliums' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🎃' WHERE name = 'Squashes' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍎' WHERE name = 'Apples' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍊' WHERE name = 'Citrus Fruits' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍓' WHERE name = 'Berries' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍌' WHERE name = 'Tropical Fruits' AND icon IS NULL;
UPDATE label_subcategories SET icon = '🍇' WHERE name = 'Stone Fruits' AND icon IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN label_categories.icon IS 'Emoji icon for visual category identification (e.g., 🍖 for Meat & Poultry)';
COMMENT ON COLUMN label_subcategories.icon IS 'Emoji icon for visual subcategory identification (e.g., 🐔 for Chicken)';

-- Verify migration success
DO $$
DECLARE
  cat_count INTEGER;
  subcat_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM label_categories WHERE icon IS NOT NULL;
  SELECT COUNT(*) INTO subcat_count FROM label_subcategories WHERE icon IS NOT NULL;
  
  RAISE NOTICE 'Migration complete: % categories with icons, % subcategories with icons', cat_count, subcat_count;
END $$;
