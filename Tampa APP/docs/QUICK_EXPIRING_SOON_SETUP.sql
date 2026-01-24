-- Quick Setup Script for Expiring Soon Testing
-- Copy and run this entire script in Supabase SQL Editor

-- Step 1: Find your organization (you'll see your org name in results)
SELECT 
  id as organization_id,
  name as organization_name,
  '👆 Copy the organization_id above' as instruction
FROM organizations
ORDER BY created_at DESC;

-- Step 2: Find a category to use for test products
SELECT 
  id as category_id,
  name as category_name,
  '👆 Copy a category_id above' as instruction
FROM label_categories
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
LIMIT 5;

-- Step 3: After copying IDs above, uncomment and run the INSERT below
-- Replace YOUR_ORG_ID and YOUR_CATEGORY_ID with the actual UUIDs

/*
INSERT INTO products (
  organization_id,
  name,
  category_id,
  storage_location,
  quantity,
  unit,
  expiry_date,
  created_at,
  updated_at
) VALUES
  -- 🔴 CRITICAL: Expires TODAY
  ('YOUR_ORG_ID', 'Test: Fresh Salmon', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 2, 'kg', NOW()::date, NOW(), NOW()),
  
  -- 🟠 URGENT: Expires TOMORROW
  ('YOUR_ORG_ID', 'Test: Whole Milk', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 5, 'liters', (NOW() + INTERVAL '1 day')::date, NOW(), NOW()),
  ('YOUR_ORG_ID', 'Test: Ground Beef', 'YOUR_CATEGORY_ID', 'Freezer', 3, 'kg', (NOW() + INTERVAL '1 day')::date, NOW(), NOW()),
  
  -- 🟡 WARNING: Expires in 2-3 DAYS
  ('YOUR_ORG_ID', 'Test: Fresh Mozzarella', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 8, 'units', (NOW() + INTERVAL '2 days')::date, NOW(), NOW()),
  ('YOUR_ORG_ID', 'Test: Lettuce (Romaine)', 'YOUR_CATEGORY_ID', 'Produce Cooler', 10, 'heads', (NOW() + INTERVAL '3 days')::date, NOW(), NOW()),
  
  -- 🟢 NORMAL: Expires in 4-7 DAYS
  ('YOUR_ORG_ID', 'Test: Butter (Unsalted)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 10, 'lbs', (NOW() + INTERVAL '5 days')::date, NOW(), NOW()),
  ('YOUR_ORG_ID', 'Test: Eggs (Large)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 24, 'units', (NOW() + INTERVAL '7 days')::date, NOW(), NOW());

-- Also add some test labels
INSERT INTO printed_labels (
  organization_id,
  product_name,
  use_by_date,
  prepared_date,
  storage_location,
  prepared_by,
  created_at
) VALUES
  ('YOUR_ORG_ID', 'Test: Chicken Soup (Batch #1)', NOW()::date, (NOW() - INTERVAL '2 days')::date, 'Walk-in Fridge', 'Test User', NOW()),
  ('YOUR_ORG_ID', 'Test: Caesar Dressing', (NOW() + INTERVAL '1 day')::date, NOW()::date, 'Prep Fridge', 'Test User', NOW()),
  ('YOUR_ORG_ID', 'Test: Marinara Sauce', (NOW() + INTERVAL '3 days')::date, NOW()::date, 'Walk-in Fridge', 'Test User', NOW()),
  ('YOUR_ORG_ID', 'Test: Herb Butter', (NOW() + INTERVAL '5 days')::date, NOW()::date, 'Prep Station', 'Test User', NOW());
*/

-- Step 4: Verify what was inserted
-- Uncomment to see your test data:
/*
SELECT 
  name,
  expiry_date,
  storage_location,
  CASE 
    WHEN expiry_date < NOW()::date THEN '🔴 EXPIRED'
    WHEN expiry_date = NOW()::date THEN '🔴 CRITICAL (Today)'
    WHEN expiry_date = (NOW() + INTERVAL '1 day')::date THEN '🟠 URGENT (Tomorrow)'
    WHEN expiry_date <= (NOW() + INTERVAL '3 days')::date THEN '🟡 WARNING (2-3 days)'
    ELSE '🟢 NORMAL (4-7 days)'
  END as urgency,
  EXTRACT(DAY FROM (expiry_date - NOW()::date)) as days_until_expiry
FROM products
WHERE organization_id = 'YOUR_ORG_ID'
  AND name LIKE 'Test:%'
ORDER BY expiry_date;
*/

-- Step 5: Clean up when done testing
-- Uncomment to remove test data:
/*
DELETE FROM products 
WHERE organization_id = 'YOUR_ORG_ID' 
  AND name LIKE 'Test:%';

DELETE FROM printed_labels 
WHERE organization_id = 'YOUR_ORG_ID' 
  AND product_name LIKE 'Test:%';
*/
