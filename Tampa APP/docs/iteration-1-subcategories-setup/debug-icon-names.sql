-- Query to see EXACT names in your database
-- Run this in Supabase SQL Editor to find name mismatches

-- 1. Get all category names (check for exact spelling, spaces, special characters)
SELECT 
  id,
  name as category_name,
  LENGTH(name) as name_length,
  '"' || name || '"' as quoted_name
FROM label_categories
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY name;

-- 2. Get all subcategory names with their categories
SELECT 
  c.name as category_name,
  s.name as subcategory_name,
  LENGTH(s.name) as name_length,
  '"' || s.name || '"' as quoted_name,
  s.display_order
FROM label_subcategories s
JOIN label_categories c ON c.id = s.category_id
WHERE s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND c.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY c.name, s.display_order, s.name;

-- 3. Check for names with trailing/leading spaces or special characters
SELECT 
  name,
  CASE 
    WHEN name != TRIM(name) THEN 'HAS EXTRA SPACES'
    WHEN name LIKE '%&%' THEN 'HAS AMPERSAND'
    WHEN name LIKE '%''%' THEN 'HAS APOSTROPHE'
    ELSE 'OK'
  END as status
FROM label_categories
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 
  name,
  CASE 
    WHEN name != TRIM(name) THEN 'HAS EXTRA SPACES'
    WHEN name LIKE '%&%' THEN 'HAS AMPERSAND'
    WHEN name LIKE '%''%' THEN 'HAS APOSTROPHE'
    ELSE 'OK'
  END as status
FROM label_subcategories
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;
