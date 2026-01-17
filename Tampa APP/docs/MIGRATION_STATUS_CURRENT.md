# Database Migration Status - User Roles

## Current State

❌ **Problem**: `user_roles` table only has 2 rows (both admin)

✅ **Expected**: Every user in `profiles` table should have a corresponding entry in `user_roles`

## Why This Happened

The migrations have NOT been fully applied yet. Here's what needs to happen:

### Migration Status:

| Migration | File | Status | What It Does |
|-----------|------|--------|--------------|
| Part 1 | `20260110_fix_user_roles_relationships_PART1_ONLY.sql` | ❓ Unknown | Adds 'cook' and 'barista' to enum |
| Part 2 | `20260110_fix_user_roles_relationships_part2.sql` | ❌ NOT RUN | Backfills ALL users from profiles/team_members |
| Fix | `20260110_fix_get_current_user_context_location_id.sql` | ❌ NOT RUN | Fixes organization_id = null issue |

## What Part 2 Does (When Applied)

The Part 2 migration will:

1. **Backfill existing team_members** to user_roles:
   ```sql
   -- Creates temp table with highest priority role per user
   CREATE TEMP TABLE temp_highest_roles AS
   SELECT DISTINCT ON (tm.auth_role_id)
     tm.auth_role_id as user_id,
     tm.role_type::text::app_role as role,
     tm.created_at
   FROM team_members tm
   WHERE tm.auth_role_id IS NOT NULL
   ORDER BY 
     tm.auth_role_id,
     CASE tm.role_type
       WHEN 'admin' THEN 1
       WHEN 'manager' THEN 2
       WHEN 'leader_chef' THEN 3
       WHEN 'cook' THEN 4
       WHEN 'barista' THEN 5
     END;

   -- Insert/update with only the highest priority role
   INSERT INTO public.user_roles (user_id, role, created_at)
   SELECT user_id, role, created_at FROM temp_highest_roles
   ON CONFLICT (user_id) 
   DO UPDATE SET role = EXCLUDED.role, ...
   ```

2. **Create auto-sync trigger**: Future team_members automatically create user_roles entries

3. **Add UNIQUE constraint**: Ensures ONE role per user (1:1 relationship)

## How to Fix: Complete Migration Process

### Step 1: Apply Part 1 (Add Enum Values)

1. Go to: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new
2. Copy entire contents of: `supabase/migrations/20260110_fix_user_roles_relationships_PART1_ONLY.sql`
3. Paste and click **RUN**
4. ✅ Expected output:
   ```
   Added cook role to app_role enum
   Added barista role to app_role enum
   Current app_role enum values:
     admin, manager, leader_chef, staff, cook, barista
   ```

### Step 2: Apply Part 2 (Backfill & Setup) - NEW TAB!

**IMPORTANT**: Open a NEW SQL Editor tab or refresh the page before running Part 2

1. Click **"New query"** or refresh page
2. Copy entire contents of: `supabase/migrations/20260110_fix_user_roles_relationships_part2.sql`
3. Paste and click **RUN**
4. ✅ Expected output:
   ```
   Disabled role validation trigger
   Disabled updated_at trigger
   Dropped old constraint allowing multiple roles per user
   Added constraint: ONE role per user
   Running relationship validation...
   ✓ All relationships are valid!
   Re-enabled role validation trigger
   Re-enabled updated_at trigger
   ```

### Step 3: Apply Location ID Fix

1. In same SQL Editor (or new tab)
2. Copy entire contents of: `supabase/migrations/20260110_fix_get_current_user_context_location_id.sql`
3. Paste and click **RUN**
4. ✅ Expected: Function recreated successfully

### Step 4: Verify Results

Run these queries to verify:

```sql
-- 1. Check app_role enum has all 6 values
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype 
ORDER BY enumsortorder;
-- Should return: admin, manager, leader_chef, staff, cook, barista

-- 2. Check how many users have roles now
SELECT COUNT(*) as total_user_roles FROM user_roles;
-- Should match the number of users in profiles

-- 3. Check the UNIQUE constraint exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'user_roles' 
  AND constraint_type = 'UNIQUE';
-- Should include: user_roles_user_id_unique

-- 4. See all user roles
SELECT 
  p.display_name,
  p.email,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.user_id = ur.user_id
ORDER BY p.display_name;
-- Every user should have a role (no NULLs)

-- 5. Test get_current_user_context works
SELECT * FROM get_current_user_context();
-- Should return your user with organization_id (not null)
```

## Expected Final State

After all 3 migrations:

✅ `user_roles` table has entries for ALL users  
✅ Each user has exactly ONE role (1:1 relationship)  
✅ New team members automatically get user_roles entries  
✅ `get_current_user_context()` returns organization_id correctly  
✅ People module loads successfully  
✅ Can create users with all 5 roles (cook and barista work)  

## Quick Summary

**You need to run 3 migrations in order:**

1. Part 1 (enum) → Commit → Part 2 (backfill) → Part 3 (fix function)

**Time Required**: ~5 minutes

**Current Blockers**:
- ❌ Can't access People module (organization_id = null)
- ❌ Only 2 users have roles (should be all users)
- ❌ Can't create users with cook/barista roles

**After Migrations**:
- ✅ All users have roles
- ✅ People module works
- ✅ Can create users with any role
- ✅ Organization appears in header

---

**Priority**: HIGH - System partially broken  
**Action Required**: Apply 3 migrations  
**Documentation**: See `TWO_PART_MIGRATION_GUIDE.md` and `URGENT_FIX_ORGANIZATION_NULL.md`  
**Last Updated**: January 10, 2026, 7:30 PM
