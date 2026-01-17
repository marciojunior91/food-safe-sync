# Iteration 10: Duplicate Product Detection - Testing Guide

## 🧪 Testing Workflow

### Prerequisites
- Migration `20251216000000_duplicate_product_detection.sql` applied
- Database functions tested via `test-duplicate-detection.mjs`
- Development server running (`npm run dev`)

---

## Test 1: Duplicate Warning on Product Creation

### Steps:
1. Navigate to **Labeling** page
2. Click "Create Label" or open LabelForm
3. In the product selector, click **"+ Create New Product"**
4. Start typing a product name similar to an existing one:
   - Try: "Caesar Salad" (should match "Caesar Salad Mix")
   - Try: "Chicken" (should match "Chicken Breast")
   - Try: "Fresh Salmon" (should match "Fresh Salmon Fillet")

### Expected Behavior:
✅ **As you type (after 3+ characters):**
- Warning appears below the product name input
- Shows list of similar products with:
  - Product name
  - Similarity percentage (badge)
  - Category → Subcategory
  - Allergen count (if any)
  - Last printed date (or "Never printed")
  - "Use This" button

✅ **For 85%+ similarity (duplicate):**
- Red destructive alert: "⚠️ Potential Duplicate Product Detected"
- Create Product button becomes disabled
- Button text changes to "Cannot Create - Duplicate Exists"

✅ **For 30-84% similarity (suggestions):**
- Yellow warning alert: "Similar Products Found"
- Create Product button remains enabled
- User can proceed or select existing

---

## Test 2: Select Existing Product

### Steps:
1. In Create Product dialog, type a similar product name
2. Wait for duplicate warning to appear
3. Click **"Use This"** button on one of the suggested products

### Expected Behavior:
✅ Create Product dialog closes
✅ LabelForm is populated with selected product:
- Product name filled
- Category automatically set
- Unit/measuring unit filled (if available)
✅ Toast notification: "Product Selected - Using existing product: [name]"

---

## Test 3: Create Despite Warning (Low Similarity)

### Steps:
1. Type a product name with 30-70% similarity (not a duplicate)
   - Example: "Caesar Wrap" (similar to "Caesar Salad Mix")
2. See the yellow warning with suggestions
3. Ignore the suggestions
4. Select a category
5. Click **"Create Product"**

### Expected Behavior:
✅ Product is created successfully
✅ Warning does not block creation
✅ Toast: "Product Created - [name] has been created successfully"
✅ LabelForm populated with new product

---

## Test 4: Blocked Creation (High Similarity)

### Steps:
1. Type an exact match or very similar name (85%+)
   - Example: "Caesar Salad Mix" (exact match)
   - Example: "caesar salad mix" (case insensitive match)
2. Select a category
3. Try to click **"Create Product"**

### Expected Behavior:
✅ Create Product button is **disabled**
✅ Button shows: "Cannot Create - Duplicate Exists"
✅ Red warning displayed
✅ Cannot proceed with creation
✅ Must either:
- Select an existing product, OR
- Change the name to something unique

---

## Test 5: Admin - View Duplicate Statistics

### Steps:
1. Create a test page or add MergeProductsAdmin component
2. Add to a page (e.g., Settings or Admin):
   ```tsx
   import { MergeProductsAdmin } from "@/components/admin/MergeProductsAdmin";
   
   // In your component:
   <MergeProductsAdmin organizationId="4808e8a5-547b-4601-ab90-a8388ee748fa" />
   ```
3. Navigate to the page

### Expected Behavior:
✅ **Statistics Cards Show:**
- Total Products: 11 (or current count)
- Potential Duplicates: count of products with 70%+ similar names
- Duplicate Pairs: count of unique pairs

✅ **Duplicate Pairs Section:**
- Lists all pairs with 70%+ similarity
- Shows both product names
- Shows similarity percentage badge (color-coded)
- Shows merge buttons (left/right arrows)

---

## Test 6: Merge Duplicate Products

### Setup:
First, create a test duplicate:
1. Using SQL Editor, temporarily disable duplicate check:
   ```sql
   -- Insert a duplicate for testing
   INSERT INTO products (name, organization_id, category_id)
   VALUES ('Caesar Salad Test', '4808e8a5-547b-4601-ab90-a8388ee748fa', 
     (SELECT id FROM label_categories WHERE name = 'Soufle' LIMIT 1));
   ```

### Steps:
1. Open MergeProductsAdmin page
2. Click **Refresh Statistics** to see new duplicate
3. Find the duplicate pair in the list
4. Click one of the **arrow buttons** (choose merge direction):
   - Right arrow (→): Merge Product 1 into Product 2 (delete 1, keep 2)
   - Left arrow (←): Merge Product 2 into Product 1 (delete 2, keep 1)
5. Review the confirmation dialog:
   - Source product (will be deleted)
   - Target product (will be kept)
   - List of what will happen
   - Warning about permanent deletion
6. Click **"Confirm Merge"**

### Expected Behavior:
✅ **Merge Dialog Shows:**
- Clear indication of source and target
- Red badge for source, blue badge for target
- List of actions (labels, allergens, deletion)
- Destructive warning alert

