# User Acceptance Testing - Quick Start Guide
## Iteration 10: Duplicate Product Detection

**Date:** December 16, 2025  
**Status:** Ready for Testing ✅

---

## 🎯 What to Test

### **Feature:** Duplicate Product Detection
The system now prevents duplicate products by warning users when they try to create products with similar names.

---

## 📋 Quick Test Checklist

### Test 1: High Similarity Warning (Should Block) ⚠️
**Steps:**
1. Navigate to **Labeling** page
2. Click **"Create New Product"** in the product selector
3. Type: **"Caesar Salad Mix"** (exact match to existing product)
4. Select any category

**Expected Result:**
- ❌ Red warning appears: "⚠️ Potential Duplicate Product Detected"
- ❌ Shows existing product with 100% match
- ❌ "Create Product" button is **DISABLED**
- ❌ Button text: "Cannot Create - Duplicate Exists"
- ✅ Can click "Use This" to select existing product

---

### Test 2: Medium Similarity Warning (Should Allow with Warning) 🟡
**Steps:**
1. Click **"Create New Product"**
2. Type: **"Caesar Wrap"** (similar but not duplicate)
3. Select a category

**Expected Result:**
- 🟡 Yellow warning appears: "Similar Products Found"
- 🟡 Shows "Caesar Salad Mix" with ~60% match
- ✅ "Create Product" button is **ENABLED**
- ✅ Can create new product despite warning
- ✅ Can click "Use This" to select existing product instead

---

### Test 3: No Similarity (Clean Creation) ✅
**Steps:**
1. Click **"Create New Product"**
2. Type: **"Mango Smoothie Bowl"** (completely unique)
3. Select a category

**Expected Result:**
- ✅ No warning appears
- ✅ "Create Product" button enabled immediately
- ✅ Product creates successfully

---

### Test 4: Select Existing Product from Warning 🔄
**Steps:**
1. Click **"Create New Product"**
2. Type: **"Chicken"** (similar to "Chicken Breast")
3. Wait for warning to appear
4. Click **"Use This"** button on "Chicken Breast"

**Expected Result:**
- ✅ Dialog closes
- ✅ LabelForm populated with "Chicken Breast"
- ✅ Category automatically filled
- ✅ Toast: "Product Selected - Using existing product: Chicken Breast"

---

### Test 5: Loading State ⏳
**Steps:**
1. Click **"Create New Product"**
2. Type quickly: **"Caesar"**
3. Observe the loading state

**Expected Result:**
- ⏳ Loading skeleton appears briefly
- ⏳ Results appear after ~500ms (debounced)
- ✅ UI doesn't freeze or lag

---

### Test 6: Case Insensitivity 🔤
**Steps:**
1. Click **"Create New Product"**
2. Type: **"CAESAR SALAD MIX"** (all caps)
3. Select a category

**Expected Result:**
- ❌ Red warning: Matches "Caesar Salad Mix"
- ❌ Button disabled (85%+ match)
- ✅ Case is ignored in comparison

---

### Test 7: Short Names (Edge Case) ⚡
**Steps:**
1. Click **"Create New Product"**
2. Type: **"AB"** (only 2 characters)

**Expected Result:**
- ✅ No warning appears (need 3+ chars)
- ✅ No error shown
- ✅ Can proceed with creation

---

## 🐛 Bug Report Template

If you find issues, please report:

```
**Test:** [Test number and name]
**Steps:** [What you did]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Browser:** [Chrome/Firefox/Safari]
**Screenshot:** [If possible]
```

---

## 📊 Success Criteria

✅ **PASS** if:
- High similarity (85%+) blocks creation
- Medium similarity (30-84%) shows warning but allows
- No similarity allows clean creation
- "Use This" button selects existing product
- Loading states display correctly
- No crashes or freezes

❌ **FAIL** if:
- Duplicate detection doesn't trigger
- False positives (blocks unique names)
- False negatives (allows clear duplicates)
- UI freezes or crashes
- "Use This" button doesn't work

---

## 🔍 Additional Testing (Optional)

### Real-World Scenarios:
1. **Common variations:**
   - "Fresh Salmon" vs "Salmon Fresh" vs "Fresh Salmon Fillet"
   - "Tomato Sauce" vs "Tomato Basil Sauce" vs "Sauce Tomato"

2. **Special characters:**
   - "Caesar & Romaine" vs "Caesar and Romaine"
   - "50/50 Blend" vs "50 50 Blend"

3. **Multiple similar products:**
   - Type "Salad" - should show multiple matches
   - Type "Chicken" - should show multiple matches

---

## ✅ Sign-Off

**Tester Name:** _______________  
**Date:** _______________  
**Overall Result:** ☐ Pass ☐ Fail ☐ Pass with Issues  

**Notes:**
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________

**Ready for Production?** ☐ Yes ☐ No ☐ Needs Minor Fixes

---

## 🚀 Next Steps After Testing

If all tests pass:
1. ✅ Mark "User Acceptance Testing" as complete
2. ➡️ Move to "Add MergeProductsAdmin to Admin UI"
3. ➡️ Set up role-based permissions
4. ➡️ Prepare for production deployment

If issues found:
1. 🐛 Document all bugs
2. 🔧 Fix critical issues
3. 🔄 Re-test
4. ✅ Sign off when ready

---

**Ready to test!** Start the dev server (`npm run dev`) and follow the test cases above. 🎉
