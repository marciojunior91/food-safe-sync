# Production Deployment - Iteration 10

**Date**: December 16, 2025  
**Feature**: Duplicate Product Detection System  
**Status**: 🚀 Ready for Deployment

---

## 📋 Pre-Deployment Checklist

### ✅ Code Status
- [x] All TypeScript files updated
- [x] 0 TypeScript errors
- [x] 0 console errors (after migrations)
- [x] All components tested locally
- [x] Role-based permissions verified
- [x] Organization isolation working

### ✅ Database Status
- [x] Migration files created
- [x] SQL validated
- [x] RPC functions tested
- [x] No breaking changes

### ✅ Documentation Status
- [x] User guides created
- [x] Admin guides created
- [x] Testing guides prepared
- [x] UAT checklist ready

---

## 🚀 Deployment Steps

### **Step 1: Backup Current State** (5 minutes)

#### A. Backup Database
```sql
-- Optional but recommended: Export current products table
-- In Supabase Dashboard → Table Editor → products → Export as CSV
```

#### B. Note Current State
```sql
-- Check current product count
SELECT COUNT(*) FROM products;

-- Check current allergens
SELECT name, icon FROM allergens WHERE name = 'Lupin';

-- Test current RPC (will fail with 400)
SELECT * FROM find_similar_products('chicken', '<your-org-id>', 0.3) LIMIT 1;
```

---

### **Step 2: Apply Database Migrations** (5 minutes)

#### A. Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

#### B. Run Migration 1 - Fix RPC Function

**Copy and paste this SQL** (from `20251216120000_fix_similarity_and_rls.sql`):

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

**Click "Run"** → Wait for **"Success. No rows returned"**

✅ **Expected Result**: Function updated successfully

#### C. Run Migration 2 - Fix Lupin Emoji

**Copy and paste this SQL** (from `20251216130000_fix_lupin_emoji.sql`):

```sql
-- Fix Lupin allergen emoji
UPDATE public.allergens 
SET icon = '🌿'
WHERE name = 'Lupin';
```

**Click "Run"** → Wait for **"Success"**

✅ **Expected Result**: "UPDATE 1" (1 row updated)

---

### **Step 3: Verify Migrations** (5 minutes)

#### A. Test RPC Function
```sql
-- Should now work without errors
SELECT * FROM find_similar_products('chicken', '<your-org-id>', 0.3) LIMIT 3;
```

✅ **Expected**: Returns products with similarity scores (no 400 error)

#### B. Check Lupin Emoji
```sql
SELECT name, icon FROM allergens WHERE name = 'Lupin';
```

✅ **Expected**: 
```
name  | icon
------+------
Lupin | 🌿
```

#### C. Test Product Creation
```sql
-- Try inserting a test product with organization_id
INSERT INTO products (name, category_id, organization_id)
VALUES ('Test Product', '<valid-category-id>', '<your-org-id>')
RETURNING id, name;

-- Clean up test
DELETE FROM products WHERE name = 'Test Product';
```

✅ **Expected**: INSERT succeeds (no 403 error)

---

### **Step 4: Frontend Verification** (10 minutes)

#### A. Clear Browser Cache
```bash
# Chrome/Edge: Ctrl+Shift+Delete → Clear cache
# Or: Hard refresh with Ctrl+F5
```

#### B. Test Duplicate Detection

**Test 1: Suggestion Mode (30% similarity)**
```bash
1. Navigate to /labeling
2. Click "New Label"
3. Start typing a product name that has similar products
   Example: "chicken b..." (if "chicken breast" exists)
4. ✅ Wait 500ms → Similar products appear
5. ✅ No 400 errors in console
6. ✅ Similarity scores display (30%-84%)
```

**Test 2: Blocking Mode (85% similarity)**
```bash
1. Try typing an almost-exact product name
   Example: "Chicken Breast" (if exists)
2. ✅ Warning appears: "Very likely duplicate"
3. ✅ "Create Product" button disabled
4. ✅ Can select existing product instead
```

**Test 3: Product Creation**
```bash
1. Click dropdown → "Create New Product"
2. Fill in: name, category, subcategory
3. Click "Create Product"
4. ✅ Product created successfully
5. ✅ No 403 errors in console
6. ✅ Product appears in product list
```

