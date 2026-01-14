# User Roles Configuration - Sprint 2 Module 1

**Date**: January 10, 2026  
**Issue**: Dialog showing roles that don't exist in user_roles table  
**Solution**: Updated to only show available roles  

---

## Problem

The CreateUserDialog and CreateTeamMemberDialog were showing 5 role options:
- cook
- barista
- leader_chef
- manager
- admin

But the `user_roles` table only has:
- **admin**
- **leader_chef**

This would cause errors when trying to create users with non-existent roles.

---

## Solution Applied

Updated both dialogs to only show the 2 available roles:

### Files Modified:

1. **CreateUserDialog.tsx**
   - Schema: `z.enum(["admin", "leader_chef"])`
   - Dropdown options: Admin, Leader Chef

2. **CreateTeamMemberDialog.tsx**
   - Schema: `z.enum(["admin", "leader_chef"])`
   - Dropdown options: Admin, Leader Chef

---

## Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| **admin** | Full system administrator | All permissions, can manage users, settings, data |
| **leader_chef** | Head chef / Kitchen manager | Manage recipes, tasks, team operations |

---

## Adding More Roles in Future

If you need to add more roles like cook, barista, or manager:

### 1. Add to Database (`user_roles` table)

```sql
INSERT INTO public.user_roles (role_name, description) VALUES
  ('cook', 'Kitchen staff - cooking and food prep'),
  ('barista', 'Beverage preparation specialist'),
  ('manager', 'Restaurant manager');
```

### 2. Update Dialog Schemas

In both `CreateUserDialog.tsx` and `CreateTeamMemberDialog.tsx`:

```typescript
role: z.enum(["admin", "leader_chef", "cook", "barista", "manager"], {
  required_error: "Please select a role",
}),
```

### 3. Update Dropdown Options

```tsx
<SelectContent>
  <SelectItem value="admin">Admin</SelectItem>
  <SelectItem value="leader_chef">Leader Chef</SelectItem>
  <SelectItem value="cook">Cook</SelectItem>
  <SelectItem value="barista">Barista</SelectItem>
  <SelectItem value="manager">Manager</SelectItem>
</SelectContent>
```

### 4. Update Edge Function

Update `supabase/functions/create-user-with-credentials/index.ts`:

```typescript
role_type: "cook" | "barista" | "manager" | "leader_chef" | "admin";
```

---

## Testing

After these changes:
1. ✅ Restart dev server (to load .env file)
2. ✅ Open People module
3. ✅ Click "Add User"
4. ✅ Should only see "Admin" and "Leader Chef" in Role dropdown
5. ✅ Select a role and create user
6. ✅ Verify user is created successfully

---

## Related Files

- `src/components/people/CreateUserDialog.tsx`
- `src/components/people/CreateTeamMemberDialog.tsx`
- Database: `user_roles` table
- Edge Function: `create-user-with-credentials`

---

**Status**: ✅ Fixed  
**Sprint**: Sprint 2 Module 1 - People & Authentication
