-- ============================================================================
-- ROUTINE TASKS RLS FIX - Run this in Supabase SQL Editor
-- ============================================================================
-- This script will ONLY update the routine_tasks RLS policies
-- Safe to run multiple times (uses DROP IF EXISTS)
-- ============================================================================

-- Enable RLS on routine_tasks table
ALTER TABLE IF EXISTS routine_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON routine_tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their organization" ON routine_tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON routine_tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON routine_tasks;

-- CREATE NEW POLICIES

-- SELECT: Users can view tasks in their organization
CREATE POLICY "Users can view tasks in their organization"
ON routine_tasks
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- INSERT: Users can insert tasks in their organization
CREATE POLICY "Users can insert tasks in their organization"
ON routine_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE: Users can update tasks in their organization
CREATE POLICY "Users can update tasks in their organization"
ON routine_tasks
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- DELETE: Users can delete tasks in their organization  
CREATE POLICY "Users can delete tasks in their organization"
ON routine_tasks
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON routine_tasks TO authenticated;
GRANT ALL ON routine_tasks TO service_role;

-- ============================================================================
-- DONE! Now refresh your app and tasks should be visible
-- ============================================================================