✅ **After Merge:**
- Success toast with migration details:
  - "X labels migrated"
  - "X allergens migrated"
- Dialog closes
- Statistics refresh automatically
- Duplicate pair disappears from list
- Source product deleted from database
- All references updated to target product

✅ **Error Handling:**
- If merge fails, shows error toast
- No partial changes (transaction rollback)
- Both products remain unchanged on error

---

## Test 7: Edge Cases

### Test 7a: Very Short Names
1. Type a 1-2 character product name
2. **Expected:** No duplicate check (need 3+ chars)

### Test 7b: Special Characters
1. Type product name with special chars: "Caesar & Romaine"
2. **Expected:** Duplicate check works, matches similar names

### Test 7c: Case Insensitivity
1. Type "CAESAR SALAD MIX" (all caps)
2. **Expected:** Matches "Caesar Salad Mix" (exact duplicate blocked)

### Test 7d: No Similar Products
1. Type completely unique name: "Zzzz Test Product 12345"
2. **Expected:** No warning displayed, can create freely

---

## Test 8: Performance Testing

### Steps:
1. Type rapidly in product name field
2. **Expected:** 
   - Debounced API calls (waits 500ms after last keystroke)
   - Loading skeleton while fetching
   - No lag or UI freezing

---

## 🐛 Known Issues & Limitations

1. **Organization ID Hardcoded**: Currently uses hardcoded org ID. In production, should come from auth context.

2. **Max 10 Similar Products**: Duplicate detection returns top 10 matches. Very common names might have more.

3. **No Undo for Merge**: Product merge is permanent. Must restore from backup if mistake.

4. **70% Threshold for Stats**: get_duplicate_stats uses 70% threshold. May show false positives.

---

## ✅ Test Checklist

### Basic Functionality:
- [ ] Duplicate warning appears when typing similar name
- [ ] High similarity (85%+) blocks creation
- [ ] Low similarity (30-84%) shows warning but allows creation
- [ ] Loading state shows while checking
- [ ] Error states display properly

### Product Selection:
- [ ] "Use This" button selects existing product
- [ ] Dialog closes after selection
- [ ] LabelForm populated correctly
- [ ] Toast confirmation shows

### Admin Tool:
- [ ] Statistics display correctly
- [ ] Duplicate pairs list shows all pairs
- [ ] Similarity badges color-coded properly
- [ ] Merge dialog shows correct information
- [ ] Merge completes successfully
- [ ] Statistics refresh after merge
- [ ] Error handling works

### Edge Cases:
- [ ] Short names (< 3 chars) don't trigger check
- [ ] Case insensitive matching works
- [ ] Special characters handled
- [ ] Unique names create without warning
- [ ] Debouncing works (rapid typing)

---

## 📊 Test Data

### Existing Products (for reference):
1. Caesar Salad Mix (Soufle)
2. Chicken Breast (Meat)
3. Fresh Salmon Fillet (Fish and Seafood)
4. Tomato Basil Sauce (Sauces)
5. Carrot Sticks (Vegetables)
6. Roast Beef Sandwich (Prepared Foods)
7. French Onion Soup (Hot Foods)
8. Chocolate Cake (Bakery)
9. Greek Salad (Soufle)
10. Mixed Berry Smoothie (Beverages)
11. Grilled Chicken Wrap (Prepared Foods)

### Test Names (Suggestions):
- **High Similarity (85%+)**: "Caesar Salad Mix", "Chicken Breasts", "Fresh Salmon"
- **Medium Similarity (60-84%)**: "Caesar Bowl", "Chicken Thigh", "Salmon Fillet"
- **Low Similarity (30-59%)**: "Caesar Wrap", "Chicken Soup", "Salmon Poke"
- **No Match (< 30%)**: "Quinoa Bowl", "Pork Chops", "Tuna Salad"

---

## 🔄 Cleanup After Testing

If you created test duplicates, clean them up:

```sql
-- Delete test products
DELETE FROM products 
WHERE name LIKE '%Test%' 
AND organization_id = '4808e8a5-547b-4601-ab90-a8388ee748fa';
```

---

## 📝 Test Results Log

**Date:** _______________  
**Tester:** _______________  
**Environment:** _______________

| Test # | Description | Result | Notes |
|--------|-------------|--------|-------|
| 1 | Duplicate warning appears | ☐ Pass ☐ Fail | |
| 2 | Select existing product | ☐ Pass ☐ Fail | |
| 3 | Create despite warning | ☐ Pass ☐ Fail | |
| 4 | Blocked creation (high similarity) | ☐ Pass ☐ Fail | |
| 5 | View duplicate statistics | ☐ Pass ☐ Fail | |
| 6 | Merge duplicate products | ☐ Pass ☐ Fail | |
| 7 | Edge cases | ☐ Pass ☐ Fail | |
| 8 | Performance testing | ☐ Pass ☐ Fail | |

**Overall Status:** ☐ All Passed ☐ Some Failed ☐ Needs Retest

**Additional Comments:**
___________________________________________________________________
___________________________________________________________________
___________________________________________________________________
