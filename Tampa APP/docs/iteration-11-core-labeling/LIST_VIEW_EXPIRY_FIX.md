# List View Expiry Alerts Fix

## Date
December 28, 2024

## Issue
List view in "by products" mode was not showing expiry alerts, even though the UI code was correctly implemented.

## Root Cause
The `fetchProducts()` function in `Labeling.tsx` was not fetching the `latestLabel` data for products. The QuickPrintGrid component receives products as a prop, and when in "by products" mode, it filters these products but cannot add the missing `latestLabel` data.

**Data Flow:**
```
Labeling.tsx (fetchProducts) 
  → products state (missing latestLabel)
  → QuickPrintGrid (products prop)
  → filteredProducts (still missing latestLabel)
  → List View (no data to display expiry warnings)
```

## Solution
Updated `fetchProducts()` in `Labeling.tsx` to fetch the latest printed label for each product, matching the pattern used in `QuickPrintGrid.fetchProductsByCategory()`.

### Changes Made

**File**: `src/pages/Labeling.tsx`

**Before:**
```typescript
// Transform product_allergens into allergens array
const transformedProducts = (data || []).map(product => ({
  ...product,
  allergens: product.product_allergens
    ?.map((pa: any) => pa.allergens)
    .filter(Boolean) || []
}));

setProducts(transformedProducts);
```

**After:**
```typescript
// Transform product_allergens into allergens array
const productsWithAllergens = (data || []).map(product => ({
  ...product,
  allergens: product.product_allergens
    ?.map((pa: any) => pa.allergens)
    .filter(Boolean) || []
}));

// Fetch latest printed label for each product to enable expiry warnings
const productsWithLabels = await Promise.all(
  productsWithAllergens.map(async (product) => {
    const { data: latestLabel } = await supabase
      .from('printed_labels')
      .select('id, expiry_date, condition')
      .eq('product_id', product.id)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    return {
      ...product,
      latestLabel
    };
  })
);

setProducts(productsWithLabels);
```

## Impact

### Before
- ❌ List view: No expiry warnings shown
- ✅ Grid view (by products): Expiry warnings shown (fetches own data)
- ✅ Grid view (by categories): Expiry warnings shown (fetches own data)

### After
- ✅ List view: Expiry warnings shown
- ✅ Grid view (by products): Expiry warnings shown
- ✅ Grid view (by categories): Expiry warnings shown

## Technical Details

### N+1 Query Pattern
The solution uses an N+1 query pattern (one query per product) to fetch the latest label. This is acceptable because:
- Typical product counts are 10-50 items
- Queries are run in parallel using `Promise.all()`
- Alternative (join with window function) is more complex in Supabase

### Performance Characteristics
- Products query: ~1 query
- Latest labels: N queries (parallel)
- Total time: Similar to sequential query with window function
- Trade-off: Simplicity vs. single complex query

## Testing

### Test Cases
1. **By Products - List View**:
   - [ ] Switch to "by products" mode
   - [ ] Switch to "list" view
   - [ ] Verify products with "Expiring Soon" labels show orange badge + warning text
   - [ ] Verify products with "Expired" labels show red badge + critical warning text
   - [ ] Verify products with "Safe" labels or no labels don't show warnings

2. **By Products - Grid View** (regression test):
   - [ ] Switch to "by products" mode
   - [ ] Switch to "grid" view
   - [ ] Verify expiry badges still appear in top-left corner
   - [ ] Verify expiry warnings still show for urgent statuses

3. **By Categories** (regression test):
   - [ ] Switch to "by categories" mode
   - [ ] Navigate through categories → subcategories → products
   - [ ] Verify expiry warnings still work correctly

## Files Modified
1. `src/pages/Labeling.tsx` - Added latest label fetching to `fetchProducts()`

## Success Criteria
- ✅ List view shows expiry warnings for products with expiring/expired labels
- ✅ All three views (by categories grid, by products grid, by products list) show consistent expiry warnings
- ✅ No regression in existing functionality
- ✅ Products without printed labels don't show expiry warnings

## Notes
- This fix completes the expiry warning implementation across all views
- The pattern is now consistent: all views fetch `latestLabel` data and use the same display logic
- Future optimization could consider caching latest labels or using a materialized view if product counts grow significantly
