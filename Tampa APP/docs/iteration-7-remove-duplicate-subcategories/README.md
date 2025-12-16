# Iteration 7: Remove Duplicate Subcategories

**Date:** December 16, 2025  
**Status:** ✅ Complete (Code) - 🔄 Pending (Database)  
**Goal:** Remove duplicate subcategory entries causing TypeScript compilation errors

---

## 📋 Problem

TypeScript compilation errors occurred due to duplicate keys in `SUBCATEGORY_ICONS` object:

```
An object literal cannot have multiple properties with the same name.
```

### Duplicates Identified:

1. **'Pastries'** 🥐
   - ❌ In Bakery (line 48) 
   - ❌ In Desserts (line 100)

2. **'Leafy Greens'** 🥬
   - ❌ In Raw Ingredients (line 58)
   - ❌ In Vegetables (line 121)

3. **'Root Vegetables'** 🥕
   - ❌ In Raw Ingredients (line 59)
   - ❌ In Vegetables (line 122)

---

## ✅ Solution

### Strategy: Keep Original, Remove Duplicates

| Subcategory | Keep In | Remove From | Rationale |
|---|---|---|---|
| **Pastries** | Bakery | Desserts | Croissants, danishes are baked goods, not desserts |
| **Leafy Greens** | Raw Ingredients | Vegetables | Comprehensive ingredients category covers it |
| **Root Vegetables** | Raw Ingredients | Vegetables | Comprehensive ingredients category covers it |

### Result:
- **Before:** 74 subcategories
- **After:** 71 subcategories (-3 duplicates)

---

## 📂 Files

### Code Changes
- **`src/constants/quickPrintIcons.ts`**
  - Removed `'Pastries': '🥐'` from Desserts section
  - Removed `'Leafy Greens': '🥬'` from Vegetables section
  - Removed `'Root Vegetables': '🥕'` from Vegetables section
  - Updated section comments to reflect new counts

### Database Scripts
- **`delete-duplicate-subcategories.sql`**
  - Verification queries to check duplicates
  - Product assignment checks (ensure no data loss)
  - DELETE statements for 3 duplicate subcategories
  - Verification queries after deletion

---

## 🔧 Changes Made

### TypeScript File (`quickPrintIcons.ts`)

**Before:**
```typescript
// Desserts Subcategories (5)
'Cakes': '🎂',
'Pastries': '🥐',  // ❌ DUPLICATE
'Ice Cream': '🍦',
'Cookies': '🍪',
'Puddings': '🍮',

// Vegetables Subcategories (6)
'Leafy Greens': '🥬',  // ❌ DUPLICATE
'Root Vegetables': '🥕',  // ❌ DUPLICATE
'Cruciferous': '🥦',
'Nightshades': '🍅',
'Alliums': '🧅',
'Squashes': '🎃',
```

**After:**
```typescript
// Desserts Subcategories (4) - Removed duplicate 'Pastries'
'Cakes': '🎂',
'Ice Cream': '🍦',
'Cookies': '🍪',
'Puddings': '🍮',

// Vegetables Subcategories (4) - Removed duplicates
'Cruciferous': '🥦',
'Nightshades': '🍅',
'Alliums': '🧅',
'Squashes': '🎃',
```

---

## 🗄️ Database Changes

### Step 1: Verify Duplicates (Run First)

```sql
-- Check 'Pastries' in both categories
SELECT ls.name, lc.name as category, ls.display_order
FROM label_subcategories ls
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.name = 'Pastries';
-- Expected: 2 rows (Bakery, Desserts)
```

### Step 2: Check Product Assignments

**IMPORTANT:** Before deleting, ensure no products are assigned to the duplicate subcategories!

```sql
-- Check if products use 'Pastries' in Desserts
SELECT p.name, ls.name as subcategory, lc.name as category
FROM products p
JOIN label_subcategories ls ON p.subcategory_id = ls.id
JOIN label_categories lc ON ls.category_id = lc.id
WHERE ls.name = 'Pastries' AND lc.name = 'Desserts';
-- Expected: 0 rows (no products should be affected)
```

### Step 3: Delete Duplicates

```sql
-- Delete 'Pastries' from Desserts (keep in Bakery)
DELETE FROM label_subcategories
WHERE name = 'Pastries'
  AND category_id IN (
    SELECT id FROM label_categories WHERE name = 'Desserts'
  );

-- Delete 'Leafy Greens' from Vegetables (keep in Raw Ingredients)
DELETE FROM label_subcategories
WHERE name = 'Leafy Greens'
  AND category_id IN (
    SELECT id FROM label_categories WHERE name = 'Vegetables'
  );

-- Delete 'Root Vegetables' from Vegetables (keep in Raw Ingredients)
DELETE FROM label_subcategories
WHERE name = 'Root Vegetables'
  AND category_id IN (
    SELECT id FROM label_categories WHERE name = 'Vegetables'
  );
```

### Step 4: Verify Results

