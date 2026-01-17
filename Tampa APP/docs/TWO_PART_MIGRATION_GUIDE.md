# Two-Part Migration Guide: User Roles Fix

## Why Two Parts?

PostgreSQL has a restriction: **newly added enum values cannot be used If you still see these errors:
1. Manually disable both triggers:
   ```sql
   ALTER TABLE user_roles DISABLE TRIGGER validate_role_assignment_trigger;
   ALTER TABLE user_roles DISABLE TRIGGER update_user_roles_updated_at;
   ```
2. Run Part 2 again
3. Manually re-enable both triggers:
   ```sql
   ALTER TABLE user_roles ENABLE TRIGGER validate_role_assignment_trigger;
   ALTER TABLE user_roles ENABLE TRIGGER update_user_roles_updated_at;
   ```

### Issue: "unsafe use of new value"transaction**. This means we must:

1. **Part 1**: Add the enum values (`cook` and `barista`)
2. **Commit the transaction** (or start a new session)
3. **Part 2**: Use those enum values in functions, constraints, and data operations

## Step-by-Step Instructions

### Step 1: Run Part 1 (Add Enum Values)

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/imnecvcvhypnlvujajpn/sql/new
2. Copy the entire contents of: `supabase/migrations/20260110_fix_user_roles_relationships_PART1_ONLY.sql`
3. Paste into SQL Editor
4. Click **RUN**
5. ✅ You should see:
   ```
   Added cook role to app_role enum
   Added barista role to app_role enum
   Current app_role enum values:
     admin, manager, leader_chef, staff, cook, barista
   ```

### Step 2: Verify Enum Values (Optional)

Run this query to confirm:
```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype 
ORDER BY enumsortorder;
```

Expected result:
```
admin
manager
leader_chef
staff
cook
barista
```

### Step 3: Run Part 2 (Update Everything Else)

**IMPORTANT**: Open a **NEW SQL Editor tab** or refresh the page to start a fresh transaction.

1. Click "New query" or open a new SQL Editor
2. Copy the entire contents of: `supabase/migrations/20260110_fix_user_roles_relationships_part2.sql`
3. Paste into SQL Editor
4. Click **RUN**
5. ✅ You should see:
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

**Note**: The migration temporarily disables TWO triggers:
- `validate_role_assignment_trigger` - prevents non-admins from assigning admin roles
- `update_user_roles_updated_at` - expects an `updated_at` column that doesn't exist

Both are re-enabled at the end of the migration.

### Step 4: Verify the Changes

Run these verification queries:

**Check all roles exist:**
```sql
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'app_role'::regtype;
```
Should return: **6 rows** (admin, manager, leader_chef, staff, cook, barista)

**Check UNIQUE constraint:**
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'user_roles' AND constraint_type = 'UNIQUE';
```
Should include: **user_roles_user_id_unique**

**Check no duplicate roles:**
```sql
SELECT user_id, COUNT(*) as role_count 
FROM user_roles 
GROUP BY user_id 
HAVING COUNT(*) > 1;
```
Should return: **0 rows** (no duplicates)

**View user roles summary:**
```sql
SELECT * FROM user_roles_summary;
```
Each user should show **ONE role** (not an array)

## What Each Part Does

### Part 1: Add Enum Values
- Adds `cook` to app_role enum
- Adds `barista` to app_role enum
- Verifies the additions
- **Must be committed before Part 2**

### Part 2: Update Functions & Data
- Updates `get_user_role()` function to include cook & barista in hierarchy
- Removes old constraint allowing multiple roles per user
- **Adds UNIQUE constraint** on `user_roles.user_id` (enforces 1:1)
- Removes duplicate roles (keeps highest priority)
- Updates sync function to UPSERT (not insert multiple)
- Creates trigger for auto-sync
- Backfills team_members to user_roles (one role per user)
- Updates `get_current_user_context()` for all 6 roles
- Creates `user_roles_summary` view
- Validates all relationships

## Common Issues

### Issue: "record 'new' has no field 'updated_at'"
**Cause**: The `update_user_roles_updated_at` trigger expects an `updated_at` column that doesn't exist on `user_roles` table.

**Solution**: ✅ Fixed! Part 2 now automatically disables this trigger along with the role validation trigger.

### Issue: "Only administrators can assign admin roles"
**Cause**: The `validate_role_assignment_trigger` was blocking role assignments during migration.

**Solution**: ✅ Fixed! Part 2 now automatically disables this trigger at the start and re-enables it at the end.

If you still see these errors:
1. Manually disable the trigger:
   ```sql
   ALTER TABLE user_roles DISABLE TRIGGER validate_role_assignment_trigger;
   ```
2. Run Part 2 again
3. Manually re-enable the trigger:
   ```sql
   ALTER TABLE user_roles ENABLE TRIGGER validate_role_assignment_trigger;
   ```

### Issue: "unsafe use of new value"
**Cause**: You tried to use the enum value in the same transaction where it was added.

**Solution**: Make sure you run Part 1 completely, then open a **new SQL Editor tab** before running Part 2.

### Issue: "duplicate key value violates unique constraint"
**Cause**: A user has multiple roles in user_roles table.

**Solution**: Part 2 automatically handles this by deleting duplicates and keeping the highest priority role. If this error occurs, the duplicates weren't cleaned up properly.

**Manual Fix**:
```sql
-- Find duplicates
SELECT user_id, COUNT(*), array_agg(role::text) as roles
FROM user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Delete lower priority duplicates manually
-- (Part 2 should do this automatically, but if needed:)
DELETE FROM user_roles ur1
WHERE EXISTS (
  SELECT 1 FROM user_roles ur2
  WHERE ur2.user_id = ur1.user_id
    AND ur2.id != ur1.id
    AND (CASE ur2.role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'leader_chef' THEN 3 WHEN 'cook' THEN 4 WHEN 'barista' THEN 5 WHEN 'staff' THEN 6 END)
      < (CASE ur1.role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'leader_chef' THEN 3 WHEN 'cook' THEN 4 WHEN 'barista' THEN 5 WHEN 'staff' THEN 6 END)
);
```

## Next Steps After Migration

1. **Apply email migration** (if not done yet):
   - Run: `supabase/migrations/20260110_sync_profile_emails.sql`

2. **Restart dev server**:
   ```powershell
   # Press Ctrl+C to stop
   npm run dev
   ```

3. **Test user creation**:
   - Open http://localhost:8080/people
   - Click "Auth Users" → "Add User"
   - Try creating users with **all 5 roles**: admin, manager, leader_chef, cook, barista
   - All should work now! ✅

4. **Test team member creation**:
   - Click "Team Members" → "Add Team Member"
   - Verify auth user dropdown shows "Name - Email" (not "No email")
   - Create test team member
   - Verify it appears in the list

## Success Criteria

✅ Both migrations ran without errors  
✅ app_role enum has 6 values (including cook and barista)  
✅ UNIQUE constraint exists on user_roles.user_id  
✅ No users have multiple roles (each has exactly ONE)  
✅ Can create users with all 5 roles (cook and barista work!)  
✅ Validation query shows "All relationships are valid!"  

---

**Created**: January 10, 2026  
**Purpose**: Fix PostgreSQL enum transaction restriction  
**Result**: Two separate migration files that must be run in sequence
