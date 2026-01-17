# Fix Product Subcategory Reference

## Problem
The `products.subcategory_id` field is currently referencing the wrong table:
- **Current (Wrong)**: References `product_subcategories` 
- **Correct**: Should reference `label_subcategories`

## Solution
Run this SQL in Supabase SQL Editor to fix the foreign key constraint.

## SQL Script

```sql
-- Step 1: Drop the old foreign key constraint
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_subcategory_id_fkey;

-- Step 2: Add new foreign key constraint pointing to label_subcategories
ALTER TABLE products 
ADD CONSTRAINT products_subcategory_id_fkey 
FOREIGN KEY (subcategory_id) 
REFERENCES label_subcategories(id) 
ON DELETE SET NULL;

-- Step 3: Verify the constraint
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'products'
  AND kcu.column_name = 'subcategory_id';
```

## Expected Output

After running the verification query, you should see:
```
constraint_name              | table_name | column_name    | foreign_table_name   | foreign_column_name
-----------------------------|------------|----------------|---------------------|--------------------
products_subcategory_id_fkey | products   | subcategory_id | label_subcategories | id
```

## After Fixing

Once this is done:
1. Products will correctly reference `label_subcategories`
2. The Quick Print navigation will work properly
3. You can assign products to the new subcategories (Fish and Seafood, Bakery, etc.)

## How to Run

1. Open: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn
2. Go to **SQL Editor** → **New Query**
3. Copy and paste the SQL script above
4. Click **RUN**
5. Check the verification output

## Next Steps

After fixing the foreign key:
1. The app should now correctly fetch subcategories from `label_subcategories`
2. You can test by assigning products to subcategories
3. The hierarchical navigation should work: Categories → Subcategories → Products

---

**Note**: This doesn't delete or modify any existing data, it only changes which table the foreign key points to. Any products with existing `subcategory_id` values referencing `product_subcategories` will become NULL (which is fine, since we're using the new structure now).
