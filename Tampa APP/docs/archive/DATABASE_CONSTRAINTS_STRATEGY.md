# 🔒 Database Constraints Strategy - Multi-Tenancy & Data Integrity

## 📋 Overview

This document explains the UNIQUE constraint strategy for the Tampa APP labeling system, ensuring data integrity while supporting multi-tenancy (multiple organizations/restaurants).

---

## 🎯 Goals

1. **Prevent Duplicates**: No duplicate categories/products within same organization
2. **Multi-Tenancy Support**: Different organizations can have same product names
3. **Global Entities**: System-wide entities (NULL org_id) remain unique
4. **Better UX**: Enable `ON CONFLICT` clauses for seamless create-or-use flows

---

## 🏗️ Architecture

### **Multi-Tenancy Model**

```
Organization A (org_id: aaaa-...)
├── Category: "Meat & Poultry" ✅
├── Product: "Chicken Breast" ✅
└── Product: "Salmon Fillet" ✅

Organization B (org_id: bbbb-...)
├── Category: "Meat & Poultry" ✅ (allowed, different org)
├── Product: "Chicken Breast" ✅ (allowed, different org)
└── Product: "Chicken Breast" ❌ (DUPLICATE, same org - BLOCKED!)

Global (org_id: NULL)
├── Category: "Prepared Foods" ✅
└── Product: "Tomato Sauce" ✅
```

---

## 🔑 UNIQUE Constraints Applied

### **1. Label Categories**

```sql
CREATE UNIQUE INDEX idx_label_categories_unique_name_per_org 
ON label_categories (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));
```

**Ensures**:
- ✅ "Meat & Poultry" unique within Organization A
- ✅ "Meat & Poultry" can exist in Organization B (different org_id)
- ✅ Global categories (NULL) are unique system-wide

**Prevents**:
- ❌ Duplicate "Meat & Poultry" in same organization
- ❌ Multiple global "Prepared Foods" categories

---

### **2. Products**

```sql
CREATE UNIQUE INDEX idx_products_unique_name_per_org 
ON products (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));
```

**Ensures**:
- ✅ "Chicken Breast" unique within Organization A
- ✅ "Chicken Breast" can exist in Organization B
- ✅ Global products (NULL) are unique system-wide

**Prevents**:
- ❌ Duplicate "Chicken Breast" in same restaurant
- ❌ Multiple global "Tomato Sauce" products

---

### **3. Measuring Units**

```sql
CREATE UNIQUE INDEX idx_measuring_units_unique_abbrev_per_org 
ON measuring_units (abbreviation, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid));
```

**Ensures**:
- ✅ Only one "kg" per organization
- ✅ Consistency in unit abbreviations
- ✅ Global units (NULL) are unique system-wide

**Prevents**:
- ❌ Multiple "kg" definitions in same org
- ❌ Confusion with duplicate unit abbreviations

---

## 💡 Why `COALESCE(organization_id, '00000000-...')`?

### **Problem**: NULL values in UNIQUE indexes

PostgreSQL treats each NULL as distinct, so:
```sql
-- Without COALESCE:
('Meat & Poultry', NULL)  ✅ Allowed
('Meat & Poultry', NULL)  ✅ Allowed (duplicate!)
('Meat & Poultry', NULL)  ✅ Allowed (duplicate!)
```

### **Solution**: Replace NULL with a dummy UUID

```sql
-- With COALESCE:
('Meat & Poultry', '00000000-0000-0000-0000-000000000000')  ✅ Allowed
('Meat & Poultry', '00000000-0000-0000-0000-000000000000')  ❌ DUPLICATE (blocked!)
```

This ensures global entities (NULL org_id) are also unique.

---

## 🛠️ Application Code Changes

### **Before (Without Constraints)**

```typescript
// ❌ Problem: Creates duplicates silently
const createCategory = async (name: string) => {
  const { data, error } = await supabase
    .from('label_categories')
    .insert({ name, organization_id: orgId });
  
  // Could create "Meat & Poultry" 10 times!
};
```

### **After (With Constraints)**

```typescript
// ✅ Solution: Handle conflicts gracefully
const createOrGetCategory = async (name: string) => {
  // Try to insert, if duplicate exists, just fetch it
  const { data, error } = await supabase
    .from('label_categories')
    .insert({ name, organization_id: orgId })
    .select()
    .single();
  
  if (error?.code === '23505') { // Unique violation
    // Category exists, fetch it
    const { data: existing } = await supabase
      .from('label_categories')
      .select()
      .eq('name', name)
      .eq('organization_id', orgId)
      .single();
    
    return existing;
  }
  
  return data;
};
```

### **Even Better: Use `ON CONFLICT` in SQL**

```sql
-- Insert or return existing (PostgreSQL feature)
INSERT INTO label_categories (name, organization_id)
VALUES ('Meat & Poultry', 'org-uuid')
ON CONFLICT (name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid))
DO NOTHING
RETURNING *;
```

Or via Supabase RPC:

```typescript
const { data } = await supabase.rpc('create_or_get_category', {
  p_name: 'Meat & Poultry',
  p_org_id: orgId
});
```

---

## 🧪 Testing the Constraints

### **Test 1: Prevent Duplicate Categories**

```sql
-- Should succeed
INSERT INTO label_categories (name, organization_id)
VALUES ('Test Category', 'aaaa-1111');

-- Should fail (duplicate)
INSERT INTO label_categories (name, organization_id)
VALUES ('Test Category', 'aaaa-1111');
-- ERROR: duplicate key value violates unique constraint
```

