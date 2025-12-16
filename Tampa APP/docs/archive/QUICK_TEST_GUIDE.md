# ⚡ Quick Test Guide - 5 Minutes

## 🎯 Fast Track Testing (Most Important Features)

### Test 1: Blank Template Preview (30 seconds)
```
1. Open Labeling page
2. Look for "Template" dropdown
3. Select "Blank"
4. Check preview → Should show empty state with eye icon ✅
5. Select "Default"
6. Check preview → Should show normal content ✅
```

**Expected Result:**  
Blank = Empty preview with message  
Default = Full preview with fields

---

### Test 2: Subcategory Selector (1 minute)
```
1. Create New Label
2. Select Category: "Proteins"
3. Wait 0.5s → Subcategory dropdown should appear ✅
4. Open dropdown → Should show: Red Meats, Poultry, Fish, Seafood
5. Select "Poultry"
6. Verify it stays selected ✅
```

**Expected Result:**  
- Dropdown appears after category selection
- Shows 4-8 subcategories depending on category
- Selection persists

---

### Test 3: Allergen Selector (2 minutes)
```
1. Continue from Test 2 (or create new label)
2. Select a Product (any product)
3. Scroll down → Allergen selector should appear ✅
4. Look for colored sections:
   - 🔴 CRITICAL (red) - Peanuts, Tree Nuts, Shellfish, Fish
   - 🟡 WARNING (yellow) - Milk, Eggs, Gluten, Soy
   - 🔵 INFO (blue) - Celery, Mustard, etc.
5. Click checkboxes to select 2-3 allergens
6. Verify badges appear at top ✅
7. Check preview → Should show "Allergen Warning" box below ✅
```

**Expected Result:**  
- Allergens grouped by severity (3 sections)
- Color-coded badges
- Warning box in preview

---

### Test 4: Save & Print (1 minute)
```
1. Fill all required fields
2. Click "Print Label" or "Save Draft"
3. No errors in console ✅
4. Success toast message appears ✅
```

**Expected Result:**  
- Operation completes without errors
- Success notification shows

---

## 🚨 Critical Checks

### Check 1: Console Errors
```
1. Press F12 (open DevTools)
2. Go to Console tab
3. Refresh page
4. Look for RED errors ❌
```

**Good:** Only warnings (yellow) or info (blue)  
**Bad:** Red errors about "table doesn't exist"

→ If you see "allergens doesn't exist": **Apply migrations first!**

---

### Check 2: Database Tables Exist
```
1. Go to Supabase Dashboard
2. Database → Tables
3. Look for:
   ✅ allergens
   ✅ product_allergens
   ✅ label_subcategories
```

**Missing tables?** → Apply migrations (see FINAL_INSTRUCTIONS.md)

---

## 📸 Screenshot Checklist

Take screenshots of:
1. ✅ Blank template preview (empty state)
2. ✅ Subcategory dropdown populated
3. ✅ Allergen selector with all 3 sections
4. ✅ Allergen warning box in preview
5. ❌ Any errors (if they occur)

---

## 🎯 Pass/Fail Criteria

### ✅ PASS if:
- App loads without errors
- Blank template shows empty preview
- Subcategories appear when category selected
- Allergen selector displays 24 allergens in 3 groups
- Can save/print labels
- No red console errors

### ❌ FAIL if:
- Red console errors on load
- Blank template still shows content
- Subcategories don't load
- Allergen selector doesn't appear
- Can't save/print
- "Table doesn't exist" errors

---

## 🔧 Quick Fixes

**Problem:** Allergen selector doesn't appear  
**Fix:** Make sure you selected a PRODUCT (not just category)

**Problem:** Subcategories don't load  
**Fix:** Select a different category, then go back

**Problem:** "Table doesn't exist"  
**Fix:** Migrations not applied → See FINAL_INSTRUCTIONS.md

**Problem:** Build errors  
**Fix:** Run `npm install` and `npm run build` again

---

## ⏱️ Time Budget

- Test 1 (Blank Preview): 30 seconds
- Test 2 (Subcategories): 1 minute
- Test 3 (Allergens): 2 minutes
- Test 4 (Save/Print): 1 minute
- Check Console: 30 seconds
─────────────────────────────────
**Total: 5 minutes**

---

## 🎉 Success Checklist

- [ ] Blank template preview works
- [ ] Subcategory selector loads
- [ ] Allergen selector displays correctly
- [ ] Color-coded badges show (red/yellow/blue)
- [ ] Allergen warning in preview
- [ ] Can save labels
- [ ] Can print labels
- [ ] No console errors

**All checked?** → 🎊 **Phase 1 is PERFECT!** 🎊

---

## 📞 Report Results

### Format:
```
✅ Feature X works perfectly
⚠️ Feature Y has minor issue: [describe]
❌ Feature Z doesn't work: [error message]
```

### Example:
```
✅ Blank template preview works perfectly
✅ Subcategory selector loads instantly
⚠️ Allergen selector: Some icons not showing (minor)
✅ Save/print works without errors
```

---

**Ready? GO TEST! 🚀**

