# Apply Database Fixes - Quick Guide

## 🚨 IMPORTANT: These fixes are critical for product creation to work!

### What's Broken Right Now
1. ❌ Duplicate detection returns 400 errors
2. ❌ Creating new products returns 403 errors (RLS violation)

### What Will Be Fixed
1. ✅ Type mismatch in `find_similar_products` RPC function
2. ✅ Missing `organization_id` when creating products

---

## 📋 Steps to Apply Fix

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Copy and Paste SQL

Copy the **entire contents** of this file:
```
supabase/migrations/20251216120000_fix_similarity_and_rls.sql
```

Paste it into the SQL Editor.

### Step 3: Run the Migration

1. Click **"Run"** (or press Ctrl/Cmd + Enter)
2. Wait for confirmation: **"Success. No rows returned"**
3. ✅ Done! The RPC function is now fixed.

---

## 🧪 Verify the Fix

### Test 1: Check RPC Function

Run this in SQL Editor (replace `<your-org-id>` with a real organization ID from your profiles table):

```sql
SELECT * FROM find_similar_products('chicken', '<your-org-id>', 0.3);
```

**✅ Expected**: Returns results with similarity scores (no errors)  
**❌ If error**: Check that the function was created successfully

### Test 2: Test in Browser

1. Open your app and navigate to `/labeling`
2. Click **"New Label"**
3. Try typing a product name (e.g., "chicken")
4. **✅ Expected**: Similar products appear (no console errors)
5. Click **"Create New Product"** in the dropdown
6. Fill in: name, category, subcategory
7. Click **"Create Product"**
8. **✅ Expected**: Product created successfully (no 403 error)

---

## 🔍 Troubleshooting

### "Function find_similar_products does not exist"

**Solution**: Make sure you pasted the entire SQL migration file.

### Still getting 403 errors when creating products

**Check**:
1. Is `organizationId` loaded? (Check console: should log organization_id)
2. Does the user have an `organization_id` in their profile?
3. Are RLS policies enabled on the `products` table?

**SQL to check user's organization**:
```sql
SELECT organization_id FROM profiles WHERE user_id = auth.uid();
```

### Still getting 400 errors on duplicate detection

**Check**:
1. Was the SQL migration applied successfully?
2. Try re-running the migration
3. Check browser console for the exact error message

---

## 📊 What Changed

### Database (SQL Migration)
```sql
-- Added type cast to fix type mismatch
SIMILARITY(...)::DOUBLE PRECISION  -- ← This fixes the 400 error
```

### Frontend (LabelForm.tsx)
```tsx
// Added organization_id to fix RLS violation
.insert({
  name: newProductName.trim(),
  category_id: newProductCategory,
  subcategory_id: newProductSubcategory || null,
  organization_id: organizationId  // ← This fixes the 403 error
})
```

---

## ✅ Success Criteria

After applying both fixes:

- [ ] No more 400 errors in console (duplicate detection works)
- [ ] No more 403 errors in console (product creation works)
- [ ] DuplicateProductWarning shows similar products
- [ ] Can create new products successfully
- [ ] Products have correct organization_id
- [ ] RLS policies still enforced (users only see their org's products)

---

## 📞 Need Help?

1. Check console for error messages
2. Verify SQL migration ran successfully
3. Confirm user has organization_id in profile
4. Test with a fresh browser session (clear cache)

---

**Time to Apply**: ~2 minutes  
**Downtime Required**: None (hot fix)  
**Risk Level**: Low (single-line changes)  
**Testing Required**: Yes (verify product creation works)