```sql
-- Count subcategories per category
SELECT 
  lc.name as category_name,
  COUNT(ls.id) as subcategory_count
FROM label_categories lc
LEFT JOIN label_subcategories ls ON ls.category_id = lc.id
GROUP BY lc.name
ORDER BY lc.name;
```

**Expected Results:**
| Category | Subcategories | Change |
|---|---|---|
| Bakery | 9 | No change (Pastries kept) |
| Desserts | **4** | -1 (Pastries removed) |
| Raw Ingredients | 15 | No change (Leafy Greens, Root Vegetables kept) |
| Vegetables | **4** | -2 (Leafy Greens, Root Vegetables removed) |
| **TOTAL** | **71** | **-3** |

---

## 🚀 How to Apply

### 1. Code Changes (Already Applied)
✅ TypeScript file updated  
✅ Compilation errors resolved  
✅ No duplicates in icon mappings

### 2. Database Changes (Manual Application Required)

**Option A: Supabase SQL Editor (Recommended)**
```bash
1. Open: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql
2. Open: docs/iteration-7-remove-duplicate-subcategories/delete-duplicate-subcategories.sql
3. Copy STEP 1 (Verification) → Run → Review results
4. Copy STEP 2 (Product checks) → Run → Ensure 0 products affected
5. Copy STEP 3 (DELETE statements) → Run → Remove duplicates
6. Copy STEP 4 (Final verification) → Run → Confirm counts
```

**Option B: Run Script with Node.js**
```bash
cd docs/iteration-7-remove-duplicate-subcategories
node delete-duplicates.mjs  # Script to be created if needed
```

---

## 📊 Impact Analysis

### Code Impact:
- ✅ TypeScript compilation errors fixed
- ✅ No duplicate keys in object literal
- ✅ Cleaner, more maintainable code
- ✅ Updated section comments

### Database Impact:
- 🔄 3 subcategories will be deleted
- ⚠️ **Ensure no products are assigned to duplicates first!**
- ✅ No data loss if product checks pass
- ✅ Cleaner category structure

### User Impact:
- ✅ No visible changes in UI (duplicates weren't being used)
- ✅ More logical category organization
- ✅ Vegetables category now focused on specific types

---

## 💡 Rationale

### Why Remove from Vegetables?

**Vegetables Category After Cleanup:**
- ✅ Cruciferous (broccoli, cauliflower)
- ✅ Nightshades (tomatoes, peppers, eggplant)
- ✅ Alliums (onions, garlic)
- ✅ Squashes (pumpkin, zucchini)

**These are specific vegetable families, not covered by Raw Ingredients subcategories.**

**Raw Ingredients Category Remains Comprehensive:**
- ✅ Leafy Greens (lettuce, spinach, kale)
- ✅ Root Vegetables (carrots, beets, turnips)
- ✅ Fresh Vegetables (general produce)
- ✅ Fresh Fruits
- ✅ Herbs & Aromatics
- And 10 more...

### Why Remove Pastries from Desserts?

**Bakery items (croissants, danishes, éclairs) are:**
- ✅ Baked goods (belong in Bakery)
- ❌ Not necessarily desserts (often breakfast items)

**Desserts category focuses on:**
- Sweet treats (cakes, cookies)
- Frozen desserts (ice cream)
- Puddings and custards

---

## ✅ Completion Checklist

### Code
- ✅ Removed 'Pastries' from Desserts section
- ✅ Removed 'Leafy Greens' from Vegetables section
- ✅ Removed 'Root Vegetables' from Vegetables section
- ✅ Updated section comments (counts)
- ✅ TypeScript compilation passes
- ✅ No lint errors

### Database (To Do)
- ⬜ Run verification queries (STEP 1)
- ⬜ Check product assignments (STEP 2)
- ⬜ Execute DELETE statements (STEP 3)
- ⬜ Verify final counts (STEP 4)
- ⬜ Test in application

### Documentation
- ✅ SQL script created with full comments
- ✅ README.md created with rationale
- ✅ Impact analysis documented
- ✅ Verification steps provided

---

## 🧪 Testing

### After Database Changes:
1. Open app and hard refresh (Ctrl + Shift + R)
2. Go to: Labeling → Toggle "By Categories"
3. Click **"Desserts"** → Should see 4 subcategories (no Pastries)
4. Click **"Bakery"** → Should see 9 subcategories (Pastries present)
5. Click **"Vegetables"** → Should see 4 subcategories (no Leafy Greens or Root Vegetables)
6. Click **"Raw Ingredients"** → Should see 15 subcategories (both present)

### Verify No Errors:
```bash
# Check TypeScript compilation
npm run build

# Check for runtime errors
npm run dev
# Open browser console, check for warnings
```

---

## 📈 Statistics

### Before:
- Total subcategories: 74
- Desserts: 5 subcategories
- Vegetables: 6 subcategories
- TypeScript errors: 3

### After:
- Total subcategories: 71 ✅
- Desserts: 4 subcategories ✅
- Vegetables: 4 subcategories ✅
- TypeScript errors: 0 ✅

---

**Iteration Complete (Code)** 🎉  
**Database Update Pending** 🔄

Run the SQL script when ready to apply database changes!