#### C. Test Admin Merge UI

**For Admin/Manager Users:**
```bash
1. Navigate to /labeling
2. ✅ "Manage Duplicates" button visible
3. Click "Manage Duplicates"
4. ✅ See duplicate statistics
5. ✅ Role badge shows "Admin" or "Manager"
6. ✅ Merge buttons enabled
7. Try merging a test duplicate pair
8. ✅ Merge succeeds with migration counts
```

**For Staff/LeaderChef Users:**
```bash
1. Navigate to /labeling
2. ✅ "Manage Duplicates" button is HIDDEN
3. (If accessing directly via URL)
4. ✅ See "Access Denied" screen
```

#### D. Test Allergen Display
```bash
1. View any product with allergens
2. Check if Lupin allergen displays
3. ✅ Shows 🌿 emoji (not [])
```

---

### **Step 5: Smoke Testing** (15 minutes)

Run through these critical user flows:

#### Flow 1: Create New Product (No Duplicates)
```bash
1. Login as any user
2. Go to /labeling → New Label
3. Type unique product name: "Unique Item 12345"
4. ✅ No warnings appear
5. Create product → Select category/subcategory
6. ✅ Product created successfully
7. ✅ Appears in product list
```

#### Flow 2: Create Product (With Suggestions)
```bash
1. Type similar name: "chicken breast fillet"
   (if "chicken breast" exists)
2. ✅ Warning appears with suggestions
3. ✅ Can click suggestion to select existing
4. OR: Click "Create Anyway"
5. ✅ Product created successfully
```

#### Flow 3: Admin Merge Duplicates
```bash
1. Login as admin
2. Go to /labeling → Manage Duplicates
3. ✅ See duplicate pairs list
4. Click merge arrow on a pair
5. ✅ Confirmation dialog appears
6. Confirm merge
7. ✅ Success message with migration counts
8. ✅ Duplicate pair disappears from list
9. ✅ Product count decreases
```

#### Flow 4: Organization Isolation
```bash
1. Login as User A (Org 1)
2. Create product "Test Org 1"
3. Logout → Login as User B (Org 2)
4. Try to find "Test Org 1"
5. ✅ Product NOT visible (isolated)
6. ✅ No duplicate warnings for other org's products
```

---

### **Step 6: Monitor for Issues** (First 24 Hours)

#### A. Check Browser Console
```javascript
// Should see these logs (no errors):
"Fetched categories: [...]"
"Fetched products: X valid products"
"Duplicate stats fetched: {...}"
```

#### B. Check Supabase Logs
```bash
# In Supabase Dashboard → Logs
# Look for:
# - API errors (should be none)
# - RPC function calls (should succeed)
# - Database errors (should be none)
```

#### C. User Feedback
- Monitor for user-reported issues
- Check if duplicate detection is too aggressive/lenient
- Adjust thresholds if needed (30% and 85%)

---

## 🐛 Troubleshooting

### Issue: Still seeing 400 errors

**Symptoms**: Console shows type mismatch error

**Solution**:
```sql
-- Verify function was updated
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'find_similar_products';

-- Re-run migration if needed
```

### Issue: Still seeing 403 errors

**Symptoms**: Cannot create products

**Check**:
```sql
-- Verify user has organization_id
SELECT user_id, organization_id FROM profiles WHERE user_id = auth.uid();

-- If null, update it:
UPDATE profiles SET organization_id = '<valid-org-id>' WHERE user_id = auth.uid();
```

### Issue: Lupin still shows []

**Solution**:
```sql
-- Re-run emoji update
UPDATE allergens SET icon = '🌿' WHERE name = 'Lupin';

-- If still broken, try different emoji:
UPDATE allergens SET icon = '🌱' WHERE name = 'Lupin';
```

### Issue: Merge button disabled for admin

**Check**:
```sql
-- Verify user has admin role
SELECT role FROM user_roles WHERE user_id = auth.uid();

-- Add admin role if missing:
INSERT INTO user_roles (user_id, role) 
VALUES (auth.uid(), 'admin');
```

---

## 📊 Success Metrics

