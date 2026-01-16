-- ============================================================================
-- Make assigned_to (team_member_id) MANDATORY in routine_tasks
-- ============================================================================
-- This migration ensures all tasks must have a team member assigned
-- Applied: January 15, 2026
-- ============================================================================

-- Step 1: First, handle any existing tasks with NULL team_member_id
-- We'll need to assign them to a default user or update them manually

-- Check for existing NULL values
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM routine_tasks
  WHERE team_member_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE NOTICE 'Found % tasks with NULL team_member_id. These will need to be assigned.', null_count;
  ELSE
    RAISE NOTICE 'All tasks have team_member_id assigned. Ready to add constraint.';
  END IF;
END $$;

-- Step 2: Update any NULL team_member_id to use assigned_to (legacy field)
-- If assigned_to is also NULL, we'll need to handle it manually
DO $$
DECLARE
  updated_count INTEGER;
  still_null_count INTEGER;
BEGIN
  -- Try to populate team_member_id from assigned_to for backwards compatibility
  UPDATE routine_tasks
  SET team_member_id = assigned_to
  WHERE team_member_id IS NULL 
    AND assigned_to IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RAISE NOTICE 'Updated % tasks with team_member_id from assigned_to field', updated_count;
  END IF;
  
  -- Check if there are still NULL values
  SELECT COUNT(*) INTO still_null_count
  FROM routine_tasks
  WHERE team_member_id IS NULL;
  
  IF still_null_count > 0 THEN
    RAISE NOTICE '⚠️ WARNING: % tasks still have NULL team_member_id after migration', still_null_count;
    RAISE NOTICE 'These tasks need to be manually assigned before adding NOT NULL constraint';
    RAISE NOTICE 'Run this query to see them:';
    RAISE NOTICE 'SELECT id, title, organization_id FROM routine_tasks WHERE team_member_id IS NULL;';
    
    -- Don't proceed with NOT NULL constraint if there are still NULL values
    RAISE EXCEPTION 'Cannot add NOT NULL constraint - % tasks have NULL team_member_id', still_null_count;
  ELSE
    RAISE NOTICE '✅ All tasks now have team_member_id assigned';
  END IF;
END $$;

-- Step 3: Add NOT NULL constraint to team_member_id
-- This will fail if there are still NULL values, which is intentional
ALTER TABLE routine_tasks 
  ALTER COLUMN team_member_id SET NOT NULL;

-- Step 4: Add helpful comment
COMMENT ON COLUMN routine_tasks.team_member_id IS 
  'REQUIRED: ID of the team member assigned to this task. Must not be NULL.';

-- Step 5: Verify the constraint
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'routine_tasks'
    AND column_name = 'team_member_id'
    AND is_nullable = 'NO'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✅ SUCCESS: team_member_id is now NOT NULL';
  ELSE
    RAISE WARNING '⚠️ WARNING: Failed to make team_member_id NOT NULL';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To rollback this migration, run:
-- ALTER TABLE routine_tasks ALTER COLUMN team_member_id DROP NOT NULL;
-- ============================================================================
