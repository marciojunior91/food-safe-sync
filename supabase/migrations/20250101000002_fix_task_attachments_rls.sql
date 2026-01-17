-- Fix task_attachments RLS policies to use correct table name
-- Issue: Policies reference 'user_profiles' but actual table is 'profiles'

-- Drop existing broken policies
DROP POLICY IF EXISTS "Users can view attachments for their org tasks" ON task_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their org tasks" ON task_attachments;
DROP POLICY IF EXISTS "Users can delete attachments for their org tasks" ON task_attachments;

-- Policy: Users can view attachments for tasks in their organization
CREATE POLICY "Users can view attachments for their org tasks"
ON task_attachments
FOR SELECT
TO authenticated
USING (
  task_id IN (
    SELECT id FROM routine_tasks
    WHERE organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can insert attachments for tasks in their organization
CREATE POLICY "Users can insert attachments for their org tasks"
ON task_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  task_id IN (
    SELECT id FROM routine_tasks
    WHERE organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can delete attachments for tasks in their organization
CREATE POLICY "Users can delete attachments for their org tasks"
ON task_attachments
FOR DELETE
TO authenticated
USING (
  task_id IN (
    SELECT id FROM routine_tasks
    WHERE organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
);
