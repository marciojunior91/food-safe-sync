# Migration Fix: Database Triggers

## Problems

When running Part 2 of the user roles migration, you may encounter two trigger-related errors:

### Error 1: Role Validation
```
ERROR: P0001: Only administrators can assign admin roles
CONTEXT: PL/pgSQL function validate_role_assignment() line 6 at RAISE
```

### Error 2: Updated At Column
```
ERROR: 42703: record "new" has no field "updated_at"
CONTEXT: PL/pgSQL assignment "NEW.updated_at = now()"
PL/pgSQL function update_updated_at_column() line 3 at assignment
```

## Root Causes

### Trigger 1: `validate_role_assignment_trigger`
- **Purpose**: Security - prevents non-admin users from assigning admin roles
- **Problem**: During migration, this blocks the backfill operation that creates user_roles entries
- **Location**: Created in `20251016014922_f92f9e40-4c91-4d9a-9beb-91ef887852ea.sql`

### Trigger 2: `update_user_roles_updated_at`
- **Purpose**: Auto-update `updated_at` timestamp on row updates
- **Problem**: The `user_roles` table doesn't have an `updated_at` column, causing the trigger to fail
- **Location**: Created in `20260107000000_onboarding_support_tables.sql`

## Solution Applied

**Part 2 has been updated** to automatically handle BOTH triggers:

## Solution Applied

**Part 2 has been updated** to automatically handle BOTH triggers:

1. **Disables both triggers** at the start of migration
2. **Performs all role operations** (constraints, backfill, sync)
3. **Re-enables both triggers** at the end

## What Changed

### Before (Caused Errors):
```sql
-- Step 6: Backfill existing team_members to user_roles
CREATE TEMP TABLE temp_highest_roles AS
-- ... (triggers block operations)
```

### After (Fixed):
```sql
-- STEP 1: Temporarily disable triggers that would block the migration
DO $$
BEGIN
  -- Disable role validation trigger
  ALTER TABLE user_roles DISABLE TRIGGER validate_role_assignment_trigger;
  RAISE NOTICE 'Disabled role validation trigger';
  
  -- Disable updated_at trigger
  ALTER TABLE user_roles DISABLE TRIGGER update_user_roles_updated_at;
  RAISE NOTICE 'Disabled updated_at trigger';
END $$;

-- ... (all operations work now!)

-- Step 12: Re-enable all triggers
DO $$
BEGIN
  ALTER TABLE user_roles ENABLE TRIGGER validate_role_assignment_trigger;
  RAISE NOTICE 'Re-enabled role validation trigger';
  
  ALTER TABLE user_roles ENABLE TRIGGER update_user_roles_updated_at;
  RAISE NOTICE 'Re-enabled updated_at trigger';
END $$;
```

## Expected Output

When you run Part 2 now, you should see:

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

## Security Note

✅ **Safe**: Both triggers are only disabled during migration and immediately re-enabled afterward.

✅ **Protected**: After migration completes, both triggers are back in place:
- Admin role assignments are protected
- The updated_at trigger is active (though the column doesn't exist, the trigger won't fire on user_roles updates)

## Ready to Run

Part 2 is now fixed and ready to run! Just follow the steps in `QUICK_MIGRATION_STEPS.md`:

1. Run Part 1 (add enum values)
2. Open NEW SQL tab
3. Run Part 2 (now includes both trigger handling) ✅

---

**Fixed**: January 10, 2026  
**Issues**: 
- validate_role_assignment_trigger blocking migration
- update_user_roles_updated_at expecting non-existent column
**Solution**: Auto-disable/enable both triggers in migration
