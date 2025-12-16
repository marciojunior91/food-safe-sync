# Testing Guide: Merge Products Admin Access

## Quick Test Steps

### ✅ Test 1: Admin User Can Access
**User Role**: `admin`

1. Navigate to `/labeling`
2. **Expected**: "Manage Duplicates" button visible in header (next to "Print Queue")
3. Click "Manage Duplicates" button
4. **Expected**: 
   - Page switches to admin view
   - Title: "Product Duplicate Management"
   - MergeProductsAdmin component loads
   - Shows duplicate statistics and merge interface
5. Click "Back to Overview"
6. **Expected**: Returns to main labeling page

**✅ PASS CRITERIA**:
- Button visible
- Admin view accessible
- Component loads without errors
- Can navigate back

---

### ✅ Test 2: Non-Admin User Cannot Access
**User Role**: `staff`, `leader_chef`, or `manager`

1. Navigate to `/labeling`
2. **Expected**: "Manage Duplicates" button is **HIDDEN** (not visible at all)
3. Try to manually access by changing view state (if possible)
4. **Expected**: Access denied screen appears with:
   - Alert icon
   - "Access Denied" message
   - "You need administrator privileges..." text
   - "Back to Overview" button

**✅ PASS CRITERIA**:
- Button completely hidden
- Cannot access admin features
- Clear error message if attempting access

---

### ✅ Test 3: Organization ID Loading
**User Role**: `admin`

1. Navigate to `/labeling`
2. Click "Manage Duplicates"
3. **Expected** (briefly): 
   - Loading spinner appears
   - Message: "Loading organization information..."
4. **Expected** (after load):
   - MergeProductsAdmin component shows
   - Displays duplicate products from user's organization only

**✅ PASS CRITERIA**:
- No blank screen during loading
- Organization data loads correctly
- Only shows products from correct organization

---

### ✅ Test 4: Merge Functionality
**User Role**: `admin`

1. Click "Manage Duplicates"
2. If duplicates exist:
   - View duplicate pairs with similarity scores
   - Click "Merge These Products" on a pair
   - Confirm merge in dialog
3. **Expected**:
   - Success message: "Products merged successfully"
   - Labels migrated count shown
   - Allergens migrated count shown
   - Duplicate count decreases
4. Go back to LabelForm
5. **Expected**:
   - Merged product no longer shows duplicate warning
   - Target product appears in product list

**✅ PASS CRITERIA**:
- Merge dialog works
- Data migrates correctly
- UI updates after merge
- No data loss

---

### ✅ Test 5: Integration with Duplicate Detection
**User Role**: `admin`

1. In LabelForm, try creating a product with existing name
2. **Expected**: Duplicate warning shows
3. Note the similar products
4. Go to "Manage Duplicates"
5. **Expected**: Same products appear in duplicate list
6. Merge the duplicates
7. Go back to LabelForm
8. Try creating the same product name again
9. **Expected**: No duplicate warning (merged successfully)

**✅ PASS CRITERIA**:
- Duplicate detection and merge admin show consistent data
- Merging resolves duplicate warnings
- System maintains data integrity

---

## Browser Console Checks

### Expected Console Logs (Normal Operation)
```javascript
// On page load
"Fetched categories: [...]"
"Fetched products: X valid products"

// When clicking "Manage Duplicates"
"Fetching organization_id"

// In MergeProductsAdmin
"Duplicate stats fetched: {...}"
"Total products: X, Potential duplicates: Y"
```

### ❌ ERROR INDICATORS (Should NOT Appear)
```javascript
// These indicate problems:
"Error fetching organization_id"
"Error fetching user roles"
"RPC function error"
"Cannot read property 'organizationId' of undefined"
```

---

## Visual Checks

### Admin View Header
```
┌─────────────────────────────────────────────────────────────┐
│ Product Duplicate Management            [Back to Overview]  │
│ Identify and merge duplicate products to maintain data...   │
└─────────────────────────────────────────────────────────────┘
```

### Access Denied Screen (Non-Admin)
```
┌─────────────────────────────────────────────────────────────┐
│ Admin Access Required                   [Back to Overview]  │
└─────────────────────────────────────────────────────────────┘

        ┌─────────────────────────────────────────────┐
        │          ⚠ (Alert Triangle Icon)           │
        │                                             │
        │           Access Denied                     │
        │                                             │
        │   You need administrator privileges to      │
        │   access product duplicate management.      │
        └─────────────────────────────────────────────┘
```

### Button Layout (Admin User)
```
[🔀 Manage Duplicates] [🖨 Print Queue] [⚙ Manage Templates] [+ New Label]
     ↑ NEW BUTTON          ↑ Existing      ↑ Existing        ↑ Existing
```

---

## Database Verification

### Check User Role
```sql
SELECT r.role 
FROM user_roles r
WHERE r.user_id = '<current_user_id>';
```

**Expected for Test 1**: `admin`  
**Expected for Test 2**: `staff`, `leader_chef`, or `manager`

### Check Organization ID
```sql
SELECT organization_id 
FROM profiles 
WHERE user_id = '<current_user_id>';
```

**Expected**: Valid UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)

### Check Duplicate Products
```sql
SELECT * FROM detect_duplicate_products('<organization_id>', 0.3);
```

**Expected**: JSON array of duplicate pairs with similarity scores

---

## Troubleshooting

### Issue: Button Not Showing (Admin User)
**Check**:
1. User has `admin` role in `user_roles` table
2. `useUserRole` hook returns `isAdmin: true`
3. Browser console for role fetch errors

### Issue: "Loading organization information..." Never Completes
**Check**:
1. User has `organization_id` in `profiles` table
2. No console errors during fetch
3. Network tab shows successful response

### Issue: "Access Denied" for Admin
**Check**:
1. Role check happens twice (button + view)
2. Verify both checks pass
3. Check for timing issues (role loading vs. view rendering)

### Issue: MergeProductsAdmin Doesn't Load
**Check**:
1. Component exists at `src/components/admin/MergeProductsAdmin.tsx`
2. Import path is correct
3. `organizationId` prop is being passed
4. No TypeScript/console errors

---

## Success Criteria Summary

✅ **All Tests Pass**:
- Admin access works seamlessly
- Non-admin access properly blocked
- Organization ID loads correctly
- Merge functionality works
- Integration with duplicate detection consistent
- No console errors
- Clean UI/UX

✅ **Ready for Production** when all criteria met.
