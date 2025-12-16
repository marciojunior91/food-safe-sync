# Link Products to Subcategories - Complete Guide

## 🎯 Goal
Link your existing products to the new subcategories structure (Bakery, Fish & Seafood, Raw Ingredients, etc.)

## 📋 Prerequisites

Before linking products, you MUST:
1. ✅ Run the foreign key fix from `FIX_SUBCATEGORY_REFERENCE.md`
2. ✅ Have subcategories created (from `APPLY_VIA_SQL_EDITOR.md`)
3. ✅ Verify icon mappings are working

---

## Step 1: Fix Foreign Key Constraint ⚠️ CRITICAL

**Run this FIRST in Supabase SQL Editor:**

```sql
-- Drop old foreign key pointing to product_subcategories
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey;

-- Add new foreign key pointing to label_subcategories
ALTER TABLE products 
ADD CONSTRAINT products_subcategory_id_fkey 
FOREIGN KEY (subcategory_id) 
REFERENCES label_subcategories(id) 
ON DELETE SET NULL;
```

**Verify it worked:**
```sql
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'products'
  AND kcu.column_name = 'subcategory_id';
```

Should show `foreign_table_name = label_subcategories` ✅

---

## Step 2: Understand Your Subcategory Structure

**View all available subcategories:**

```sql
SELECT 
  c.name as category_name,
  s.id as subcategory_id,
  s.name as subcategory_name,
  s.display_order
FROM label_subcategories s
JOIN label_categories c ON c.id = s.category_id
WHERE s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND c.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY c.name, s.display_order;
```

This shows you:
- 68 subcategories across 10 categories
- Their IDs (for linking)
- Their names and structure

---

## Step 3: Choose Your Linking Strategy

### Option A: Manual UI Assignment (Recommended for Small Batches)
**Best for**: Testing, small number of products, precise control

1. Go to your app's product management page
2. Edit each product
3. Select the appropriate subcategory from dropdown
4. Save

**Pros:**
- ✅ Visual interface
- ✅ Easy to review
- ✅ No SQL knowledge needed

**Cons:**
- ❌ Time-consuming for many products
- ❌ One product at a time

---

### Option B: Bulk SQL Update (Recommended for Large Batches)
**Best for**: Many products, automated assignment, data migration

#### Step 3B.1: Find Products to Assign

**See all products without subcategories:**
```sql
SELECT 
  id,
  name,
  category
FROM products
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND subcategory_id IS NULL
ORDER BY category, name
LIMIT 50;
```

**See products by category:**
```sql
-- Example: Find all bakery products
SELECT 
  id,
  name,
  category
FROM products
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND (
    category ILIKE '%bread%' OR 
    category ILIKE '%bakery%' OR
    category ILIKE '%pastry%'
  )
ORDER BY name;
```

#### Step 3B.2: Get Subcategory IDs

**Find specific subcategory IDs:**
```sql
-- Get Bakery subcategory IDs
SELECT 
  s.id,
  s.name as subcategory_name,
  c.name as category_name
FROM label_subcategories s
JOIN label_categories c ON c.id = s.category_id
WHERE c.name = 'Bakery'
  AND s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY s.display_order;
```

#### Step 3B.3: Update Products with Subcategories

**Example: Assign bread products to "Artisan Breads" subcategory**

```sql
-- First, get the subcategory ID
SELECT id, name 
FROM label_subcategories 
WHERE name = 'Artisan Breads' 
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- Then update products (replace <subcategory_id> with actual ID)
UPDATE products
SET subcategory_id = '<subcategory_id>'::uuid,
    updated_at = NOW()
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND name ILIKE '%sourdough%'  -- Example: all sourdough products
  AND subcategory_id IS NULL;   -- Only update unassigned products
```

**Example: Assign multiple product types at once**

