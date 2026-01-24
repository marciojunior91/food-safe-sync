-- Test Data for Expiring Soon Module
-- Run this in Supabase SQL Editor to populate test data

-- First, get your organization_id
-- SELECT id FROM organizations WHERE name = 'Your Organization Name';
-- Replace 'YOUR_ORG_ID' below with the actual UUID

-- Test Products with Various Expiry Dates
INSERT INTO products (
  organization_id,
  name,
  category_id,
  storage_location,
  quantity,
  unit,
  expiry_date
) VALUES
  -- Critical: Expired yesterday
  ('YOUR_ORG_ID', 'Chicken Breast (EXPIRED)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 2.5, 'kg', (NOW() - INTERVAL '1 day')::date),
  
  -- Critical: Expires today
  ('YOUR_ORG_ID', 'Fresh Salmon', 'YOUR_CATEGORY_ID', 'Display Fridge', 1.8, 'kg', NOW()::date),
  
  -- Urgent: Expires tomorrow
  ('YOUR_ORG_ID', 'Milk (Full Fat)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 10, 'liters', (NOW() + INTERVAL '1 day')::date),
  ('YOUR_ORG_ID', 'Ground Beef', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 3, 'kg', (NOW() + INTERVAL '1 day')::date),
  
  -- Warning: Expires in 2 days
  ('YOUR_ORG_ID', 'Fresh Mozzarella', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 5, 'units', (NOW() + INTERVAL '2 days')::date),
  ('YOUR_ORG_ID', 'Lettuce (Romaine)', 'YOUR_CATEGORY_ID', 'Produce Cooler', 8, 'heads', (NOW() + INTERVAL '2 days')::date),
  
  -- Warning: Expires in 3 days
  ('YOUR_ORG_ID', 'Cream (Heavy)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 2, 'liters', (NOW() + INTERVAL '3 days')::date),
  
  -- Normal: Expires in 4 days
  ('YOUR_ORG_ID', 'Butter (Unsalted)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 10, 'units', (NOW() + INTERVAL '4 days')::date),
  
  -- Normal: Expires in 5 days
  ('YOUR_ORG_ID', 'Tomatoes (Cherry)', 'YOUR_CATEGORY_ID', 'Produce Cooler', 3, 'kg', (NOW() + INTERVAL '5 days')::date),
  
  -- Normal: Expires in 7 days
  ('YOUR_ORG_ID', 'Eggs (Large)', 'YOUR_CATEGORY_ID', 'Walk-in Fridge', 60, 'units', (NOW() + INTERVAL '7 days')::date);

-- Test Printed Labels with Various Expiry Dates
INSERT INTO printed_labels (
  organization_id,
  product_name,
  use_by_date,
  prepared_date,
  storage_location,
  prepared_by
) VALUES
  -- Critical: Expires today
  ('YOUR_ORG_ID', 'Chicken Soup (Batch #123)', NOW()::date, (NOW() - INTERVAL '2 days')::date, 'Walk-in Fridge', 'Chef Maria'),
  
  -- Urgent: Expires tomorrow
  ('YOUR_ORG_ID', 'Caesar Dressing', (NOW() + INTERVAL '1 day')::date, (NOW() - INTERVAL '1 day')::date, 'Prep Station Fridge', 'Chef John'),
  ('YOUR_ORG_ID', 'Marinara Sauce (Fresh)', (NOW() + INTERVAL '1 day')::date, NOW()::date, 'Walk-in Fridge', 'Chef Maria'),
  
  -- Warning: Expires in 2 days
  ('YOUR_ORG_ID', 'Cooked Pasta (Penne)', (NOW() + INTERVAL '2 days')::date, NOW()::date, 'Walk-in Fridge', 'Chef John'),
  
  -- Warning: Expires in 3 days
  ('YOUR_ORG_ID', 'Beef Stock', (NOW() + INTERVAL '3 days')::date, (NOW() - INTERVAL '1 day')::date, 'Walk-in Cooler', 'Chef Maria'),
  
  -- Normal: Expires in 5 days
  ('YOUR_ORG_ID', 'Herb Butter', (NOW() + INTERVAL '5 days')::date, NOW()::date, 'Prep Station Fridge', 'Chef John');


-- HELPER QUERIES:

-- 1. Get your organization_id:
-- SELECT id, name FROM organizations WHERE name ILIKE '%your org name%';

-- 2. Get category_id for products (use any existing category):
-- SELECT id, name FROM label_categories WHERE organization_id = 'YOUR_ORG_ID';

-- 3. Quick verification - See what will appear in Expiring Soon:
SELECT 
  name,
  expiry_date,
  storage_location,
  EXTRACT(DAY FROM (expiry_date - NOW()::date)) as days_until_expiry,
  CASE 
    WHEN expiry_date < NOW()::date THEN 'EXPIRED'
    WHEN expiry_date = NOW()::date THEN 'CRITICAL (Today)'
    WHEN expiry_date = (NOW() + INTERVAL '1 day')::date THEN 'URGENT (Tomorrow)'
    WHEN expiry_date <= (NOW() + INTERVAL '3 days')::date THEN 'WARNING (2-3 days)'
    ELSE 'NORMAL (4-7 days)'
  END as urgency_level
FROM products
WHERE organization_id = 'YOUR_ORG_ID'
  AND expiry_date IS NOT NULL
  AND expiry_date <= (NOW() + INTERVAL '7 days')::date
ORDER BY expiry_date;

-- 4. Clean up test data later (OPTIONAL):
-- DELETE FROM products WHERE name LIKE '%(EXPIRED)%' OR name LIKE '%Test%';
-- DELETE FROM printed_labels WHERE product_name LIKE '%Batch #%';
