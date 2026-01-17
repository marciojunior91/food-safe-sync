-- Insert test products for labeling system testing
-- This script inserts 10 test products with different categories and measuring units

-- First, ensure we have some measuring units (skip if already exist from default migration)
-- The default migration already inserts these units, so we'll just use them

-- Get the organization_id of the current logged-in user
-- This will be used to associate test data with your organization
DO $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get organization_id from the current user's profile
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Fallback: if no org_id found (e.g., running as service role), use NULL for global entities
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization_id found for current user. Using NULL (global entities).';
  ELSE
    RAISE NOTICE 'Using organization_id: %', v_org_id;
  END IF;

  -- Add additional categories needed for test products
  -- Note: Requires unique constraint migration (20251203120000_add_unique_constraints.sql) to be applied first
  INSERT INTO public.label_categories (name, organization_id)
  VALUES 
    ('Meat & Poultry', v_org_id),
    ('Fish & Seafood', v_org_id),
    ('Vegetables', v_org_id),
    ('Bakery & Desserts', v_org_id),
    ('Dairy', v_org_id)
  ON CONFLICT (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) 
  DO NOTHING;

  -- Insert test products (only using existing columns: name, category_id, organization_id)
  -- Note: Requires unique constraint migration (20251203120000_add_unique_constraints.sql) to be applied first
  INSERT INTO public.products (name, category_id, organization_id) 
  SELECT 
    product_data.name,
    (SELECT id FROM public.label_categories WHERE name = product_data.category_name AND COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(v_org_id, '00000000-0000-0000-0000-000000000000'::uuid) LIMIT 1),
    v_org_id -- Use current user's organization_id
  FROM (VALUES
    ('Chicken Breast', 'Meat & Poultry'),
    ('Fresh Salmon Fillet', 'Fish & Seafood'),
    ('Beef Stew Meat', 'Meat & Poultry'),
    ('Tomato Sauce', 'Sauces & Condiments'),
    ('Caesar Salad Mix', 'Vegetables'),
    ('Chocolate Cake', 'Bakery & Desserts'),
    ('Vanilla Ice Cream', 'Bakery & Desserts'),
    ('Cooked Rice', 'Prepared Foods'),
    ('Vegetable Soup', 'Prepared Foods'),
    ('Mozzarella Cheese', 'Dairy')
  ) AS product_data(name, category_name)
  ON CONFLICT (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) 
  DO NOTHING;

  -- Report success
  RAISE NOTICE 'Test products inserted successfully for organization: %', COALESCE(v_org_id::text, 'GLOBAL');
END $$;

-- Verify the insertion
SELECT 
  p.name as product_name,
  lc.name as category,
  p.organization_id,
  CASE 
    WHEN p.organization_id IS NULL THEN 'GLOBAL'
    ELSE 'ORGANIZATION-SPECIFIC'
  END as scope,
  p.created_at
FROM public.products p
LEFT JOIN public.label_categories lc ON p.category_id = lc.id
WHERE p.created_at > NOW() - INTERVAL '1 minute'  -- Only show recently created products
ORDER BY p.created_at DESC
LIMIT 10;