```sql
-- Get subcategory IDs first
WITH subcategory_mapping AS (
  SELECT 
    id,
    name
  FROM label_subcategories
  WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
    AND name IN ('Artisan Breads', 'Croissants', 'Pastries')
)

-- View the mapping
SELECT * FROM subcategory_mapping;

-- Then run individual updates:

-- 1. Artisan Breads
UPDATE products
SET subcategory_id = (
  SELECT id FROM label_subcategories 
  WHERE name = 'Artisan Breads' 
    AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND (name ILIKE '%sourdough%' OR name ILIKE '%ciabatta%' OR name ILIKE '%multigrain%');

-- 2. Croissants
UPDATE products
SET subcategory_id = (
  SELECT id FROM label_subcategories 
  WHERE name = 'Croissants' 
    AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND name ILIKE '%croissant%';

-- 3. Pastries
UPDATE products
SET subcategory_id = (
  SELECT id FROM label_subcategories 
  WHERE name = 'Pastries' 
    AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND (name ILIKE '%danish%' OR name ILIKE '%tart%' OR name ILIKE '%éclair%');
```

---

## Step 4: Verification Queries

**Check how many products are assigned:**
```sql
SELECT 
  COUNT(*) as total_products,
  COUNT(subcategory_id) as assigned_products,
  COUNT(*) - COUNT(subcategory_id) as unassigned_products
FROM products
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;
```

**See products by subcategory:**
```sql
SELECT 
  c.name as category,
  s.name as subcategory,
  COUNT(p.id) as product_count
FROM label_subcategories s
JOIN label_categories c ON c.id = s.category_id
LEFT JOIN products p ON p.subcategory_id = s.id 
  AND p.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
WHERE s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
GROUP BY c.name, s.name, s.display_order, c.id
ORDER BY c.name, s.display_order;
```

**View specific subcategory's products:**
```sql
SELECT 
  p.id,
  p.name as product_name,
  s.name as subcategory_name,
  c.name as category_name
FROM products p
JOIN label_subcategories s ON s.id = p.subcategory_id
JOIN label_categories c ON c.id = s.category_id
WHERE p.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND s.name = 'Artisan Breads'  -- Change to any subcategory
ORDER BY p.name;
```

---

## Step 5: Smart Assignment Patterns

### Pattern 1: By Product Name Keywords

```sql
-- Fish & Seafood subcategories
UPDATE products SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Fresh Fish' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND (name ILIKE '%salmon%' OR name ILIKE '%tuna%' OR name ILIKE '%cod%' OR name ILIKE '%bass%');

UPDATE products SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Shellfish' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND (name ILIKE '%oyster%' OR name ILIKE '%clam%' OR name ILIKE '%mussel%' OR name ILIKE '%scallop%');

UPDATE products SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Crustaceans' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND (name ILIKE '%shrimp%' OR name ILIKE '%lobster%' OR name ILIKE '%crab%' OR name ILIKE '%prawn%');
```

### Pattern 2: By Existing Category Field

```sql
-- If your products already have a category field, use it!

-- Bakery products
UPDATE products 
SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Artisan Breads' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND category = 'Bakery'
  AND name ILIKE '%bread%'
  AND subcategory_id IS NULL;

-- Dairy products
UPDATE products 
SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Cheese' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND category = 'Dairy'
  AND name ILIKE '%cheese%'
  AND subcategory_id IS NULL;
```

### Pattern 3: Safe Batch Update Template

```sql
-- TEMPLATE - Copy and modify for each subcategory
UPDATE products
SET subcategory_id = '<SUBCATEGORY_ID>'::uuid,
    updated_at = NOW()
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND (
    -- Add your conditions here
    name ILIKE '%keyword1%' OR 
    name ILIKE '%keyword2%' OR
    category = 'CategoryName'
  )
  AND subcategory_id IS NULL;  -- Safety: only update unassigned

-- Always preview first:
SELECT id, name, category
FROM products
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND (
    -- Same conditions as above
    name ILIKE '%keyword1%' OR 
    name ILIKE '%keyword2%' OR
    category = 'CategoryName'
  )
  AND subcategory_id IS NULL
LIMIT 20;
```

---

## Step 6: Test the Navigation

After assigning products:

1. **Open your app**
2. **Go to Labeling page**
3. **Toggle to "By Categories" mode**
4. **Click a category** (e.g., "Bakery")
5. **Should see subcategories** (e.g., "Artisan Breads", "Croissants")
6. **Click a subcategory**
7. **Should see products** in that subcategory

