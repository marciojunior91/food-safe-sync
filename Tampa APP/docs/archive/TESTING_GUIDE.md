# 🧪 Testing & Validation Guide - Label Management System

## ✅ Pre-requisites

1. **Database Setup**
   - [ ] Applied migration: `20251202120000_create_labeling_tables.sql`
   - [ ] Applied migration: `20251202100000_fix_category_rls.sql`
   - [ ] Applied migration: `20251203000000_insert_test_products.sql`

2. **Application Running**
   - [ ] Frontend: `npm run dev` (http://localhost:5173)
   - [ ] Logged in with valid user account

---

## 📋 Test Plan

### **Test 1: Dashboard Stats** ✅
**Objective**: Verify dashboard loads with correct initial state

**Steps**:
1. Navigate to `/labeling` page
2. Check Stats Cards:
   - [ ] "Labels Today" shows 0 (if no labels printed)
   - [ ] "Recent Labels" shows 0 or empty state
   - [ ] "Expiring Soon" shows 0
   - [ ] "Compliance Rate" shows "No Data" or "Active"

**Expected**: All stats load without errors

---

### **Test 2: Create Label - Full Flow** 🏷️
**Objective**: Create and print a label successfully

**Steps**:
1. Click **"New Label"** button
2. In User Selection Dialog:
   - [ ] Select your user
   - [ ] Click "Continue"
3. In Label Form:
   - [ ] Select Category: "Meat & Poultry"
   - [ ] Select Product: "Chicken Breast"
   - [ ] Select Condition: "Refrigerated" (7 days)
   - [ ] Verify Prep Date: Today's date (auto-filled)
   - [ ] Verify Expiry Date: Today + 7 days (auto-calculated)
   - [ ] Verify Prepared By: Your name (auto-filled)
   - [ ] Enter Quantity: "2"
   - [ ] Verify Unit: "kg" (auto-loaded)
   - [ ] Edit Unit: Change to "pcs" (test editable field)
4. Click **"Print Label"**
5. Verify toast notification: "Label Printed Successfully"

**Expected**: Label created and saved to database

---

### **Test 3: Dashboard Stats Update** 📊
**Objective**: Verify stats refresh after printing

**Steps**:
1. After Test 2, check Dashboard Stats:
   - [ ] "Labels Today" incremented to 1
   - [ ] "Recent Labels" shows the label you just printed
   - [ ] Recent label shows:
     - Product name: "Chicken Breast"
     - Category: "Meat & Poultry"
     - Condition: "refrigerated"
     - Prep date and Expiry date
     - Your name
     - Quantity: "2 pcs"

**Expected**: Stats update in real-time

---

### **Test 4: "All Categories" Option** 🗂️
**Objective**: Test category filter bypass

**Steps**:
1. Click **"New Label"** > Select User
2. In Label Form:
   - [ ] Select Category: "All Categories"
   - [ ] Search for Product: "chocolate"
   - [ ] Verify product "Chocolate Cake" appears
   - [ ] Select it
   - [ ] Verify category auto-fills from product

**Expected**: Can search all products regardless of category

---

### **Test 5: Template Management** 📄
**Objective**: Manage label templates

**Steps**:
1. Click **"Manage Templates"** button
2. Verify templates table shows:
   - [ ] "Default" template (with star ⭐)
   - [ ] "Blank" template
   - [ ] "Recipe" template
3. Click **"New Template"**:
   - [ ] Enter Name: "Test Template"
   - [ ] Enter Description: "For testing purposes"
   - [ ] Click "Create Template"
4. Verify new template appears in list
5. Click **Edit** icon on "Test Template":
   - [ ] Change description to "Updated description"
   - [ ] Click "Update Template"
6. Click **Star** icon on "Test Template":
   - [ ] Verify it becomes default (star icon)
   - [ ] Verify "Default" template loses star
7. Click **Delete** icon on "Test Template":
   - [ ] Confirm deletion
   - [ ] Verify template removed from list
8. Click **"Back"** arrow to return to dashboard

**Expected**: All CRUD operations work correctly

---

### **Test 6: Recent Labels Search** 🔍
**Objective**: Test search functionality

**Steps**:
1. Create 3 different labels with different products
2. In "Recent Labels" section:
   - [ ] Enter search term: "chicken"
   - [ ] Verify only "Chicken Breast" label shows
   - [ ] Clear search
   - [ ] Verify all labels show again

**Expected**: Search filters labels correctly

---

### **Test 7: Traffic Light Status** 🚦
**Objective**: Verify expiry status colors

**Steps**:
1. Create a label with Condition: "Fresh" (1 day expiry)
2. Check Recent Labels:
   - [ ] Label should have GREEN status badge ("Safe")
3. Wait until tomorrow (or modify database):
   ```sql
   UPDATE printed_labels 
   SET expiry_date = CURRENT_DATE 
   WHERE id = 'YOUR_LABEL_ID';
   ```
4. Refresh page:
   - [ ] Label should have YELLOW status ("Expiring Soon")
5. Set expiry to yesterday:
   ```sql
   UPDATE printed_labels 
   SET expiry_date = CURRENT_DATE - 1 
   WHERE id = 'YOUR_LABEL_ID';
   ```
6. Refresh page:
   - [ ] Label should have RED status ("Expired")

**Expected**: Colors change based on expiry date

---

### **Test 8: Form Validation** ⚠️
**Objective**: Test required field validation

**Steps**:
1. Click **"New Label"** > Select User
2. Try to print WITHOUT selecting product:
   - [ ] Verify toast error: "Please fill in all required fields"
3. Select product but NOT condition:
   - [ ] Verify toast error again
4. Fill all required fields:
   - [ ] Verify print succeeds

**Expected**: Cannot print without required fields

---

### **Test 9: Multiple Labels Same Product** 📦
**Objective**: Test printing multiple labels

**Steps**:
1. Print 3 labels of "Chicken Breast" with different conditions:
   - Fresh (1 day)
   - Cooked (3 days)
   - Frozen (30 days)
2. Check "Recent Labels":
   - [ ] Verify 3 labels appear
   - [ ] Verify different expiry dates
   - [ ] Verify correct conditions

**Expected**: Multiple labels tracked independently

---

### **Test 10: Navigation Flow** 🧭
**Objective**: Test all navigation paths

**Steps**:
1. From Dashboard → Click "Manage Templates"
   - [ ] Verify template page loads
2. Click **"Back"** arrow
   - [ ] Verify returns to dashboard
3. From Dashboard → Click "New Label"
   - [ ] Verify user selection dialog opens
4. Select user → Click **"Back"** arrow
   - [ ] Verify returns to dashboard
5. Create label → Click "Print Label"
   - [ ] Verify returns to dashboard automatically

**Expected**: All navigation works smoothly

---

## 🐛 Known Issues / Edge Cases

### Edge Case 1: No Products Available
- **Scenario**: Database has no products
- **Expected Behavior**: Show empty state in product selector
- **Test**: Delete all products, try to create label

### Edge Case 2: No User Profile
- **Scenario**: User has no profile entry
- **Expected Behavior**: Use email as fallback for prepared_by_name
- **Test**: Create label with user without profile

### Edge Case 3: Invalid Expiry Calculation
- **Scenario**: Prep date in future
- **Expected Behavior**: Should still calculate correctly
- **Test**: Change prep date to next week

---

## 📊 Success Criteria

### ✅ All Tests Pass
- [ ] 10/10 test cases successful
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All data persists in Supabase

### ✅ Performance
- [ ] Dashboard loads < 2 seconds
- [ ] Label creation < 1 second
- [ ] Search response instant (<100ms)

### ✅ Data Integrity
- [ ] All printed labels in `printed_labels` table
- [ ] All relationships valid (product_id, category_id, user_id)
- [ ] Timestamps accurate

---

## 🔧 Troubleshooting

### Issue: Templates not loading
**Solution**: Check if migration `20251202120000_create_labeling_tables.sql` was applied

### Issue: Products not showing
**Solution**: Run `20251203000000_insert_test_products.sql` migration

### Issue: RLS errors
**Solution**: Check if `20251202100000_fix_category_rls.sql` was applied

### Issue: Stats not updating
**Solution**: Check browser console for Supabase errors, verify RLS policies

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Environment: Dev / Staging / Production

Test 1: ✅ / ❌  Notes: _____________
Test 2: ✅ / ❌  Notes: _____________
Test 3: ✅ / ❌  Notes: _____________
Test 4: ✅ / ❌  Notes: _____________
Test 5: ✅ / ❌  Notes: _____________
Test 6: ✅ / ❌  Notes: _____________
Test 7: ✅ / ❌  Notes: _____________
Test 8: ✅ / ❌  Notes: _____________
Test 9: ✅ / ❌  Notes: _____________
Test 10: ✅ / ❌ Notes: _____________

Overall Status: PASS / FAIL
```

---

## 🚀 Next Steps After Testing

1. ✅ Apply all migrations in Supabase Dashboard
2. ✅ Test in production environment
3. ✅ Train users on the system
4. ✅ Set up Zebra printer connection
5. ✅ Deploy to production (Vercel/Netlify)
