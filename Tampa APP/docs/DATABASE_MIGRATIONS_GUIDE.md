# 🔴 CRITICAL: Database Migrations - Step-by-Step Guide

**Priority:** CRITICAL - BLOCKING  
**Status:** ⏸️ Waiting for User Action  
**Estimated Time:** 15-30 minutes  
**Created:** January 15, 2026

---

## ⚠️ CURRENT BLOCKER

**Error:** `column 'team_member_id' of relation 'routine_tasks' contains null values`

**Impact:** 
- Cannot add NOT NULL constraint to routine_tasks table
- Activity tracking system cannot be deployed
- Routine tasks improvements are blocked

**Root Cause:**
- Existing tasks have NULL values in `team_member_id` field
- Migration requires all tasks to have an assigned team member
- Need to fix NULL values before applying constraint

---

## 📋 PRE-MIGRATION CHECKLIST

Before starting, ensure you have:

- [ ] Access to Supabase Dashboard (https://supabase.com)
- [ ] Logged into your project
- [ ] SQL Editor access
- [ ] Admin/Owner permissions
- [ ] Backup of current database (optional but recommended)

---

## 🔍 STEP 0: Verify Current State

### Check NULL Values Count

1. Open Supabase Dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Click "New Query"
4. Run this query:

```sql
-- Check how many tasks have NULL team_member_id
SELECT 
  COUNT(*) as total_null_tasks,
  organization_id
FROM routine_tasks 
WHERE team_member_id IS NULL
GROUP BY organization_id;
```

**Expected Output:**
```
total_null_tasks | organization_id
-----------------+------------------------------------
              15 | b818500f-27f7-47c3-b62a-7d76d5505d57
```

5. **Note down the count** - you'll verify this later

---

## 🛠️ STEP 1: Fix NULL Values

### Option 3 (RECOMMENDED): Auto-assign to First Team Member

**Why this option?**
- ✅ Fastest and safest
- ✅ No manual work needed
- ✅ Preserves all tasks
- ✅ Can be reassigned later

### Execute the Fix

1. Open file: `docs/fix-null-team-member-tasks.sql`
2. Scroll to **OPTION 3** (around line 79)
3. **Copy this entire section:**

```sql
-- ============================================================================
-- OPTION 3: Auto-assign to first team member per organization (RECOMMENDED)
-- ============================================================================
-- This is the safest and fastest option
-- Assigns NULL tasks to the oldest team member in each organization

UPDATE routine_tasks
SET 
  team_member_id = (
    SELECT id 
    FROM team_members 
    WHERE team_members.organization_id = routine_tasks.organization_id
    ORDER BY created_at ASC
    LIMIT 1
  ),
  updated_at = NOW()
WHERE team_member_id IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as fixed_count,
  organization_id
FROM routine_tasks 
WHERE team_member_id IS NOT NULL
  AND updated_at > NOW() - INTERVAL '1 minute'
GROUP BY organization_id;
```

4. Go to **Supabase SQL Editor**
5. Click "New Query"
6. **Paste the code**
7. Click **"Run"** (or press Ctrl+Enter)

### Verify the Fix Worked

8. You should see output like:
```
fixed_count | organization_id
------------+------------------------------------
         15 | b818500f-27f7-47c3-b62a-7d76d5505d57
```

9. Run final verification:
```sql
-- Should return 0 if successful
SELECT COUNT(*) 
FROM routine_tasks 
WHERE team_member_id IS NULL;
```

**Expected Result:** `0`

✅ **If you see 0, proceed to Step 2!**

❌ **If you still see NULL values:**
- Check that team_members table has records
- Try Option 1 (migrate from assigned_to field)
- Contact support if issues persist

---

## 🚀 STEP 2: Apply Migration #1 (Mandatory Field)

### Make team_member_id Required

1. Open file: `supabase/migrations/20260115000001_make_assigned_to_mandatory.sql`

2. **Copy the ENTIRE file content** (Ctrl+A, Ctrl+C)

3. Go to **Supabase SQL Editor**

4. Click "New Query"

5. **Paste the migration**

6. Click **"Run"**

### What This Does:
- ✅ Adds NOT NULL constraint to team_member_id
- ✅ Adds comment explaining the field
- ✅ Verifies the constraint was added
- ✅ Shows summary of changes

### Expected Output:
```
Step 1: Checking for NULL values...
No NULL values found. Safe to proceed. ✓

Step 2: Auto-migrating NULL values from assigned_to...
0 rows updated from assigned_to field.

Step 3: Adding NOT NULL constraint...
Constraint added successfully. ✓

Step 4: Adding helpful comment...
Comment added. ✓

Step 5: Verification...
✓ SUCCESS: team_member_id is now NOT NULL
✓ All existing tasks have team_member_id assigned

Migration completed successfully! 🎉
```

✅ **If you see "Migration completed successfully", proceed to Step 3!**

---

## 📊 STEP 3: Apply Migration #2 (Activity Tracking)

### Enable Automatic Activity Logging

1. Open file: `supabase/migrations/20260115000002_task_activity_tracking.sql`

2. **Copy the ENTIRE file content** (Ctrl+A, Ctrl+C)

3. Go to **Supabase SQL Editor**

4. Click "New Query"

5. **Paste the migration**

6. Click **"Run"**

### What This Does:
- ✅ Creates task_activity_log table
- ✅ Adds RLS policies for security
- ✅ Creates trigger to log task creation
- ✅ Creates trigger to log task updates
- ✅ Tracks 11 different activity types:
  - created
  - status_changed
  - assignment_changed
  - title_updated
  - description_updated
  - priority_changed
  - schedule_changed
  - attachment_added
  - attachment_removed
  - approval_status_changed
  - notes_added

### Expected Output:
```
Table 'task_activity_log' created successfully.
RLS enabled on task_activity_log.
Policy 'Users can view activity in their organization' created.
Policy 'System can insert activity logs' created.
Function 'log_task_creation' created.
Function 'log_task_updates' created.
Trigger 'task_creation_logger' created.
Trigger 'task_update_logger' created.
Helper function 'get_task_activity' created.

Activity tracking system deployed successfully! 🎉
```

✅ **Migration complete! Activity tracking is now live!**

---

## ✅ STEP 4: Verify Everything Works

### Test Activity Tracking

Run these verification queries:

```sql
-- 1. Check task_activity_log table exists
SELECT COUNT(*) as activity_count 
FROM task_activity_log;

-- 2. Check triggers are installed
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname LIKE '%task%logger%';

-- 3. Test by updating a task (change status)
UPDATE routine_tasks 
SET status = 'in_progress',
    updated_at = NOW()
WHERE id = (SELECT id FROM routine_tasks LIMIT 1)
RETURNING id, title, status;

-- 4. Verify activity was logged
SELECT 
  activity_type,
  details,
  created_at
FROM task_activity_log
ORDER BY created_at DESC
LIMIT 5;
```

### Expected Results:

**Query 1:** Should show activity count (might be 0 if no changes yet)  
**Query 2:** Should show 2 triggers both enabled  
**Query 3:** Should return the updated task  
**Query 4:** Should show recent activity including "status_changed"

---

## 🎉 SUCCESS CRITERIA

You've successfully completed migrations if:

- [x] All NULL values fixed (count = 0)
- [x] Migration #1 completed (NOT NULL constraint added)
- [x] Migration #2 completed (activity tracking table created)
- [x] Triggers installed and working
- [x] RLS policies active
- [x] Test activity log recorded

---

## 🧪 TESTING IN THE APP

Now test the features in your app:

### 1. Test Mandatory Assignment
1. Go to Routine Tasks
2. Click "New Task"
3. Try to submit **without** assigning to anyone
4. ✅ Should show error: "This field is required"
5. Assign to team member
6. ✅ Should allow submission

### 2. Test Activity History
1. Open any existing task
2. Scroll to "Activity History" section
3. ✅ Should see timeline of changes
4. Change status from "Not Started" to "In Progress"
5. ✅ Should see new activity entry immediately

### 3. Test Recurrence
1. Create new task
2. Enable "Recurring Task" toggle
3. Select frequency (Daily/Weekly/etc)
4. ✅ Should save recurrence_pattern

### 4. Test Custom Task Type
1. Create new task
2. Select Task Type: "Others"
3. ✅ Custom field should appear
4. Enter custom type (e.g., "Inventory")
5. ✅ Should require field before submission

---

## 🐛 TROUBLESHOOTING

### Issue: "NULL values still exist"
**Solution:** 
1. Check team_members table has records
2. Try Option 1 (migrate from assigned_to)
3. Verify organization_id matches

### Issue: "Constraint already exists"
**Solution:**
```sql
-- Drop and recreate
ALTER TABLE routine_tasks 
DROP CONSTRAINT IF EXISTS routine_tasks_team_member_id_not_null;
```
Then re-run migration #1

### Issue: "Trigger not firing"
**Solution:**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname LIKE '%task%';

-- Recreate trigger
DROP TRIGGER IF EXISTS task_update_logger ON routine_tasks;
-- Then re-run migration #2
```

### Issue: "Permission denied"
**Solution:**
- Ensure you're logged in as organization admin
- Check RLS policies are correct
- Verify auth.uid() returns your user ID

---

## 📞 NEED HELP?

If you encounter any issues:

1. **Check Supabase Logs:**
   - Dashboard → Logs → Select time range
   - Look for error messages

2. **Verify Database State:**
   ```sql
   -- Check routine_tasks structure
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'routine_tasks'
   AND column_name = 'team_member_id';
   
   -- Check task_activity_log exists
   SELECT * FROM information_schema.tables
   WHERE table_name = 'task_activity_log';
   ```

3. **Share Error Messages:**
   - Copy full error text
   - Share in support channel
   - Include query that caused error

---

## 🎯 AFTER MIGRATIONS

Once migrations are complete, you can:

1. ✅ Test all routine task features
2. ✅ Start Feed module development
3. ✅ Complete Stripe webhook testing
4. ✅ Move to next priority tasks

**Next TODO:** Test routine tasks features thoroughly!

---

## 📝 MIGRATION HISTORY

| Migration | Status | Date | Notes |
|-----------|--------|------|-------|
| 20260115000001 | ⏳ Pending | - | Make team_member_id mandatory |
| 20260115000002 | ⏳ Pending | - | Add activity tracking system |

**Update this table after completing each migration!**

---

**Created:** January 15, 2026  
**Status:** ⏸️ Awaiting User Action  
**Priority:** 🔴 CRITICAL - BLOCKING ALL ROUTINE TASKS WORK

---

## 🚀 QUICK START (TL;DR)

```sql
-- 1. Fix NULL values (run in Supabase SQL Editor)
UPDATE routine_tasks
SET team_member_id = (
  SELECT id FROM team_members 
  WHERE team_members.organization_id = routine_tasks.organization_id
  ORDER BY created_at ASC LIMIT 1
)
WHERE team_member_id IS NULL;

-- 2. Apply migration #1
-- Copy/paste: supabase/migrations/20260115000001_make_assigned_to_mandatory.sql

-- 3. Apply migration #2  
-- Copy/paste: supabase/migrations/20260115000002_task_activity_tracking.sql

-- 4. Verify
SELECT COUNT(*) FROM task_activity_log; -- Should work
SELECT COUNT(*) FROM routine_tasks WHERE team_member_id IS NULL; -- Should be 0
```

**Done! Now test in the app! 🎉**
