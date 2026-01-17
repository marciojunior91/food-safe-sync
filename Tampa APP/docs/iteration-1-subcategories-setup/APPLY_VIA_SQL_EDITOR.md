# Apply Suflê Subcategories via Supabase SQL Editor

Since the Supabase CLI and RLS policies are blocking the migration, please follow these steps to apply the changes directly in the Supabase SQL Editor:

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

## Step 2: Copy and Paste This SQL

```sql
-- Suflê Subcategories Migration
-- Organization ID: 4808e8a5-547b-4601-ab90-a8388ee748fa

-- Step 1: Create new categories (only if they don't exist)
DO $$
DECLARE
  org_id UUID := '4808e8a5-547b-4601-ab90-a8388ee748fa';
BEGIN
  -- Fish and Seafood
  IF NOT EXISTS (SELECT 1 FROM public.label_categories WHERE name = 'Fish and Seafood' AND organization_id = org_id) THEN
    INSERT INTO public.label_categories (name, organization_id) VALUES ('Fish and Seafood', org_id);
  END IF;
  
  -- Bakery
  IF NOT EXISTS (SELECT 1 FROM public.label_categories WHERE name = 'Bakery' AND organization_id = org_id) THEN
    INSERT INTO public.label_categories (name, organization_id) VALUES ('Bakery', org_id);
  END IF;
  
  -- Raw Ingredients
  IF NOT EXISTS (SELECT 1 FROM public.label_categories WHERE name = 'Raw Ingredients' AND organization_id = org_id) THEN
    INSERT INTO public.label_categories (name, organization_id) VALUES ('Raw Ingredients', org_id);
  END IF;
  
  -- Meat & Poultry
  IF NOT EXISTS (SELECT 1 FROM public.label_categories WHERE name = 'Meat & Poultry' AND organization_id = org_id) THEN
    INSERT INTO public.label_categories (name, organization_id) VALUES ('Meat & Poultry', org_id);
  END IF;
END $$;

-- Step 2: Delete old category (if it exists)
DELETE FROM public.label_categories 
WHERE name = 'Bakery and Desserts' 
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- Step 3: Insert Fish and Seafood subcategories
INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
SELECT 'Fresh Fish', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 1 
FROM public.label_categories 
WHERE name = 'Fish and Seafood' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Frozen Fish', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 2 
FROM public.label_categories 
WHERE name = 'Fish and Seafood' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Shellfish', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 3 
FROM public.label_categories 
WHERE name = 'Fish and Seafood' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Crustaceans', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 4 
FROM public.label_categories 
WHERE name = 'Fish and Seafood' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Mollusks', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 5 
FROM public.label_categories 
WHERE name = 'Fish and Seafood' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Smoked Fish', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 6 
FROM public.label_categories 
WHERE name = 'Fish and Seafood' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Canned Seafood', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 7 
FROM public.label_categories 
WHERE name = 'Fish and Seafood' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

-- Step 4: Insert Bakery subcategories
INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
SELECT 'Artisan Breads', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 1 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Rolls & Buns', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 2 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Baguettes', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 3 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Croissants', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 4 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Pastries', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 5 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Danish', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 6 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Focaccia', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 7 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Flatbreads', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 8 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Specialty Breads', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 9 
FROM public.label_categories 
WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

-- Step 5: Insert Raw Ingredients subcategories
INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
SELECT 'Fresh Vegetables', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 1 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Fresh Fruits', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 2 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Herbs & Aromatics', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 3 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Leafy Greens', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 4 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Root Vegetables', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 5 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Mushrooms', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 6 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Legumes & Pulses', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 7 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Grains & Rice', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 8 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Flours', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 9 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Nuts & Seeds', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 10 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Oils & Fats', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 11 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Vinegars', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 12 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Spices', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 13 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Dried Herbs', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 14 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Sugars & Sweeteners', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 15 
FROM public.label_categories 
WHERE name = 'Raw Ingredients' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

-- Step 6: Insert Meat & Poultry subcategories
INSERT INTO public.label_subcategories (name, category_id, organization_id, display_order)
SELECT 'Beef', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 1 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Pork', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 2 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Lamb', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 3 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Veal', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 4 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Chicken', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 5 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Duck', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 6 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Turkey', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 7 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Game Meats', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 8 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Offal', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 9 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Charcuterie', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 10 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
UNION ALL
SELECT 'Sausages', id, '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid, 11 
FROM public.label_categories 
WHERE name = 'Meat & Poultry' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ON CONFLICT (name, category_id, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

-- Verification query
SELECT 
  c.name as category,
  COUNT(s.id) as subcategory_count
FROM label_categories c
LEFT JOIN label_subcategories s ON s.category_id = c.id AND s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
WHERE c.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
GROUP BY c.name
ORDER BY c.name;
```

## Step 3: Run the Query

1. Click **RUN** button (or press `Ctrl+Enter`)
2. Wait for the query to complete
3. Check the verification results at the bottom

## Step 4: Verify

You should see output like:
```
category              | subcategory_count
----------------------|------------------
Bakery                | 9
Beverages             | X
Dairy                 | X
Desserts              | X
Fish and Seafood      | 7
Meat & Poultry        | 11
Prepared Foods        | X
Raw Ingredients       | 15
Sauces & Condiments   | X
```

**Note**: This script only creates the 4 new categories and their 42 subcategories. Your existing categories will show their current subcategory counts.

## Step 5: Test in App

1. Run `npm run dev`
2. Go to Labeling page
3. Click "By Categories" toggle
4. You should see all 9 categories with folder icons
5. Click each category to see subcategories

---

## Alternative: Use npx supabase

If you want to fix the Supabase CLI for future use, you can run commands with `npx`:

```powershell
# Instead of: supabase db push
# Use: npx supabase db push

# List migrations
npx supabase migration list

# Pull database changes
npx supabase db pull
```

The `npx` command runs Supabase CLI without needing to install it globally.

---

✅ Once you run the SQL in the Supabase dashboard, the migration will be complete!
