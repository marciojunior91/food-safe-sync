-- Fix: routine_tasks.completed_by FK constraint
-- The completed_by column stores team_member IDs but may have a FK referencing profiles/auth.users
-- Drop the old FK and create one referencing team_members

-- Step 1: Drop the existing FK constraint (if it exists)
ALTER TABLE routine_tasks 
  DROP CONSTRAINT IF EXISTS routine_tasks_completed_by_fkey;

-- Step 2: Null out any completed_by values that don't exist in team_members
UPDATE routine_tasks
  SET completed_by = NULL
  WHERE completed_by IS NOT NULL
    AND completed_by NOT IN (SELECT id FROM team_members);

-- Step 3: Add new FK referencing team_members (with ON DELETE SET NULL so deleting a member doesn't fail)
ALTER TABLE routine_tasks
  ADD CONSTRAINT routine_tasks_completed_by_fkey
  FOREIGN KEY (completed_by)
  REFERENCES team_members(id)
  ON DELETE SET NULL;
