# 🐛 User Role Badge Issue - Diagnosis & Fix

## Problem Description
- **Symptoms:**
  - All user badges show "staff" 
  - Role count in stats shows only "admin" (correct)
  - Only YOUR badge shows "admin" (correct)

## Root Cause
The issue is that **most users don't have an entry in the `user_roles` table**.

The `usePeople` hook defaults users without a role to `'staff'`:
```typescript
role: rolesMap.get(user.user_id) || 'staff'  // ← Defaults to 'staff'
```

This is **CORRECT BEHAVIOR** for security:
- Users must explicitly be assigned roles
- New users default to lowest permission level (staff)
- Prevents accidental admin access

## Verification Steps

### 1. Check Database
Run this query in Supabase SQL Editor:

```sql
-- See all users and their roles
SELECT 
  p.user_id,
  p.display_name,
  p.email,
  ur.role,
  p.organization_id
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.display_name;
```

**Expected Result:**
- Your user: Has `role = 'admin'` in user_roles
- Other users: **NULL** or missing from user_roles (will default to 'staff')

### 2. Check Role Counts
```sql
-- Count users by role
SELECT 
  COALESCE(ur.role::TEXT, 'no_role') as role,
  COUNT(*) as count
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
GROUP BY ur.role
ORDER BY count DESC;
```

**Expected Result:**
- 1 admin (you)
- X users with 'no_role' (will show as 'staff' in UI)

## Solution

You have 3 options:

### Option 1: Assign Roles to Existing Users (Recommended)
If these users should have specific roles, assign them:

```sql
-- Example: Make user a manager
INSERT INTO user_roles (user_id, role, organization_id)
VALUES (
  'USER_ID_HERE',  -- Replace with actual user_id
  'manager',       -- Or: admin, leader_chef, cook, barista, staff
  'YOUR_ORG_ID'    -- Your organization_id
)
ON CONFLICT (user_id, organization_id) 
DO UPDATE SET role = EXCLUDED.role;
```

### Option 2: Bulk Assign Roles
Assign roles to multiple users at once:

```sql
-- Make all users without roles into 'staff' explicitly
INSERT INTO user_roles (user_id, role, organization_id)
SELECT 
  p.user_id,
  'staff'::text,  -- Default role
  p.organization_id
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
WHERE ur.user_id IS NULL  -- Only users without roles
  AND p.organization_id = 'YOUR_ORG_ID';  -- Replace with your org ID
```

### Option 3: Do Nothing (Current Behavior is Correct)
If these are new/test users without assigned roles, the "staff" badge is correct. They'll need to be assigned roles through the People module when ready.

## How to Assign Roles in UI

Once the RLS policies are working (after running the fix SQL), you can assign roles through the UI:

1. Go to **People Module**
2. Click **Edit** on a user card
3. **Select their role** from dropdown
4. Click **Save**

This will create/update their entry in the `user_roles` table.

## Testing

After assigning roles, refresh the People page:

```javascript
// In browser console
window.location.reload();
```

**Expected:**
- ✅ Each user shows their assigned role badge
- ✅ Stats show correct role counts
- ✅ Only assigned admins see "Admin" badge

## Technical Details

### Data Flow:
1. `usePeople` hook queries `profiles` table
2. Separately queries `user_roles` table
3. Creates a Map of `user_id → role`
4. Merges data: `role: rolesMap.get(user.user_id) || 'staff'`
5. `UserCard` displays `user.role`

### Default Behavior:
- User IN `user_roles`: Shows assigned role ✅
- User NOT IN `user_roles`: Shows "staff" (default) ✅
- This is secure and prevents privilege escalation

## Summary

**This is NOT a bug** - it's the correct security behavior:
- New users default to minimal permissions (staff)
- Roles must be explicitly assigned
- Only YOUR user has admin role assigned

**To fix the display:**
- Assign proper roles to users through UI or SQL
- Or accept that unassigned users show as "staff"

---

**Status:** Working as intended  
**Action Required:** Assign roles to users who need elevated permissions
