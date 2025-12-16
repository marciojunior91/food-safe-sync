# Why Some Items Show Default Icons - Troubleshooting Guide

## 🔍 Problem: Default Icons Appearing

When you see **📁** (category) or **📂** (subcategory) instead of the proper emoji, it means there's a **name mismatch** between:
1. The name stored in the database
2. The name in `quickPrintIcons.ts`

## 🐛 Debugging Steps

### Step 1: Check Browser Console (EASIEST)

I've added console warnings to help you identify mismatches!

1. **Open Browser DevTools**: Press `F12`
2. **Go to Console tab**
3. **Navigate to the Labeling page** and click categories
4. **Look for warnings like:**
   ```
   ⚠️ No icon found for category: "Fish & Seafood"
   ```

The warning will show:
- The exact name from the database
- The name length (helps spot extra spaces)
- List of available icon mappings

### Step 2: Run SQL to See Exact Names

Run `debug-icon-names.sql` in Supabase SQL Editor to see:
- Exact database names (with quotes to show spaces)
- Name lengths
- Any special characters

```sql
SELECT 
  name as category_name,
  LENGTH(name) as name_length,
  '"' || name || '"' as quoted_name
FROM label_categories
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;
```

## 🔧 Common Causes & Fixes

### 1. **Extra Spaces** (Most Common)

**Problem:**
- Database: `"Fish and Seafood "` (space at end)
- Icon file: `'Fish and Seafood'` (no space)
- Result: ❌ Mismatch → 📁 default icon

**Fix in Database:**
```sql
UPDATE label_categories 
SET name = TRIM(name)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

UPDATE label_subcategories 
SET name = TRIM(name)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;
```

### 2. **Different Ampersand Style**

**Problem:**
- Database: `"Meat & Poultry"` (with `&`)
- Icon file: `'Meat and Poultry'` (with `and`)
- Result: ❌ Mismatch

**Check in Console:** You'll see exactly which one is wrong

**Fix Option A** - Update Database:
```sql
UPDATE label_categories 
SET name = 'Meat & Poultry'
WHERE name = 'Meat and Poultry'
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;
```

**Fix Option B** - Update Icon File:
```typescript
// In quickPrintIcons.ts
'Meat and Poultry': '🥩',  // Add both variations
'Meat & Poultry': '🥩',
```

### 3. **Case Sensitivity**

**Problem:**
- Database: `"fresh fish"` (lowercase)
- Icon file: `'Fresh Fish'` (title case)
- Result: ❌ Mismatch

**Note:** JavaScript object keys are case-sensitive!

**Fix in Database:**
```sql
UPDATE label_subcategories 
SET name = 'Fresh Fish'
WHERE LOWER(name) = 'fresh fish'
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;
```

### 4. **Special Characters**

**Problem:**
- Database: `"Herbs & Aromatics"` 
- Icon file: `'Herbs and Aromatics'`

**Check:** Console will show the exact character

**Fix:** Match them exactly or add both variations

### 5. **Accents or Unicode**

**Problem:**
- Database: `"Crème Fraîche"` (with accents)
- Icon file: `'Creme Fraiche'` (without accents)

**Fix:** Use exact Unicode characters in icon file

## 📋 Quick Diagnosis Checklist

Run through this checklist:

### Categories
- [ ] Open app → F12 → Console
- [ ] Toggle to "By Categories"
- [ ] Check for ⚠️ warnings
- [ ] Note which categories show 📁

### Subcategories
- [ ] Click each category with subcategories
- [ ] Check for ⚠️ warnings
- [ ] Note which subcategories show 📂

### Database Check
- [ ] Run `debug-icon-names.sql` in Supabase
- [ ] Compare names with `quickPrintIcons.ts`
- [ ] Look for:
  - Extra spaces before/after
  - `&` vs `and`
  - Different capitalization
  - Special characters

## 🔨 Fix Examples

### Example 1: "Herbs & Aromatics" shows 📂

**Console shows:**
```
⚠️ No icon found for subcategory: "Herbs & Aromatics"
```

**Icon file has:**
```typescript
'Herbs and Aromatics': '🌿',  // ❌ Wrong - has "and"
```

**Fix - Update icon file:**
```typescript
'Herbs & Aromatics': '🌿',  // ✅ Correct - has "&"
```

### Example 2: "Bakery " shows 📁 (extra space)

**Console shows:**
```
⚠️ No icon found for category: "Bakery "
length: 7  // ← Should be 6!
```

**Fix - Clean database:**
```sql
UPDATE label_categories 
SET name = TRIM(name)
WHERE name LIKE '% ' OR name LIKE ' %';
```

### Example 3: Multiple items missing icons

**If many items show default icons:**

1. **First**, run the trim SQL for all:
```sql
-- Clean all extra spaces
UPDATE label_categories SET name = TRIM(name);
UPDATE label_subcategories SET name = TRIM(name);
```

2. **Then**, check console for remaining mismatches

3. **Finally**, update icon file with exact names from database

## 🎯 The Golden Rule

**The names MUST match EXACTLY, character for character:**

```typescript
// Database:        "Fish and Seafood"
// Icon file:       'Fish and Seafood'  ✅ MATCH

// Database:        "Fish & Seafood"
// Icon file:       'Fish and Seafood'  ❌ NO MATCH

// Database:        "Bakery "
// Icon file:       'Bakery'            ❌ NO MATCH (extra space)

// Database:        "fresh fish"
// Icon file:       'Fresh Fish'        ❌ NO MATCH (case)
```

## 🚀 Quick Fix Script

Run this to automatically fix most common issues:

```sql
-- 1. Remove extra spaces
UPDATE label_categories 
SET name = TRIM(name)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

UPDATE label_subcategories 
SET name = TRIM(name)
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- 2. Standardize ampersands (choose one style)
UPDATE label_categories 
SET name = REPLACE(name, ' and ', ' & ')
WHERE name LIKE '% and %'
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

UPDATE label_subcategories 
SET name = REPLACE(name, ' and ', ' & ')
WHERE name LIKE '% and %'
  AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid;

-- 3. Verify all names
SELECT name, LENGTH(name) 
FROM label_categories 
WHERE organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa'::uuid
ORDER BY name;
```

## 📝 After Fixing

1. **Refresh the browser** (`Ctrl + Shift + R`)
2. **Check console** - warnings should be gone
3. **Verify icons** - proper emojis should appear
4. **If still issues** - copy exact name from console and add to icon file

## 🆘 Still Not Working?

If icons still don't show after fixing names:

1. **Copy the exact warning from console**
2. **Check the name has no hidden characters** (copy to a text editor)
3. **Add the exact name to icon file:**
   ```typescript
   'Exact Name From Console': '🐟',
   ```
4. **Hard refresh** (`Ctrl + Shift + R`)

## 💡 Pro Tips

- **Use console warnings** - They tell you exactly what's wrong!
- **Database is the source of truth** - Match icon file to database, not vice versa
- **Test incrementally** - Fix one category at a time
- **Keep names simple** - Avoid special characters when possible
- **Document variations** - If you need both "Herbs and Aromatics" and "Herbs & Aromatics", add both

---

**Remember:** The console warnings I added will show you EXACTLY which names don't match. Just open F12 and look for the ⚠️ warnings!