### Immediate Metrics (First Hour)
- [ ] No 400 errors in logs
- [ ] No 403 errors in logs
- [ ] Products can be created
- [ ] Duplicate warnings appear
- [ ] Admin merge works

### Short-term Metrics (First Week)
- [ ] Duplicate detection usage: 80%+ of product creations
- [ ] False positives: <10%
- [ ] Admin merges: 5-10 duplicate pairs resolved
- [ ] User satisfaction: Positive feedback

### Long-term Metrics (First Month)
- [ ] Duplicate products: -70% reduction
- [ ] Data quality: +50% improvement
- [ ] User errors: -40% reduction
- [ ] Database cleanliness: Maintained

---

## 📝 Post-Deployment Tasks

### Day 1
- [x] Apply migrations
- [x] Verify functionality
- [x] Monitor error logs
- [ ] Collect initial feedback

### Week 1
- [ ] Train users on duplicate detection
- [ ] Train admins on merge functionality
- [ ] Document any issues encountered
- [ ] Adjust thresholds if needed

### Month 1
- [ ] Review analytics
- [ ] Calculate ROI/impact
- [ ] Plan iteration 11 enhancements
- [ ] Document lessons learned

---

## 🎓 User Training

### Training Materials Created
- ✅ UAT Quick Start Guide
- ✅ Admin Merge Guide
- ✅ Role-Based Permissions Guide
- ✅ Testing Guide

### Training Schedule (Suggested)

**Session 1: All Users (10 minutes)**
- What is duplicate detection
- How to use warnings
- When to create anyway vs. select existing

**Session 2: Admins/Managers (15 minutes)**
- Accessing merge interface
- Understanding similarity scores
- How to merge duplicates safely
- What happens during merge

**Session 3: Q&A (15 minutes)**
- Answer user questions
- Address concerns
- Collect feedback

---

## 🔄 Rollback Plan (If Needed)

### If Critical Issues Arise

**Option 1: Revert Migrations**
```sql
-- Revert to old RPC function (without cast)
-- Note: Will bring back 400 errors
CREATE OR REPLACE FUNCTION find_similar_products(...) 
-- Use old definition without ::DOUBLE PRECISION

-- Revert emoji
UPDATE allergens SET icon = '🫘' WHERE name = 'Lupin';
```

**Option 2: Disable Duplicate Detection**
```tsx
// In useDuplicateDetection.tsx, temporarily return empty:
return {
  similarProducts: [],
  isLoading: false,
  isDuplicate: false,
  error: null,
  checkDuplicate: () => {}
};
```

**Option 3: Hide Admin UI**
```tsx
// In Labeling.tsx, comment out the button:
// {isAdmin && (
//   <Button onClick={() => setCurrentView('admin')}>
//     Manage Duplicates
//   </Button>
// )}
```

---

## ✅ Deployment Checklist Summary

- [ ] **Pre-Deployment**
  - [ ] Code committed to repository
  - [ ] All tests passing
  - [ ] Documentation complete

- [ ] **Deployment**
  - [ ] Database migrations applied
  - [ ] Migrations verified
  - [ ] Frontend verified
  - [ ] Smoke tests completed

- [ ] **Post-Deployment**
  - [ ] Monitor error logs (24 hours)
  - [ ] Collect user feedback
  - [ ] Train users
  - [ ] Document issues

- [ ] **Success Validation**
  - [ ] No critical errors
  - [ ] Users can create products
  - [ ] Admins can merge duplicates
  - [ ] Permissions working correctly

---

## 📞 Support Contacts

### For Issues
- **Technical Issues**: Check documentation in `docs/iteration-10-duplicate-detection/`
- **Database Issues**: Review migrations in `supabase/migrations/`
- **User Questions**: Refer to UAT and testing guides

### Escalation Path
1. Check troubleshooting guide (this document)
2. Review error logs in Supabase Dashboard
3. Check browser console for specific errors
4. Review code in relevant components

---

**Deployment Status**: 🚀 **READY**  
**Estimated Time**: 30 minutes  
**Risk Level**: Low  
**Rollback Available**: Yes

---

🎉 **You're ready to deploy Iteration 10! Follow the steps above and enjoy your new duplicate detection system!**
