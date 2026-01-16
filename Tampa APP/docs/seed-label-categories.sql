-- SEED DEFAULT LABEL CATEGORIES
-- Run this SQL in Supabase SQL Editor to create initial categories
-- Replace 'YOUR_ORG_ID' with your actual organization_id

-- Your organization_id: b818500f-27f7-47c3-b62a-7d76d5505d57

-- Delete existing categories (if any) - CAREFUL!
-- DELETE FROM label_categories WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';

-- Insert default label categories
INSERT INTO label_categories (
  organization_id,
  name,
  icon,
  display_order,
  created_at,
  updated_at
) VALUES
  -- Main Categories
  ('b818500f-27f7-47c3-b62a-7d76d5505d57', 'Prepared Foods', '🍽️', 1, NOW(), NOW()),
  ('b818500f-27f7-47c3-b62a-7d76d5505d57', 'Raw Ingredients', '🥬', 2, NOW(), NOW()),
  ('b818500f-27f7-47c3-b62a-7d76d5505d57', 'Beverages', '🥤', 3, NOW(), NOW()),
  ('b818500f-27f7-47c3-b62a-7d76d5505d57', 'Baked Goods', '🥖', 4, NOW(), NOW()),
  ('b818500f-27f7-47c3-b62a-7d76d5505d57', 'Dairy Products', '🧈', 5, NOW(), NOW()),
  ('b818500f-27f7-47c3-b62a-7d76d5505d57', 'Frozen Items', '❄️', 6, NOW(), NOW()),
  ('b818500f-27f7-47c3-b62a-7d76d5505d57', 'Condiments & Sauces', '🧂', 7, NOW(), NOW()),
  ('b818500f-27f7-47c3-b62a-7d76d5505d57', 'Cleaning Supplies', '🧽', 8, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verify categories were created
SELECT 
  id,
  name,
  icon,
  display_order,
  created_at
FROM label_categories
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY display_order;

-- Optional: Create some subcategories for "Prepared Foods"
-- First, get the category ID:
DO $$
DECLARE
  prepared_foods_id UUID;
BEGIN
  SELECT id INTO prepared_foods_id
  FROM label_categories
  WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
    AND name = 'Prepared Foods';
  
  IF prepared_foods_id IS NOT NULL THEN
    INSERT INTO label_subcategories (
      organization_id,
      category_id,
      name,
      icon,
      display_order,
      created_at,
      updated_at
    ) VALUES
      ('b818500f-27f7-47c3-b62a-7d76d5505d57', prepared_foods_id, 'Soups & Stews', '🍲', 1, NOW(), NOW()),
      ('b818500f-27f7-47c3-b62a-7d76d5505d57', prepared_foods_id, 'Sandwiches', '🥪', 2, NOW(), NOW()),
      ('b818500f-27f7-47c3-b62a-7d76d5505d57', prepared_foods_id, 'Salads', '🥗', 3, NOW(), NOW()),
      ('b818500f-27f7-47c3-b62a-7d76d5505d57', prepared_foods_id, 'Hot Dishes', '🍛', 4, NOW(), NOW()),
      ('b818500f-27f7-47c3-b62a-7d76d5505d57', prepared_foods_id, 'Recipes', '📖', 5, NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Subcategories created successfully!';
  ELSE
    RAISE NOTICE 'Prepared Foods category not found';
  END IF;
END $$;

-- Verify subcategories
SELECT 
  lc.name as category,
  ls.name as subcategory,
  ls.icon,
  ls.display_order
FROM label_subcategories ls
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY lc.display_order, ls.display_order;

-- Success message
SELECT 
  COUNT(*) as total_categories,
  (SELECT COUNT(*) FROM label_subcategories WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57') as total_subcategories
FROM label_categories
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';
