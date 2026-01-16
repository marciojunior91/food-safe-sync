-- ============================================================================
-- FIX TASK ACTIVITY TRACKING TRIGGER
-- Date: January 16, 2026
-- ============================================================================
-- This migration fixes the log_task_creation trigger that references
-- the non-existent field 'created_by' in routine_tasks table
-- ============================================================================

-- Fix the log_task_creation function to NOT reference created_by
CREATE OR REPLACE FUNCTION log_task_creation()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  creator_id UUID;
BEGIN
  -- Try to get creator from auth.uid() (current user creating the task)
  creator_id := auth.uid();
  
  -- Get the user's display name from team_member
  SELECT display_name INTO user_name
  FROM team_members
  WHERE id = NEW.team_member_id
  LIMIT 1;
  
  -- If not found in team_members, try profiles with current user
  IF user_name IS NULL AND creator_id IS NOT NULL THEN
    SELECT display_name INTO user_name
    FROM profiles
    WHERE user_id = creator_id
    LIMIT 1;
  END IF;
  
  -- Log the creation
  INSERT INTO task_activity_log (
    task_id,
    organization_id,
    activity_type,
    performed_by,
    performed_by_name,
    notes
  ) VALUES (
    NEW.id,
    NEW.organization_id,
    'created',
    creator_id,  -- Use auth.uid() instead of NEW.created_by
    COALESCE(user_name, 'System'),
    'Task created: ' || NEW.title
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_task_creation IS 
  'Logs task creation to task_activity_log. Uses auth.uid() as creator since routine_tasks table does not have created_by field.';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
/*
-- Verify the function was updated
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'log_task_creation'
  AND routine_schema = 'public';

-- Test creating a task to ensure trigger works
INSERT INTO routine_tasks (
  organization_id,
  title,
  task_type,
  scheduled_date,
  team_member_id
)
SELECT 
  organization_id,
  'Test Task - Trigger Fix',
  'others',
  CURRENT_DATE,
  id
FROM team_members
WHERE organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
LIMIT 1;

-- Verify activity was logged
SELECT * FROM task_activity_log
WHERE notes LIKE '%Test Task - Trigger Fix%'
ORDER BY created_at DESC
LIMIT 1;

-- Clean up test
DELETE FROM routine_tasks WHERE title = 'Test Task - Trigger Fix';
*/
