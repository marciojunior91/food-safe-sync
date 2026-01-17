-- Migration: Seed default subcategories (Suflex-style)
-- Description: Insert default subcategories for common food categories
-- Date: 2025-12-09

-- Function to insert subcategories safely
CREATE OR REPLACE FUNCTION insert_default_subcategories()
RETURNS void AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- PROTEÍNAS / PROTEINS
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Prepared Foods' AND organization_id IS NULL LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    -- We'll use a generic "Proteins" category, but if it doesn't exist, we'll create subcategories under existing ones
    NULL;
  END IF;

  -- Insert category: Proteínas (if not exists)
  INSERT INTO public.label_categories (name, organization_id)
  VALUES ('Proteins', NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Proteins' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Red Meats', v_category_id, NULL, 1),
      ('Poultry', v_category_id, NULL, 2),
      ('Fish', v_category_id, NULL, 3),
      ('Seafood', v_category_id, NULL, 4),
      ('Processed Meats', v_category_id, NULL, 5)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Insert category: Vegetables
  INSERT INTO public.label_categories (name, organization_id)
  VALUES ('Vegetables', NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Vegetables' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Leafy Greens', v_category_id, NULL, 1),
      ('Root Vegetables', v_category_id, NULL, 2),
      ('Legumes', v_category_id, NULL, 3),
      ('Mushrooms', v_category_id, NULL, 4),
      ('Cruciferous', v_category_id, NULL, 5),
      ('Alliums', v_category_id, NULL, 6)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Insert category: Dairy
  INSERT INTO public.label_categories (name, organization_id)
  VALUES ('Dairy', NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Dairy' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Cheeses', v_category_id, NULL, 1),
      ('Milk & Cream', v_category_id, NULL, 2),
      ('Yogurt', v_category_id, NULL, 3),
      ('Butter', v_category_id, NULL, 4)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Insert category: Grains & Cereals
  INSERT INTO public.label_categories (name, organization_id)
  VALUES ('Grains & Cereals', NULL)
  ON CONFLICT DO NOTHING;
  
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Grains & Cereals' AND organization_id IS NULL LIMIT 1;
  
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Rice', v_category_id, NULL, 1),
      ('Pasta', v_category_id, NULL, 2),
      ('Flours', v_category_id, NULL, 3),
      ('Bread', v_category_id, NULL, 4),
      ('Cereals', v_category_id, NULL, 5)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Add subcategories to existing categories
  
  -- Sauces & Condiments
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Sauces & Condiments' AND organization_id IS NULL LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Sauces', v_category_id, NULL, 1),
      ('Dressings', v_category_id, NULL, 2),
      ('Oils & Vinegars', v_category_id, NULL, 3),
      ('Spices & Herbs', v_category_id, NULL, 4),
      ('Condiments', v_category_id, NULL, 5)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Desserts
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Desserts' AND organization_id IS NULL LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Cakes', v_category_id, NULL, 1),
      ('Pies & Tarts', v_category_id, NULL, 2),
      ('Ice Cream', v_category_id, NULL, 3),
      ('Puddings', v_category_id, NULL, 4),
      ('Cookies', v_category_id, NULL, 5)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Bakery
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Bakery' AND organization_id IS NULL LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Breads', v_category_id, NULL, 1),
      ('Rolls & Buns', v_category_id, NULL, 2),
      ('Pastries', v_category_id, NULL, 3),
      ('Croissants', v_category_id, NULL, 4),
      ('Bagels & Donuts', v_category_id, NULL, 5)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Beverages
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Beverages' AND organization_id IS NULL LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Juices', v_category_id, NULL, 1),
      ('Smoothies', v_category_id, NULL, 2),
      ('Coffee & Tea', v_category_id, NULL, 3),
      ('Soft Drinks', v_category_id, NULL, 4),
      ('Alcoholic', v_category_id, NULL, 5)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Prepared Foods subcategories
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Prepared Foods' AND organization_id IS NULL LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Soups', v_category_id, NULL, 1),
      ('Salads', v_category_id, NULL, 2),
      ('Sandwiches', v_category_id, NULL, 3),
      ('Entrees', v_category_id, NULL, 4),
      ('Side Dishes', v_category_id, NULL, 5)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

  -- Raw Ingredients subcategories
  SELECT id INTO v_category_id FROM public.label_categories WHERE name = 'Raw Ingredients' AND organization_id IS NULL LIMIT 1;
  IF v_category_id IS NOT NULL THEN
    INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
    VALUES 
      ('Fruits', v_category_id, NULL, 1),
      ('Vegetables', v_category_id, NULL, 2),
      ('Meats', v_category_id, NULL, 3),
      ('Seafood', v_category_id, NULL, 4),
      ('Dry Goods', v_category_id, NULL, 5)
    ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT insert_default_subcategories();

-- Drop the function after use (cleanup)
DROP FUNCTION insert_default_subcategories();

-- Add helpful comment
COMMENT ON TABLE public.label_subcategories IS 'Hierarchical subcategories following Suflex industry standards for food classification';
