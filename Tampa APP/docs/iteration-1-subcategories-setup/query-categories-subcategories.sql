-- Query to get all categories and their subcategories
-- Run this in Supabase SQL Editor to see what's in your database

-- Get all categories with subcategory counts
SELECT 
  c.name as category_name,
  COUNT(s.id) as subcategory_count
FROM label_categories c
LEFT JOIN label_subcategories s ON s.category_id = c.id 
  AND s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
WHERE c.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
GROUP BY c.name
ORDER BY c.name;

-- Get all subcategories grouped by category
SELECT 
  c.name as category_name,
  s.name as subcategory_name,
  s.display_order
FROM label_categories c
INNER JOIN label_subcategories s ON s.category_id = c.id
WHERE c.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY c.name, s.display_order, s.name;
