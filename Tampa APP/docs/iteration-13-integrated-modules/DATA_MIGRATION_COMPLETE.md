# Data Migration Complete - Organization Structure

## 📦 Migration Created: `20241228000000_update_existing_data_organization.sql`

### What This Migration Does:

#### 1. **Updates All Existing Data** ✅
Updates all records in these tables to reference the default organization:
- `label_categories` - All food categories
- `label_subcategories` - All subcategories (Fish, Bakery, etc.)
- `products` - All products in inventory
- `recipes` - All recipes
- `measuring_units` - All units (kg, L, etc.)
- `allergens` - If column exists
- `print_queue` - If column exists
- `label_drafts` - If column exists

#### 2. **Adds Foreign Key Constraints** 🔗
Creates proper relationships:
```
label_categories.organization_id → organizations.id (CASCADE)
label_subcategories.organization_id → organizations.id (CASCADE)
products.organization_id → organizations.id (CASCADE)
recipes.organization_id → organizations.id (CASCADE)
measuring_units.organization_id → organizations.id (CASCADE)
```

#### 3. **Sets Default Values** 🎯
For all tables, sets default `organization_id` to the default organization:
```sql
ALTER TABLE [table_name]
ALTER COLUMN organization_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
```

#### 4. **Updates RLS Policies** 🔒
All tables now have organization-based filtering:
- Users can only view data from THEIR organization
- Admins can only manage data in THEIR organization
- Automatic data isolation

#### 5. **Creates Indexes** ⚡
Performance indexes on all `organization_id` columns

## 🚀 Migration Order (Complete List)

Run these migrations in this exact order:

1. ✅ **`20241227000000_iteration_13_foundation.sql`**
   - Creates organizations table
   - Creates 8 new tables for Iteration 13
   - Seeds default organization
   - Updates profiles table

2. ✅ **`20241227130000_fix_profiles_relationships.sql`**
   - Adds FK constraints for profiles
   - Links departments to organizations
   - Creates user context view and function
   - Seeds default department

3. 🆕 **`20241228000000_update_existing_data_organization.sql`**
   - Updates ALL existing data with organization_id
   - Adds FK constraints for all data tables
   - Updates RLS policies
   - Sets default values

4. 🧹 **`20241227120000_cleanup_unused_tables.sql`** *(Optional)*
   - Removes 15 unused tables
   - Keeps departments and user_roles

## 📊 What Gets Updated

### Before Migration:
```
products: 100 records
├─ organization_id: NULL (50 records)
├─ organization_id: random UUID (50 records)

label_categories: 20 records  
├─ organization_id: NULL (all)

recipes: 30 records
├─ organization_id: various UUIDs
```

### After Migration:
```
products: 100 records
└─ organization_id: 00000000-0000-0000-0000-000000000001 (ALL)

label_categories: 20 records
└─ organization_id: 00000000-0000-0000-0000-000000000001 (ALL)

recipes: 30 records
└─ organization_id: 00000000-0000-0000-0000-000000000001 (ALL)
```

## ✅ Verification

After running the migration, you can verify with:

```sql
-- Check all tables have organization_id
SELECT 'label_categories' as table_name, 
       COUNT(*) as total, 
       COUNT(organization_id) as with_org_id
FROM label_categories
UNION ALL
SELECT 'products', COUNT(*), COUNT(organization_id) FROM products
UNION ALL
SELECT 'recipes', COUNT(*), COUNT(organization_id) FROM recipes;

-- Expected result: with_org_id should equal total for all tables
```

## 🎯 Impact on Existing Code

### Components that fetch data will automatically work:
- ✅ Labeling module - Already uses `organizationId`
- ✅ Products list - Will be filtered by organization
- ✅ Recipes list - Will be filtered by organization
- ✅ Categories/Subcategories - Will be filtered by organization

### No code changes needed because:
1. RLS policies handle filtering automatically
2. Existing queries continue to work
3. Data is properly scoped to organization

## 🔧 Testing After Migration

1. **Login to the app**
2. **Check products list** - Should show all existing products
3. **Check recipes** - Should show all existing recipes
4. **Check categories** - Should show all categories
5. **Try creating new items** - Should automatically use default organization

## 🎉 Benefits

- ✅ **Data Integrity**: Foreign keys prevent orphaned data
- ✅ **Automatic Filtering**: RLS handles organization scoping
- ✅ **Future Ready**: Can add new organizations easily
- ✅ **No Breaking Changes**: Existing code continues to work
- ✅ **Clean Data**: All records properly associated

## 📝 Summary

This migration ensures that ALL your existing data (products, categories, recipes, etc.) is properly associated with your default organization ("Demo Local Restaurant"). This is essential for:

1. Multi-tenant support (future)
2. Data integrity with foreign keys
3. Proper RLS policy enforcement
4. Clean database architecture

Run this migration after the previous two, and your entire system will have proper organization structure! 🚀
