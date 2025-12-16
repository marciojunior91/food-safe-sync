# Apply All Fixes - Complete Guide

## 🎯 Quick Summary

**3 fixes to apply in order**:
1. ✅ Fix RPC function type mismatch (400 error)
2. ✅ Fix product creation RLS (403 error) - already done in code
3. ✅ Fix Lupin emoji (shows as `[]`)

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

---

### Step 2: Apply Fix #1 - RPC Function Type Mismatch

**Copy and paste this SQL**:

```sql
-- Fix find_similar_products type mismatch
CREATE OR REPLACE FUNCTION find_similar_products(
  search_name TEXT,
  org_id UUID,
  min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  category_name TEXT,
  subcategory_name TEXT,
  similarity_score DOUBLE PRECISION,
  allergen_count BIGINT,
  last_printed TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    lc.name,
    ls.name,
    SIMILARITY(LOWER(p.name), LOWER(search_name))::DOUBLE PRECISION,  -- Cast to DOUBLE PRECISION
    (
      SELECT COUNT(*) 
      FROM product_allergens pa 
      WHERE pa.product_id = p.id
    ),
    (
      SELECT MAX(created_at) 
      FROM printed_labels pl 
      WHERE pl.product_id = p.id
    )
  FROM products p
  LEFT JOIN label_categories lc ON p.category_id = lc.id
  LEFT JOIN label_subcategories ls ON p.subcategory_id = ls.id
  WHERE 
    p.organization_id = org_id
    AND SIMILARITY(LOWER(p.name), LOWER(search_name)) >= min_similarity
    AND p.name != search_name  -- Exclude exact match
  ORDER BY 
    SIMILARITY(LOWER(p.name), LOWER(search_name)) DESC,
    (
      SELECT MAX(created_at) 
      FROM printed_labels pl 
      WHERE pl.product_id = p.id
    ) DESC NULLS LAST
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_similar_products IS 'Find products with similar names using trigram similarity. Fixed type casting to DOUBLE PRECISION.';
```

Click **Run** → Wait for "Success"

---

### Step 3: Apply Fix #2 - Lupin Emoji

**Copy and paste this SQL**:

```sql
-- Fix Lupin allergen emoji
UPDATE public.allergens 
SET icon = '🌿'
WHERE name = 'Lupin';
```

Click **Run** → Wait for "Success"

---

### Step 4: Verify Fixes

**Run this verification query**:

```sql
-- Verify lupin emoji
SELECT name, icon FROM allergens WHERE name = 'Lupin';

-- Test RPC function (replace <your-org-id> with a real organization ID)
SELECT * FROM find_similar_products('chicken', '<your-org-id>', 0.3) LIMIT 3;
```

**Expected Results**:
- Lupin shows: `Lupin | 🌿`
- RPC returns products with similarity scores (no errors)

---

## 🧪 Test in Browser

1. **Open** `/labeling`
2. **Click** "New Label"
3. **Type** a product name (e.g., "chicken breast")
4. ✅ **Expected**: Similar products appear (no 400 errors)
5. **Click** dropdown → "Create New Product"
6. **Fill** name, category, subcategory
7. **Click** "Create Product"
8. ✅ **Expected**: Product created (no 403 errors)
9. **View** allergen information
10. ✅ **Expected**: Lupin shows 🌿 emoji (not `[]`)

---

## 📊 What Was Fixed

| Issue | Error | Fix |
|-------|-------|-----|
| RPC type mismatch | 400 Bad Request | Cast similarity to `DOUBLE PRECISION` |
| Product creation RLS | 403 Forbidden | Add `organization_id` to INSERT (already in code) |
| Lupin emoji | Shows `[]` | Change to `🌿` (better support) |

---

## ✅ Success Checklist

After applying all fixes:

- [ ] SQL migrations ran successfully
- [ ] No 400 errors when typing product names
- [ ] No 403 errors when creating products
- [ ] Duplicate detection shows similar products
- [ ] Products can be created successfully
- [ ] Lupin allergen shows 🌿 emoji (not `[]`)
- [ ] All other allergens display correctly

---

## 🔧 Troubleshooting

### Still seeing 400 errors?
- Re-run the RPC function migration
- Check browser console for exact error
- Verify pg_trgm extension is installed

### Still seeing 403 errors?
- Check that user has `organization_id` in profile:
  ```sql
  SELECT organization_id FROM profiles WHERE user_id = auth.uid();
  ```
- Verify RLS policies are enabled on products table

### Lupin still shows `[]`?
- Re-run the UPDATE query
- Try a different emoji: `UPDATE allergens SET icon = '🌱' WHERE name = 'Lupin';`
- Clear browser cache and refresh

---

## 📁 Files Created

1. `supabase/migrations/20251216120000_fix_similarity_and_rls.sql`
2. `supabase/migrations/20251216130000_fix_lupin_emoji.sql`
3. `src/components/labels/LabelForm.tsx` (modified - already done)
4. Documentation files in `docs/iteration-10-duplicate-detection/`

---

**Time to Complete**: ~5 minutes  
**Downtime Required**: None  
**Risk Level**: Low  
**Reversible**: Yes (can rollback if needed)

---

🎉 **After completing these steps, all critical issues will be resolved!**
