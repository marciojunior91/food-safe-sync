-- Migration: Suflê-style Subcategories Structure
-- Description: Create comprehensive subcategories based on Suflê restaurant structure
-- Date: 2025-12-15

-- Function to insert Suflê-style subcategories
CREATE OR REPLACE FUNCTION insert_sufle_subcategories()
RETURNS void AS $$
DECLARE
  v_category_id UUID;
BEGIN
  
  -- ========================================
  -- FISH AND SEAFOOD (Folder Icon 🐟)
  -- ========================================
  INSERT INTO public.label_categories (name, organization_id)
  VALUES ('Fish and Seafood', NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Fish and Seafood' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Fresh Fish', v_category_id, NULL, 1),
      ('Frozen Fish', v_category_id, NULL, 2),
      ('Shellfish', v_category_id, NULL, 3),
      ('Crustaceans', v_category_id, NULL, 4),
      ('Mollusks', v_category_id, NULL, 5),
      ('Smoked Fish', v_category_id, NULL, 6),
      ('Canned Seafood', v_category_id, NULL, 7)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- ========================================
  -- BAKERY (Folder Icon 🍞)
  -- ========================================
  INSERT INTO public.label_categories (name, organization_id)
  VALUES ('Bakery', NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Bakery' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Artisan Breads', v_category_id, NULL, 1),
      ('Rolls & Buns', v_category_id, NULL, 2),
      ('Baguettes', v_category_id, NULL, 3),
      ('Croissants', v_category_id, NULL, 4),
      ('Pastries', v_category_id, NULL, 5),
      ('Danish', v_category_id, NULL, 6),
      ('Focaccia', v_category_id, NULL, 7),
      ('Flatbreads', v_category_id, NULL, 8),
      ('Specialty Breads', v_category_id, NULL, 9)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- ========================================
  -- RAW INGREDIENTS (Folder Icon 🥬)
  -- ========================================
  INSERT INTO public.label_categories (name, organization_id)
  VALUES ('Raw Ingredients', NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Raw Ingredients' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Fresh Vegetables', v_category_id, NULL, 1),
      ('Fresh Fruits', v_category_id, NULL, 2),
      ('Herbs & Aromatics', v_category_id, NULL, 3),
      ('Leafy Greens', v_category_id, NULL, 4),
      ('Root Vegetables', v_category_id, NULL, 5),
      ('Mushrooms', v_category_id, NULL, 6),
      ('Legumes & Pulses', v_category_id, NULL, 7),
      ('Grains & Rice', v_category_id, NULL, 8),
      ('Flours', v_category_id, NULL, 9),
      ('Nuts & Seeds', v_category_id, NULL, 10),
      ('Oils & Fats', v_category_id, NULL, 11),
      ('Vinegars', v_category_id, NULL, 12),
      ('Spices', v_category_id, NULL, 13),
      ('Dried Herbs', v_category_id, NULL, 14),
      ('Sugars & Sweeteners', v_category_id, NULL, 15)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- ========================================
  -- MEAT & POULTRY (Folder Icon 🥩)
  -- ========================================
  INSERT INTO public.label_categories (name, organization_id)
  VALUES ('Meat & Poultry', NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Meat & Poultry' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Beef', v_category_id, NULL, 1),
      ('Pork', v_category_id, NULL, 2),
      ('Lamb', v_category_id, NULL, 3),
      ('Veal', v_category_id, NULL, 4),
      ('Chicken', v_category_id, NULL, 5),
      ('Duck', v_category_id, NULL, 6),
      ('Turkey', v_category_id, NULL, 7),
      ('Game Meats', v_category_id, NULL, 8),
      ('Offal', v_category_id, NULL, 9),
      ('Charcuterie', v_category_id, NULL, 10),
      ('Sausages', v_category_id, NULL, 11)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- ========================================
  -- DAIRY (Existing - Add More Subcategories)
  -- ========================================
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Dairy' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Soft Cheeses', v_category_id, NULL, 1),
      ('Hard Cheeses', v_category_id, NULL, 2),
      ('Blue Cheeses', v_category_id, NULL, 3),
      ('Fresh Cheeses', v_category_id, NULL, 4),
      ('Aged Cheeses', v_category_id, NULL, 5),
      ('Heavy Cream', v_category_id, NULL, 6),
      ('Light Cream', v_category_id, NULL, 7),
      ('Whole Milk', v_category_id, NULL, 8),
      ('Buttermilk', v_category_id, NULL, 9),
      ('Yogurt', v_category_id, NULL, 10),
      ('Butter', v_category_id, NULL, 11),
      ('Clarified Butter', v_category_id, NULL, 12),
      ('Crème Fraîche', v_category_id, NULL, 13),
      ('Sour Cream', v_category_id, NULL, 14)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- ========================================
  -- SAUCES & CONDIMENTS (Existing - Expand)
  -- ========================================
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Sauces & Condiments' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Mother Sauces', v_category_id, NULL, 1),
      ('Tomato-Based Sauces', v_category_id, NULL, 2),
      ('Cream-Based Sauces', v_category_id, NULL, 3),
      ('Wine-Based Sauces', v_category_id, NULL, 4),
      ('Stock Reductions', v_category_id, NULL, 5),
      ('Emulsified Sauces', v_category_id, NULL, 6),
      ('Hot Sauces', v_category_id, NULL, 7),
      ('Mustards', v_category_id, NULL, 8),
      ('Vinaigrettes', v_category_id, NULL, 9),
      ('Mayonnaise-Based', v_category_id, NULL, 10),
      ('Asian Sauces', v_category_id, NULL, 11),
      ('Latin Sauces', v_category_id, NULL, 12),
      ('Chutneys & Relishes', v_category_id, NULL, 13),
      ('Glazes', v_category_id, NULL, 14),
      ('Compound Butters', v_category_id, NULL, 15)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- ========================================
  -- DESSERTS (Existing - Expand for Suflê)
  -- ========================================
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Desserts' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Soufflés', v_category_id, NULL, 1),
      ('Mousses', v_category_id, NULL, 2),
      ('Tarts & Pies', v_category_id, NULL, 3),
      ('Layer Cakes', v_category_id, NULL, 4),
      ('Cheesecakes', v_category_id, NULL, 5),
      ('Chocolate Desserts', v_category_id, NULL, 6),
      ('Fruit Desserts', v_category_id, NULL, 7),
      ('Ice Creams', v_category_id, NULL, 8),
      ('Sorbets', v_category_id, NULL, 9),
      ('Custards & Puddings', v_category_id, NULL, 10),
      ('Cookies & Biscuits', v_category_id, NULL, 11),
      ('Macarons', v_category_id, NULL, 12),
      ('Pastry Creams', v_category_id, NULL, 13),
      ('Ganaches', v_category_id, NULL, 14)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- ========================================
  -- PREPARED FOODS (Existing - Expand)
  -- ========================================
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Prepared Foods' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Stocks & Broths', v_category_id, NULL, 1),
      ('Soups', v_category_id, NULL, 2),
      ('Salads', v_category_id, NULL, 3),
      ('Pasta Dishes', v_category_id, NULL, 4),
      ('Rice Dishes', v_category_id, NULL, 5),
      ('Sandwiches', v_category_id, NULL, 6),
      ('Appetizers', v_category_id, NULL, 7),
      ('Side Dishes', v_category_id, NULL, 8),
      ('Entrees', v_category_id, NULL, 9),
      ('Casseroles', v_category_id, NULL, 10),
      ('Terrines & Pâtés', v_category_id, NULL, 11),
      ('Quiches & Tarts', v_category_id, NULL, 12)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- ========================================
  -- BEVERAGES (Existing - Expand)
  -- ========================================
  SELECT id INTO v_category_id FROM public.label_categories 
  WHERE name = 'Beverages' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Coffee', v_category_id, NULL, 1),
      ('Tea', v_category_id, NULL, 2),
      ('Fresh Juices', v_category_id, NULL, 3),
      ('Smoothies', v_category_id, NULL, 4),
      ('Infused Waters', v_category_id, NULL, 5),
      ('Cocktails', v_category_id, NULL, 6),
      ('Mocktails', v_category_id, NULL, 7),
      ('House Specialties', v_category_id, NULL, 8)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT insert_sufle_subcategories();

-- Drop the function after execution
DROP FUNCTION IF EXISTS insert_sufle_subcategories();

-- Delete "Bakery and Desserts" category if it exists
DELETE FROM public.label_categories 
WHERE name = 'Bakery and Desserts' AND organization_id IS NULL;

RAISE NOTICE 'Suflê subcategories structure created successfully!';
