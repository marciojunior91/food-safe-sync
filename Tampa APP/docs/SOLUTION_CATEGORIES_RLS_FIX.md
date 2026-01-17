# SOLUTION: Categories Not Showing - RLS Policy Fix

**Date:** January 15, 2026  
**Issue:** Categories exist in database but query returns empty array  
**Root Cause:** Row Level Security (RLS) policy blocking the query  
**Status:** ✅ SOLUTION READY

---

## Problem Summary

### What We Found:

✅ **User is logged in** - User ID available  
✅ **Organization exists** - ID: `b818500f-27f7-47c3-b62a-7d76d5505d57`  
✅ **Categories exist** - 10 categories in database:
- 🍽️ Prepared Foods
- 🥬 Raw Ingredients  
- 🍞 Bakery
- 🥤 Beverages
- 🍰 Desserts
- 🌶️ Sauces & Condiments
- 🥩 Meat & Poultry
- 🐟 Fish & Seafood
- 🥛 Dairy
- 🍎 Vegetables & Fruits

❌ **Query returns `[]`** - Empty array despite data existing

### The Issue:

The Supabase query is working but Row Level Security (RLS) is blocking the results. The RLS policy on `label_categories` table is either:
1. Missing completely
2. Incorrectly configured
3. Not matching the user's organization_id

---

## Quick Fix (5 Minutes)

### Step 1: Go to Supabase SQL Editor

Open: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new

### Step 2: Run This SQL

```sql
-- Remove old policy (if exists)
DROP POLICY IF EXISTS "Users can view their organization's categories" ON label_categories;

-- Create correct policy
CREATE POLICY "Users can view their organization's label categories"
ON label_categories
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND organization_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE label_categories ENABLE ROW LEVEL SECURITY;
```

### Step 3: Verify It Worked

Run this test query:
```sql
SELECT id, name, icon 
FROM label_categories 
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
ORDER BY name;
```

Should return 10 categories.

### Step 4: Refresh Browser

Go back to your Labels page and refresh (F5). Categories should now appear!

---

## How The Fix Works

### Before (Broken):
```
Browser → Supabase Query → RLS Check → ❌ BLOCKED → Returns []
```

### After (Fixed):
```
Browser → Supabase Query → RLS Check → ✅ ALLOWED → Returns 10 categories
```

### The RLS Policy Logic:

```sql
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()  -- Current logged-in user
    AND organization_id IS NOT NULL
  )
)
```

This means:
1. Get current user's ID from `auth.uid()`
2. Look up their `organization_id` in `profiles` table
3. Allow viewing categories where `organization_id` matches

---

## Complete RLS Setup (Optional)

If you want full CRUD permissions, run this:

```sql
-- SELECT (View) - Already done above
CREATE POLICY "Users can view their organization's label categories"
ON label_categories FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

-- INSERT (Create)
CREATE POLICY "Users can create categories for their organization"
ON label_categories FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

-- UPDATE (Edit)
CREATE POLICY "Users can update their organization's categories"
ON label_categories FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

-- DELETE (Remove)
CREATE POLICY "Users can delete their organization's categories"
ON label_categories FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

-- Enable RLS
ALTER TABLE label_categories ENABLE ROW LEVEL SECURITY;
```

---

## Verification Steps

### 1. Check Policy Exists
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'label_categories';
```

Should show:
- `Users can view their organization's label categories` - SELECT

### 2. Check RLS is Enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'label_categories';
```

Should show: `rowsecurity = true`

### 3. Test Query Returns Data
```sql
SELECT COUNT(*) as category_count
FROM label_categories
WHERE organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57';
```

Should show: `category_count = 10`

---

## Troubleshooting

### Issue: Still Returns Empty Array After Fix

**Check 1: Verify your profile has organization_id**
```sql
SELECT user_id, organization_id, display_name
FROM profiles
WHERE user_id = auth.uid();
```

If `organization_id` is NULL:
```sql
UPDATE profiles 
SET organization_id = 'b818500f-27f7-47c3-b62a-7d76d5505d57'
WHERE user_id = auth.uid();
```

**Check 2: Verify auth.uid() returns your user ID**
```sql
SELECT auth.uid() as my_user_id;
```

Should return your user ID (not NULL).

**Check 3: Test direct query bypassing RLS**
```sql
-- This bypasses RLS (admin only)
SELECT COUNT(*) FROM label_categories;
```

If this returns 10 but normal query returns 0, it's definitely an RLS issue.

---

## Why This Happened

When you created the `label_categories` table, RLS was either:
1. Not configured at all
2. Configured with incorrect logic
3. Configured but then broken by a migration

Supabase enables RLS by default for security, but you must explicitly create policies that define WHO can access WHAT data.

Without a SELECT policy, nobody (not even you) can view the data through the API, even though the data exists in the database.

---

## Prevention for Other Tables

Apply the same RLS pattern to other organization-scoped tables:

```sql
-- Template for any organization-scoped table
CREATE POLICY "Users can view their organization's [TABLE_NAME]"
ON [TABLE_NAME]
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

ALTER TABLE [TABLE_NAME] ENABLE ROW LEVEL SECURITY;
```

Replace `[TABLE_NAME]` with:
- `label_subcategories`
- `products`
- `recipes`
- etc.

---

## Files Created

1. **docs/fix-label-categories-rls.sql** - Complete RLS setup script
2. **docs/SOLUTION_CATEGORIES_RLS_FIX.md** - This file (documentation)
3. **docs/DEBUG_QUICKPRINT_CATEGORIES.md** - Original debug guide

---

## Next Steps

1. ✅ Run the Quick Fix SQL in Supabase
2. ✅ Refresh your browser
3. ✅ Verify 10 categories appear in QuickPrintGrid
4. ✅ Test clicking on a category to view products
5. ⏳ Apply same RLS fix to `label_subcategories` if needed

---

## Success Criteria

After applying the fix, you should see:

✅ Categories grid displays 10 category cards  
✅ Each category shows name and icon  
✅ Each category shows product count  
✅ Clicking category navigates to subcategories/products  
✅ Console shows: "✅ QuickPrintGrid: Found 10 categories"

---

## Summary

**Problem:** RLS policy blocking category queries  
**Solution:** Create proper SELECT policy for organization members  
**Time to Fix:** 5 minutes  
**Status:** Ready to apply ✅

Run the SQL, refresh your browser, and the categories will appear! 🎉
