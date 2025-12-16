-- Delete Duplicate Subcategories
-- Date: December 16, 2025
-- Organization ID: 4808e8a5-547b-4601-ab90-a8388ee748fa
--
-- Issue: Three subcategories exist in multiple categories causing TypeScript duplicate key errors
-- Duplicates found:
-- 1. 'Pastries' - in both Bakery and Desserts
-- 2. 'Leafy Greens' - in both Raw Ingredients and Vegetables
-- 3. 'Root Vegetables' - in both Raw Ingredients and Vegetables
--
-- Strategy: Keep the original instances (in Bakery and Raw Ingredients)
--           Delete the duplicate instances (in Desserts and Vegetables)

-- IMPORTANT: Run this query in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql

-- ============================================================================
-- STEP 1: Verify duplicates before deletion
-- ============================================================================

-- Check 'Pastries' in both Bakery and Desserts
SELECT 
  ls.id,
  ls.name as subcategory_name,
  lc.name as category_name,
  ls.display_order,
  ls.created_at
FROM label_subcategories ls
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.name = 'Pastries'
  AND ls.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY lc.name;

-- Check 'Leafy Greens' in both Raw Ingredients and Vegetables
SELECT 
  ls.id,
  ls.name as subcategory_name,
  lc.name as category_name,
  ls.display_order,
  ls.created_at
FROM label_subcategories ls
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.name = 'Leafy Greens'
  AND ls.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY lc.name;

-- Check 'Root Vegetables' in both Raw Ingredients and Vegetables
SELECT 
  ls.id,
  ls.name as subcategory_name,
  lc.name as category_name,
  ls.display_order,
  ls.created_at
FROM label_subcategories ls
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.name = 'Root Vegetables'
  AND ls.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY lc.name;

-- ============================================================================
-- STEP 2: Check for products assigned to duplicate subcategories
-- ============================================================================

-- Check if any products are assigned to 'Pastries' in Desserts category
SELECT 
  p.id,
  p.name as product_name,
  ls.name as subcategory_name,
  lc.name as category_name
FROM products p
JOIN label_subcategories ls ON p.subcategory_id = ls.id
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.name = 'Pastries'
  AND lc.name = 'Desserts'
  AND ls.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- Check if any products are assigned to 'Leafy Greens' in Vegetables category
SELECT 
  p.id,
  p.name as product_name,
  ls.name as subcategory_name,
  lc.name as category_name
FROM products p
JOIN label_subcategories ls ON p.subcategory_id = ls.id
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.name = 'Leafy Greens'
  AND lc.name = 'Vegetables'
  AND ls.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- Check if any products are assigned to 'Root Vegetables' in Vegetables category
SELECT 
  p.id,
  p.name as product_name,
  ls.name as subcategory_name,
  lc.name as category_name
FROM products p
JOIN label_subcategories ls ON p.subcategory_id = ls.id
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.name = 'Root Vegetables'
  AND lc.name = 'Vegetables'
  AND ls.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- ============================================================================
-- STEP 3: Delete duplicate subcategories
-- ============================================================================

-- Delete 'Pastries' from Desserts category (keep in Bakery)
DELETE FROM label_subcategories
WHERE name = 'Pastries'
  AND category_id IN (
    SELECT id FROM label_categories 
    WHERE name = 'Desserts' 
      AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  )
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- Delete 'Leafy Greens' from Vegetables category (keep in Raw Ingredients)
DELETE FROM label_subcategories
WHERE name = 'Leafy Greens'
  AND category_id IN (
    SELECT id FROM label_categories 
    WHERE name = 'Vegetables' 
      AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  )
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- Delete 'Root Vegetables' from Vegetables category (keep in Raw Ingredients)
DELETE FROM label_subcategories
WHERE name = 'Root Vegetables'
  AND category_id IN (
    SELECT id FROM label_categories 
    WHERE name = 'Vegetables' 
      AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  )
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- ============================================================================
-- STEP 4: Verification after deletion
-- ============================================================================

-- Count subcategories per category
SELECT 
  lc.name as category_name,
  COUNT(ls.id) as subcategory_count
FROM label_categories lc
LEFT JOIN label_subcategories ls 
  ON ls.category_id = lc.id 
  AND ls.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
WHERE lc.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
GROUP BY lc.name
ORDER BY lc.name;

-- Expected results after deletion:
-- Bakery: 9 subcategories (Pastries remains)
-- Desserts: 4 subcategories (Pastries removed)
-- Raw Ingredients: 15 subcategories (Leafy Greens and Root Vegetables remain)
-- Vegetables: 4 subcategories (Leafy Greens and Root Vegetables removed)
--
-- Total: 71 subcategories (was 74, removed 3 duplicates)

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Rationale for keeping vs removing:
--
-- 1. 'Pastries' - KEEP in Bakery (original location for baked pastries)
--                  REMOVE from Desserts (croissants, danishes are bakery items, not desserts)
--
-- 2. 'Leafy Greens' - KEEP in Raw Ingredients (comprehensive ingredients category)
--                      REMOVE from Vegetables (too specific, redundant)
--
-- 3. 'Root Vegetables' - KEEP in Raw Ingredients (comprehensive ingredients category)
--                         REMOVE from Vegetables (too specific, redundant)
--
-- The Vegetables category should focus on prepared/processed vegetables or
-- vegetable-based products, not raw ingredients which are covered in Raw Ingredients.
--
-- After deletion, Vegetables will have: Cruciferous, Nightshades, Alliums, Squashes
-- These can be used for prepared vegetable products or specific vegetable categories
-- not covered elsewhere.
