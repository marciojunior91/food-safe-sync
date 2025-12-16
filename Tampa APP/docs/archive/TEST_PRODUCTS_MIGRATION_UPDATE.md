# 🔄 Update: Test Products Migration - User Organization

## 📋 Change Summary

**Previous**: Test products were created with `organization_id = NULL` (global entities)

**Now**: Test products are created with **your logged-in user's `organization_id`**

---

## 🎯 Why This Change?

### **Problem with NULL (Global)**:
- ❌ Test products would be visible to ALL organizations
- ❌ Doesn't reflect real-world usage (each restaurant has their own products)
- ❌ Could clutter the global product catalog
- ❌ RLS policies might not work as expected for testing

### **Solution with User's org_id**:
- ✅ Test products belong to YOUR organization only
- ✅ More realistic testing scenario
- ✅ Tests RLS policies correctly
- ✅ Easy to clean up (delete your org's test data)

---

## 🛠️ How It Works

### **1. Dynamic org_id Detection**

The migration now uses a PL/pgSQL block:

```sql
DO $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Get organization_id from current user's profile
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- Use v_org_id for all inserts...
END $$;
```

### **2. Fallback to Global**

If no `organization_id` is found (e.g., running as service role):
```sql
IF v_org_id IS NULL THEN
  RAISE NOTICE 'No organization_id found. Using NULL (global entities).';
END IF;
```

This ensures the script always works, even if:
- User has no profile yet
- Running from Supabase dashboard (service role)
- Testing in development environment

---

## 📊 What Gets Created

### **Categories (5 new)**
```
┌─────────────────────┬──────────────────────────────────────┐
│ Category Name       │ organization_id                       │
├─────────────────────┼──────────────────────────────────────┤
│ Meat & Poultry      │ YOUR_ORG_ID                          │
│ Fish & Seafood      │ YOUR_ORG_ID                          │
│ Vegetables          │ YOUR_ORG_ID                          │
│ Bakery & Desserts   │ YOUR_ORG_ID                          │
│ Dairy               │ YOUR_ORG_ID                          │
└─────────────────────┴──────────────────────────────────────┘
```

### **Products (10 new)**
```
┌──────────────────────┬─────────────────────┬──────────────────┐
│ Product Name         │ Category            │ organization_id  │
├──────────────────────┼─────────────────────┼──────────────────┤
│ Chicken Breast       │ Meat & Poultry      │ YOUR_ORG_ID      │
│ Fresh Salmon Fillet  │ Fish & Seafood      │ YOUR_ORG_ID      │
│ Beef Stew Meat       │ Meat & Poultry      │ YOUR_ORG_ID      │
│ Tomato Sauce         │ Sauces & Condiments │ YOUR_ORG_ID      │
│ Caesar Salad Mix     │ Vegetables          │ YOUR_ORG_ID      │
│ Chocolate Cake       │ Bakery & Desserts   │ YOUR_ORG_ID      │
│ Vanilla Ice Cream    │ Bakery & Desserts   │ YOUR_ORG_ID      │
│ Cooked Rice          │ Prepared Foods      │ YOUR_ORG_ID      │
│ Vegetable Soup       │ Prepared Foods      │ YOUR_ORG_ID      │
│ Mozzarella Cheese    │ Dairy               │ YOUR_ORG_ID      │
└──────────────────────┴─────────────────────┴──────────────────┘
```

---

## 🧪 Testing Scenarios

### **Scenario 1: Run as Logged-In User**

```sql
-- You're logged in to Supabase Dashboard
-- Run the migration
-- Result: Products created with YOUR organization_id
```

**Output**:
```
NOTICE: Using organization_id: 12345678-abcd-...
NOTICE: Test products inserted successfully for organization: 12345678-abcd-...
```

### **Scenario 2: Run as Service Role**

```sql
-- Running via CLI or service account
-- No auth.uid() available
-- Result: Products created as global (NULL)
```

**Output**:
```
NOTICE: No organization_id found for current user. Using NULL (global entities).
NOTICE: Test products inserted successfully for organization: GLOBAL
```

---

## 🔍 Verification Query

After running the migration, the script automatically shows:

```sql
SELECT 
  p.name as product_name,
  lc.name as category,
  p.organization_id,
  CASE 
    WHEN p.organization_id IS NULL THEN 'GLOBAL'
    ELSE 'ORGANIZATION-SPECIFIC'
  END as scope,
  p.created_at
FROM public.products p
LEFT JOIN public.label_categories lc ON p.category_id = lc.id
WHERE p.created_at > NOW() - INTERVAL '1 minute'
ORDER BY p.created_at DESC
LIMIT 10;
```

**Expected Output**:
```
product_name          | category            | organization_id        | scope                  | created_at
----------------------|---------------------|------------------------|------------------------|---------------------------
Mozzarella Cheese     | Dairy               | your-org-id-here       | ORGANIZATION-SPECIFIC  | 2025-12-03 15:30:45.123+00
Vegetable Soup        | Prepared Foods      | your-org-id-here       | ORGANIZATION-SPECIFIC  | 2025-12-03 15:30:45.122+00
Cooked Rice           | Prepared Foods      | your-org-id-here       | ORGANIZATION-SPECIFIC  | 2025-12-03 15:30:45.121+00
...
```

---

## 🎯 Benefits for Testing

### **1. Realistic RLS Testing**
- ✅ Categories query: `WHERE organization_id = your_org_id`
- ✅ Products query: `WHERE organization_id = your_org_id`
- ✅ Tests exactly how production will work

### **2. Easy Cleanup**
```sql
-- Delete all test data for your org
DELETE FROM public.products 
WHERE organization_id = 'your-org-id-here'
AND name IN ('Chicken Breast', 'Fresh Salmon Fillet', ...);

DELETE FROM public.label_categories
WHERE organization_id = 'your-org-id-here'
AND name IN ('Meat & Poultry', 'Fish & Seafood', ...);
```

### **3. Multi-Tenancy Validation**
- ✅ Your test data is isolated from other organizations
- ✅ Other users won't see your test products
- ✅ You won't see other orgs' test data

### **4. Phase 2 Preparation**
- ✅ Dynamic category/product creation will work the same way
- ✅ Constraints will prevent duplicates within your org
- ✅ Quick Print will fetch products from your org only

---

## 🚀 How to Run

### **Option 1: Supabase Dashboard (Recommended)**

1. Login to Supabase Dashboard
2. Go to SQL Editor
3. Paste the migration content
4. Click "Run"
5. Check output for your `organization_id`

### **Option 2: Supabase CLI**

```bash
# Apply migration
supabase db push

# Or run directly
psql $DATABASE_URL -f supabase/migrations/20251203000000_insert_test_products.sql
```

---

## ⚠️ Important Notes

### **1. Must Be Logged In**

To get your `organization_id`, you must:
- Be authenticated in Supabase Dashboard
- Have a record in the `profiles` table
- Have an `organization_id` set in your profile

If not, the script falls back to `NULL` (global).

### **2. Requires Constraints Migration First**

Make sure you applied:
```
20251203120000_add_unique_constraints.sql
```

Otherwise, the `ON CONFLICT` clauses won't work.

### **3. Idempotent Script**

You can run this multiple times:
- `ON CONFLICT ... DO NOTHING` prevents duplicates
- Safe to re-run if something fails

---

## 🔄 Rollback (If Needed)

If you want to delete the test data:

```sql
-- Find your organization_id first
SELECT organization_id 
FROM public.profiles 
WHERE user_id = auth.uid();

-- Delete test products
DELETE FROM public.products
WHERE organization_id = 'YOUR_ORG_ID_HERE'
AND name IN (
  'Chicken Breast', 'Fresh Salmon Fillet', 'Beef Stew Meat',
  'Tomato Sauce', 'Caesar Salad Mix', 'Chocolate Cake',
  'Vanilla Ice Cream', 'Cooked Rice', 'Vegetable Soup', 'Mozzarella Cheese'
);

-- Delete test categories
DELETE FROM public.label_categories
WHERE organization_id = 'YOUR_ORG_ID_HERE'
AND name IN (
  'Meat & Poultry', 'Fish & Seafood', 'Vegetables', 
  'Bakery & Desserts', 'Dairy'
);
```

---

## 📋 Updated Files

- ✅ `20251203000000_insert_test_products.sql` - Updated to use `auth.uid()` org_id
- ✅ This documentation file

---

## ✅ Checklist

Before running:
- [ ] Applied `20251203120000_add_unique_constraints.sql` first
- [ ] Logged in to Supabase Dashboard
- [ ] Have a profile with `organization_id` set

After running:
- [ ] Check NOTICE output for your org_id
- [ ] Verify 10 products created
- [ ] Verify 5 categories created
- [ ] Confirm `scope = 'ORGANIZATION-SPECIFIC'`
- [ ] Test label creation with these products

---

**Ready to proceed with Phase 2!** 🎉
