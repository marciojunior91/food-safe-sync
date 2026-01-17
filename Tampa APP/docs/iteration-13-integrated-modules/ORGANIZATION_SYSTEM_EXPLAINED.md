# Organization & Department System Explanation

## 📋 How the System Works

### Current Architecture

```
User Login
    ↓
auth.users (Supabase Auth)
    ↓
profiles table
    ├─→ organization_id → organizations table
    └─→ location_id → departments table
```

### Data Flow on Login

1. **User authenticates** via Supabase Auth (`auth.users`)
2. **Profile lookup** happens automatically via `profiles` table
3. **Context is established:**
   - `profiles.organization_id` → Which restaurant (Demo Local Restaurant)
   - `profiles.location_id` → Which department/location (Main Kitchen, Pastry, etc.)

### Example Structure

```
Organization: Demo Local Restaurant
├── Department: Main Kitchen
│   └── Users: Chef John, Cook Maria
├── Department: Pastry Station
│   └── Users: Pastry Chef Sarah
├── Department: Coffee Bar
│   └── Users: Barista Tom, Barista Lisa
└── Department: Storage Area
    └── Users: Inventory Manager Bob
```

## 🔧 What We Fixed

### Before (Broken State)
- ❌ `organization_id` was just a UUID with no foreign key
- ❌ `location_id` didn't reference `departments` table
- ❌ No data integrity enforcement
- ❌ Could have orphaned references

### After (Fixed State)
- ✅ `profiles.organization_id` → **FK to `organizations.id`**
- ✅ `profiles.location_id` → **FK to `departments.id`**
- ✅ `departments.organization_id` → **FK to `organizations.id`**
- ✅ Cascading deletes configured properly
- ✅ RLS policies enforce proper isolation

## 📁 New Files Created

### 1. Database Migration
**File:** `supabase/migrations/20241227130000_fix_profiles_relationships.sql`

**What it does:**
- Adds foreign key constraints between tables
- Seeds default organization ("Demo Local Restaurant")
- Seeds default department ("Main Kitchen")
- Creates `user_context` view for easy querying
- Creates `get_current_user_context()` database function
- Updates RLS policies to use proper relationships

### 2. TypeScript Types
**File:** `src/types/organization.ts`

**Exports:**
- `Organization` - Restaurant/company information
- `Department` - Location within restaurant
- `UserContext` - Complete user context with org and dept info
- Helper functions for context checks

### 3. React Hooks
**File:** `src/hooks/useUserContext.ts`

**Exports:**
- `useUserContext()` - Get full user context (org + dept)
- `useOrganizationId()` - Get just organization ID
- `useDepartmentId()` - Get just department ID
- `useDepartments()` - Get all departments in user's org

## 🎯 How to Use in Your Code

### Basic Usage - Get User Context

```typescript
import { useUserContext } from '@/hooks/useUserContext';

function MyComponent() {
  const { context, organization, department, loading } = useUserContext();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Organization: {organization?.name}</p>
      <p>Department: {department?.name}</p>
      <p>Your Role: {context?.user_role}</p>
    </div>
  );
}
```

### Filter Data by Organization

```typescript
import { useOrganizationId } from '@/hooks/useUserContext';

function TasksList() {
  const { organizationId } = useOrganizationId();
  
  const { data: tasks } = useQuery({
    queryKey: ['tasks', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('routine_tasks')
        .select('*')
        .eq('organization_id', organizationId);
      return data;
    },
    enabled: !!organizationId,
  });
}
```

### Show Departments Selector

```typescript
import { useDepartments } from '@/hooks/useUserContext';

function DepartmentSelector() {
  const { departments, loading } = useDepartments();

  return (
    <select>
      {departments.map(dept => (
        <option key={dept.id} value={dept.id}>
          {dept.name}
        </option>
      ))}
    </select>
  );
}
```

## 🔒 How RLS (Row Level Security) Works

### Example: Task Templates

```sql
-- Users can only see templates in their organization
CREATE POLICY "Users can view templates in their org"
  ON task_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

**What this means:**
1. When you query `task_templates`, Supabase checks your `auth.uid()`
2. Looks up your `organization_id` in `profiles`
3. Only returns templates where `task_templates.organization_id` matches yours
4. **You automatically only see data from YOUR restaurant**

## 📊 Database Function

You can call the helper function directly:

```typescript
const { data } = await supabase.rpc('get_current_user_context');

console.log(data);
// {
//   user_id: "abc-123",
//   organization_id: "org-456",
//   organization_name: "Demo Local Restaurant",
//   department_id: "dept-789",
//   department_name: "Main Kitchen",
//   user_role: "cook",
//   display_name: "John Doe"
// }
```

## 🚀 Migration Steps

1. ✅ Run foundation migration (`20241227000000_iteration_13_foundation.sql`)
2. ✅ Run relationships fix (`20241227130000_fix_profiles_relationships.sql`)
3. ✅ Optionally run cleanup (`20241227120000_cleanup_unused_tables.sql`)

## 🎨 Adding More Departments

```sql
INSERT INTO departments (name, description, organization_id) VALUES
  ('Pastry Station', 'Bakery and dessert preparation', '00000000-0000-0000-0000-000000000001'),
  ('Coffee Bar', 'Barista station', '00000000-0000-0000-0000-000000000001');
```

## 📝 Summary

**Before:** 
- Organization and location were just UUIDs stored in `profiles`
- No enforcement, no relationships

**After:**
- Proper foreign key relationships
- `organizations` table stores restaurant info
- `departments` table stores locations within restaurant
- `profiles` properly references both with FKs
- RLS policies enforce proper data isolation
- Easy-to-use React hooks for accessing context
- Database function for quick context retrieval

**Result:** 
Multi-location restaurant management with proper data isolation, referential integrity, and easy-to-use APIs! 🎉
