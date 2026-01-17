# URGENT FIX: Missing `allergens` Column in `printed_labels` Table

## 🔴 Error

```json
{
    "code": "PGRST204",
    "message": "Could not find the 'allergens' column of 'printed_labels' in the schema cache"
}
```

## 🎯 Root Cause

The `allergens` column is missing from the `printed_labels` table in your Supabase database. This column should have been added by migration `20251209140200_create_allergens.sql`, but it appears it wasn't applied.

## ✅ Quick Fix (2 minutes)

### Option 1: Run in Supabase SQL Editor (RECOMMENDED)

1. Go to your Supabase Dashboard → SQL Editor
2. Create a new query
3. Paste this SQL:

```sql
-- Add allergens column to printed_labels
ALTER TABLE public.printed_labels 
  ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_printed_labels_allergens 
  ON public.printed_labels USING GIN(allergens);

-- Verify it worked
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'printed_labels' 
  AND column_name = 'allergens';
```

4. Click **Run**
5. You should see: `allergens | ARRAY` in the results ✅

### Option 2: Run Migration File

If you prefer to run the migration file:

```bash
# In your terminal
supabase migration up
```

Or manually run the file:
- File: `supabase/migrations/20251217000000_add_allergens_to_printed_labels.sql`
- Copy contents to Supabase SQL Editor
- Execute

## 🧪 Test It Works

After applying the fix, try printing a label again. The error should be gone!

### Test in Browser Console:
```javascript
// This should now work without error
fetch('https://imnecvcvhypnlvujajpn.supabase.co/rest/v1/printed_labels', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    product_id: 'test',
    product_name: 'Test Product',
    allergens: ['Peanuts', 'Soy']
  })
})
```

## 📊 What This Column Does

The `allergens` column stores an array of allergen names (TEXT[]) for each printed label. This provides:

1. **Historical tracking** - Know what allergens were on labels when printed
2. **Compliance** - Audit trail for food safety regulations
3. **Search** - Query labels by allergen (using GIN index)

Example data:
```sql
allergens = '{Peanuts,Soy,Dairy}'
allergens = '{}'  -- No allergens
allergens = '{Gluten,Eggs,Tree Nuts}'
```

## 🔍 Why Did This Happen?

The migration file `20251209140200_create_allergens.sql` exists in your codebase, but:
- It may not have been applied to Supabase
- The database might have been reset
- RLS policies might have blocked the ALTER TABLE

## ✅ After Fixing

Once you run the SQL above, the printing functionality will work immediately. No code changes needed - the application code is already correct!

**Print buttons in:**
- ✅ LabelForm (main form)
- ✅ Quick Print (dashboard)
- ✅ Quick Print Grid

All will work once the column is added.

---

**Total Time**: 2 minutes  
**Complexity**: Easy (just run 1 SQL query)  
**Impact**: Print functionality restored ✅
