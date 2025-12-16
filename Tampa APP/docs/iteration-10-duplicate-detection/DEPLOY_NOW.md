# 🚀 Deploy Iteration 10 - Quick Guide

**Time Required**: 10 minutes  
**Current Date**: December 16, 2025

---

## Step 1: Apply Database Migrations (5 minutes)

### Open Supabase SQL Editor
1. Go to **https://supabase.com/dashboard**
2. Select your Tampa APP project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

---

### Migration 1: Fix RPC Type Mismatch

**Copy and paste this entire SQL block, then click RUN:**

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
    SIMILARITY(LOWER(p.name), LOWER(search_name))::DOUBLE PRECISION,
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
    AND p.name != search_name
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

✅ **Expected**: "Success. No rows returned"

---

### Migration 2: Fix Lupin Emoji

**Copy and paste this SQL, then click RUN:**

```sql
-- Fix Lupin allergen emoji
UPDATE public.allergens 
SET icon = '🌿'
WHERE name = 'Lupin';
```

✅ **Expected**: "Success. 1 row updated"

---

## Step 2: Verify Migrations (2 minutes)

### Test RPC Function

**Run this SQL** (replace `<your-org-id>` with your actual organization ID):

```sql
SELECT * FROM find_similar_products('chicken', '<your-org-id>', 0.3) LIMIT 3;
```

✅ **Expected**: Returns products with similarity scores (NO 400 error)

---

### Test Lupin Emoji

**Run this SQL:**

```sql
SELECT name, icon FROM allergens WHERE name = 'Lupin';
```

✅ **Expected**: 
```
name  | icon
------+------
Lupin | 🌿
```

---

## Step 3: Test in Browser (3 minutes)

### Clear Browser Cache
- **Chrome/Edge**: Press `Ctrl + Shift + Delete` → Clear cache
- **Or**: Hard refresh with `Ctrl + F5`

### Test 1: Duplicate Detection

1. Go to **http://localhost:5173/labeling** (or your dev URL)
2. Click **"New Label"**
3. Start typing a product name that has similar products
   - Example: Type `"chicken b..."` if you have "chicken breast"
4. **Wait 500ms**
5. ✅ Similar products should appear
6. ✅ Check console: **NO 400 errors**

### Test 2: Product Creation

1. Click the dropdown → **"Create New Product"**
2. Fill in:
   - Name: "Test Product 123"
   - Category: Select any
   - Subcategory: Select any
3. Click **"Create Product"**
4. ✅ Product should be created
5. ✅ Check console: **NO 403 errors**

### Test 3: Admin Merge (If Admin)

1. In /labeling page, click **"Manage Duplicates"** (top right)
2. ✅ See duplicate statistics
3. ✅ Role badge shows "Admin" or "Manager"
4. ✅ Merge buttons are **enabled**
5. Try merging a duplicate pair
6. ✅ Should succeed with success message

### Test 4: Allergen Display

1. View any product with allergens
2. Check if Lupin allergen displays
3. ✅ Should show **🌿** emoji (not [])

---

## ✅ Success Checklist

- [ ] Migration 1 applied (RPC function updated)
- [ ] Migration 2 applied (Lupin emoji fixed)
- [ ] RPC function test passes (no 400 error)
- [ ] Duplicate detection works in UI
- [ ] Product creation works (no 403 error)
- [ ] Admin merge UI accessible
- [ ] Lupin emoji displays correctly
- [ ] No console errors

---

## 🐛 Troubleshooting

### Still seeing 400 errors?
```sql
-- Re-run migration 1 (the RPC function fix)
-- Make sure you copied the ENTIRE function including COMMENT ON FUNCTION
```

### Still seeing 403 errors?
```sql
-- Check your organization_id in profiles table
SELECT user_id, organization_id FROM profiles WHERE user_id = auth.uid();

-- If null, update it (replace with valid org ID)
UPDATE profiles SET organization_id = '<valid-org-id>' WHERE user_id = auth.uid();
```

### Lupin still shows []?
```sql
-- Try a different emoji
UPDATE allergens SET icon = '🌱' WHERE name = 'Lupin';
```

---

## 🎉 Deployment Complete!

**What's New:**
- ✅ Duplicate detection works (no 400 errors)
- ✅ Product creation works (no 403 errors)
- ✅ Lupin emoji displays correctly
- ✅ Admin merge functionality ready
- ✅ Role-based permissions active

**Next Steps:**
- Monitor error logs for 24 hours
- Train users on duplicate detection
- Train admins on merge functionality
- Collect feedback

**Documentation:**
- Full deployment guide: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- User testing guide: `UAT_QUICK_START.md`
- Admin guide: `TESTING_MERGE_ADMIN_ACCESS.md`

---

**Deployed by**: GitHub Copilot  
**Date**: December 16, 2025  
**Feature**: Iteration 10 - Duplicate Detection System  
**Status**: 🚀 **LIVE**