**Expected flow:**
```
Categories View
  └─ Click "Bakery" 🍞
      └─ Subcategories View
          ├─ Artisan Breads 🍞 (5 products)
          ├─ Croissants 🥐 (3 products)
          └─ Pastries 🧁 (7 products)
              └─ Click "Pastries"
                  └─ Products View
                      ├─ Danish Pastry
                      ├─ Fruit Tart
                      └─ Chocolate Éclair
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Foreign key violation"
**Cause:** Subcategory ID doesn't exist or wrong organization  
**Fix:** Verify subcategory ID with:
```sql
SELECT id, name FROM label_subcategories 
WHERE id = '<your_id>'::uuid;
```

### Issue 2: "Products not showing in subcategory"
**Cause:** Foreign key still pointing to old table  
**Fix:** Run Step 1 again (fix foreign key constraint)

### Issue 3: "Subcategory dropdown is empty"
**Cause:** Frontend querying wrong table  
**Fix:** Already fixed in `SubcategorySelector.tsx`

### Issue 4: "Updated products but navigation doesn't work"
**Cause:** Cache or foreign key issue  
**Fix:** 
1. Hard refresh browser (`Ctrl + Shift + R`)
2. Verify foreign key is correct (Step 1 verification query)

---

## 📊 Progress Tracking

### Recommended Order:

1. **Start with one category** (e.g., Bakery)
   - Assign 5-10 products to different subcategories
   - Test navigation
   - Verify everything works

2. **Expand to more categories**
   - Fish & Seafood
   - Raw Ingredients
   - Meat & Poultry

3. **Complete remaining categories**
   - Dairy, Beverages, Desserts, etc.

### Track your progress:

```sql
-- Progress by category
SELECT 
  c.name as category,
  COUNT(DISTINCT s.id) as total_subcategories,
  COUNT(DISTINCT p.subcategory_id) as used_subcategories,
  COUNT(p.id) as assigned_products
FROM label_categories c
JOIN label_subcategories s ON s.category_id = c.id
LEFT JOIN products p ON p.subcategory_id = s.id 
  AND p.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
WHERE c.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
  AND s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
GROUP BY c.name
ORDER BY c.name;
```

---

## 💡 Pro Tips

1. **Start Small**: Test with 5-10 products before bulk updates
2. **Always Preview**: Run SELECT before UPDATE
3. **Use Transactions**: Wrap bulk updates in BEGIN/COMMIT/ROLLBACK
4. **Document Patterns**: Keep notes on which keywords map to which subcategories
5. **Check Regularly**: Use verification queries to monitor progress

---

## 🎯 Example: Complete Bakery Setup

Here's a complete example for Bakery category:

```sql
-- 1. Get all Bakery subcategory IDs
SELECT id, name, display_order
FROM label_subcategories
WHERE category_id = (
  SELECT id FROM label_categories 
  WHERE name = 'Bakery' 
    AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
)
ORDER BY display_order;

-- 2. Assign products by pattern
-- Artisan Breads
UPDATE products SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Artisan Breads' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid AND (name ILIKE '%sourdough%' OR name ILIKE '%ciabatta%' OR name ILIKE '%multigrain%' OR name ILIKE '%rye bread%');

-- Croissants
UPDATE products SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Croissants' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid AND name ILIKE '%croissant%';

-- Baguettes
UPDATE products SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Baguettes' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid AND name ILIKE '%baguette%';

-- Rolls & Buns
UPDATE products SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Rolls & Buns' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid AND (name ILIKE '%roll%' OR name ILIKE '%bun%' OR name ILIKE '%brioche%');

-- Pastries
UPDATE products SET subcategory_id = (SELECT id FROM label_subcategories WHERE name = 'Pastries' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid AND (name ILIKE '%danish%' OR name ILIKE '%tart%' OR name ILIKE '%éclair%' OR name ILIKE '%puff pastry%');

-- 3. Verify
SELECT 
  s.name as subcategory,
  COUNT(p.id) as product_count,
  STRING_AGG(p.name, ', ') as sample_products
FROM label_subcategories s
LEFT JOIN products p ON p.subcategory_id = s.id 
  AND p.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
WHERE s.category_id = (SELECT id FROM label_categories WHERE name = 'Bakery' AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid)
  AND s.organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
GROUP BY s.name, s.display_order
ORDER BY s.display_order;
```

---

**Ready to start? Begin with Step 1 and work through systematically!** 🚀
