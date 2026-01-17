# Fix Lupin Allergen Emoji

**Issue**: Lupin allergen shows `[]` instead of emoji  
**Date**: December 16, 2025  
**Status**: ✅ Fixed

## Problem

The lupin allergen was using the `🫘` (beans) emoji, which:
1. Is the same emoji as "Soy" (confusing)
2. May not render properly in all browsers/devices (shows as `[]`)
3. Is a relatively new emoji with limited support

## Solution

Updated lupin emoji to `🌿` (herb/plant):
- More appropriate representation (lupin is a legume plant)
- Better cross-platform support
- Universally renders correctly
- Distinct from other allergen emojis

## Migration

**File**: `supabase/migrations/20251216130000_fix_lupin_emoji.sql`

```sql
UPDATE public.allergens 
SET icon = '🌿'
WHERE name = 'Lupin';
```

## Apply the Fix

### Option 1: Supabase Dashboard
1. Go to SQL Editor
2. Paste the migration SQL
3. Click "Run"

### Option 2: Direct Update
```sql
UPDATE public.allergens SET icon = '🌿' WHERE name = 'Lupin';
```

## Verification

After applying:
```sql
SELECT name, icon FROM allergens WHERE name = 'Lupin';
```

**Expected**: 
```
name  | icon
------+------
Lupin | 🌿
```

## Alternative Emoji Options

If `🌿` doesn't work for your needs, consider:
- `🌱` - Seedling (but already used for Sesame)
- `💊` - Pill (represents supplement use)
- `🥜` - But this is peanuts (too confusing)
- `🫛` - Pea pod (newer emoji, may have support issues)

## Testing

1. Open your app
2. View allergen information where lupin is displayed
3. **Expected**: See 🌿 emoji instead of `[]`
4. Check across different browsers/devices

---

**Status**: ✅ Ready to deploy  
**Risk**: Zero (simple UPDATE statement)  
**Impact**: Visual only (no data structure changes)
