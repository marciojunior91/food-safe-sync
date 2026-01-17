-- ============================================================================
-- Routine Tasks RLS Policies
-- ============================================================================

-- Enable RLS on routine_tasks table
ALTER TABLE routine_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON routine_tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their organization" ON routine_tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON routine_tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON routine_tasks;

-- Policy: Users can view tasks in their organization
CREATE POLICY "Users can view tasks in their organization"
ON routine_tasks
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can insert tasks in their organization
CREATE POLICY "Users can insert tasks in their organization"
ON routine_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update tasks in their organization
CREATE POLICY "Users can update tasks in their organization"
ON routine_tasks
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete tasks in their organization
CREATE POLICY "Users can delete tasks in their organization"
ON routine_tasks
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON routine_tasks TO authenticated;
GRANT ALL ON routine_tasks TO service_role;

-- Enable RLS on task_templates table
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view templates in their organization" ON task_templates;
DROP POLICY IF EXISTS "Users can insert templates in their organization" ON task_templates;
DROP POLICY IF EXISTS "Users can update templates in their organization" ON task_templates;
DROP POLICY IF EXISTS "Users can delete templates in their organization" ON task_templates;

-- Policy: Users can view templates in their organization
CREATE POLICY "Users can view templates in their organization"
ON task_templates
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
  OR is_default = true  -- Everyone can see default templates
);

-- Policy: Users can insert templates in their organization
CREATE POLICY "Users can insert templates in their organization"
ON task_templates
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update their organization's templates
CREATE POLICY "Users can update their organization's templates"
ON task_templates
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
  AND is_default = false  -- Can't update default templates
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete their organization's templates
CREATE POLICY "Users can delete their organization's templates"
ON task_templates
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
  AND is_default = false  -- Can't delete default templates
);

-- Grant permissions
GRANT ALL ON task_templates TO authenticated;
GRANT ALL ON task_templates TO service_role;

-- Enable RLS on task_attachments table
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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
      FROM user_profiles 
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
      FROM user_profiles 
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
      FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Grant permissions
GRANT ALL ON task_attachments TO authenticated;
GRANT ALL ON task_attachments TO service_role;
