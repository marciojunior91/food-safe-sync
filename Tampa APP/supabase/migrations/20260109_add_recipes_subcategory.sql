-- Migration: Add Recipes Subcategory
-- Date: January 9, 2026
-- Purpose: Create "Prepared Foods" category and "Recipes" subcategory for recipe printing

-- Step 1: Create "Prepared Foods" category
/*INSERT INTO label_categories (name, description, icon, color, display_order)
VALUES (
  'Prepared Foods',
  'House-made prepared items and recipes',
  '🍽️',
  '#10B981',
  (SELECT COALESCE(MAX(display_order), 0) + 1 FROM label_categories)
)
ON CONFLICT (name) DO NOTHING;
*/

-- Step 2: Create "Recipes" subcategory under "Prepared Foods"
INSERT INTO label_subcategories (category_id, name, icon, display_order)
SELECT 
  lc.id,
  'Recipes',
  '👨‍🍳',
  1
FROM label_categories lc
WHERE lc.name = 'Prepared Foods'
AND NOT EXISTS (
  SELECT 1 FROM label_subcategories 
  WHERE category_id = lc.id AND name = 'Recipes'
);

-- Step 3: Add subcategory_id column to printed_labels if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'printed_labels' 
    AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE printed_labels 
    ADD COLUMN subcategory_id UUID REFERENCES label_subcategories(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_printed_labels_subcategory 
    ON printed_labels(subcategory_id);
  END IF;
END $$;

-- Verification query
SELECT 
  c.name AS category,
  c.icon AS category_icon,
  s.name AS subcategory,
  s.icon AS subcategory_icon
FROM label_categories c
LEFT JOIN label_subcategories s ON s.category_id = c.id
WHERE c.name = 'Prepared Foods'
ORDER BY s.display_order;
