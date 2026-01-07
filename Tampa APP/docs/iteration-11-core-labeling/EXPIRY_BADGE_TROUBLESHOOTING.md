# Expiry Badge Not Showing - Troubleshooting & Fix

## Date
December 28, 2024

## Issue Reported
Expiry badges are not showing in the list/grid views, but allergen badges are working properly.

## Root Cause Analysis

### Potential Issues Identified

1. **Conditional Rendering Too Strict**
   - Badge was conditioned on `product.latestLabel` only
   - Should also check if `expiryStatus` was successfully calculated
   - If `getExpiryStatus()` returns null, badge won't render

2. **Style Property Issues**
   - Using template literal `${statusColor}20` without checking if statusColor exists
   - Could cause rendering issues if statusColor is null/undefined
   - Browser might fail to render badge with invalid CSS

3. **Data Fetching Timing**
   - Products might load before `latestLabel` data is fetched
   - Need to verify Promise.all() is completing successfully

## Fixes Applied

### 1. Added expiryStatus Check to Condition

**Before:**
```tsx
{product.latestLabel && (
  <Badge>...</Badge>
)}
```

**After:**
```tsx
{product.latestLabel && expiryStatus && (
  <Badge>...</Badge>
)}
```

**Reasoning**: Ensures badge only renders when both data exists AND status calculation succeeds.

### 2. Added Fallback Values for Styles

**Before:**
```tsx
style={{ 
  backgroundColor: `${statusColor}20`, 
  color: statusColor || undefined,
  borderColor: statusColor || undefined
}}
```

**After:**
```tsx
style={{ 
  backgroundColor: statusColor ? `${statusColor}20` : 'rgba(0,0,0,0.1)', 
  color: statusColor || '#000',
  borderColor: statusColor || 'transparent'
}}
```

**Reasoning**: Prevents invalid CSS that could break rendering. Provides visible fallback even if color calculation fails.

### 3. Added Debug Logging

**Added to List View:**
```tsx
if (product.latestLabel) {
  console.log('Product with label:', product.name, 'Status:', expiryStatus, 'Color:', statusColor);
}
```

**Purpose**: Helps identify if:
- Products have `latestLabel` data
- `expiryStatus` is being calculated correctly
- `statusColor` is being set properly

## Files Updated

1. **src/components/labels/QuickPrintGrid.tsx**
   - Grid view expiry badge condition and styles
   - List view expiry badge condition and styles
   - Added debug logging

2. **src/components/labels/QuickPrintCategoryView.tsx**
   - Category view expiry badge condition and styles

## Testing Steps

### 1. Check Console Logs
Open browser console and switch to list view. You should see:
```
Product with label: [Product Name] Status: Safe/Expiring Soon/Expired Color: #[color]
```

If you see logs:
- ✅ `latestLabel` data is being fetched
- ✅ `expiryStatus` is being calculated
- ✅ `statusColor` is being determined

If you DON'T see logs:
- ❌ Products don't have `latestLabel` data
- ❌ Need to check `fetchProducts()` or database

### 2. Verify Data Structure
In console, inspect a product object:
```javascript
console.log(filteredProducts[0])
```

Expected structure:
```javascript
{
  id: "...",
  name: "Product Name",
  allergens: [...],
  latestLabel: {
    id: "...",
    expiry_date: "2024-12-30",
    condition: "Fresh"
  }
}
```

If `latestLabel` is missing or null, the issue is in data fetching.

### 3. Test Badge Rendering
Create a test product with a label:
1. Go to Labeling page
2. Create and print a label for any product
3. Switch to Quick Print → By Products → List View
4. Verify badge appears with color-coded status

### 4. Test All Status Types
Print labels with different expiry dates to test all statuses:
- **Safe** (future date): Green badge
- **Expiring Soon** (2-3 days): Orange badge  
- **Expired** (past date): Red badge

## Debugging Checklist

If badges still don't show:

- [ ] Check browser console for errors
- [ ] Check console logs for product data
- [ ] Verify `printed_labels` table has data
- [ ] Verify RLS policies allow reading `printed_labels`
- [ ] Check if `getExpiryStatus()` function exists and works
- [ ] Check if `getStatusColor()` function exists and works
- [ ] Inspect element in browser DevTools to see if badge HTML exists but is hidden
- [ ] Check if there are any CSS conflicts hiding the badge

## Common Issues & Solutions

### Issue: No Console Logs Appear
**Solution**: Products don't have `latestLabel` data
- Check `fetchProducts()` in Labeling.tsx
- Verify Promise.all() is completing
- Check database for printed_labels records

### Issue: Logs Show "Status: null"
**Solution**: `getExpiryStatus()` is failing
- Check if expiry_date format is correct
- Verify getExpiryStatus() function logic
- Check import statement

### Issue: Logs Show "Color: undefined"
**Solution**: `getStatusColor()` is failing
- Check getStatusColor() function
- Verify it handles all status values
- Check import statement

### Issue: Badge HTML Exists but Not Visible
**Solution**: CSS or z-index issue
- Check if badge has proper z-index
- Verify no parent overflow:hidden
- Check badge positioning
- Inspect computed styles

### Issue: Works in Grid but Not List
**Solution**: Different rendering logic
- Compare grid vs list badge code
- Ensure both use same conditions
- Verify filteredProducts has same data

## Verification Query

To check if products have labels in database:
```sql
SELECT 
  p.name AS product_name,
  pl.expiry_date,
  pl.created_at,
  pl.condition
FROM products p
LEFT JOIN printed_labels pl ON pl.product_id = p.id
ORDER BY pl.created_at DESC
LIMIT 10;
```

## Success Criteria

- ✅ Console logs show product data with expiry status
- ✅ Expiry badges visible in all views (grid, list, categories)
- ✅ Badges show correct colors (green/orange/red)
- ✅ Badges show correct status text (Safe/Expiring Soon/Expired)
- ✅ Products without labels don't show expiry badges
- ✅ No console errors related to badge rendering

## Next Steps If Issue Persists

1. **Simplify the condition**: Test with just `{product.latestLabel && <Badge>TEST</Badge>}` to verify basic rendering
2. **Hard-code values**: Test with `<Badge style={{ backgroundColor: 'red' }}>TEST</Badge>` to verify styling
3. **Check React DevTools**: Inspect component props to see if latestLabel exists
4. **Add more logging**: Log every step of the rendering logic
5. **Test in isolation**: Create a simple test component with mock data
