# 🔧 Fixed User Role Context - Complete

## Problem Identified

The `get_current_user_context()` function was fetching the role from the wrong table:
- ❌ **OLD:** Used `profiles.role` field (contains outdated values like "cook")
- ✅ **NEW:** Uses `user_roles` table (contains proper app roles: admin, manager, leader_chef, staff)

## Root Cause

Your user "marcin" has:
- `profiles.role = 'cook'` (old field, incorrect)
- `user_roles.role = 'leader_chef'` (correct field)

The app was reading from `profiles.role` instead of `user_roles.role`, so it saw you as a "cook" instead of "leader_chef".

---

## Solution Applied

### Migration Created: `20250101000003_fix_user_context_role.sql`

**What it does:**
1. Updates `get_current_user_context()` function
2. Fetches role from `user_roles` table instead of `profiles` table
3. If user has multiple roles, returns the highest priority:
   - admin (highest)
   - manager
   - leader_chef
   - staff (lowest)
4. Defaults to 'staff' if no role found

**Code change:**
```sql
-- OLD (wrong)
p.role as user_role

-- NEW (correct)
COALESCE(
  (
    SELECT ur.role::TEXT
    FROM user_roles ur
    WHERE ur.user_id = p.user_id
    ORDER BY 
      CASE ur.role::TEXT
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'leader_chef' THEN 3
        WHEN 'staff' THEN 4
        ELSE 5
      END
    LIMIT 1
  ),
  'staff'
) as user_role
```

### Permission Check Updated

**TaskForm.tsx** now checks for proper roles:
```typescript
const canDeleteImages = 
  userRole === 'admin' || 
  userRole === 'owner' ||
  userRole === 'manager' ||
  userRole === 'leader_chef';
```

---

## How to Apply

### Step 1: Run Migration in Supabase

1. Go to Supabase SQL Editor
2. Copy and run: `supabase/migrations/20250101000003_fix_user_context_role.sql`
3. Should complete successfully

### Step 2: Refresh Your App

1. Hard refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
2. This clears any cached context data

### Step 3: Test Delete Button

1. Edit any task
2. Scroll to Photo Attachments section
3. Hover over an image
4. Red X button should now appear! ✅

---

## Verification

After applying the migration and refreshing, check console logs:

**Before (broken):**
```
TasksOverview - context: {user_role: "cook", ...}
🔐 TaskForm - User role: cook
🔐 TaskForm - Can delete images: false ❌
```

**After (fixed):**
```
TasksOverview - context: {user_role: "leader_chef", ...}
🔐 TaskForm - User role: leader_chef
🔐 TaskForm - Can delete images: true ✅
```

---

## Who Can Delete Images Now

After this fix, only these roles can delete:
- ✅ **admin** - Full system access
- ✅ **owner** - Organization owner
- ✅ **manager** - Management role
- ✅ **leader_chef** - Kitchen leadership (YOUR ROLE)
- ❌ **staff** - Regular staff cannot delete
- ❌ **cook** - Regular cooks cannot delete

---

## Benefits of This Fix

1. **Correct Role Hierarchy**: Uses proper app_role enum from user_roles table
2. **Future-Proof**: All role-based features will now work correctly
3. **Security**: Only authorized users can delete images
4. **Consistency**: Same role system across entire app

---

## Database Structure Reference

### user_roles Table
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL,  -- enum: admin, manager, leader_chef, staff
  created_at TIMESTAMP,
  UNIQUE (user_id, role)
);
```

### app_role Enum
```sql
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'manager',
  'leader_chef',
  'staff'
);
```

---

## Next Steps

1. ✅ **Apply migration** (run SQL file)
2. ✅ **Refresh app** (Ctrl+Shift+R)
3. ✅ **Test delete button** (should work now!)
4. ✅ **Remove debug logs** (optional, after confirming it works)

---

## Troubleshooting

### If delete button still doesn't appear:

**Check 1: Migration applied?**
```sql
-- Run this to verify function was updated
SELECT pg_get_functiondef('get_current_user_context()'::regprocedure);
-- Should show the new code with user_roles join
```

**Check 2: Do you have a role in user_roles?**
```sql
SELECT * FROM user_roles WHERE user_id = 'cd9af250-133d-409e-9e97-f570f767648d';
-- Should return: role = 'leader_chef'
```

**Check 3: Context returning correct role?**
```sql
SELECT * FROM get_current_user_context();
-- Should show: user_role = 'leader_chef'
```

**If user_roles is empty**, insert your role:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('cd9af250-133d-409e-9e97-f570f767648d', 'leader_chef'::app_role);
```

---

## Summary

**Problem:** Context was reading from wrong table field  
**Solution:** Fixed function to read from `user_roles` table  
**Result:** Your `leader_chef` role now correctly grants delete permissions  

After applying the migration and refreshing, you should be able to delete images! 🎉
