# Organization & Department System - Quick Reference

## 🏗️ Database Structure

```
organizations (restaurants)
    ↓ (has many)
departments (locations: Main Kitchen, Pastry, Coffee Bar, etc.)
    ↓ (has many)  
profiles (users)
```

## 📦 What Was Created

### Database Migrations
1. **`20241227000000_iteration_13_foundation.sql`** ✅
   - Creates `organizations` table
   - Creates 8 new tables for Iteration 13
   - Seeds default organization

2. **`20241227130000_fix_profiles_relationships.sql`** 🆕
   - Adds FK: `departments.organization_id` → `organizations.id`
   - Adds FK: `profiles.organization_id` → `organizations.id`
   - Adds FK: `profiles.location_id` → `departments.id`
   - Creates `user_context` view
   - Creates `get_current_user_context()` function
   - Seeds default department

3. **`20241227120000_cleanup_unused_tables.sql`** 🧹
   - Removes 15 unused tables
   - **KEEPS**: `departments`, `user_roles` (as you requested)

### TypeScript Files
1. **`src/types/organization.ts`** 🆕
   - `Organization` interface
   - `Department` interface  
   - `UserContext` interface
   - Helper functions

2. **`src/hooks/useUserContext.ts`** 🆕
   - `useUserContext()` - Full context
   - `useOrganizationId()` - Just org ID
   - `useDepartmentId()` - Just dept ID
   - `useDepartments()` - List all departments

### Documentation
1. **`docs/iteration-13-integrated-modules/ORGANIZATION_SYSTEM_EXPLAINED.md`** 📚
   - Complete explanation
   - Usage examples
   - Migration guide

## 🎯 Quick Usage

### In any component:
```typescript
import { useUserContext } from '@/hooks/useUserContext';

function MyComponent() {
  const { context, organization, department } = useUserContext();
  
  return (
    <div>
      <h1>{organization?.name}</h1>
      <p>Location: {department?.name}</p>
      <p>Role: {context?.user_role}</p>
    </div>
  );
}
```

### Filter by organization:
```typescript
const { organizationId } = useOrganizationId();

const { data } = await supabase
  .from('routine_tasks')
  .select('*')
  .eq('organization_id', organizationId);
```

## 🔄 Migration Order

Run these in Supabase SQL Editor (in order):
1. ✅ `20241227000000_iteration_13_foundation.sql`
2. 🆕 `20241227130000_fix_profiles_relationships.sql`
3. 🧹 `20241227120000_cleanup_unused_tables.sql` (optional)

## 📊 Default Data Created

- **Organization**: "Demo Local Restaurant" (`00000000-0000-0000-0000-000000000001`)
- **Department**: "Main Kitchen" (`00000000-0000-0000-0001-000000000001`)
- All existing users assigned to both

## 🎨 Adding More Locations

```sql
INSERT INTO departments (name, description, organization_id) VALUES
  ('Pastry Station', 'Bakery area', '00000000-0000-0000-0000-000000000001'),
  ('Coffee Bar', 'Barista station', '00000000-0000-0000-0000-000000000001');
```

## ✨ Benefits

- ✅ **Data Integrity**: Foreign keys prevent orphaned data
- ✅ **Multi-Location**: Support multiple departments/locations
- ✅ **Easy Filtering**: RLS automatically filters by organization
- ✅ **Type Safe**: Full TypeScript support
- ✅ **React Hooks**: Easy-to-use hooks for common queries
- ✅ **Future Ready**: Multi-tenant architecture for scaling

## 🔒 Security (RLS)

All queries automatically filtered by your organization:
- You can only see data from YOUR restaurant
- You can only see tasks assigned to YOUR organization
- You can only see users in YOUR organization

This happens automatically in the database layer! 🎉

## 📝 Next Steps

After running migrations:
1. Test login and check `useUserContext()` returns correct data
2. Update existing components to use `useOrganizationId()` where needed
3. Add department selector to user profiles
4. Create admin panel to manage departments

---

**Questions?** Check `ORGANIZATION_SYSTEM_EXPLAINED.md` for detailed explanations!