### **Test 2: Allow Same Name in Different Orgs**

```sql
-- Should succeed (Org A)
INSERT INTO label_categories (name, organization_id)
VALUES ('Seafood', 'aaaa-1111');

-- Should succeed (Org B - different org)
INSERT INTO label_categories (name, organization_id)
VALUES ('Seafood', 'bbbb-2222');
```

### **Test 3: Global Entities are Unique**

```sql
-- Should succeed
INSERT INTO label_categories (name, organization_id)
VALUES ('Global Category', NULL);

-- Should fail (duplicate global)
INSERT INTO label_categories (name, organization_id)
VALUES ('Global Category', NULL);
-- ERROR: duplicate key value violates unique constraint
```

---

## 📊 Impact on Phase 2 Features

### **Dynamic Category Creation (Step 4.2)**

```typescript
// User types "Seafood" in search box
// System checks if exists, if not:

const handleCreateCategory = async (name: string) => {
  // Show confirmation dialog
  const confirmed = await showConfirmDialog({
    title: "Create New Category?",
    description: `Create "${name}" category?`,
  });

  if (!confirmed) return;

  // Try to create with conflict handling
  const { data, error } = await supabase
    .from('label_categories')
    .insert({ 
      name, 
      organization_id: currentUser.organization_id 
    })
    .select()
    .single();

  if (error?.code === '23505') {
    // Category already exists (maybe created by another user just now)
    toast.info(`Category "${name}" already exists!`);
    
    // Fetch and return existing
    const { data: existing } = await supabase
      .from('label_categories')
      .select()
      .eq('name', name)
      .eq('organization_id', currentUser.organization_id)
      .single();
    
    return existing;
  }

  if (error) {
    toast.error("Failed to create category");
    return null;
  }

  toast.success(`Category "${name}" created!`);
  return data;
};
```

### **Dynamic Product Creation (Step 4.3)**

Same pattern applies for products:

```typescript
const handleCreateProduct = async (name: string, categoryId: string) => {
  const confirmed = await showConfirmDialog({
    title: "Create New Product?",
    description: `Create "${name}" in this category?`,
  });

  if (!confirmed) return;

  const { data, error } = await supabase
    .from('products')
    .insert({ 
      name, 
      category_id: categoryId,
      organization_id: currentUser.organization_id 
    })
    .select()
    .single();

  if (error?.code === '23505') {
    toast.info(`Product "${name}" already exists!`);
    // Fetch existing...
  }

  // Handle success...
};
```

---

## 🚀 Migration Order

**Apply in this order:**

1. ✅ **20251203120000_add_unique_constraints.sql** (FIRST - creates indexes)
2. ✅ **20251203000000_insert_test_products.sql** (SECOND - uses ON CONFLICT)

**Why this order?**
- Test products script uses `ON CONFLICT` which requires the unique constraints to exist
- If applied in reverse order, test products will fail

---

## 📈 Benefits

### **Data Integrity**
- ✅ No duplicate products/categories per organization
- ✅ Cleaner database, easier to maintain
- ✅ Prevents user confusion ("Why do I have 5 'Chicken Breast' entries?")

### **Performance**
- ✅ UNIQUE indexes speed up lookups
- ✅ Faster searches when creating labels
- ✅ Efficient `ON CONFLICT` queries

### **User Experience**
- ✅ "Create or use existing" flows work seamlessly
- ✅ No need for complex deduplication logic in frontend
- ✅ Database enforces rules automatically

### **Multi-Tenancy**
- ✅ Perfect isolation between organizations
- ✅ Each restaurant has their own product catalog
- ✅ Global products available to all

---

## ⚠️ Important Notes

1. **Existing Data**: If you have duplicates before applying migration, fix them first:

```sql
-- Find duplicates
SELECT name, organization_id, COUNT(*)
FROM label_categories
GROUP BY name, organization_id
HAVING COUNT(*) > 1;

-- Delete duplicates (keep oldest)
DELETE FROM label_categories
WHERE id NOT IN (
  SELECT MIN(id)
  FROM label_categories
  GROUP BY name, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
```

2. **Case Sensitivity**: PostgreSQL is case-sensitive by default
   - "chicken breast" ≠ "Chicken Breast" ≠ "CHICKEN BREAST"
   - Consider adding lowercase index if needed:
   
```sql
CREATE UNIQUE INDEX idx_products_unique_name_case_insensitive
ON products (LOWER(name), COALESCE(organization_id, '00000000-...'::uuid));
```

3. **Name Trimming**: Ensure names are trimmed before insert
   - "Chicken Breast" ≠ "Chicken Breast " (trailing space)
   - Handle in application code:

```typescript
const cleanName = name.trim();
```

---

## ✅ Success Criteria

After applying migrations:
- [ ] Can create category "Test" in Org A
- [ ] Cannot create duplicate "Test" in Org A (constraint violation)
- [ ] Can create category "Test" in Org B (different org)
- [ ] Global categories remain unique
- [ ] Test products script runs without errors
- [ ] ON CONFLICT clauses work as expected

---

**Migration Files:**
- `20251203120000_add_unique_constraints.sql`
- `20251203000000_insert_test_products.sql` (updated)

**Estimated Impact**: High (database integrity)
**Breaking Changes**: None (additive only)
**Rollback Plan**: Drop indexes if needed
