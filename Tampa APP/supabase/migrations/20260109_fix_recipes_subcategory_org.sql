-- Fix: Add organization_id to Recipes subcategory for all organizations
-- Date: January 9, 2026
-- Purpose: Ensure "Recipes" subcategory is visible in QuickPrint for all organizations

-- Update existing "Recipes" subcategories to have organization_id from their parent category
UPDATE label_subcategories ls
SET organization_id = lc.organization_id
FROM label_categories lc
WHERE ls.category_id = lc.id
  AND ls.name = 'Recipes'
  AND ls.organization_id IS NULL;

-- Verification
SELECT 
  c.name AS category,
  c.organization_id AS category_org_id,
  s.name AS subcategory,
  s.organization_id AS subcategory_org_id
FROM label_categories c
LEFT JOIN label_subcategories s ON s.category_id = c.id
WHERE c.name = 'Prepared Foods' AND s.name = 'Recipes';
